import { createSeededRng, hashSeed as hashSeedValue } from "../random/rng.js";

// Backward-compatible expedition facade. New systems should use createSeededRng.
export type Rng = {
  next(): number; // [0,1)
  int(min: number, max: number): number; // inclusive
  pick<T>(arr: readonly T[]): T;
};

export function mulberry32(seed: number): Rng {
  const rng = createSeededRng(seed);

  return {
    next: rng.nextFloat,
    int: rng.nextInt,
    pick<T>(arr: readonly T[]) {
      if (arr.length === 0) throw new Error("Cannot pick from empty array");
      return arr[rng.nextInt(0, arr.length - 1)];
    },
  };
}

export const hashSeed = hashSeedValue;
