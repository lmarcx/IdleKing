// TODO(combat-runtime): temporary visual/story adapter. Enemy HP authority, movement
// and loot rolling live here only to preserve the visual slice. They must migrate to
// the game-core combat-runtime enemy authority so Story/Dungeon/Duel reuse them without
// duplication. Damage numbers already come from game-core (basic attack + computeSkillDamage);
// this module must never hold a combat damage formula.
import type { ResourceId } from "@idleking/game-core/resources/types.js";
import type { random } from "@idleking/game-core";

export type EnemyId = string;
export type EnemyKind = "grunt" | "shadow" | "boss";
export type EnemyState = "idle" | "chasing" | "dead";

export type CombatVector = {
  x: number;
  y: number;
};

export type StoryLevelEnemy = {
  attackCooldownMs: number;
  contactDamage: number;
  detectionRadius: number;
  hp: number;
  id: EnemyId;
  kind: EnemyKind;
  /** Display name, shown for bosses. */
  name?: string;
  /** True for the level boss (bigger, gated completion). */
  isBoss?: boolean;
  lastContactDamageAt: number;
  lootClaimed: boolean;
  maxHp: number;
  moveSpeed: number;
  position: CombatVector;
  radius: number;
  state: EnemyState;
};

export type EnemyLoot = {
  amount: number;
  resourceId: ResourceId;
};

export const GRUNT_HP = 50;
export const GRUNT_MOVE_SPEED = 90;
export const GRUNT_DETECTION_RADIUS = 280;
export const GRUNT_CONTACT_DAMAGE = 8;
export const GRUNT_CONTACT_DAMAGE_COOLDOWN_MS = 700;

const GRUNT_RADIUS = 20;

// Prologue Shadows ("Ombres") — slightly tougher than generic grunts.
export const SHADOW_HP = 60;
const SHADOW_RADIUS = 22;

// Amalgame des Ténèbres — the prologue boss.
export const DARK_AMALGAM_HP = 520;
const DARK_AMALGAM_RADIUS = 46;
const DARK_AMALGAM_CONTACT_DAMAGE = 16;

type EnemyLootEntry = {
  maxAmount: number;
  minAmount: number;
  resourceId: ResourceId;
  weight: number;
};

const GRUNT_LOOT_TABLE: EnemyLootEntry[] = [
  // Food drops are represented by MEAT until the resource model exposes FOOD.
  { resourceId: "MEAT", weight: 40, minAmount: 1, maxAmount: 2 },
  { resourceId: "WOOD", weight: 35, minAmount: 1, maxAmount: 3 },
  { resourceId: "STONE", weight: 25, minAmount: 1, maxAmount: 2 },
];

const ENEMY_SPAWN_POINTS: CombatVector[] = [
  { x: 560, y: 620 },
  { x: 940, y: 340 },
  { x: 1510, y: 520 },
  { x: 2060, y: 700 },
  { x: 360, y: 1060 },
  { x: 1260, y: 1220 },
  { x: 2020, y: 1260 },
];

function makeGrunt(position: CombatVector, index: number, kind: "grunt" | "shadow"): StoryLevelEnemy {
  const isShadow = kind === "shadow";
  const hp = isShadow ? SHADOW_HP : GRUNT_HP;
  return {
    attackCooldownMs: GRUNT_CONTACT_DAMAGE_COOLDOWN_MS,
    contactDamage: GRUNT_CONTACT_DAMAGE,
    detectionRadius: GRUNT_DETECTION_RADIUS,
    hp,
    id: `${kind}-${index + 1}`,
    kind,
    lastContactDamageAt: -Infinity,
    lootClaimed: false,
    maxHp: hp,
    moveSpeed: GRUNT_MOVE_SPEED,
    position: { ...position },
    radius: isShadow ? SHADOW_RADIUS : GRUNT_RADIUS,
    state: "idle",
  };
}

function makeDarkAmalgamBoss(position: CombatVector): StoryLevelEnemy {
  return {
    attackCooldownMs: GRUNT_CONTACT_DAMAGE_COOLDOWN_MS,
    contactDamage: DARK_AMALGAM_CONTACT_DAMAGE,
    detectionRadius: GRUNT_DETECTION_RADIUS + 120,
    hp: DARK_AMALGAM_HP,
    id: "boss-dark-amalgam",
    isBoss: true,
    kind: "boss",
    lastContactDamageAt: -Infinity,
    lootClaimed: false,
    maxHp: DARK_AMALGAM_HP,
    moveSpeed: GRUNT_MOVE_SPEED * 0.8,
    name: "Amalgame des Ténèbres",
    position: { ...position },
    radius: DARK_AMALGAM_RADIUS,
    state: "idle",
  };
}

/**
 * Per-level enemy roster. The prologue spawns Shadows ("Ombres") and the boss
 * Amalgame des Ténèbres; other levels keep the generic grunt slice.
 */
export function createInitialEnemies(levelId?: string): StoryLevelEnemy[] {
  if (levelId === "prologue_wastelands") {
    // First waves of Shadows, then the boss at the far end of the map.
    const shadows = ENEMY_SPAWN_POINTS.slice(0, 5).map((position, index) =>
      makeGrunt(position, index, "shadow"),
    );
    return [...shadows, makeDarkAmalgamBoss({ x: 1980, y: 760 })];
  }

  return ENEMY_SPAWN_POINTS.map((position, index) => makeGrunt(position, index, "grunt"));
}

function getLootTableForEnemy(enemy: StoryLevelEnemy): EnemyLootEntry[] {
  switch (enemy.kind) {
    case "grunt":
    case "shadow":
    case "boss":
      return GRUNT_LOOT_TABLE;
  }
}

export function rollEnemyLoot(
  enemy: StoryLevelEnemy,
  rng: Pick<random.SeededRng, "nextFloat" | "nextInt">
): EnemyLoot {
  const table = getLootTableForEnemy(enemy);
  const totalWeight = table.reduce((total, entry) => total + entry.weight, 0);
  let roll = rng.nextFloat() * totalWeight;

  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) {
      return {
        amount: rng.nextInt(entry.minAmount, entry.maxAmount),
        resourceId: entry.resourceId,
      };
    }
  }

  const fallback = table[table.length - 1];
  return {
    amount: rng.nextInt(fallback.minAmount, fallback.maxAmount),
    resourceId: fallback.resourceId,
  };
}

export function distanceBetween(a: CombatVector, b: CombatVector): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function isCircleIntersectingCircle(a: CombatVector, aRadius: number, b: CombatVector, bRadius: number): boolean {
  return distanceBetween(a, b) <= aRadius + bRadius;
}

export function isEnemyAlive(enemy: StoryLevelEnemy): boolean {
  return enemy.state !== "dead" && enemy.hp > 0;
}

export function updateEnemyMovement(enemy: StoryLevelEnemy, playerPosition: CombatVector, deltaSeconds: number): void {
  if (!isEnemyAlive(enemy)) return;

  const distanceToPlayer = distanceBetween(enemy.position, playerPosition);
  if (distanceToPlayer >= enemy.detectionRadius) {
    enemy.state = "idle";
    return;
  }

  enemy.state = "chasing";
  if (distanceToPlayer <= 0.0001) return;

  const step = Math.min(enemy.moveSpeed * deltaSeconds, distanceToPlayer);
  enemy.position.x += ((playerPosition.x - enemy.position.x) / distanceToPlayer) * step;
  enemy.position.y += ((playerPosition.y - enemy.position.y) / distanceToPlayer) * step;
}

export function damageEnemy(enemy: StoryLevelEnemy, amount: number): boolean {
  if (!isEnemyAlive(enemy)) return false;

  enemy.hp = Math.max(0, enemy.hp - amount);
  if (enemy.hp <= 0) {
    enemy.state = "dead";
    return true;
  }

  return false;
}

export function isTargetInsideAttackCone({
  attackDirection,
  attackPosition,
  halfAngleRadians,
  range,
  targetPosition,
  targetRadius,
}: {
  attackDirection: CombatVector;
  attackPosition: CombatVector;
  halfAngleRadians: number;
  range: number;
  targetPosition: CombatVector;
  targetRadius: number;
}): boolean {
  const targetVector = {
    x: targetPosition.x - attackPosition.x,
    y: targetPosition.y - attackPosition.y,
  };
  const distance = Math.hypot(targetVector.x, targetVector.y);
  if (distance > range + targetRadius) return false;
  if (distance <= targetRadius) return true;

  const targetAngle = Math.atan2(targetVector.y, targetVector.x);
  const attackAngle = Math.atan2(attackDirection.y, attackDirection.x);
  const angleDelta = Math.abs(Math.atan2(Math.sin(targetAngle - attackAngle), Math.cos(targetAngle - attackAngle)));
  return angleDelta <= halfAngleRadians;
}
