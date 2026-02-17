import type { Element, CombatStats } from "../power/types.js";
import { computePowerFromStats } from "../power/powerEngine.js";
import type { ItemSlot, ItemKind, ItemStats } from "./budget.js";
import { SLOT_KIND, allocateStats, tierFromWorldLevel, budgetFinal } from "./budget.js";
import type { Rarity } from "./rarity.js";
import { rarityFromIlvl } from "./rarity.js";

/**
 * Biomes (MVP): 4 biomes -> 4 elements
 */
export type Biome = "VOLCANIC" | "TUNDRA" | "STORM_CITADEL" | "COSMIC_WRECK";

export const BIOME_ELEMENT: Record<Biome, Element> = {
  VOLCANIC: "FIRE",
  TUNDRA: "ICE",
  STORM_CITADEL: "LIGHTNING",
  COSMIC_WRECK: "VOID",
};

export type GeneratedItem = {
  id: string;
  name: string;
  slot: ItemSlot;
  kind: ItemKind;

  biome: Biome;
  element: Element;

  ilvl: number; // fixed
  rarity: Rarity;
  


  upgradeLevel: number; // starts at 0 in MVP
  baseStats: ItemStats;
  stats: ItemStats;

  itemPower: number;
};

export type GenerateItemParams = {
  seed: number;
  worldLevel: number;
  biome: Biome;

  /**
   * The ilvl to generate. Usually expectedIlvl(worldLevel) with some variance.
   */
  ilvl: number;

  /**
   * Optional: smart-loot anti-tilt.
   * If provided, the generator will slightly bias toward this slot.
   */
  biasSlot?: ItemSlot;
};

/**
 * Deterministic PRNG (Mulberry32).
 * Returns a function rng() -> [0,1)
 */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne<T>(rng: () => number, arr: readonly T[]): T {
  const idx = Math.floor(rng() * arr.length);
  return arr[Math.max(0, Math.min(arr.length - 1, idx))];
}

function clampIlvl(ilvl: number) {
  if (!Number.isFinite(ilvl)) return 1;
  return Math.max(1, Math.min(1000, Math.floor(ilvl)));
}

const ARMOR_SLOTS: readonly ItemSlot[] = [
  "HELM",
  "CHEST",
  "LEGS",
  "SHOULDERS",
  "BOOTS",
  "GLOVES",
  "CAPE",
] as const;

const JEWELRY_SLOTS: readonly ItemSlot[] = ["NECKLACE", "RING", "BAND"] as const;

const STONE_SLOTS: readonly ItemSlot[] = ["STONE"] as const;

const ALL_SLOTS: readonly ItemSlot[] = [...ARMOR_SLOTS, ...JEWELRY_SLOTS, ...STONE_SLOTS] as const;

/**
 * Slot distribution:
 * - Armor: 55%
 * - Jewelry: 35%
 * - Stone: 10%
 */
function rollSlot(rng: () => number): ItemSlot {
  const r = rng();
  if (r < 0.55) return pickOne(rng, ARMOR_SLOTS);
  if (r < 0.90) return pickOne(rng, JEWELRY_SLOTS);
  return "STONE";
}

/**
 * Anti-tilt bias: small chance to force a chosen slot.
 * Use case: after failed expedition, increase chance to drop a lost slot.
 *
 * By design: still roguelite/punitive; this is only a small safety net.
 */
function rollSlotWithBias(rng: () => number, biasSlot?: ItemSlot): ItemSlot {
  if (!biasSlot) return rollSlot(rng);

  // 18% chance to respect bias, otherwise normal distribution
  const biasChance = 0.18;
  if (rng() < biasChance) return biasSlot;
  return rollSlot(rng);
}

/**
 * Element roll:
 * - 70% biome element
 * - 30% random other
 * 1 element per item (MVP rule)
 */
function rollElement(rng: () => number, biome: Biome): Element {
  const primary = BIOME_ELEMENT[biome];
  if (rng() < 0.7) return primary;

  const others: Element[] = ["FIRE", "ICE", "LIGHTNING", "VOID"].filter((e) => e !== primary) as Element[];
  return pickOne(rng, others);
}

/**
 * Convert ItemStats -> CombatStats so we can compute ItemPower.
 * Notes:
 * - Item alone doesn't define full stats, so missing values default to 0.
 * - critChance can exceed 1; critDmg defaults to base 1.5 (as per player baseline).
 * - This is a "loadout-only" stat block, used to compute the power contribution of the item.
 */
function toCombatStats(itemStats: ItemStats): CombatStats {
  const resists = {
    FIRE: 0,
    ICE: 0,
    LIGHTNING: 0,
    VOID: 0,
    ...(itemStats.resists ?? {}),
  } as Record<Element, number>;

  const elemental = {
    FIRE: 0,
    ICE: 0,
    LIGHTNING: 0,
    VOID: 0,
    ...(itemStats.elemental ?? {}),
  } as Record<Element, number>;

  return {
    hp: Math.round(itemStats.hp ?? 0),
    attack: Number((itemStats.attack ?? 0).toFixed(4)),
    armor: Number((itemStats.armor ?? 0).toFixed(4)),
    resists,
    elemental,
    critChance: itemStats.critChance ?? 0,
    critDmg: 1.5 + (itemStats.critDmg ?? 0),
    speedRating: Math.round(itemStats.speedRating ?? 0),
    pierceRating: Math.round(itemStats.pierceRating ?? 0),
  };
}

function makeId(seed: number, ilvl: number, slot: ItemSlot, element: Element) {
  return `itm_${seed}_${ilvl}_${slot}_${element}`;
}

function defaultName(slot: ItemSlot, rarity: Rarity, element: Element): string {
  // simple placeholder naming (you’ll later swap via localization tables)
  const rarityLabel: Record<Rarity, string> = {
    COMMON: "Commun",
    RARE: "Rare",
    EPIC: "Épique",
    LEGENDARY: "Légendaire",
  };

  const slotLabel: Record<ItemSlot, string> = {
    HELM: "Heaume",
    CHEST: "Plastron",
    LEGS: "Jambières",
    SHOULDERS: "Épaulières",
    BOOTS: "Bottes",
    GLOVES: "Gants",
    CAPE: "Cape",
    NECKLACE: "Collier",
    RING: "Anneau",
    BAND: "Bague",
    STONE: "Pierre",
  };

  return `${slotLabel[slot]} ${rarityLabel[rarity]} (${element})`;
}

/**
 * Main generator.
 */
export function generateItem(params: GenerateItemParams): GeneratedItem {
  const ilvl = clampIlvl(params.ilvl);
  const rng = mulberry32(params.seed);

  const tier = tierFromWorldLevel(params.worldLevel);
  const { rarity } = rarityFromIlvl(ilvl);

  const slot = rollSlotWithBias(rng, params.biasSlot);
  const kind = SLOT_KIND[slot];

  const element = rollElement(rng, params.biome);

  const budget = budgetFinal(ilvl, rarity, tier);
  const stats = allocateStats({ kind, budget, element });

  // ItemPower: use tier of the WORLD (content tier) to keep it consistent
  const rolledStats = allocateStats({ kind, budget, element });

  const itemCombatStats = toCombatStats(rolledStats);
  const itemPower = computePowerFromStats(itemCombatStats, tier).power;

  return {
    id: makeId(params.seed, ilvl, slot, element),
    name: defaultName(slot, rarity, element),
    slot,
    kind,
    biome: params.biome,
    element,
    ilvl,
    rarity,
    upgradeLevel: 0,
    baseStats: rolledStats,   
    stats: rolledStats,
    itemPower,
  };
}

/**
 * Utility: generate multiple items with sequential seeds.
 */
export function generateLootBatch(params: {
  seed: number;
  count: number;
  worldLevel: number;
  biome: Biome;
  ilvl: number;
  biasSlot?: ItemSlot;
}): GeneratedItem[] {
  const out: GeneratedItem[] = [];
  for (let i = 0; i < params.count; i++) {
    out.push(
      generateItem({
        seed: params.seed + i,
        worldLevel: params.worldLevel,
        biome: params.biome,
        ilvl: params.ilvl,
        biasSlot: params.biasSlot,
      })
    );
  }
  return out;
}
