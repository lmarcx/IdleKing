import type { Inventory } from "../player/types.js";
import { removeItem } from "../player/inventory.js";
import type { ItemSlot } from "../loot/budget.js";
import type { ExpeditionLoadout, ExpeditionRunState, ExpeditionConfig } from "./types.js";
import { generateExpeditionLoot } from "../loot/lootTables.js";

function makeExpeditionId(seed: number, worldLevel: number) {
  return `exp_${worldLevel}_${seed}`;
}

function uniq(ids: string[]) {
  return Array.from(new Set(ids));
}

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

export function startExpeditionRun(params: {
  config: ExpeditionConfig;
  loadout: ExpeditionLoadout;
  now: number;
}): ExpeditionRunState {
  const riskedItemIds = uniq(Object.values(params.loadout).filter(Boolean) as string[]);
  return {
    id: makeExpeditionId(params.config.seed, params.config.worldLevel),
    config: params.config,
    loadout: { ...params.loadout },
    riskedItemIds,
    startedAt: params.now,
  };
}

/**
 * Resolve a run with your rule:
 * - WIN: keep expedition loadout (for chaining/farming) + grant loot items
 * - LOSE: delete risked items from inventory AND clear expedition loadout (player must re-equip)
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

  // ✅ Your rule:
  // - WIN => keep loadout
  // - LOSE => clear it (items are gone)
  const nextExpeditionLoadout: ExpeditionLoadout =
    params.result === "WIN" ? { ...run.loadout } : {};

  return { run: completed, inventory, nextExpeditionLoadout };
}
