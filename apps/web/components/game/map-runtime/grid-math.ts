/** Pure cell <-> world pixel-space conversion helpers, shared by any PlayableMap runtime. */

export type Vector2 = { x: number; y: number };
export type CellCoord = { x: number; y: number };
export type WorldSize = { width: number; height: number };

export function cellToWorldOrigin(cellX: number, cellY: number, cellSize: number): Vector2 {
  return { x: cellX * cellSize, y: cellY * cellSize };
}

export function worldToCell(point: Vector2, cellSize: number): CellCoord {
  return { x: Math.floor(point.x / cellSize), y: Math.floor(point.y / cellSize) };
}

/** Matches the key format produced by packages/game-core/level-editor/map-loader.ts's blockingCells set. */
export function cellKey(cellX: number, cellY: number): string {
  return `${cellX}:${cellY}`;
}
