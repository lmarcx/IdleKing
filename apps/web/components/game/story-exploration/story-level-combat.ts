export type EnemyId = string;
export type EnemyKind = "grunt";
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
  lastContactDamageAt: number;
  maxHp: number;
  moveSpeed: number;
  position: CombatVector;
  radius: number;
  state: EnemyState;
};

export const PLAYER_MAX_HP = 100;
export const GRUNT_HP = 50;
export const GRUNT_MOVE_SPEED = 90;
export const GRUNT_DETECTION_RADIUS = 280;
export const GRUNT_CONTACT_DAMAGE = 8;
export const GRUNT_CONTACT_DAMAGE_COOLDOWN_MS = 700;
export const MELEE_DAMAGE = 25;
export const RANGED_DAMAGE = 15;

const GRUNT_RADIUS = 20;

const ENEMY_SPAWN_POINTS: CombatVector[] = [
  { x: 560, y: 620 },
  { x: 940, y: 340 },
  { x: 1510, y: 520 },
  { x: 2060, y: 700 },
  { x: 360, y: 1060 },
  { x: 1260, y: 1220 },
  { x: 2020, y: 1260 },
];

export function createInitialEnemies(): StoryLevelEnemy[] {
  return ENEMY_SPAWN_POINTS.map((position, index) => ({
    attackCooldownMs: GRUNT_CONTACT_DAMAGE_COOLDOWN_MS,
    contactDamage: GRUNT_CONTACT_DAMAGE,
    detectionRadius: GRUNT_DETECTION_RADIUS,
    hp: GRUNT_HP,
    id: `grunt-${index + 1}`,
    kind: "grunt",
    lastContactDamageAt: -Infinity,
    maxHp: GRUNT_HP,
    moveSpeed: GRUNT_MOVE_SPEED,
    position: { ...position },
    radius: GRUNT_RADIUS,
    state: "idle",
  }));
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

export function damagePlayer(currentHp: number, amount: number): number {
  return Math.max(0, currentHp - amount);
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
