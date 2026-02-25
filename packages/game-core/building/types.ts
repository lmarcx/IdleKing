import type { GameState } from "../game/state.js";

export type BuildingId =
  | "FORUM"
  | "TEMPLE"
  | "FARM"
  | "MINE"
  | "KITCHEN"
  | "FORGE"
  | "CORNUCOPIA"
  // extensible
  | (string & {});

export type BuildingTickContext = {
  minutes: number; // tick granularity = 1 minute
};

export type BuildingTickResult = {
  next: GameState;
  log?: string[];
};

export type BuildingModule = {
  id: BuildingId;

  isUnlocked(state: GameState): boolean;
  isActive(state: GameState): boolean;

  tick(state: GameState, ctx: BuildingTickContext): BuildingTickResult;
};