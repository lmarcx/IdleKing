import * as PIXI from "pixi.js";
import type { MapCollision } from "@idleking/game-core/level-editor";

import type { Vector2, WorldSize } from "./grid-math";

export type Rect = { x: number; y: number; width: number; height: number };

/** Circle-vs-axis-aligned-rect overlap test (point + radius, not a true circle-rect distance check). */
export function isInsideRect(point: Vector2, rect: Rect, radius: number): boolean {
  return (
    point.x + radius > rect.x &&
    point.x - radius < rect.x + rect.width &&
    point.y + radius > rect.y &&
    point.y - radius < rect.y + rect.height
  );
}

export function collidesWithAny(point: Vector2, radius: number, collisions: readonly MapCollision[]): boolean {
  return collisions.some((collision) => isInsideRect(point, collision, radius));
}

export function isWithinWorldBounds(point: Vector2, radius: number, worldSize: WorldSize): boolean {
  return point.x >= radius && point.y >= radius && point.x <= worldSize.width - radius && point.y <= worldSize.height - radius;
}

/** Debug outline for a single MapCollision rect, drawn into a caller-provided Graphics. */
export function renderMapCollisionDebug(g: PIXI.Graphics, collision: MapCollision): void {
  g.rect(collision.x, collision.y, collision.width, collision.height)
    .fill({ color: 0xffffff, alpha: 0.04 })
    .stroke({ color: 0xf2f2f2, alpha: 0.75, width: 2 });
}
