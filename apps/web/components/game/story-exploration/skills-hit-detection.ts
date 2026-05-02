type CircleEnemy = {
  position: {
    x: number;
    y: number;
  };
  radius?: number;
};

const ENEMY_HIT_RADIUS = 24;

function getEnemyRadius(enemy: CircleEnemy): number {
  return enemy.radius ?? ENEMY_HIT_RADIUS;
}

export function isEnemyInCircle(enemy: CircleEnemy, centerX: number, centerY: number, radius: number): boolean {
  const enemyRadius = getEnemyRadius(enemy);
  return Math.hypot(enemy.position.x - centerX, enemy.position.y - centerY) <= radius + enemyRadius;
}

export function isEnemyInBeam(
  enemy: CircleEnemy,
  originX: number,
  originY: number,
  directionX: number,
  directionY: number,
  range: number,
  width: number,
): boolean {
  const enemyRadius = getEnemyRadius(enemy);
  const toEnemyX = enemy.position.x - originX;
  const toEnemyY = enemy.position.y - originY;
  const projection = toEnemyX * directionX + toEnemyY * directionY;

  if (projection < -enemyRadius || projection > range + enemyRadius) return false;

  const closestX = originX + directionX * projection;
  const closestY = originY + directionY * projection;
  const perpendicularDistance = Math.hypot(enemy.position.x - closestX, enemy.position.y - closestY);

  return perpendicularDistance <= width / 2 + enemyRadius;
}

export function isEnemyInFrontalAoe(
  enemy: CircleEnemy,
  originX: number,
  originY: number,
  directionX: number,
  directionY: number,
  range: number,
  width: number,
): boolean {
  return isEnemyInBeam(enemy, originX, originY, directionX, directionY, range, width);
}
