import type { Vector2 } from "./grid-math";

/**
 * Direction from currently-pressed key codes. Mirrors the original inline checks exactly:
 * each axis is clamped to at most +-1 regardless of how many keys for that axis are held
 * (e.g. ArrowLeft + KeyA together still yields dx = -1, not -2).
 */
export function computeMovementDirection(pressedKeys: ReadonlySet<string>): Vector2 {
  let dx = 0;
  let dy = 0;
  if (pressedKeys.has("ArrowLeft") || pressedKeys.has("KeyA") || pressedKeys.has("KeyQ")) dx -= 1;
  if (pressedKeys.has("ArrowRight") || pressedKeys.has("KeyD")) dx += 1;
  if (pressedKeys.has("ArrowUp") || pressedKeys.has("KeyW") || pressedKeys.has("KeyZ")) dy -= 1;
  if (pressedKeys.has("ArrowDown") || pressedKeys.has("KeyS")) dy += 1;
  return { x: dx, y: dy };
}

/** Frame movement delta for a normalized direction, given speed (px/s) and elapsed ms. */
export function computeMovementStep(direction: Vector2, speed: number, deltaMs: number): Vector2 {
  if (direction.x === 0 && direction.y === 0) return { x: 0, y: 0 };
  const length = Math.hypot(direction.x, direction.y) || 1;
  const step = speed * (deltaMs / 1000);
  return { x: (direction.x / length) * step, y: (direction.y / length) * step };
}
