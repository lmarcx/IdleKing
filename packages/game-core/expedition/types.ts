import type { ItemSlot } from "../loot/budget.js";
import type { Biome } from "../loot/itemGenerator.js";
import type { ExpeditionLoot, ExpeditionResult } from "../loot/lootTables.js";

export type ExpeditionId = string;

export type ExpeditionConfig = {
  biome: Biome;
  worldLevel: number;
  seed: number; // deterministic for loot & patterns later
};

export type ExpeditionLoadout = Partial<Record<ItemSlot, string>>; // slot -> itemId

export type ExpeditionRunState = {
  id: ExpeditionId;
  config: ExpeditionConfig;

  // Snapshot of the items risked for this run
  loadout: ExpeditionLoadout;

  // Derived helper: list of item ids risked
  riskedItemIds: string[];

  // Run lifecycle
  startedAt: number; // epoch ms
  finishedAt?: number; // epoch ms
  result?: ExpeditionResult;

  // Rewards on win
  loot?: ExpeditionLoot;
};
