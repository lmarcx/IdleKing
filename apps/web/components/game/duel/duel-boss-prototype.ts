export type DuelBossSpecialKind = "columns" | "rain";

export type DuelVector = {
  x: number;
  y: number;
};

export type DuelColumnConfig = {
  delayMs: number;
  intervalMs: number;
  label: "slow" | "medium" | "fast";
  speed: number;
  xRatio: number;
};

export const RESURRECTED_SCARECROW_BOSS = {
  basicProjectileDamage: 8,
  basicProjectileRadius: 13,
  basicProjectileSpeed: 255,
  bossRadius: 88,
  columnDamage: 10,
  columnDurationMs: 5600,
  columnProjectileRadius: 15,
  hp: 2400,
  hitFlashMs: 150,
  meleeDamage: 42,
  meleeRadius: 88,
  nextBasicDelayMaxMs: 2400,
  nextBasicDelayMinMs: 1400,
  nextSpecialDelayMaxMs: 9000,
  nextSpecialDelayMinMs: 6400,
  rainDamage: 14,
  rainImpactRadius: 52,
  rainImpactWarningMs: 1150,
  rainIntervalMs: 360,
  rainPatternCount: 8,
  rangedDamage: 28,
  specialWindupMs: 650,
} as const;

export const RESURRECTED_SCARECROW_COLUMNS: DuelColumnConfig[] = [
  { delayMs: 0, intervalMs: 880, label: "slow", speed: 215, xRatio: 0.24 },
  { delayMs: 220, intervalMs: 620, label: "medium", speed: 285, xRatio: 0.5 },
  { delayMs: 420, intervalMs: 430, label: "fast", speed: 355, xRatio: 0.76 },
];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function createDuelRng(seed: string) {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  state >>>= 0;

  return function nextRandom() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function distance(a: DuelVector, b: DuelVector): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function isCircleCollision(a: DuelVector, aRadius: number, b: DuelVector, bRadius: number): boolean {
  return distance(a, b) <= aRadius + bRadius;
}

export function nextBasicDelayMs(random: () => number): number {
  const min = RESURRECTED_SCARECROW_BOSS.nextBasicDelayMinMs;
  const max = RESURRECTED_SCARECROW_BOSS.nextBasicDelayMaxMs;
  return min + (max - min) * random();
}

export function nextSpecialDelayMs(random: () => number): number {
  const min = RESURRECTED_SCARECROW_BOSS.nextSpecialDelayMinMs;
  const max = RESURRECTED_SCARECROW_BOSS.nextSpecialDelayMaxMs;
  return min + (max - min) * random();
}

export function pickNextSpecial(lastSpecial: DuelBossSpecialKind | null, random: () => number): DuelBossSpecialKind {
  if (!lastSpecial) return random() > 0.5 ? "columns" : "rain";
  return lastSpecial === "columns" ? "rain" : "columns";
}

export function createRainTarget(random: () => number, mapWidth: number, mapHeight: number): DuelVector {
  const marginX = Math.min(260, mapWidth * 0.14);
  const top = Math.min(360, mapHeight * 0.22);
  const bottom = Math.min(220, mapHeight * 0.14);

  return {
    x: marginX + random() * Math.max(1, mapWidth - marginX * 2),
    y: top + random() * Math.max(1, mapHeight - top - bottom),
  };
}
