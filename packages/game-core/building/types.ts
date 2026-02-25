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

  // le bâtiment existe-t-il côté state et est-il unlock ?
  isUnlocked(state: GameState): boolean;
  isActive(state: GameState): boolean;

  // un tick de production
  tick(state: GameState, ctx: BuildingTickContext): BuildingTickResult;
};