import type { ResourceId, ResourceStock } from "../../resources/types.js";
import type { MineBoard, MineTile, MineTileAdjacentHints, MineTileContentKind, MineTileType } from "./types.js";

export const MINE_MAX_FLOORS = 100;
export const MINE_BOARD_SIZE = 5;

export const MINE_RESOURCE_TABLE: Array<{ id: ResourceId; amount: number; minFloor: number; weight: number }> = [
  { id: "STONE", amount: 1, minFloor: 1, weight: 6 },
  { id: "COPPER", amount: 1, minFloor: 1, weight: 5 },
  { id: "SILVER", amount: 1, minFloor: 5, weight: 3 },
  { id: "GOLD", amount: 1, minFloor: 10, weight: 2 },
  { id: "IRON", amount: 1, minFloor: 15, weight: 3 },
  { id: "GEMS", amount: 1, minFloor: 20, weight: 1 },
  { id: "PLATINUM", amount: 1, minFloor: 35, weight: 1 },
  { id: "MITHRIL", amount: 1, minFloor: 55, weight: 1 },
  { id: "ORICHALUM", amount: 1, minFloor: 75, weight: 1 },
];

export type GenerateMineBoardOptions = {
  floor?: number;
  maxFloors?: number;
  seed?: number;
  size?: number;
};

type MineRandom = {
  next(): number;
  int(maxExclusive: number): number;
};

function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.floor(value), min), max);
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number): MineRandom {
  let state = seed >>> 0;
  return {
    next() {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    int(maxExclusive: number) {
      return Math.floor(this.next() * Math.max(1, maxExclusive));
    },
  };
}

function pickWeightedResource(rng: MineRandom, floor: number): ResourceStock {
  const available = MINE_RESOURCE_TABLE.filter((entry) => floor >= entry.minFloor);
  const totalWeight = available.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng.next() * totalWeight;

  for (const entry of available) {
    roll -= entry.weight;
    if (roll <= 0) return { [entry.id]: entry.amount };
  }

  const fallback = available[0] ?? MINE_RESOURCE_TABLE[0];
  return { [fallback.id]: fallback.amount };
}

function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function getMineTileKey(tile: Pick<MineTile, "x" | "y">): string {
  return tileKey(tile.x, tile.y);
}

function chooseContent(rng: MineRandom, floor: number): MineTileContentKind {
  const enemyChance = Math.min(0.08 + floor * 0.001, 0.2);
  const resourceChance = Math.min(0.35 + floor * 0.001, 0.5);
  const roll = rng.next();

  if (roll < resourceChance) return "resource";
  if (roll < resourceChance + enemyChance) return "enemy";
  return "empty";
}

export function getMineTile(board: MineBoard, x: number, y: number): MineTile | null {
  if (x < 0 || y < 0 || x >= board.size || y >= board.size) return null;
  return board.tiles[y * board.size + x] ?? null;
}

export function getAdjacentMineTiles(board: MineBoard, x: number, y: number): MineTile[] {
  const tiles: MineTile[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const tile = getMineTile(board, x + dx, y + dy);
      if (tile) tiles.push(tile);
    }
  }
  return tiles;
}

export function computeMineAdjacentHints(board: MineBoard, x: number, y: number): MineTileAdjacentHints {
  const adjacent = getAdjacentMineTiles(board, x, y);
  return {
    resources: adjacent.filter((tile) => tile.content === "resource").length,
    enemies: adjacent.filter((tile) => tile.content === "enemy").length,
    stairs: adjacent.filter((tile) => tile.content === "stair").length,
    rocks: adjacent.filter((tile) => tile.type === "rock").length,
    soil: adjacent.filter((tile) => tile.type === "soil").length,
  };
}

export function refreshMineBoardVisibility(board: MineBoard): MineBoard {
  return {
    ...board,
    tiles: board.tiles.map((tile) => ({
      ...tile,
      adjacentHints: tile.revealed ? computeMineAdjacentHints(board, tile.x, tile.y) : tile.adjacentHints,
    })),
  };
}

export function getMineBoardDugTileKeys(board: MineBoard): string[] {
  return board.tiles.filter((tile) => tile.dug).map(getMineTileKey);
}

export function getMineBoardRevealedTileKeys(board: MineBoard): string[] {
  return board.tiles.filter((tile) => tile.revealed).map(getMineTileKey);
}

export function generateMineBoard(options: GenerateMineBoardOptions = {}): MineBoard {
  const maxFloors = clampInt(options.maxFloors ?? MINE_MAX_FLOORS, 1, MINE_MAX_FLOORS);
  const floor = clampInt(options.floor ?? 1, 1, maxFloors);
  const size = clampInt(options.size ?? MINE_BOARD_SIZE, 3, 12);
  const seed = options.seed ?? hashSeed(`mine:${floor}:${size}`);
  const rng = createRandom(hashSeed(`${seed}:${floor}:${size}`));
  const tiles: MineTile[] = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const type: MineTileType = rng.next() < 0.55 ? "soil" : "rock";
      const content = chooseContent(rng, floor);
      tiles.push({
        x,
        y,
        type,
        content,
        resourceReward: content === "resource" ? pickWeightedResource(rng, floor) : undefined,
        revealed: false,
        dug: false,
      });
    }
  }

  if (floor < maxFloors) {
    const stairIndex = rng.int(tiles.length);
    tiles[stairIndex] = {
      ...tiles[stairIndex],
      type: "soil",
      content: "stair",
      resourceReward: undefined,
    };
  }

  return {
    floor,
    size,
    seed,
    tiles,
  };
}
