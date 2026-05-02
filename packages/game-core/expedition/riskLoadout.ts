import type { Inventory } from "../player/types.js";
import { removeItem } from "../player/inventory.js";
import type { ItemSlot } from "../loot/budget.js";
import type { ExpeditionLoadout, ExpeditionRunState, ExpeditionConfig } from "./types.js";
import { generateExpedition } from "./generator.js";
import { generateExpeditionLoot } from "../loot/lootTables.js";
import { rollKingamasForExpedition } from "../economy/kingamas.js";

const ACTIVE_EXPEDITION_SLOTS: readonly ItemSlot[] = [
  "HELM",
  "CHEST",
  "LEGS",
  "SHOULDERS",
  "BOOTS",
  "GLOVES",
  "CAPE",
  "NECKLACE",
  "ARTIFACT",
  "STONE",
] as const;

function uniq(ids: string[]) {
  return Array.from(new Set(ids));
}

function isActiveExpeditionSlot(slot: unknown): slot is ItemSlot {
  return typeof slot === "string" && (ACTIVE_EXPEDITION_SLOTS as readonly string[]).includes(slot);
}

function sanitizeExpeditionLoadout(loadout: ExpeditionLoadout): ExpeditionLoadout {
  const next: ExpeditionLoadout = {};

  for (const [slot, itemId] of Object.entries(loadout)) {
    if (!isActiveExpeditionSlot(slot) || !itemId) continue;
    next[slot] = itemId;
  }

  return next;
}

/**
 * Build an expedition loadout from inventory selections.
 * - ignores unknown items
 * - enforces slot match
 */
export function createExpeditionLoadout(params: {
  inventory: Inventory;
  selections: Array<{ slot: ItemSlot; itemId: string }>;
}): ExpeditionLoadout {
  const out: ExpeditionLoadout = {};

  for (const s of params.selections) {
    if (!isActiveExpeditionSlot(s.slot)) continue;
    const item = params.inventory.items[s.itemId];
    if (!item) continue;
    if (!isActiveExpeditionSlot(item.slot)) continue;
    if (item.slot !== s.slot) continue;
    out[s.slot] = item.id;
  }

  return out;
}

/**
 * Start a run:
 * - snapshots risked item ids
 * - generates the 7 rooms deterministically from config.seed
 */
export function startExpeditionRun(params: {
  config: ExpeditionConfig;
  loadout: ExpeditionLoadout;
  now: number;
}): ExpeditionRunState {
  const loadout = sanitizeExpeditionLoadout(params.loadout);
  const riskedItemIds = uniq(Object.values(loadout).filter(Boolean) as string[]);
  const gen = generateExpedition(params.config);

  return {
    id: gen.id,
    config: params.config,
    loadout,
    riskedItemIds,
    rooms: gen.rooms,
    startedAt: params.now,
  };
}

/**
 * Resolve a run:
 * - LOSE: remove risked items, clear loadout, kingamas gained = 0
 * - WIN: keep risked items, add loot items, keep loadout, gain kingamas in fixed range per level
 *
 * Note: weekly claim checks are handled at app/server level (not core).
 */
export function resolveExpeditionRun(params: {
  run: ExpeditionRunState;
  inventory: Inventory;
  result: "WIN" | "LOSE";
  now: number;
  lostSlotBias?: ItemSlot | null;

  // economy: optional so older callers/tests don't break
  kingamas?: number;
}): {
  run: ExpeditionRunState;
  inventory: Inventory;
  nextExpeditionLoadout: ExpeditionLoadout;
  kingamas: number;
  kingamasGained: number;
} {
  const run = params.run;

  const loot = generateExpeditionLoot({
    seed: run.config.seed,
    worldLevel: run.config.worldLevel,
    biome: run.config.biome,
    result: params.result,
    lostSlotBias: params.lostSlotBias ?? null,
  });

  const kingamasGained = rollKingamasForExpedition({
    seed: run.config.seed,
    expeditionLevel: run.config.expeditionLevel,
    win: params.result === "WIN",
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

  const currentKingamas = params.kingamas ?? 0;

  return {
    run: completed,
    inventory,
    nextExpeditionLoadout,
    kingamas: currentKingamas + kingamasGained,
    kingamasGained,
  };
}
