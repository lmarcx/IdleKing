import type { MapEnemy } from "./types.js";

/**
 * Pure enemy AI state machine for map-driven encounters (Story today; Kingdom/Tutorial/Quests/
 * Events can reuse it since it only depends on MapEnemy, not on Story or Pixi). This is the
 * single source of truth for enemy movement/aggro/attack/leash/death -- it replaces the
 * duplicated 3-state (idle/chasing/dead) machine in apps/web's story-level-combat.ts, per the
 * "temporary duplication" this must migrate out of noted in story-combat-runtime-adapter.ts.
 *
 * Deliberately NOT strict parity with the legacy runtime: "leashed" is a real return-to-spawn
 * state (legacy just falls back to idle wherever the enemy currently stands), a considered
 * improvement rather than an oversight -- see the Story Runtime Parity plan.
 *
 * No damage formula lives here. Player-dealt damage still goes through
 * packages/game-core/combat/runtime (performBasicAttack/computeSkillDamage). Enemy-dealt contact
 * damage is a flat value (EnemyAiConfig.contactDamage, matching legacy's flat GRUNT/BOSS contact
 * damage authoring) applied by the caller via combat/runtime's applyDamageToPlayer -- this module
 * only decides *when* an attack lands (stepEnemyAi's didAttack flag), never how much it deals.
 */
export type EnemyAiState = "idle" | "chasing" | "attacking" | "leashed" | "dead";

export type EnemyAiRuntime = Readonly<{
  id: string;
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
  state: EnemyAiState;
  hpCurrent: number;
  hpMax: number;
  lastAttackAtMs: number;
}>;

/**
 * DEFERRED balancing placeholders (mirrors the pattern in combat/runtime/constants.ts): these
 * defaults are tunable, the state machine itself is locked. attackRange/attackCooldownMs get a
 * boss-sized bump since MapEnemy has no per-enemy hitbox radius to derive them from yet.
 */
export type EnemyAiConfig = Readonly<{
  moveSpeed: number;
  leashSpeed: number;
  aggroRadius: number;
  attackRange: number;
  attackCooldownMs: number;
  leashDistance: number;
  contactDamage: number;
}>;

const DEFAULT_GRUNT_ATTACK_RANGE = 56;
const DEFAULT_BOSS_ATTACK_RANGE = 96;
const DEFAULT_GRUNT_ATTACK_COOLDOWN_MS = 700;
const DEFAULT_BOSS_ATTACK_COOLDOWN_MS = 900;
const DEFAULT_LEASH_DISTANCE_MULTIPLIER = 1.5;
const DEFAULT_LEASH_SPEED_MULTIPLIER = 1.2;
const LEASH_ARRIVAL_EPSILON = 1;

export function createEnemyAiRuntime(enemy: MapEnemy): EnemyAiRuntime {
  const hpMax = Math.max(0, enemy.stats.hp);
  return {
    id: enemy.id,
    x: enemy.x,
    y: enemy.y,
    spawnX: enemy.x,
    spawnY: enemy.y,
    state: hpMax > 0 ? "idle" : "dead",
    hpCurrent: hpMax,
    hpMax,
    lastAttackAtMs: -Infinity,
  };
}

export function createEnemyAiConfig(enemy: MapEnemy): EnemyAiConfig {
  const isBoss = enemy.isBoss ?? enemy.behavior === "boss";
  return {
    moveSpeed: Math.max(0, enemy.stats.speed),
    leashSpeed: Math.max(0, enemy.stats.speed) * DEFAULT_LEASH_SPEED_MULTIPLIER,
    aggroRadius: Math.max(0, enemy.aggroRadius),
    attackRange: isBoss ? DEFAULT_BOSS_ATTACK_RANGE : DEFAULT_GRUNT_ATTACK_RANGE,
    attackCooldownMs: isBoss ? DEFAULT_BOSS_ATTACK_COOLDOWN_MS : DEFAULT_GRUNT_ATTACK_COOLDOWN_MS,
    leashDistance: Math.max(0, enemy.aggroRadius) * DEFAULT_LEASH_DISTANCE_MULTIPLIER,
    contactDamage: Math.max(0, enemy.stats.attack),
  };
}

export type EnemyAiStepResult = Readonly<{
  enemy: EnemyAiRuntime;
  /** True exactly on the tick this enemy's contact attack should be applied to the player. */
  didAttack: boolean;
}>;

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}

function moveToward(x: number, y: number, targetX: number, targetY: number, step: number): Readonly<{ x: number; y: number }> {
  const dist = distance(x, y, targetX, targetY);
  if (dist <= 0) return { x, y };
  const clampedStep = Math.min(step, dist);
  return { x: x + ((targetX - x) / dist) * clampedStep, y: y + ((targetY - y) / dist) * clampedStep };
}

/**
 * Advances one enemy by one tick. Never mutates its input; returns the next EnemyAiRuntime plus
 * whether a contact attack should be applied to the player this tick.
 */
export function stepEnemyAi(
  enemy: EnemyAiRuntime,
  config: EnemyAiConfig,
  playerX: number,
  playerY: number,
  deltaSeconds: number,
  nowMs: number,
): EnemyAiStepResult {
  if (enemy.state === "dead") return { enemy, didAttack: false };

  const distanceToPlayer = distance(enemy.x, enemy.y, playerX, playerY);

  switch (enemy.state) {
    case "idle": {
      if (distanceToPlayer <= config.aggroRadius) {
        return { enemy: { ...enemy, state: "chasing" }, didAttack: false };
      }
      return { enemy, didAttack: false };
    }
    case "chasing": {
      const distanceFromSpawn = distance(enemy.x, enemy.y, enemy.spawnX, enemy.spawnY);
      if (distanceFromSpawn >= config.leashDistance) {
        return { enemy: { ...enemy, state: "leashed" }, didAttack: false };
      }
      if (distanceToPlayer <= config.attackRange) {
        return { enemy: { ...enemy, state: "attacking" }, didAttack: false };
      }
      const step = config.moveSpeed * deltaSeconds;
      const next = moveToward(enemy.x, enemy.y, playerX, playerY, step);
      return { enemy: { ...enemy, x: next.x, y: next.y }, didAttack: false };
    }
    case "attacking": {
      if (distanceToPlayer > config.attackRange) {
        return { enemy: { ...enemy, state: "chasing" }, didAttack: false };
      }
      if (nowMs - enemy.lastAttackAtMs >= config.attackCooldownMs) {
        return { enemy: { ...enemy, lastAttackAtMs: nowMs }, didAttack: true };
      }
      return { enemy, didAttack: false };
    }
    case "leashed": {
      if (distanceToPlayer <= config.aggroRadius) {
        return { enemy: { ...enemy, state: "chasing" }, didAttack: false };
      }
      const distanceToSpawn = distance(enemy.x, enemy.y, enemy.spawnX, enemy.spawnY);
      if (distanceToSpawn <= LEASH_ARRIVAL_EPSILON) {
        return { enemy: { ...enemy, x: enemy.spawnX, y: enemy.spawnY, state: "idle" }, didAttack: false };
      }
      const step = config.leashSpeed * deltaSeconds;
      const next = moveToward(enemy.x, enemy.y, enemy.spawnX, enemy.spawnY, step);
      return { enemy: { ...enemy, x: next.x, y: next.y }, didAttack: false };
    }
    default:
      return { enemy, didAttack: false };
  }
}

export function applyDamageToEnemyAi(enemy: EnemyAiRuntime, amount: number): EnemyAiRuntime {
  if (enemy.state === "dead") return enemy;
  const hpCurrent = Math.max(0, enemy.hpCurrent - Math.max(0, amount));
  return { ...enemy, hpCurrent, state: hpCurrent <= 0 ? "dead" : enemy.state };
}

export function isEnemyAiAlive(enemy: EnemyAiRuntime): boolean {
  return enemy.state !== "dead";
}
