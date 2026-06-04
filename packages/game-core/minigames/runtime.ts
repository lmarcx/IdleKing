import type { GameState } from "../game/state.js";
import { ALL_RESOURCES, hasAtLeast, spend, type ResourceId, type ResourceStock } from "../resources/types.js";
import { grantResourceReward } from "../rewards/index.js";
import type {
  MiniGameConsumedCosts,
  MiniGameKind,
  MiniGameRunResources,
  MiniGameRunState,
  MiniGameRunStatus,
  MiniGameRuntimeState,
  MiniGameTemporaryItemReward,
} from "./types.js";

const DEFAULT_WORLD_ENERGY_COST_BY_KIND: Record<MiniGameKind, number> = {
  mine: 10,
  farm: 10,
  kitchen: 10,
};

const RESOURCE_IDS = new Set<ResourceId>(ALL_RESOURCES);

export type LaunchMiniGameRunOptions = {
  id?: string;
  nowMs?: number;
  worldEnergyCost?: number;
  resourceCosts?: ResourceStock;
  runResources?: MiniGameRunResources;
};

export type LaunchMiniGameRunBlockedReason =
  | "RUN_ALREADY_ACTIVE"
  | "NOT_ENOUGH_WORLD_ENERGY"
  | "NOT_ENOUGH_RESOURCES";

export type LaunchMiniGameRunResult =
  | { ok: true; next: GameState; run: MiniGameRunState }
  | {
      ok: false;
      next: GameState;
      reason: LaunchMiniGameRunBlockedReason;
    };

export type FinishMiniGameRunStatus = Extract<MiniGameRunStatus, "success" | "failed" | "abandoned">;

export type FinishMiniGameRunOptions = {
  nowMs?: number;
  runId?: string;
};

export type FinishMiniGameRunResult =
  | {
      ok: true;
      next: GameState;
      run: MiniGameRunState;
      outcome: "success" | "failed";
      rewardsCommitted: ResourceStock;
      itemRewardsCommitted: MiniGameTemporaryItemReward[];
      consumedCosts: MiniGameConsumedCosts;
    }
  | { ok: false; next: GameState; reason: "NO_ACTIVE_RUN" | "RUN_ID_MISMATCH" };

export type AddMiniGameTemporaryRewardsResult =
  | { ok: true; next: GameState; run: MiniGameRunState }
  | { ok: false; next: GameState; reason: "NO_ACTIVE_RUN" | "RUN_ID_MISMATCH" };

function normalizeAmount(value: unknown): number {
  return Math.max(0, Math.floor(typeof value === "number" && Number.isFinite(value) ? value : 0));
}

function normalizeWorldEnergyCost(value: unknown): number {
  return normalizeAmount(value);
}

function normalizeResourceStock(value: unknown): ResourceStock {
  if (!value || typeof value !== "object") return {};

  const next: ResourceStock = {};
  for (const [key, rawAmount] of Object.entries(value)) {
    const resourceId = key as ResourceId;
    const amount = normalizeAmount(rawAmount);
    if (RESOURCE_IDS.has(resourceId) && amount > 0) {
      next[resourceId] = amount;
    }
  }
  return next;
}

function normalizeTemporaryItemReward(value: unknown): MiniGameTemporaryItemReward | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<MiniGameTemporaryItemReward>;
  if (typeof raw.id !== "string" || raw.id.length === 0) return null;
  if (typeof raw.name !== "string" || raw.name.length === 0) return null;
  if (raw.kind !== "consumable") return null;

  const quantity = normalizeAmount(raw.quantity ?? 1);
  const quality = Math.min(100, normalizeAmount(raw.quality));
  if (quantity <= 0 || quality <= 0) return null;

  return {
    id: raw.id,
    kind: "consumable",
    name: raw.name,
    quantity,
    quality,
    value: raw.value === undefined ? quality : normalizeAmount(raw.value),
  };
}

function normalizeTemporaryItemRewards(value: unknown): MiniGameTemporaryItemReward[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const reward = normalizeTemporaryItemReward(entry);
    return reward ? [reward] : [];
  });
}

function addResourceStock(stock: ResourceStock, rewards: ResourceStock): ResourceStock {
  let next = stock;
  for (const [resourceId, amount] of Object.entries(rewards) as Array<[ResourceId, number | undefined]>) {
    next = grantResourceReward(next, { resourceId, amount: amount ?? 0 });
  }
  return next;
}

function mergeResourceStock(left: ResourceStock, right: ResourceStock): ResourceStock {
  return addResourceStock(normalizeResourceStock(left), normalizeResourceStock(right));
}

function normalizePool(value: unknown): { current: number; max: number } | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as { current?: unknown; max?: unknown };
  const max = normalizeAmount(raw.max);
  if (max <= 0) return undefined;
  return {
    current: Math.min(normalizeAmount(raw.current), max),
    max,
  };
}

export function createDefaultMiniGameRunResources(kind: MiniGameKind): MiniGameRunResources {
  switch (kind) {
    case "mine":
      return {
        hp: { current: 100, max: 100 },
        energy: { current: 100, max: 100 },
      };
    case "farm":
      return {
        hp: { current: 100, max: 100 },
        energy: { current: 100, max: 100 },
        timerMs: 60_000,
        timerMaxMs: 60_000,
      };
    case "kitchen":
      return {
        successPoints: 100,
        successPointsMax: 100,
      };
  }
}

export function createDefaultMiniGameRuntimeState(): MiniGameRuntimeState {
  return {
    activeRun: null,
    lastRun: null,
  };
}

export function getMiniGameWorldEnergyCost(kind: MiniGameKind): number {
  return DEFAULT_WORLD_ENERGY_COST_BY_KIND[kind];
}

function normalizeRunResources(kind: MiniGameKind, value: unknown): MiniGameRunResources {
  const defaults = createDefaultMiniGameRunResources(kind);
  if (!value || typeof value !== "object") return defaults;

  const raw = value as MiniGameRunResources;
  const timerMaxMs = normalizeAmount(raw.timerMaxMs);
  const timerMs = timerMaxMs > 0 ? Math.min(normalizeAmount(raw.timerMs), timerMaxMs) : undefined;
  const successPointsMax = normalizeAmount(raw.successPointsMax);
  const successPoints =
    successPointsMax > 0 ? Math.min(normalizeAmount(raw.successPoints), successPointsMax) : undefined;

  return {
    ...defaults,
    hp: normalizePool(raw.hp) ?? defaults.hp,
    energy: normalizePool(raw.energy) ?? defaults.energy,
    timerMs: timerMs ?? defaults.timerMs,
    timerMaxMs: timerMaxMs > 0 ? timerMaxMs : defaults.timerMaxMs,
    successPoints: successPoints ?? defaults.successPoints,
    successPointsMax: successPointsMax > 0 ? successPointsMax : defaults.successPointsMax,
  };
}

function isMiniGameKind(value: unknown): value is MiniGameKind {
  return value === "mine" || value === "farm" || value === "kitchen";
}

function isRunStatus(value: unknown): value is MiniGameRunStatus {
  return value === "idle" || value === "running" || value === "success" || value === "failed" || value === "abandoned";
}

function normalizeRunState(value: unknown): MiniGameRunState | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<MiniGameRunState>;
  if (!isMiniGameKind(raw.kind)) return null;
  if (typeof raw.id !== "string" || raw.id.length === 0) return null;

  const status = isRunStatus(raw.status) ? raw.status : "running";
  const worldEnergyCost = normalizeWorldEnergyCost(raw.worldEnergyCost ?? raw.consumedCosts?.worldEnergy);

  return {
    id: raw.id,
    kind: raw.kind,
    status,
    startedAt: normalizeAmount(raw.startedAt),
    finishedAt: raw.finishedAt === undefined ? undefined : normalizeAmount(raw.finishedAt),
    worldEnergyCost,
    consumedCosts: {
      worldEnergy: normalizeWorldEnergyCost(raw.consumedCosts?.worldEnergy ?? worldEnergyCost),
      resources: normalizeResourceStock(raw.consumedCosts?.resources),
    },
    temporaryRewards: normalizeResourceStock(raw.temporaryRewards),
    temporaryItemRewards: normalizeTemporaryItemRewards(raw.temporaryItemRewards),
    runResources: normalizeRunResources(raw.kind, raw.runResources),
    mine: raw.mine && typeof raw.mine === "object" ? raw.mine : undefined,
    farm: raw.farm && typeof raw.farm === "object" ? raw.farm : undefined,
    kitchen: raw.kitchen && typeof raw.kitchen === "object" ? raw.kitchen : undefined,
  };
}

export function normalizeMiniGameRuntimeState(value: Partial<MiniGameRuntimeState> | undefined): MiniGameRuntimeState {
  const activeRun = normalizeRunState(value?.activeRun);

  return {
    activeRun: activeRun?.status === "running" ? activeRun : null,
    lastRun: normalizeRunState(value?.lastRun),
  };
}

export function canLaunchMiniGameRun(
  state: GameState,
  kind: MiniGameKind,
  options: Pick<LaunchMiniGameRunOptions, "worldEnergyCost" | "resourceCosts"> = {},
): LaunchMiniGameRunBlockedReason | null {
  if (state.miniGames.activeRun?.status === "running") return "RUN_ALREADY_ACTIVE";

  const worldEnergyCost = normalizeWorldEnergyCost(options.worldEnergyCost ?? getMiniGameWorldEnergyCost(kind));
  if (state.world.energy.current < worldEnergyCost) return "NOT_ENOUGH_WORLD_ENERGY";

  const resourceCosts = normalizeResourceStock(options.resourceCosts);
  if (!hasAtLeast(state.resources, resourceCosts)) return "NOT_ENOUGH_RESOURCES";

  return null;
}

export function launchMiniGameRun(
  state: GameState,
  kind: MiniGameKind,
  options: LaunchMiniGameRunOptions = {},
): LaunchMiniGameRunResult {
  const blockedReason = canLaunchMiniGameRun(state, kind, options);
  if (blockedReason) return { ok: false, next: state, reason: blockedReason };

  const nowMs = normalizeAmount(options.nowMs ?? Date.now());
  const worldEnergyCost = normalizeWorldEnergyCost(options.worldEnergyCost ?? getMiniGameWorldEnergyCost(kind));
  const resourceCosts = normalizeResourceStock(options.resourceCosts);
  const run: MiniGameRunState = {
    id: options.id ?? `${kind}-${nowMs}`,
    kind,
    status: "running",
    startedAt: nowMs,
    worldEnergyCost,
    consumedCosts: {
      worldEnergy: worldEnergyCost,
      resources: resourceCosts,
    },
    temporaryRewards: {},
    temporaryItemRewards: [],
    runResources: normalizeRunResources(kind, options.runResources),
  };

  return {
    ok: true,
    run,
    next: {
      ...state,
      resources: spend(state.resources, resourceCosts),
      world: {
        ...state.world,
        energy: {
          ...state.world.energy,
          current: state.world.energy.current - worldEnergyCost,
        },
      },
      miniGames: {
        ...state.miniGames,
        activeRun: run,
      },
    },
  };
}

export function addMiniGameTemporaryRewards(
  state: GameState,
  rewards: ResourceStock,
  runId?: string,
): AddMiniGameTemporaryRewardsResult {
  const activeRun = state.miniGames.activeRun;
  if (!activeRun || activeRun.status !== "running") return { ok: false, next: state, reason: "NO_ACTIVE_RUN" };
  if (runId && activeRun.id !== runId) return { ok: false, next: state, reason: "RUN_ID_MISMATCH" };

  const run: MiniGameRunState = {
    ...activeRun,
    temporaryRewards: mergeResourceStock(activeRun.temporaryRewards, rewards),
  };

  return {
    ok: true,
    run,
    next: {
      ...state,
      miniGames: {
        ...state.miniGames,
        activeRun: run,
      },
    },
  };
}

export function finishMiniGameRun(
  state: GameState,
  status: FinishMiniGameRunStatus,
  options: FinishMiniGameRunOptions = {},
): FinishMiniGameRunResult {
  const activeRun = state.miniGames.activeRun;
  if (!activeRun || activeRun.status !== "running") return { ok: false, next: state, reason: "NO_ACTIVE_RUN" };
  if (options.runId && activeRun.id !== options.runId) return { ok: false, next: state, reason: "RUN_ID_MISMATCH" };

  const finishedRun: MiniGameRunState = {
    ...activeRun,
    status,
    finishedAt: normalizeAmount(options.nowMs ?? Date.now()),
  };
  const rewardsCommitted = status === "success" ? activeRun.temporaryRewards : {};
  const itemRewardsCommitted = status === "success" ? activeRun.temporaryItemRewards ?? [] : [];

  return {
    ok: true,
    run: finishedRun,
    outcome: status === "success" ? "success" : "failed",
    rewardsCommitted,
    itemRewardsCommitted,
    consumedCosts: finishedRun.consumedCosts,
    next: {
      ...state,
      resources: status === "success" ? addResourceStock(state.resources, activeRun.temporaryRewards) : state.resources,
      inventory:
        status === "success" && itemRewardsCommitted.length > 0
          ? { items: [...state.inventory.items, ...itemRewardsCommitted] }
          : state.inventory,
      miniGames: {
        activeRun: null,
        lastRun: finishedRun,
      },
    },
  };
}

export function succeedMiniGameRun(state: GameState, options: FinishMiniGameRunOptions = {}): FinishMiniGameRunResult {
  return finishMiniGameRun(state, "success", options);
}

export function failMiniGameRun(state: GameState, options: FinishMiniGameRunOptions = {}): FinishMiniGameRunResult {
  return finishMiniGameRun(state, "failed", options);
}

export function abandonMiniGameRun(state: GameState, options: FinishMiniGameRunOptions = {}): FinishMiniGameRunResult {
  return finishMiniGameRun(state, "abandoned", options);
}
