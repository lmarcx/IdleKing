import type { Element } from "../power/types.js";
import type { Rarity } from "./rarity.js";
import { RARITY_MULTIPLIER } from "./rarity.js";

export type ItemSlot =
  | "HELM"
  | "CHEST"
  | "LEGS"
  | "SHOULDERS"
  | "BOOTS"
  | "GLOVES"
  | "CAPE"
  | "NECKLACE"
  | "ARTIFACT"
  | "STONE";

// TODO: Ring slots will be reintroduced later as skill modifier slots.
export type LegacyItemSlot = "RING" | "BAND";

export type ItemKind = "ARMOR_GEAR" | "JEWELRY" | "STONE";

export type ItemStats = {
  hp?: number;
  attack?: number;
  armor?: number;
  resists?: Partial<Record<Element, number>>;
  elemental?: Partial<Record<Element, number>>;
  critChance?: number; // additive (can exceed 1)
  critDmg?: number; // additive to base
  speedRating?: number;
  pierceRating?: number;
};

export const SLOT_KIND: Record<ItemSlot, ItemKind> = {
  HELM: "ARMOR_GEAR",
  CHEST: "ARMOR_GEAR",
  LEGS: "ARMOR_GEAR",
  SHOULDERS: "ARMOR_GEAR",
  BOOTS: "ARMOR_GEAR",
  GLOVES: "ARMOR_GEAR",
  CAPE: "ARMOR_GEAR",
  NECKLACE: "JEWELRY",
  ARTIFACT: "JEWELRY",
  STONE: "STONE",
};

export const TIER_MULTIPLIERS = [1.0, 2.5, 6.0, 15.0, 40.0] as const;

export function tierFromWorldLevel(worldLevel: number): number {
  if (worldLevel <= 10) return 1;
  if (worldLevel <= 20) return 2;
  if (worldLevel <= 30) return 3;
  if (worldLevel <= 40) return 4;
  return 5;
}

export function budgetBase(ilvl: number): number {
  const x = Math.max(1, ilvl);
  return Math.pow(x, 1.15);
}

export function budgetFinal(ilvl: number, rarity: Rarity, tier: number): number {
  const rarityMult = RARITY_MULTIPLIER[rarity] ?? 1;
  const tierMult = TIER_MULTIPLIERS[Math.max(0, Math.min(4, tier - 1))] ?? 1;
  return budgetBase(ilvl) * rarityMult * tierMult;
}

// --- Allocation profiles (percentages sum to 1.0) ---
const ARMOR_PROFILE = { hp: 0.45, armor: 0.30, resist: 0.25 } as const;
const JEWELRY_PROFILE = { attack: 0.35, elemental: 0.25, crit: 0.15, speed: 0.15, pierce: 0.10 } as const;
const STONE_PROFILE = { elemental: 0.60, pierce: 0.25, resist: 0.15 } as const;

// --- Conversions: points -> values (tunable in balancing.md) ---
export const POINT_TO_VALUE = {
  hp: 6.0,
  armor: 0.35,
  resist: 0.45,

  attack: 0.25,
  elemental: 0.30,

  // ratings are in points already, we scale a bit:
  critChance: 0.0025, // points -> +critChance (so 100 pts => +0.25)
  speedRating: 0.9,
  pierceRating: 0.6,

  critDmg: 0.0, // not rolled directly in MVP (comes via overflow conversion), keep 0 for now
} as const;

export function allocateStats(params: {
  kind: ItemKind;
  budget: number;
  element?: Element; // for ELEMENTAL or RESIST (1 element per item)
}): ItemStats {
  const { kind, budget, element } = params;

  if (kind === "ARMOR_GEAR") {
    const hpPts = budget * ARMOR_PROFILE.hp;
    const armorPts = budget * ARMOR_PROFILE.armor;
    const resPts = budget * ARMOR_PROFILE.resist;

    return {
      hp: hpPts * POINT_TO_VALUE.hp,
      armor: armorPts * POINT_TO_VALUE.armor,
      resists: element ? { [element]: resPts * POINT_TO_VALUE.resist } : undefined,
    };
  }

  if (kind === "JEWELRY") {
    const atkPts = budget * JEWELRY_PROFILE.attack;
    const elemPts = budget * JEWELRY_PROFILE.elemental;
    const critPts = budget * JEWELRY_PROFILE.crit;
    const speedPts = budget * JEWELRY_PROFILE.speed;
    const piercePts = budget * JEWELRY_PROFILE.pierce;

    return {
      attack: atkPts * POINT_TO_VALUE.attack,
      elemental: element ? { [element]: elemPts * POINT_TO_VALUE.elemental } : undefined,
      critChance: critPts * POINT_TO_VALUE.critChance,
      speedRating: speedPts * POINT_TO_VALUE.speedRating,
      pierceRating: piercePts * POINT_TO_VALUE.pierceRating,
    };
  }

  // STONE
  const elemPts = budget * STONE_PROFILE.elemental;
  const piercePts = budget * STONE_PROFILE.pierce;
  const resPts = budget * STONE_PROFILE.resist;

  return {
    elemental: element ? { [element]: elemPts * POINT_TO_VALUE.elemental } : undefined,
    pierceRating: piercePts * POINT_TO_VALUE.pierceRating,
    resists: element ? { [element]: resPts * POINT_TO_VALUE.resist } : undefined,
  };
}
