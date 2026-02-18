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
    if (item.slot !== s.slot) continue; // safety
    out[s.slot] = item.id;
  }

  return out;
}

/**
 * Start a run (snapshot).
 */
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
 * Resolve a run:
 * - WIN: keep risked items + grant loot (items + resources)
 * - LOSE: remove risked items from inventory, no items rewarded, resources consolation already handled in lootTables
 *
 * Returns:
 * - updated inventory (items removed on loss, items added on win)
 * - the completed run state (with loot/result)
 */
export function resolveExpeditionRun(params: {
  run: ExpeditionRunState;
  inventory: Inventory;
  result: "WIN" | "LOSE";
  now: number;

  // Anti-tilt: if player lost previously, caller can pass a slot they lost.
  // For MVP: we pass it in explicitly.
  lostSlotBias?: ItemSlot | null;
}): { run: ExpeditionRunState; inventory: Inventory } {
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
    // Remove risked items permanently
    for (const id of run.riskedItemIds) {
      inventory = removeItem(inventory, id);
    }
  } else {
    // WIN: add dropped items to inventory
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

  return { run: completed, inventory };
}
