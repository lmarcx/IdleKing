import { getResourceDefinitionOrThrow } from "../../resources/index.js";
import type { CanonicalResourceId, ResourceStock } from "../../resources/types.js";
import type { FarmSpawn, FarmSpawnKind } from "./types.js";

export const FARM_RUN_TIMER_MS = 60_000;
export const FARM_SPAWNS_PER_WAVE = 8;

// DEFERRED balancing: Farm quantities and weights are Phase 5 placeholders.
export const FARM_RESOURCE_AMOUNT_PLACEHOLDERS = {
  tomato: 1,
  carrot: 1,
  tough_meat: 1,
} as const satisfies Readonly<Partial<Record<CanonicalResourceId, number>>>;

export const FARM_RESOURCE_TABLE: readonly {
  id: keyof typeof FARM_RESOURCE_AMOUNT_PLACEHOLDERS;
  amount: number;
  weight: number;
}[] = [
  { id: "tomato", amount: FARM_RESOURCE_AMOUNT_PLACEHOLDERS.tomato, weight: 5 },
  { id: "carrot", amount: FARM_RESOURCE_AMOUNT_PLACEHOLDERS.carrot, weight: 4 },
  { id: "tough_meat", amount: FARM_RESOURCE_AMOUNT_PLACEHOLDERS.tough_meat, weight: 2 },
];

export function validateFarmResourceTable(table = FARM_RESOURCE_TABLE): void {
  for (const entry of table) {
    getResourceDefinitionOrThrow(entry.id);
    if (!Number.isInteger(entry.amount) || entry.amount <= 0) {
      throw new Error(`Invalid Farm resource amount for ${entry.id}: ${entry.amount}`);
    }
    if (!Number.isFinite(entry.weight) || entry.weight <= 0) {
      throw new Error(`Invalid Farm resource weight for ${entry.id}: ${entry.weight}`);
    }
  }
}

validateFarmResourceTable();

export type GenerateFarmSpawnsOptions = {
  seed?: number;
  wave?: number;
  count?: number;
};

type FarmRandom = {
  next(): number;
  int(maxExclusive: number): number;
};

function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.floor(value), min), max);
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number): FarmRandom {
  let state = seed >>> 0;
  return {
    next() {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    int(maxExclusive: number) {
      return Math.floor(this.next() * Math.max(1, maxExclusive));
    },
  };
}

function pickWeightedResource(rng: FarmRandom, multiplier = 1): ResourceStock {
  const totalWeight = FARM_RESOURCE_TABLE.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng.next() * totalWeight;

  for (const entry of FARM_RESOURCE_TABLE) {
    roll -= entry.weight;
    if (roll <= 0) return { [entry.id]: entry.amount * multiplier };
  }

  const fallback = FARM_RESOURCE_TABLE[0];
  return { [fallback.id]: fallback.amount * multiplier };
}

function pickSpawnKind(rng: FarmRandom): FarmSpawnKind {
  const roll = rng.next();
  if (roll < 0.12) return "bomb";
  if (roll < 0.22) return "golden_fruit";
  return "fruit";
}

export function generateFarmSpawns(options: GenerateFarmSpawnsOptions = {}): FarmSpawn[] {
  const seed = options.seed ?? hashSeed("farm:spawns");
  const wave = clampInt(options.wave ?? 1, 1, 9999);
  const count = clampInt(options.count ?? FARM_SPAWNS_PER_WAVE, 1, 32);
  const rng = createRandom(hashSeed(`${seed}:${wave}:${count}`));

  return Array.from({ length: count }, (_, index) => {
    const kind = pickSpawnKind(rng);
    const isRewardSpawn = kind === "fruit" || kind === "golden_fruit";

    return {
      id: `farm-${wave}-${index}`,
      kind,
      reward: isRewardSpawn ? pickWeightedResource(rng, kind === "golden_fruit" ? 2 : 1) : undefined,
      hit: false,
      x: Math.round(rng.next() * 1000) / 1000,
      y: Math.round(rng.next() * 1000) / 1000,
    };
  });
}
