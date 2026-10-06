// TODO(combat-runtime): temporary visual/story adapter. Enemy HP authority and movement live here
// only to preserve the visual slice; they must migrate to the game-core enemy-ai/combat-runtime
// authority so Story/Dungeon/Duel reuse them without duplication. Rosters, stats and loot already
// come from game-core (enemies/): this module must never hold enemy stats, loot tables or a
// combat damage formula.
import {
  enemies as coreEnemies,
  type random,
} from "@idleking/game-core";

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
  /** Display name, shown for bosses and elites. */
  name?: string;
  /** True for the level boss (bigger, gated completion). */
  isBoss?: boolean;
  /** game-core enemy archetype (enemies/registry.ts); drives loot, attack style and silhouette. */
  archetypeId?: string;
  attackStyle: coreEnemies.EnemyAttackKind;
  silhouette: coreEnemies.EnemySilhouette;
  tier: coreEnemies.EnemyTier;
  lastContactDamageAt: number;
  lootClaimed: boolean;
  maxHp: number;
  moveSpeed: number;
  position: CombatVector;
  radius: number;
  state: EnemyState;
};

export type EnemyLoot = coreEnemies.EnemyKillLoot;

/** Placeholder target HP for the runtime before any enemy is selected. */
export const GRUNT_HP = 50;

const GRUNT_MOVE_SPEED = 90;
const GRUNT_DETECTION_RADIUS = 280;
const GRUNT_CONTACT_DAMAGE = 8;
const GRUNT_CONTACT_DAMAGE_COOLDOWN_MS = 700;
const GRUNT_RADIUS = 20;

/** Legacy (non-dungeon) story levels: canonical placeholder drops. */
const GRUNT_LOOT_TABLE = [
  { resourceId: "tough_meat", weight: 40, minAmount: 1, maxAmount: 2 },
  { resourceId: "old_wood", weight: 35, minAmount: 1, maxAmount: 3 },
  { resourceId: "iron_ore", weight: 25, minAmount: 1, maxAmount: 2 },
] as const;

/** Regular spawn points on the shared 2400x1600 exploration map, nearest-to-spawn first. */
const ENEMY_SPAWN_POINTS: CombatVector[] = [
  { x: 560, y: 620 },
  { x: 940, y: 340 },
  { x: 1510, y: 520 },
  { x: 2060, y: 700 },
  { x: 360, y: 1060 },
  { x: 1260, y: 1220 },
  { x: 2020, y: 1260 },
  { x: 700, y: 1360 },
  { x: 1700, y: 980 },
];

const PROLOGUE_BOSS_POSITION: CombatVector = { x: 1980, y: 760 };
const DEFAULT_BOSS_POSITION: CombatVector = { x: 2120, y: 360 };

function spawnPointFor(index: number): CombatVector {
  const base = ENEMY_SPAWN_POINTS[index % ENEMY_SPAWN_POINTS.length];
  const ring = Math.floor(index / ENEMY_SPAWN_POINTS.length);
  return { x: base.x + ring * 64, y: base.y + ring * 48 };
}

function makeArchetypeEnemy(
  archetype: coreEnemies.EnemyArchetype,
  index: number,
  position: CombatVector,
): StoryLevelEnemy {
  const isBoss = archetype.tier === "boss";
  return {
    archetypeId: archetype.id,
    attackCooldownMs: archetype.stats.attackCooldownMs,
    attackStyle: archetype.attack,
    contactDamage: archetype.stats.contactDamage,
    detectionRadius: archetype.stats.aggroRadius,
    hp: archetype.stats.hp,
    id: isBoss ? `boss-${archetype.id}` : `${archetype.id}-${index + 1}`,
    isBoss,
    kind: isBoss ? "boss" : archetype.familyId === "ombres_de_guerre" ? "shadow" : "grunt",
    lastContactDamageAt: -Infinity,
    lootClaimed: false,
    maxHp: archetype.stats.hp,
    moveSpeed: archetype.stats.moveSpeed,
    name: isBoss || archetype.tier === "elite" ? archetype.name : undefined,
    position: { ...position },
    radius: archetype.stats.radius,
    silhouette: archetype.silhouette,
    state: "idle",
    tier: archetype.tier,
  };
}

function makeLegacyGrunt(position: CombatVector, index: number): StoryLevelEnemy {
  return {
    attackCooldownMs: GRUNT_CONTACT_DAMAGE_COOLDOWN_MS,
    attackStyle: "melee",
    contactDamage: GRUNT_CONTACT_DAMAGE,
    detectionRadius: GRUNT_DETECTION_RADIUS,
    hp: GRUNT_HP,
    id: `grunt-${index + 1}`,
    kind: "grunt",
    lastContactDamageAt: -Infinity,
    lootClaimed: false,
    maxHp: GRUNT_HP,
    moveSpeed: GRUNT_MOVE_SPEED,
    position: { ...position },
    radius: GRUNT_RADIUS,
    silhouette: "shade",
    state: "idle",
    tier: "standard",
  };
}

/**
 * Enemy roster for a level. Story dungeons spawn their game-core roster (DUNGEON_ENCOUNTERS):
 * regular groups on the spawn points in encounter order, the boss last at the far end of the map.
 * Legacy (non-dungeon) story levels keep the generic grunt slice.
 */
export function createInitialEnemies(levelId?: string): StoryLevelEnemy[] {
  const archetypes = levelId ? coreEnemies.getDungeonEncounterArchetypes(levelId) : [];
  if (archetypes.length === 0) {
    return ENEMY_SPAWN_POINTS.slice(0, 7).map((position, index) => makeLegacyGrunt(position, index));
  }

  let regularIndex = 0;
  return archetypes.map((archetype) => {
    if (archetype.tier === "boss") {
      const position = levelId === "prologue_wastelands" ? PROLOGUE_BOSS_POSITION : DEFAULT_BOSS_POSITION;
      return makeArchetypeEnemy(archetype, 0, position);
    }
    const index = regularIndex;
    regularIndex += 1;
    return makeArchetypeEnemy(archetype, index, spawnPointFor(index));
  });
}

/** Rolls the loot of a dead enemy: game-core archetype loot, or the legacy grunt table. */
export function rollEnemyLoot(enemy: StoryLevelEnemy, rng: random.SeededRng, dungeonId?: string): EnemyLoot {
  if (enemy.archetypeId) return coreEnemies.rollEnemyKillLoot(enemy.archetypeId, rng, { dungeonId });

  const totalWeight = GRUNT_LOOT_TABLE.reduce((total, entry) => total + entry.weight, 0);
  let roll = rng.nextFloat() * totalWeight;
  const entry = GRUNT_LOOT_TABLE.find((candidate) => (roll -= candidate.weight) <= 0) ?? GRUNT_LOOT_TABLE[0];
  return {
    equipment: [],
    materials: [{ resourceId: entry.resourceId, amount: rng.nextInt(entry.minAmount, entry.maxAmount) }],
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
