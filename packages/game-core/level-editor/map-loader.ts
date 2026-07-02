import { GROUND_TEXTURES } from "./ground-textures.js";
import type { MapCollision, MapTile, PlayableMap, TopographyCellState } from "./types.js";

export type LoadedMap = Readonly<{
  map: PlayableMap;
  widthPx: number;
  heightPx: number;
  blockingCells: ReadonlySet<string>;
  collisions: readonly MapCollision[];
}>;

export type MapValidationResult = Readonly<{
  ok: boolean;
  errors: readonly string[];
}>;

function key(x: number, y: number): string {
  return `${x}:${y}`;
}

export function getTopographyCellState(map: PlayableMap, x: number, y: number): TopographyCellState {
  return map.topography.cells.find((cell) => cell.x === x && cell.y === y)?.state ?? "playable";
}

export function getMapTile(map: PlayableMap, x: number, y: number): MapTile | undefined {
  return map.tiles.find((tile) => tile.x === x && tile.y === y);
}

export function isMapCellWalkable(map: PlayableMap, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= map.grid.width || y >= map.grid.height) return false;
  const state = getTopographyCellState(map, x, y);
  if (state !== "playable") return false;
  const tile = getMapTile(map, x, y);
  return tile?.walkable ?? true;
}

export function loadPlayableMap(map: PlayableMap): LoadedMap {
  const blockingCells = new Set<string>();
  for (let y = 0; y < map.grid.height; y += 1) {
    for (let x = 0; x < map.grid.width; x += 1) {
      if (!isMapCellWalkable(map, x, y)) blockingCells.add(key(x, y));
    }
  }

  return {
    map,
    widthPx: map.grid.width * map.grid.cellSize,
    heightPx: map.grid.height * map.grid.cellSize,
    blockingCells,
    collisions: map.collisions,
  };
}

export function validatePlayableMap(map: PlayableMap): MapValidationResult {
  const errors: string[] = [];
  if (!map.id.trim()) errors.push("Map id is required");
  if (map.version < 1) errors.push(`Map ${map.id} version must be >= 1`);
  if (map.grid.width <= 0 || map.grid.height <= 0 || map.grid.cellSize <= 0) {
    errors.push(`Map ${map.id} grid dimensions must be positive`);
  }
  if (map.spawns.length === 0) errors.push(`Map ${map.id} needs at least one spawn`);

  const textureIds = new Set(GROUND_TEXTURES.map((texture) => texture.id));
  for (const tile of map.tiles) {
    if (!textureIds.has(tile.textureId)) errors.push(`Map ${map.id} tile references unknown texture: ${tile.textureId}`);
    if (tile.x < 0 || tile.y < 0 || tile.x >= map.grid.width || tile.y >= map.grid.height) {
      errors.push(`Map ${map.id} tile out of grid at ${tile.x},${tile.y}`);
    }
  }

  for (const cell of map.topography.cells) {
    if (cell.x < 0 || cell.y < 0 || cell.x >= map.grid.width || cell.y >= map.grid.height) {
      errors.push(`Map ${map.id} topography cell out of grid at ${cell.x},${cell.y}`);
    }
  }

  for (const spawn of map.spawns) {
    const cellX = Math.floor(spawn.x / map.grid.cellSize);
    const cellY = Math.floor(spawn.y / map.grid.cellSize);
    if (!isMapCellWalkable(map, cellX, cellY)) errors.push(`Map ${map.id} spawn ${spawn.id} is not walkable`);
  }

  return { ok: errors.length === 0, errors };
}
