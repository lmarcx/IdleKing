import type { GameState } from "../../game/state.js";
import type { ResourceStock } from "../../resources/types.js";
import {
  abandonMiniGameRun,
  failMiniGameRun,
  launchMiniGameRun,
  succeedMiniGameRun,
  type FinishMiniGameRunResult,
  type LaunchMiniGameRunOptions,
  type LaunchMiniGameRunResult,
} from "../runtime.js";
import type { MiniGameRunResourcePool, MiniGameRunState } from "../types.js";
import { FARM_RUN_TIMER_MS, generateFarmSpawns } from "./spawns.js";
import type { ActiveFarmRunState, FarmRunState, FarmSpawn } from "./types.js";

export const FARM_RUN_ENERGY_COST_PER_ACTION = 1;
export const FARM_RUN_BOMB_DAMAGE = 10;
export const FARM_GOLDEN_TIMER_BONUS_MS = 5_000;
export const FARM_FRUIT_SCORE = 10;
export const FARM_GOLDEN_FRUIT_SCORE = 25;

export type StartFarmRunOptions = Omit<LaunchMiniGameRunOptions, "runResources"> & {
  seed?: number;
  spawns?: FarmSpawn[];
  timerMs?: number;
  timerMaxMs?: number;
};

export type StartFarmRunResult =
  | { ok: true; next: GameState; run: ActiveFarmRunState; farm: FarmRunState }
  | Extract<LaunchMiniGameRunResult, { ok: false }>;

export type FarmActionResult =
  | {
      ok: true;
      next: GameState;
      run: ActiveFarmRunState | MiniGameRunState;
      farm: FarmRunState;
      spawn: FarmSpawn;
      outcome: "fruit" | "bomb" | "golden_fruit";
      reward: ResourceStock;
      failed: boolean;
    }
  | {
      ok: false;
      next: GameState;
      reason: "NO_ACTIVE_FARM_RUN" | "SPAWN_NOT_FOUND" | "SPAWN_ALREADY_HIT" | "NO_RUN_ENERGY";
    };

export type FarmTimerResult =
  | {
      ok: true;
      next: GameState;
      run: ActiveFarmRunState | MiniGameRunState;
      farm: FarmRunState;
      elapsedMs: number;
      finished: boolean;
      failed: boolean;
    }
  | { ok: false; next: GameState; reason: "NO_ACTIVE_FARM_RUN" };

function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.floor(value), min), max);
}

function isFarmRun(run: MiniGameRunState | null): run is ActiveFarmRunState {
  return Boolean(run && run.status === "running" && run.kind === "farm" && run.farm && typeof run.farm === "object");
}

function asPool(pool: MiniGameRunResourcePool | undefined): MiniGameRunResourcePool {
  return pool ?? { current: 0, max: 0 };
}

function addResourceStock(left: ResourceStock, right: ResourceStock): ResourceStock {
  const next: ResourceStock = { ...left };
  for (const [resourceId, amount] of Object.entries(right)) {
    const value = Math.max(0, Math.floor(amount ?? 0));
    if (value > 0) {
      next[resourceId as keyof ResourceStock] = Math.max(0, Math.floor(next[resourceId as keyof ResourceStock] ?? 0)) + value;
    }
  }
  return next;
}

function attachFarmRun(state: GameState, run: ActiveFarmRunState): GameState {
  return {
    ...state,
    miniGames: {
      ...state.miniGames,
      activeRun: run,
    },
  };
}

function createFarmRunState(options: {
  seed: number;
  spawns?: FarmSpawn[];
  timerMs?: number;
  timerMaxMs?: number;
}): FarmRunState {
  const timerMaxMs = clampInt(options.timerMaxMs ?? FARM_RUN_TIMER_MS, 1, 10 * FARM_RUN_TIMER_MS);
  const timerMs = clampInt(options.timerMs ?? timerMaxMs, 0, timerMaxMs);

  return {
    timerMs,
    timerMaxMs,
    spawns: options.spawns ?? generateFarmSpawns({ seed: options.seed, wave: 1 }),
    seed: options.seed,
    wave: 1,
    score: 0,
  };
}

function updateActiveFarmRun(state: GameState, run: ActiveFarmRunState): { state: GameState; run: ActiveFarmRunState } {
  const next = attachFarmRun(state, run);
  return { state: next, run };
}

function makeFarmRunState(params: {
  run: ActiveFarmRunState;
  farm: FarmRunState;
  reward: ResourceStock;
  hp: MiniGameRunResourcePool;
  energy: MiniGameRunResourcePool;
  timerMs: number;
  scoreDelta?: number;
}): ActiveFarmRunState {
  const farm: FarmRunState = {
    ...params.farm,
    timerMs: params.timerMs,
    score: params.farm.score + (params.scoreDelta ?? 0),
  };

  return {
    ...params.run,
    farm,
    runResources: {
      ...params.run.runResources,
      hp: params.hp,
      energy: params.energy,
      timerMs: farm.timerMs,
      timerMaxMs: farm.timerMaxMs,
    },
    temporaryRewards: addResourceStock(params.run.temporaryRewards, params.reward),
  };
}

function failIfDepleted(state: GameState, run: ActiveFarmRunState): FarmActionResult | null {
  const hp = asPool(run.runResources.hp);
  const energy = asPool(run.runResources.energy);
  if (hp.current > 0 && energy.current > 0) return null;

  const failed = failMiniGameRun(state);
  if (!failed.ok) return null;

  return {
    ok: true,
    next: failed.next,
    run: failed.run,
    farm: run.farm,
    spawn: run.farm.spawns.find((spawn) => spawn.hit) ?? run.farm.spawns[0],
    outcome: "bomb",
    reward: {},
    failed: true,
  };
}

export function startFarmRun(state: GameState, options: StartFarmRunOptions = {}): StartFarmRunResult {
  const seed = options.seed ?? options.nowMs ?? Date.now();
  const timerMaxMs = options.timerMaxMs ?? FARM_RUN_TIMER_MS;
  const timerMs = options.timerMs ?? timerMaxMs;
  const launched = launchMiniGameRun(state, "farm", {
    ...options,
    runResources: {
      hp: { current: 100, max: 100 },
      energy: { current: 100, max: 100 },
      timerMs,
      timerMaxMs,
    },
  });

  if (!launched.ok) return launched;

  const farm = createFarmRunState({
    seed,
    spawns: options.spawns,
    timerMs,
    timerMaxMs,
  });
  const run: ActiveFarmRunState = {
    ...launched.run,
    kind: "farm",
    farm,
    runResources: {
      ...launched.run.runResources,
      timerMs: farm.timerMs,
      timerMaxMs: farm.timerMaxMs,
    },
  };

  return {
    ok: true,
    run,
    farm,
    next: attachFarmRun(launched.next, run),
  };
}

export function spawnFarmWave(state: GameState, count?: number): FarmActionResult | { ok: false; next: GameState; reason: "NO_ACTIVE_FARM_RUN" } {
  const activeRun = state.miniGames.activeRun;
  if (!isFarmRun(activeRun)) return { ok: false, next: state, reason: "NO_ACTIVE_FARM_RUN" };

  const nextWave = activeRun.farm.wave + 1;
  const farm: FarmRunState = {
    ...activeRun.farm,
    wave: nextWave,
    spawns: generateFarmSpawns({
      seed: activeRun.farm.seed,
      wave: nextWave,
      count,
    }),
  };
  const run: ActiveFarmRunState = {
    ...activeRun,
    farm,
  };
  const updated = updateActiveFarmRun(state, run);

  return {
    ok: true,
    next: updated.state,
    run: updated.run,
    farm,
    spawn: farm.spawns[0],
    outcome: farm.spawns[0]?.kind ?? "fruit",
    reward: {},
    failed: false,
  };
}

export function hitFarmSpawn(state: GameState, spawnId: string): FarmActionResult {
  const activeRun = state.miniGames.activeRun;
  if (!isFarmRun(activeRun)) return { ok: false, next: state, reason: "NO_ACTIVE_FARM_RUN" };

  const spawn = activeRun.farm.spawns.find((candidate) => candidate.id === spawnId);
  if (!spawn) return { ok: false, next: state, reason: "SPAWN_NOT_FOUND" };
  if (spawn.hit) return { ok: false, next: state, reason: "SPAWN_ALREADY_HIT" };

  const energy = asPool(activeRun.runResources.energy);
  if (energy.current <= 0) return { ok: false, next: state, reason: "NO_RUN_ENERGY" };

  const hp = asPool(activeRun.runResources.hp);
  const nextEnergy = { ...energy, current: Math.max(0, energy.current - FARM_RUN_ENERGY_COST_PER_ACTION) };
  const nextHp = spawn.kind === "bomb" ? { ...hp, current: Math.max(0, hp.current - FARM_RUN_BOMB_DAMAGE) } : hp;
  const reward = spawn.kind === "fruit" || spawn.kind === "golden_fruit" ? spawn.reward ?? {} : {};
  const timerMs =
    spawn.kind === "golden_fruit"
      ? activeRun.farm.timerMs + FARM_GOLDEN_TIMER_BONUS_MS
      : activeRun.farm.timerMs;
  const scoreDelta =
    spawn.kind === "golden_fruit" ? FARM_GOLDEN_FRUIT_SCORE : spawn.kind === "fruit" ? FARM_FRUIT_SCORE : 0;
  const farm: FarmRunState = {
    ...activeRun.farm,
    spawns: activeRun.farm.spawns.map((candidate) =>
      candidate.id === spawn.id ? { ...candidate, hit: true } : candidate,
    ),
  };
  const updatedRun = makeFarmRunState({
    run: activeRun,
    farm,
    reward,
    hp: nextHp,
    energy: nextEnergy,
    timerMs,
    scoreDelta,
  });
  const updated = updateActiveFarmRun(state, updatedRun);

  if (nextHp.current <= 0 || nextEnergy.current <= 0) {
    const failed = failMiniGameRun(updated.state);
    if (failed.ok) {
      return {
        ok: true,
        next: failed.next,
        run: failed.run,
        farm: updated.run.farm,
        spawn: { ...spawn, hit: true },
        outcome: spawn.kind,
        reward,
        failed: true,
      };
    }
  }

  return {
    ok: true,
    next: updated.state,
    run: updated.run,
    farm: updated.run.farm,
    spawn: { ...spawn, hit: true },
    outcome: spawn.kind,
    reward,
    failed: false,
  };
}

export function tickFarmTimer(state: GameState, elapsedMs: number): FarmTimerResult {
  const activeRun = state.miniGames.activeRun;
  if (!isFarmRun(activeRun)) return { ok: false, next: state, reason: "NO_ACTIVE_FARM_RUN" };

  const safeElapsedMs = Math.max(0, Math.floor(elapsedMs));
  const nextTimerMs = Math.max(0, activeRun.farm.timerMs - safeElapsedMs);
  const run: ActiveFarmRunState = {
    ...activeRun,
    farm: {
      ...activeRun.farm,
      timerMs: nextTimerMs,
    },
    runResources: {
      ...activeRun.runResources,
      timerMs: nextTimerMs,
      timerMaxMs: activeRun.farm.timerMaxMs,
    },
  };
  const updated = updateActiveFarmRun(state, run);

  if (nextTimerMs <= 0) {
    const finished = succeedMiniGameRun(updated.state);
    if (finished.ok) {
      return {
        ok: true,
        next: finished.next,
        run: finished.run,
        farm: updated.run.farm,
        elapsedMs: safeElapsedMs,
        finished: true,
        failed: false,
      };
    }
  }

  return {
    ok: true,
    next: updated.state,
    run: updated.run,
    farm: updated.run.farm,
    elapsedMs: safeElapsedMs,
    finished: false,
    failed: false,
  };
}

export function finishFarmRun(state: GameState): FinishMiniGameRunResult {
  const activeRun = state.miniGames.activeRun;
  if (!isFarmRun(activeRun)) return { ok: false, next: state, reason: "NO_ACTIVE_RUN" };
  return succeedMiniGameRun(state);
}

export function abandonFarmRun(state: GameState): FinishMiniGameRunResult {
  const activeRun = state.miniGames.activeRun;
  if (!isFarmRun(activeRun)) return { ok: false, next: state, reason: "NO_ACTIVE_RUN" };
  return abandonMiniGameRun(state);
}
