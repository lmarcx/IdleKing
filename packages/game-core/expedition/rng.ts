// Deterministic RNG helpers (seeded)
export type Rng = {
  next(): number; // [0,1)
  int(min: number, max: number): number; // inclusive
  pick<T>(arr: readonly T[]): T;
};

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;

  function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    int(min, max) {
      const lo = Math.ceil(min);
      const hi = Math.floor(max);
      return Math.floor(next() * (hi - lo + 1)) + lo;
    },
    pick<T>(arr: readonly T[]) {
      if (arr.length === 0) throw new Error("Cannot pick from empty array");
      return arr[Math.floor(next() * arr.length)];
    },
  };
}

// cheap deterministic hash to derive sub-seeds
export function hashSeed(seed: number, salt: number) {
  let x = (seed ^ (salt * 0x9E3779B1)) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7FEB352D) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846CA68B) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}
