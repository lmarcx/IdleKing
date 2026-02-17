import type { Element, CombatStats } from "../power/types.js";
import type { ResourceId } from "../loot/lootTables.js";

export type BuildingId =
  | "TOWN_HALL"
  | "ROYAL_TREASURY"
  | "BARRACKS"
  | "FORGE"
  | "ARCANE_TOWER"
  | "WELL"
  | "HUNTERS_LODGE"
  | "STONEQUARRY"
  | "LUMBERMILL";

export type BuildingBonus = Partial<Pick<
  CombatStats,
  "hp" | "attack" | "armor" | "critChance" | "critDmg" | "speedRating" | "pierceRating"
>> & {
  resists?: Partial<Record<Element, number>>;
  elemental?: Partial<Record<Element, number>>;
};

export type ProductionOutput = {
  id: ResourceId;
  perSecond: number; // online production only
};

export type BuildingDefinition = {
  id: BuildingId;
  name: string;
  description: string;

  // Content gating
  minWorldLevel?: number;

  // Bonuses always active (your choice A)
  bonus?: BuildingBonus;

  // Production (online only)
  production?: ProductionOutput[];

  // Unlock flags (used by quests/stubs later)
  flags?: string[];
};

export type BuildingLevelState = {
  id: BuildingId;
  level: number; // 0 = not built
};
