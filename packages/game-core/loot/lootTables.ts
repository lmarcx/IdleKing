import type { ItemSlot } from "./budget.js";
import type { GeneratedItem, Biome } from "./itemGenerator.js";
import { generateItem } from "./itemGenerator.js";
import { expectedIlvl } from "../progression/expectedIlvl.js";

export type ExpeditionResult = "WIN" | "LOSE";

export type ResourceId =
  | "BRONZE"
  | "COPPER"
  | "SILVER"
  | "GOLD"
  | "WOOD"
  | "STONE"
  | "WATER"
  | "MEAT";

export type ResourceReward = { id: ResourceId; amount: number };

export type ExpeditionLootParams = {
  seed: number; // deterministic per run
  worldLevel: number;
  biome: Biome;

  result: ExpeditionResult;

  /**
   * Optional: "anti-tilt" after a loss.
   * If provided, we bias the slot of the GUARANTEED item slightly toward this slot.
   * This should typically be a slot the player lost in the failed expedition.
   */
  lostSlotBias?: ItemSlot | null;

  /**
   * Chance for a 2nd item on WIN.
   * Default: 30% (tunable)
   */
  secondItemChance?: number;

  /**
   * Ilvl variance around expected ilvl.
   * Default: +/- 6%
   */
  ilvlVariancePct?: number;
};

export type ExpeditionLoot = {
  items: GeneratedItem[];
  resources: ResourceReward[];
};

/**
 * Deterministic RNG (Mulberry32)
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

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function rollIlvl(rng: () => number, worldLevel: number, variancePct: number) {
  const base = expectedIlvl(worldLevel); // 20*world capped 1000
  const v = clamp(variancePct, 0, 0.25);

  // uniform variance around base
  const delta = (rng() * 2 - 1) * v; // [-v, +v]
  const ilvl = Math.round(base * (1 + delta));

  return clamp(ilvl, 1, 1000);
}

/**
 * Resources are world-owned (MVP): always kept, never lost.
 * We reward resources on WIN, and a smaller consolation on LOSE (optional).
 */
function rollResourceRewards(rng: () => number, worldLevel: number, biome: Biome, result: ExpeditionResult): ResourceReward[] {
  // Very simple v1: biome "flavor" + baseline
  // You can rebalance later in economy/balancing docs.
  const base = Math.max(1, Math.floor(worldLevel * 3));

  // Winner gets more. Loser gets some consolation (keeps morale, still punitif).
  const mult = result === "WIN" ? 1.0 : 0.25;

  const amt = (k: number) => Math.max(1, Math.round(base * k * mult));

  const common: ResourceReward[] = [
    { id: "WOOD", amount: amt(0.8) },
    { id: "STONE", amount: amt(0.7) },
    { id: "BRONZE", amount: amt(1.0) },
    { id: "WATER", amount: amt(0.5) },
  ];

  // Biome special
  const special: Record<Biome, ResourceReward> = {
    VOLCANIC: { id: "COPPER", amount: amt(0.9) },
    TUNDRA: { id: "MEAT", amount: amt(0.9) },
    STORM_CITADEL: { id: "SILVER", amount: amt(0.7) },
    COSMIC_WRECK: { id: "GOLD", amount: amt(0.4) },
  };

  // On WIN, add the biome special. On LOSE, still add it but smaller via mult.
  return [...common, special[biome]];
}

/**
 * Main: expedition end rewards.
 *
 * Rules (MVP):
 * - WIN: 1 guaranteed item + resources + chance of 2nd item
 * - LOSE: 0 items (because you lost your loadout already), but resources consolation is allowed (world-owned)
 *
 * Note: If you want "lose gives 1 low item", we can change later.
 */
export function generateExpeditionLoot(params: ExpeditionLootParams): ExpeditionLoot {
  const rng = mulberry32(params.seed);

  const secondChance = params.secondItemChance ?? 0.30;
  const variancePct = params.ilvlVariancePct ?? 0.06;

  const resources = rollResourceRewards(rng, params.worldLevel, params.biome, params.result);

  // If lose: no item reward (punitive roguelite). Only world resources (and never lose Kingamas).
  if (params.result === "LOSE") {
    return { items: [], resources };
  }

  const ilvl1 = rollIlvl(rng, params.worldLevel, variancePct);

  // Anti-tilt: only on win after a previous loss (caller decides).
  // We bias only the guaranteed item.
  const biasSlot =
    params.lostSlotBias && params.lostSlotBias !== null ? params.lostSlotBias : undefined;

  const item1 = generateItem({
    seed: params.seed + 1000, // separate stream from rng
    worldLevel: params.worldLevel,
    biome: params.biome,
    ilvl: ilvl1,
    biasSlot,
  });

  const items: GeneratedItem[] = [item1];

  // Chance of 2nd item (no bias)
  if (rng() < secondChance) {
    const ilvl2 = rollIlvl(rng, params.worldLevel, variancePct);
    const item2 = generateItem({
      seed: params.seed + 2000,
      worldLevel: params.worldLevel,
      biome: params.biome,
      ilvl: ilvl2,
    });
    items.push(item2);
  }

  return { items, resources };
}
