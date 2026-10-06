import type { Vector2, WorldSize } from "./grid-math";

export type Viewport = { width: number; height: number };

/**
 * Camera offset that keeps `focus` centered in the viewport while clamping to the world's
 * bounds (never scrolls past the edges of the map). Returned value is meant to be applied
 * directly as a Pixi container's `.position`.
 */
export function computeCameraOffset(focus: Vector2, viewport: Viewport, worldSize: WorldSize): Vector2 {
  return {
    x: -Math.min(Math.max(focus.x - viewport.width / 2, 0), Math.max(0, worldSize.width - viewport.width)),
    y: -Math.min(Math.max(focus.y - viewport.height / 2, 0), Math.max(0, worldSize.height - viewport.height)),
  };
}
