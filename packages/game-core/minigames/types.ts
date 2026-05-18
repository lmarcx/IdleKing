import type { ResourceStock } from "../resources/types.js";

export type MiniGameKind = "mine" | "farm" | "kitchen";

export type MiniGameRunStatus = "idle" | "running" | "success" | "failed" | "abandoned";

export type MiniGameRunResourcePool = {
  current: number;
  max: number;
};

export type MiniGameRunResources = {
  hp?: MiniGameRunResourcePool;
  energy?: MiniGameRunResourcePool;
  timerMs?: number;
  timerMaxMs?: number;
  successPoints?: number;
  successPointsMax?: number;
};

export type MiniGameConsumedCosts = {
  worldEnergy: number;
  resources: ResourceStock;
};

export type MiniGameRunState = {
  id: string;
  kind: MiniGameKind;
  status: MiniGameRunStatus;
  startedAt: number;
  finishedAt?: number;
  worldEnergyCost: number;
  consumedCosts: MiniGameConsumedCosts;
  temporaryRewards: ResourceStock;
  runResources: MiniGameRunResources;
};

export type MiniGameRuntimeState = {
  activeRun: MiniGameRunState | null;
  lastRun: MiniGameRunState | null;
};
