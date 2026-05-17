import type { GameState } from "../game/state.js";

export type BuildingId =
  | "FORUM"
  | "TEMPLE"
  | "FARM"
  | "MINE"
  | "KITCHEN"
  | "FORGE"
  | "MARKET"
  | "WORLD_GATE"
  | "BANK"
  | "CORNUCOPIA"
  // extensible
  | (string & {});

export type CanonicalBuildingId =
  | "FORGE"
  | "MINE"
  | "FARM"
  | "KITCHEN"
  | "TEMPLE"
  | "MARKET"
  | "FORUM"
  | "WORLD_GATE"
  | "BANK";

export type BuildingStatus =
  | "locked"
  | "unlocked"
  | "built"
  | "upgradeable"
  | "maxed";

export type CanonicalBuildingProgress = {
  status: BuildingStatus;
  level: number;
  maxLevel: number;
};

export type CanonicalBuildingState = CanonicalBuildingProgress & {
  unlocked: boolean;
  built: boolean;
  active: boolean;
};

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
