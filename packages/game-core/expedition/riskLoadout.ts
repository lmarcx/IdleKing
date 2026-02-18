import type { Inventory } from "../player/types.js";
import { removeItem } from "../player/inventory.js";
import type { ItemSlot } from "../loot/budget.js";
import type { ExpeditionLoadout, ExpeditionRunState, ExpeditionConfig } from "./types.js";
import { generateExpedition } from "./generator.js";
import { generateExpeditionLoot } from "../loot/lootTables.js";

function uniq(ids: string[]) {
  return Array.from(new Set(ids));
}

/**
 * Create an expedition loadout (selected subset of player items).
 * - only items present in inventory can be selected
 * - only one per slot
 */
export function createExpeditionLoadout(params: {
  inventory: Inventory;
  selections: Array<{ slot: ItemSlot; itemId: string }>;
}): ExpeditionLoadout {
  const out: ExpeditionLoadout = {};

  for (const s of params.selections) {
    const item = params.inventory.items[s.itemId];
    if (!item) continue;
    if (item.slot !== s.slot) continue;
    out[s.slot] = item.id;
  }

  return out;
}

/**
 * Start a run:
 * - snapshots risked item ids
 * - generates the 7 rooms plan deterministically from config.seed
 */
export function startExpeditionRun(params: {
  config: ExpeditionConfig;
  loadout: ExpeditionLoadout;
  now: number;
}): ExpeditionRunState {
  const riskedItemIds = uniq(Object.values(params.loadout).filter(Boolean) as string[]);

  const gen = generateExpedition(params.config);

  return {
    id: gen.id,
    config: params.config,
    loadout: { ...params.loadout },
    riskedItemIds,
    rooms: gen.rooms,
    startedAt: params.now,
  };
}

/**
 * Resolve a run:
 * - WIN: keep expedition loadout + grant loot items
 * - LOSE: remove risked items + clear expedition loadout
 */
export function resolveExpeditionRun(params: {
  run: ExpeditionRunState;
  inventory: Inventory;
  result: "WIN" | "LOSE";
  now: number;
  lostSlotBias?: ItemSlot | null;
}): { run: ExpeditionRunState; inventory: Inventory; nextExpeditionLoadout: ExpeditionLoadout } {
  const run = params.run;

  const loot = generateExpeditionLoot({
    seed: run.config.seed,
    worldLevel: run.config.worldLevel,
    biome: run.config.biome,
    result: params.result,
    lostSlotBias: params.lostSlotBias ?? null,
  });

  let inventory = params.inventory;

  if (params.result === "LOSE") {
    for (const id of run.riskedItemIds) {
      inventory = removeItem(inventory, id);
    }
  } else {
    for (const it of loot.items) {
      inventory = { items: { ...inventory.items, [it.id]: it } };
    }
  }

  const completed: ExpeditionRunState = {
    ...run,
    finishedAt: params.now,
    result: params.result,
    loot,
  };

  const nextExpeditionLoadout: ExpeditionLoadout =
    params.result === "WIN" ? { ...run.loadout } : {};

  return { run: completed, inventory, nextExpeditionLoadout };
}
