import type { ResourceStock } from "../../resources/types.js";
import type { MiniGameRunState } from "../types.js";

export type MineTileType = "soil" | "rock";

export type MineTileContentKind = "resource" | "empty" | "enemy" | "stair";

export type MineTileAdjacentHints = {
  resources: number;
  enemies: number;
  stairs: number;
  rocks: number;
  soil: number;
};

export type MineTile = {
  x: number;
  y: number;
  type: MineTileType;
  content: MineTileContentKind;
  resourceReward?: ResourceStock;
  revealed: boolean;
  dug: boolean;
  adjacentHints?: MineTileAdjacentHints;
};

export type MineBoard = {
  floor: number;
  size: number;
  seed: number;
  tiles: MineTile[];
};

export type MineRunState = {
  currentFloor: number;
  maxFloors: number;
  board: MineBoard;
  dugTileKeys: string[];
  revealedTileKeys: string[];
  seed: number;
  boardSize: number;
};

export type ActiveMineRunState = MiniGameRunState & {
  kind: "mine";
  mine: MineRunState;
};
