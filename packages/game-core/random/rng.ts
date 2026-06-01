export type WeightedEntry<T> = {
  value: T;
  weight: number;
};

export type SeededRng = {
  nextFloat(): number;
  nextInt(min: number, max: number): number;
  pickWeighted<T>(entries: readonly WeightedEntry<T>[]): T;
};

/**
 * Deterministic Mulberry32 RNG.
 *
 * TODO(FONDATIONS-02): inject this utility into legacy callers that still use
 * Math.random directly (combat crits, Forge precious-stone fallback, recruit ids).
 */
export function createSeededRng(seed: number): SeededRng {
  let state = seed >>> 0;

  function nextFloat(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new RangeError("nextInt bounds must be finite numbers");
    }

    const lowerBound = Math.ceil(min);
    const upperBound = Math.floor(max);

    if (lowerBound > upperBound) {
      throw new RangeError(`nextInt requires min <= max, received ${min}..${max}`);
    }

    return Math.floor(nextFloat() * (upperBound - lowerBound + 1)) + lowerBound;
  }

  function pickWeighted<T>(entries: readonly WeightedEntry<T>[]): T {
    if (entries.length === 0) {
      throw new Error("pickWeighted requires at least one entry");
    }

    let totalWeight = 0;
    for (const entry of entries) {
      if (!Number.isFinite(entry.weight) || entry.weight < 0) {
        throw new Error(`pickWeighted requires finite non-negative weights, received ${entry.weight}`);
      }
      totalWeight += entry.weight;
    }

    if (totalWeight <= 0) {
      throw new Error("pickWeighted requires a positive total weight");
    }

    let roll = nextFloat() * totalWeight;
    let fallback: WeightedEntry<T> | undefined;

    for (const entry of entries) {
      if (entry.weight <= 0) continue;
      fallback = entry;
      roll -= entry.weight;
      if (roll < 0) return entry.value;
    }

    return fallback!.value;
  }

  return {
    nextFloat,
    nextInt,
    pickWeighted,
  };
}

// Cheap deterministic hash to derive independent sub-seeds.
export function hashSeed(seed: number, salt: number): number {
  let value = (seed ^ (salt * 0x9e3779b1)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return value >>> 0;
}
