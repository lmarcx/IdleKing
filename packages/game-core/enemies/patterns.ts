import type { EnemyArchetype } from "./registry.js";

/**
 * Enemy attack patterns — pure, renderer-agnostic. The runtime asks "what does this enemy do
 * now?" and receives hazards to spawn; it owns only rendering and hit resolution.
 *
 * Generalises the Duel Scarecrow prototype (windups, ground warnings, projectile fans) into data
 * so every MVP boss gets real phases (Freeze §14) instead of contact damage only.
 */

export type Vec2 = Readonly<{ x: number; y: number }>;

/** A projectile travelling in a straight line; hits the player on contact. */
export type ProjectileHazard = Readonly<{
  kind: "projectile";
  origin: Vec2;
  direction: Vec2;
  speed: number;
  radius: number;
  damage: number;
  maxRange: number;
  /** Telegraph shown at the origin before the projectile leaves. */
  windupMs: number;
}>;

/** A telegraphed ground zone: a warning circle that deals damage when its windup ends. */
export type GroundHazard = Readonly<{
  kind: "ground";
  center: Vec2;
  radius: number;
  damage: number;
  windupMs: number;
}>;

export type EnemyHazard = ProjectileHazard | GroundHazard;

export type BossAttack =
  /** Ground circle on the player's current position. */
  | Readonly<{ kind: "slam"; damage: number; radius: number; windupMs: number }>
  /** Fan of projectiles aimed at the player. */
  | Readonly<{ kind: "volley"; damage: number; count: number; spreadDegrees: number; speed: number; windupMs: number }>
  /** Several ground circles scattered around the player. */
  | Readonly<{ kind: "rain"; damage: number; count: number; radius: number; scatter: number; windupMs: number }>
  /** Ring centred on the boss: get out of melee range. */
  | Readonly<{ kind: "nova"; damage: number; radius: number; windupMs: number }>;

export type BossPhase = Readonly<{
  /** Phase starts when boss HP ratio is at or below this value (first phase = 1). */
  hpThreshold: number;
  attackIntervalMs: number;
  moveSpeedMultiplier: number;
  attacks: readonly BossAttack[];
}>;

export type BossPattern = Readonly<{
  bossId: string;
  phases: readonly BossPhase[];
}>;

const PROJECTILE_RADIUS = 10;
const PROJECTILE_RANGE = 720;

/**
 * DEFERRED balancing — damage values scale with each boss's contact damage tier; timings keep
 * every telegraph readable (>= 550 ms windup, as in the Duel prototype).
 */
export const BOSS_PATTERNS: readonly BossPattern[] = [
  {
    bossId: "dark_amalgam",
    phases: [
      {
        hpThreshold: 1,
        attackIntervalMs: 2600,
        moveSpeedMultiplier: 1,
        attacks: [
          { kind: "slam", damage: 18, radius: 90, windupMs: 900 },
          { kind: "volley", damage: 10, count: 3, spreadDegrees: 30, speed: 300, windupMs: 600 },
        ],
      },
    ],
  },
  {
    bossId: "dragon_shadow",
    phases: [
      {
        hpThreshold: 1,
        attackIntervalMs: 2400,
        moveSpeedMultiplier: 1,
        attacks: [
          { kind: "volley", damage: 18, count: 5, spreadDegrees: 50, speed: 340, windupMs: 650 },
          { kind: "slam", damage: 28, radius: 110, windupMs: 850 },
        ],
      },
      {
        hpThreshold: 0.5,
        attackIntervalMs: 1900,
        moveSpeedMultiplier: 1.25,
        attacks: [
          { kind: "rain", damage: 24, count: 6, radius: 70, scatter: 260, windupMs: 1000 },
          { kind: "volley", damage: 18, count: 7, spreadDegrees: 70, speed: 360, windupMs: 600 },
          { kind: "nova", damage: 30, radius: 170, windupMs: 800 },
        ],
      },
    ],
  },
  {
    bossId: "frost_amalgam",
    phases: [
      {
        hpThreshold: 1,
        attackIntervalMs: 2300,
        moveSpeedMultiplier: 1,
        attacks: [
          { kind: "nova", damage: 34, radius: 180, windupMs: 850 },
          { kind: "rain", damage: 26, count: 5, radius: 75, scatter: 240, windupMs: 1000 },
          { kind: "slam", damage: 36, radius: 120, windupMs: 850 },
        ],
      },
    ],
  },
  {
    bossId: "corrupted_archmage",
    phases: [
      {
        hpThreshold: 1,
        attackIntervalMs: 2200,
        moveSpeedMultiplier: 0.9,
        attacks: [
          { kind: "volley", damage: 26, count: 5, spreadDegrees: 40, speed: 380, windupMs: 600 },
          { kind: "rain", damage: 30, count: 5, radius: 80, scatter: 260, windupMs: 1050 },
        ],
      },
      {
        hpThreshold: 0.5,
        attackIntervalMs: 1700,
        moveSpeedMultiplier: 1.1,
        attacks: [
          { kind: "volley", damage: 26, count: 9, spreadDegrees: 120, speed: 360, windupMs: 650 },
          { kind: "nova", damage: 40, radius: 200, windupMs: 800 },
          { kind: "rain", damage: 30, count: 8, radius: 80, scatter: 320, windupMs: 1000 },
        ],
      },
    ],
  },
  {
    bossId: "fallen_rain_lord",
    phases: [
      {
        hpThreshold: 1,
        attackIntervalMs: 2000,
        moveSpeedMultiplier: 1,
        attacks: [
          { kind: "slam", damage: 42, radius: 100, windupMs: 700 },
          { kind: "rain", damage: 30, count: 7, radius: 70, scatter: 300, windupMs: 1000 },
        ],
      },
      {
        hpThreshold: 0.5,
        attackIntervalMs: 1600,
        moveSpeedMultiplier: 1.3,
        attacks: [
          { kind: "rain", damage: 32, count: 10, radius: 70, scatter: 360, windupMs: 950 },
          { kind: "slam", damage: 46, radius: 110, windupMs: 650 },
          { kind: "volley", damage: 28, count: 6, spreadDegrees: 60, speed: 400, windupMs: 550 },
        ],
      },
    ],
  },
  {
    bossId: "allaeva",
    phases: [
      {
        hpThreshold: 1,
        attackIntervalMs: 2100,
        moveSpeedMultiplier: 1,
        attacks: [
          { kind: "volley", damage: 32, count: 7, spreadDegrees: 60, speed: 380, windupMs: 600 },
          { kind: "nova", damage: 44, radius: 200, windupMs: 850 },
          { kind: "slam", damage: 46, radius: 120, windupMs: 800 },
        ],
      },
      {
        hpThreshold: 0.5,
        attackIntervalMs: 1500,
        moveSpeedMultiplier: 1.2,
        attacks: [
          { kind: "rain", damage: 36, count: 10, radius: 80, scatter: 340, windupMs: 950 },
          { kind: "volley", damage: 32, count: 11, spreadDegrees: 160, speed: 380, windupMs: 600 },
          { kind: "nova", damage: 48, radius: 230, windupMs: 750 },
        ],
      },
    ],
  },
];

const PATTERN_BY_BOSS = new Map(BOSS_PATTERNS.map((pattern) => [pattern.bossId, pattern]));

export function getBossPattern(bossId: string): BossPattern | undefined {
  return PATTERN_BY_BOSS.get(bossId);
}

/** Index of the active phase for an HP ratio (0..1). Phases only advance, never revert. */
export function getBossPhaseIndex(pattern: BossPattern, hpRatio: number, currentIndex = 0): number {
  let index = currentIndex;
  for (let candidate = currentIndex + 1; candidate < pattern.phases.length; candidate += 1) {
    if (hpRatio <= pattern.phases[candidate].hpThreshold) index = candidate;
  }
  return index;
}

function normalize(vector: Vec2): Vec2 {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

function rotate(vector: Vec2, radians: number): Vec2 {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { x: vector.x * cos - vector.y * sin, y: vector.x * sin + vector.y * cos };
}

/**
 * Hazards for one boss attack. `random` must return [0, 1) (seeded by the caller) and is only
 * used for rain scatter, so tests stay deterministic.
 */
export function planBossAttack(attack: BossAttack, boss: Vec2, player: Vec2, random: () => number): EnemyHazard[] {
  switch (attack.kind) {
    case "slam":
      return [{ kind: "ground", center: { ...player }, radius: attack.radius, damage: attack.damage, windupMs: attack.windupMs }];
    case "nova":
      return [{ kind: "ground", center: { ...boss }, radius: attack.radius, damage: attack.damage, windupMs: attack.windupMs }];
    case "rain":
      return Array.from({ length: attack.count }, (_, index) => {
        // First impact always targets the player; the rest scatter around them.
        if (index === 0) return { kind: "ground" as const, center: { ...player }, radius: attack.radius, damage: attack.damage, windupMs: attack.windupMs };
        const angle = random() * Math.PI * 2;
        const distance = attack.scatter * Math.sqrt(random());
        return {
          kind: "ground" as const,
          center: { x: player.x + Math.cos(angle) * distance, y: player.y + Math.sin(angle) * distance },
          radius: attack.radius,
          damage: attack.damage,
          windupMs: attack.windupMs + index * 60,
        };
      });
    case "volley": {
      const aim = normalize({ x: player.x - boss.x, y: player.y - boss.y });
      const spread = (attack.spreadDegrees * Math.PI) / 180;
      return Array.from({ length: attack.count }, (_, index) => {
        const offset = attack.count === 1 ? 0 : -spread / 2 + (spread * index) / (attack.count - 1);
        return {
          kind: "projectile" as const,
          origin: { ...boss },
          direction: rotate(aim, offset),
          speed: attack.speed,
          radius: PROJECTILE_RADIUS,
          damage: attack.damage,
          maxRange: PROJECTILE_RANGE,
          windupMs: attack.windupMs,
        };
      });
    }
  }
}

/** Preferred distance a ranged enemy keeps from the player. */
export const RANGED_ENEMY_KEEP_DISTANCE = 240;

/** One telegraphed shot from a ranged/caster archetype (damage = its contact damage). */
export function planRangedEnemyShot(archetype: Pick<EnemyArchetype, "stats" | "tier">, enemy: Vec2, player: Vec2): ProjectileHazard {
  return {
    kind: "projectile",
    origin: { ...enemy },
    direction: normalize({ x: player.x - enemy.x, y: player.y - enemy.y }),
    speed: archetype.tier === "elite" ? 340 : 300,
    radius: archetype.tier === "elite" ? 12 : 9,
    damage: archetype.stats.contactDamage,
    maxRange: 560,
    windupMs: 420,
  };
}

export function validateBossPatterns(
  bosses: readonly { id: string; phases: number }[],
  patterns: readonly BossPattern[] = BOSS_PATTERNS,
): void {
  for (const boss of bosses) {
    const pattern = patterns.find((candidate) => candidate.bossId === boss.id);
    if (!pattern) throw new Error(`Boss ${boss.id} has no attack pattern`);
    if (pattern.phases.length !== boss.phases) {
      throw new Error(`Boss ${boss.id} pattern has ${pattern.phases.length} phases, story registry says ${boss.phases}`);
    }
    pattern.phases.forEach((phase, index) => {
      if (phase.attacks.length === 0) throw new Error(`Boss ${boss.id} phase ${index + 1} has no attacks`);
      if (index === 0 && phase.hpThreshold !== 1) throw new Error(`Boss ${boss.id} first phase must start at full HP`);
      if (index > 0 && phase.hpThreshold >= pattern.phases[index - 1].hpThreshold) {
        throw new Error(`Boss ${boss.id} phase thresholds must decrease`);
      }
      for (const attack of phase.attacks) {
        if (attack.windupMs < 550) throw new Error(`Boss ${boss.id} ${attack.kind} windup too short to read`);
      }
    });
  }
}
