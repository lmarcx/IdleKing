import type { ResourceStock } from "../../resources/types.js";
import type { MiniGameRunState } from "../types.js";

export type FarmSpawnKind = "fruit" | "bomb" | "golden_fruit";

export type FarmSpawn = {
  id: string;
  kind: FarmSpawnKind;
  reward?: ResourceStock;
  hit: boolean;
  x: number;
  y: number;
};

export type FarmRunState = {
  timerMs: number;
  timerMaxMs: number;
  spawns: FarmSpawn[];
  seed: number;
  wave: number;
  score: number;
};

export type ActiveFarmRunState = MiniGameRunState & {
  kind: "farm";
  farm: FarmRunState;
};
