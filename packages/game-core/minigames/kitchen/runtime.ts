import type { GameState } from "../../game/state.js";
import {
  failMiniGameRun,
  launchMiniGameRun,
  succeedMiniGameRun,
  type FinishMiniGameRunResult,
  type LaunchMiniGameRunOptions,
  type LaunchMiniGameRunResult,
} from "../runtime.js";
import type { MiniGameRunState } from "../types.js";
import {
  generateKitchenPattern,
  generateKitchenResourceTargets,
  getKitchenMiniGameRecipe,
} from "./recipes.js";
import type {
  ActiveKitchenRunState,
  KitchenPatternInput,
  KitchenRecipe,
  KitchenRecipeId,
  KitchenResourceTarget,
  KitchenRunState,
} from "./types.js";

export const KITCHEN_SUCCESS_POINTS_MAX = 100;
export const KITCHEN_WRONG_PATTERN_PENALTY = 15;
export const KITCHEN_CORRECT_STREAK_BONUS = 2;
export const KITCHEN_PATTERN_COMPLETE_BONUS = 3;
export const KITCHEN_WRONG_RESOURCE_MISSED_PENALTY = 5;
export const KITCHEN_RECIPE_RESOURCE_MISSED_BONUS = 3;

export type StartKitchenRunOptions = Omit<LaunchMiniGameRunOptions, "resourceCosts" | "runResources"> & {
  seed?: number;
  currentPattern?: KitchenPatternInput[];
  resourceTargets?: KitchenResourceTarget[];
  successPoints?: number;
};

export type StartKitchenRunResult =
  | { ok: true; next: GameState; run: ActiveKitchenRunState; kitchen: KitchenRunState }
  | Extract<LaunchMiniGameRunResult, { ok: false }>
  | { ok: false; next: GameState; reason: "RECIPE_NOT_FOUND" };

export type KitchenPatternResult =
  | {
      ok: true;
      next: GameState;
      run: ActiveKitchenRunState | MiniGameRunState;
      kitchen: KitchenRunState;
      expectedInput: KitchenPatternInput;
      accepted: boolean;
      patternCompleted: boolean;
      failed: boolean;
    }
  | { ok: false; next: GameState; reason: "NO_ACTIVE_KITCHEN_RUN" };

export type KitchenResourceTargetResult =
  | {
      ok: true;
      next: GameState;
      run: ActiveKitchenRunState | MiniGameRunState;
      kitchen: KitchenRunState;
      target: KitchenResourceTarget;
      action: "hit" | "miss";
      successPointDelta: number;
      failed: boolean;
    }
  | {
      ok: false;
      next: GameState;
      reason: "NO_ACTIVE_KITCHEN_RUN" | "TARGET_NOT_FOUND" | "TARGET_ALREADY_RESOLVED";
    };

export type KitchenFinalizeResult =
  | (Extract<FinishMiniGameRunResult, { ok: true }> & { quality: number })
  | Extract<FinishMiniGameRunResult, { ok: false }>
  | { ok: false; next: GameState; reason: "NO_ACTIVE_KITCHEN_RUN" | "NO_SUCCESS_POINTS" };

function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.floor(value), min), max);
}

function isKitchenRun(run: MiniGameRunState | null): run is ActiveKitchenRunState {
  return Boolean(
    run && run.status === "running" && run.kind === "kitchen" && run.kitchen && typeof run.kitchen === "object",
  );
}

function attachKitchenRun(state: GameState, run: ActiveKitchenRunState): GameState {
  return {
    ...state,
    miniGames: {
      ...state.miniGames,
      activeRun: run,
    },
  };
}

function setSuccessPoints(run: ActiveKitchenRunState, successPoints: number): ActiveKitchenRunState {
  const nextSuccessPoints = clampInt(successPoints, 0, KITCHEN_SUCCESS_POINTS_MAX);
  return {
    ...run,
    kitchen: {
      ...run.kitchen,
      successPoints: nextSuccessPoints,
    },
    runResources: {
      ...run.runResources,
      successPoints: nextSuccessPoints,
      successPointsMax: KITCHEN_SUCCESS_POINTS_MAX,
    },
  };
}

function createKitchenRunState(options: {
  recipe: KitchenRecipe;
  seed: number;
  currentPattern?: KitchenPatternInput[];
  resourceTargets?: KitchenResourceTarget[];
  successPoints?: number;
}): KitchenRunState {
  const successPoints = clampInt(options.successPoints ?? KITCHEN_SUCCESS_POINTS_MAX, 1, KITCHEN_SUCCESS_POINTS_MAX);

  return {
    recipe: options.recipe,
    successPoints,
    currentPattern: options.currentPattern ?? generateKitchenPattern(options.recipe, options.seed, 0),
    currentPatternProgress: 0,
    correctStreak: 0,
    completedPatterns: 0,
    resourceTargets: options.resourceTargets ?? generateKitchenResourceTargets(options.recipe, options.seed),
    seed: options.seed,
  };
}

function updateKitchenRun(state: GameState, run: ActiveKitchenRunState): { state: GameState; run: ActiveKitchenRunState } {
  return {
    state: attachKitchenRun(state, run),
    run,
  };
}

function failIfNoSuccessPoints(
  state: GameState,
  run: ActiveKitchenRunState,
): Extract<KitchenPatternResult, { ok: true }> | null {
  if (run.kitchen.successPoints > 0) return null;

  const failed = failMiniGameRun(state);
  if (!failed.ok) return null;

  return {
    ok: true,
    next: failed.next,
    run: failed.run,
    kitchen: run.kitchen,
    expectedInput: run.kitchen.currentPattern[run.kitchen.currentPatternProgress] ?? "up",
    accepted: false,
    patternCompleted: false,
    failed: true,
  };
}

function resolveResourceTarget(
  state: GameState,
  targetId: string,
  action: "hit" | "miss",
): KitchenResourceTargetResult {
  const activeRun = state.miniGames.activeRun;
  if (!isKitchenRun(activeRun)) return { ok: false, next: state, reason: "NO_ACTIVE_KITCHEN_RUN" };

  const target = activeRun.kitchen.resourceTargets?.find((candidate) => candidate.id === targetId);
  if (!target) return { ok: false, next: state, reason: "TARGET_NOT_FOUND" };
  if (target.resolved) return { ok: false, next: state, reason: "TARGET_ALREADY_RESOLVED" };

  const successPointDelta =
    action === "miss"
      ? target.isRecipeResource
        ? KITCHEN_RECIPE_RESOURCE_MISSED_BONUS
        : -KITCHEN_WRONG_RESOURCE_MISSED_PENALTY
      : 0;
  const resolvedTarget: KitchenResourceTarget = { ...target, resolved: true };
  const kitchen: KitchenRunState = {
    ...activeRun.kitchen,
    successPoints: clampInt(
      activeRun.kitchen.successPoints + successPointDelta,
      0,
      KITCHEN_SUCCESS_POINTS_MAX,
    ),
    resourceTargets: activeRun.kitchen.resourceTargets?.map((candidate) =>
      candidate.id === target.id ? resolvedTarget : candidate,
    ),
  };
  const run = setSuccessPoints({ ...activeRun, kitchen }, kitchen.successPoints);
  const updated = updateKitchenRun(state, run);

  if (run.kitchen.successPoints <= 0) {
    const failed = failMiniGameRun(updated.state);
    if (failed.ok) {
      return {
        ok: true,
        next: failed.next,
        run: failed.run,
        kitchen: run.kitchen,
        target: resolvedTarget,
        action,
        successPointDelta,
        failed: true,
      };
    }
  }

  return {
    ok: true,
    next: updated.state,
    run: updated.run,
    kitchen: updated.run.kitchen,
    target: resolvedTarget,
    action,
    successPointDelta,
    failed: false,
  };
}

export function startKitchenRun(
  state: GameState,
  recipeId: KitchenRecipeId,
  options: StartKitchenRunOptions = {},
): StartKitchenRunResult {
  const recipe = getKitchenMiniGameRecipe(recipeId);
  if (!recipe) return { ok: false, next: state, reason: "RECIPE_NOT_FOUND" };

  const seed = options.seed ?? options.nowMs ?? Date.now();
  const successPoints = clampInt(options.successPoints ?? KITCHEN_SUCCESS_POINTS_MAX, 1, KITCHEN_SUCCESS_POINTS_MAX);
  const launched = launchMiniGameRun(state, "kitchen", {
    ...options,
    resourceCosts: recipe.ingredientCosts,
    runResources: {
      successPoints,
      successPointsMax: KITCHEN_SUCCESS_POINTS_MAX,
    },
  });

  if (!launched.ok) return launched;

  const kitchen = createKitchenRunState({
    recipe,
    seed,
    currentPattern: options.currentPattern,
    resourceTargets: options.resourceTargets,
    successPoints,
  });
  const run: ActiveKitchenRunState = {
    ...launched.run,
    kind: "kitchen",
    kitchen,
    runResources: {
      ...launched.run.runResources,
      successPoints: kitchen.successPoints,
      successPointsMax: KITCHEN_SUCCESS_POINTS_MAX,
    },
  };

  return {
    ok: true,
    next: attachKitchenRun(launched.next, run),
    run,
    kitchen,
  };
}

export function submitKitchenPatternInput(state: GameState, input: KitchenPatternInput): KitchenPatternResult {
  const activeRun = state.miniGames.activeRun;
  if (!isKitchenRun(activeRun)) return { ok: false, next: state, reason: "NO_ACTIVE_KITCHEN_RUN" };

  const expectedInput = activeRun.kitchen.currentPattern[activeRun.kitchen.currentPatternProgress] ?? "up";
  const accepted = input === expectedInput;
  const nextProgress = accepted ? activeRun.kitchen.currentPatternProgress + 1 : 0;
  const patternCompleted = accepted && nextProgress >= activeRun.kitchen.currentPattern.length;
  const nextCompletedPatterns = patternCompleted
    ? activeRun.kitchen.completedPatterns + 1
    : activeRun.kitchen.completedPatterns;
  const nextCorrectStreak = accepted ? activeRun.kitchen.correctStreak + 1 : 0;
  const streakBonus = accepted && nextCorrectStreak % 3 === 0 ? KITCHEN_CORRECT_STREAK_BONUS : 0;
  const successPointDelta = accepted
    ? streakBonus + (patternCompleted ? KITCHEN_PATTERN_COMPLETE_BONUS : 0)
    : -KITCHEN_WRONG_PATTERN_PENALTY;
  const successPoints = clampInt(
    activeRun.kitchen.successPoints + successPointDelta,
    0,
    KITCHEN_SUCCESS_POINTS_MAX,
  );
  const kitchen: KitchenRunState = {
    ...activeRun.kitchen,
    successPoints,
    currentPattern: patternCompleted
      ? generateKitchenPattern(activeRun.kitchen.recipe, activeRun.kitchen.seed, nextCompletedPatterns)
      : activeRun.kitchen.currentPattern,
    currentPatternProgress: patternCompleted ? 0 : nextProgress,
    correctStreak: nextCorrectStreak,
    completedPatterns: nextCompletedPatterns,
  };
  const run = setSuccessPoints({ ...activeRun, kitchen }, successPoints);
  const updated = updateKitchenRun(state, run);
  const failed = failIfNoSuccessPoints(updated.state, updated.run);
  if (failed) {
    return {
      ...failed,
      expectedInput,
      accepted,
      patternCompleted,
    };
  }

  return {
    ok: true,
    next: updated.state,
    run: updated.run,
    kitchen: updated.run.kitchen,
    expectedInput,
    accepted,
    patternCompleted,
    failed: false,
  };
}

export function hitKitchenResourceTarget(state: GameState, targetId: string): KitchenResourceTargetResult {
  return resolveResourceTarget(state, targetId, "hit");
}

export function missKitchenResourceTarget(state: GameState, targetId: string): KitchenResourceTargetResult {
  return resolveResourceTarget(state, targetId, "miss");
}

export function finalizeKitchenRun(state: GameState): KitchenFinalizeResult {
  const activeRun = state.miniGames.activeRun;
  if (!isKitchenRun(activeRun)) return { ok: false, next: state, reason: "NO_ACTIVE_KITCHEN_RUN" };
  if (activeRun.kitchen.successPoints <= 0) return { ok: false, next: state, reason: "NO_SUCCESS_POINTS" };

  const quality = clampInt(
    (activeRun.kitchen.successPoints / KITCHEN_SUCCESS_POINTS_MAX) * 100,
    1,
    100,
  );
  const reward = {
    id: activeRun.kitchen.recipe.baseRewardItemId,
    kind: "consumable" as const,
    name: activeRun.kitchen.recipe.name,
    quantity: 1,
    quality,
    value: quality,
  };
  const run: ActiveKitchenRunState = {
    ...activeRun,
    kitchen: {
      ...activeRun.kitchen,
      quality,
    },
    temporaryItemRewards: [...(activeRun.temporaryItemRewards ?? []), reward],
  };
  const updated = updateKitchenRun(state, run);
  const finished = succeedMiniGameRun(updated.state);
  if (!finished.ok) return finished;

  return {
    ...finished,
    quality,
  };
}

export function failKitchenRun(state: GameState): FinishMiniGameRunResult {
  const activeRun = state.miniGames.activeRun;
  if (!isKitchenRun(activeRun)) return { ok: false, next: state, reason: "NO_ACTIVE_RUN" };
  return failMiniGameRun(state);
}
