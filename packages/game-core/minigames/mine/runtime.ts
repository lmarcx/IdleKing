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
import {
  generateMineBoard,
  getMineBoardDugTileKeys,
  getMineBoardRevealedTileKeys,
  getMineTile,
  getMineTileKey,
  refreshMineBoardVisibility,
  MINE_BOARD_SIZE,
  MINE_MAX_FLOORS,
} from "./board.js";
import type { ActiveMineRunState, MineBoard, MineRunState, MineTile, MineTileType } from "./types.js";

export const MINE_RUN_ENERGY_COST_PER_ACTION = 1;
export const MINE_RUN_ENEMY_DAMAGE = 10;

export type StartMineRunOptions = Omit<LaunchMiniGameRunOptions, "runResources"> & {
  seed?: number;
  boardSize?: number;
  board?: MineBoard;
};

export type StartMineRunResult =
  | { ok: true; next: GameState; run: ActiveMineRunState; mine: MineRunState }
  | Extract<LaunchMiniGameRunResult, { ok: false }>;

export type MineActionResult =
  | {
      ok: true;
      next: GameState;
      run: ActiveMineRunState | MiniGameRunState;
      mine: MineRunState;
      tile: MineTile;
      outcome: "empty" | "resource" | "enemy" | "stair";
      reward: ResourceStock;
      failed: boolean;
    }
  | {
      ok: false;
      next: GameState;
      reason:
        | "NO_ACTIVE_MINE_RUN"
        | "OUT_OF_BOUNDS"
        | "WRONG_TILE_TYPE"
        | "TILE_ALREADY_DUG"
        | "NO_RUN_ENERGY";
    };

function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.floor(value), min), max);
}

function isMineRun(run: MiniGameRunState | null): run is ActiveMineRunState {
  return Boolean(run && run.status === "running" && run.kind === "mine" && run.mine && typeof run.mine === "object");
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

function createMineRunState(options: {
  seed: number;
  boardSize: number;
  board?: MineBoard;
  floor?: number;
  maxFloors?: number;
}): MineRunState {
  const maxFloors = clampInt(options.maxFloors ?? MINE_MAX_FLOORS, 1, MINE_MAX_FLOORS);
  const currentFloor = clampInt(options.floor ?? options.board?.floor ?? 1, 1, maxFloors);
  const board =
    options.board ??
    generateMineBoard({
      floor: currentFloor,
      maxFloors,
      seed: options.seed,
      size: options.boardSize,
    });

  return {
    currentFloor,
    maxFloors,
    board,
    dugTileKeys: getMineBoardDugTileKeys(board),
    revealedTileKeys: getMineBoardRevealedTileKeys(board),
    seed: options.seed,
    boardSize: board.size,
  };
}

function attachMineRun(state: GameState, run: ActiveMineRunState): GameState {
  return {
    ...state,
    miniGames: {
      ...state.miniGames,
      activeRun: run,
    },
  };
}

function updateActiveMineRun(
  state: GameState,
  run: ActiveMineRunState,
): { state: GameState; run: ActiveMineRunState } {
  const next = attachMineRun(state, run);
  return { state: next, run };
}

function revealMineTileAndAdjacent(board: MineBoard, target: MineTile): { board: MineBoard; tile: MineTile } {
  const nextBoard: MineBoard = {
    ...board,
    tiles: board.tiles.map((tile) => {
      const isTarget = tile.x === target.x && tile.y === target.y;
      const isAdjacent = Math.abs(tile.x - target.x) <= 1 && Math.abs(tile.y - target.y) <= 1;
      return {
        ...tile,
        revealed: tile.revealed || isAdjacent,
        dug: tile.dug || isTarget,
      };
    }),
  };
  const refreshed = refreshMineBoardVisibility(nextBoard);
  const nextTile = getMineTile(refreshed, target.x, target.y);
  if (!nextTile) throw new Error("Mine tile disappeared during reveal");
  return { board: refreshed, tile: nextTile };
}

function makeMineActionState(params: {
  state: GameState;
  run: ActiveMineRunState;
  mine: MineRunState;
  board: MineBoard;
  reward: ResourceStock;
  hp: MiniGameRunResourcePool;
  energy: MiniGameRunResourcePool;
}): ActiveMineRunState {
  const mine: MineRunState = {
    ...params.mine,
    board: params.board,
    currentFloor: params.board.floor,
    dugTileKeys: getMineBoardDugTileKeys(params.board),
    revealedTileKeys: getMineBoardRevealedTileKeys(params.board),
  };

  return {
    ...params.run,
    mine,
    runResources: {
      ...params.run.runResources,
      hp: params.hp,
      energy: params.energy,
    },
    temporaryRewards: addResourceStock(params.run.temporaryRewards, params.reward),
  };
}

function floorSeed(run: ActiveMineRunState, floor: number): number {
  return (run.mine.seed + floor * 2654435761) >>> 0;
}

function resolveMineAction(state: GameState, x: number, y: number, expectedType: MineTileType): MineActionResult {
  const activeRun = state.miniGames.activeRun;
  if (!isMineRun(activeRun)) return { ok: false, next: state, reason: "NO_ACTIVE_MINE_RUN" };

  const tile = getMineTile(activeRun.mine.board, x, y);
  if (!tile) return { ok: false, next: state, reason: "OUT_OF_BOUNDS" };
  if (tile.type !== expectedType) return { ok: false, next: state, reason: "WRONG_TILE_TYPE" };
  if (tile.dug) return { ok: false, next: state, reason: "TILE_ALREADY_DUG" };

  const energy = asPool(activeRun.runResources.energy);
  if (energy.current <= 0) return { ok: false, next: state, reason: "NO_RUN_ENERGY" };

  const hp = asPool(activeRun.runResources.hp);
  const nextEnergy = { ...energy, current: Math.max(0, energy.current - MINE_RUN_ENERGY_COST_PER_ACTION) };
  const nextHp =
    tile.content === "enemy" ? { ...hp, current: Math.max(0, hp.current - MINE_RUN_ENEMY_DAMAGE) } : hp;
  const reward = tile.content === "resource" ? tile.resourceReward ?? {} : {};
  const revealed = revealMineTileAndAdjacent(activeRun.mine.board, tile);
  let nextBoard = revealed.board;

  if (tile.content === "stair" && activeRun.mine.currentFloor < activeRun.mine.maxFloors) {
    const nextFloor = activeRun.mine.currentFloor + 1;
    nextBoard = generateMineBoard({
      floor: nextFloor,
      maxFloors: activeRun.mine.maxFloors,
      seed: floorSeed(activeRun, nextFloor),
      size: activeRun.mine.boardSize,
    });
  }

  const updatedRun = makeMineActionState({
    state,
    run: activeRun,
    mine: activeRun.mine,
    board: nextBoard,
    reward,
    hp: nextHp,
    energy: nextEnergy,
  });
  const updated = updateActiveMineRun(state, updatedRun);

  if (nextHp.current <= 0 || nextEnergy.current <= 0) {
    const failed = failMiniGameRun(updated.state);
    if (!failed.ok) {
      return {
        ok: true,
        next: updated.state,
        run: updated.run,
        mine: updated.run.mine,
        tile: revealed.tile,
        outcome: tile.content,
        reward,
        failed: false,
      };
    }
    return {
      ok: true,
      next: failed.next,
      run: failed.run,
      mine: updated.run.mine,
      tile: revealed.tile,
      outcome: tile.content,
      reward,
      failed: true,
    };
  }

  return {
    ok: true,
    next: updated.state,
    run: updated.run,
    mine: updated.run.mine,
    tile: revealed.tile,
    outcome: tile.content,
    reward,
    failed: false,
  };
}

export function startMineRun(state: GameState, options: StartMineRunOptions = {}): StartMineRunResult {
  const seed = options.seed ?? options.nowMs ?? Date.now();
  const boardSize = options.boardSize ?? options.board?.size ?? MINE_BOARD_SIZE;
  const launched = launchMiniGameRun(state, "mine", {
    ...options,
    runResources: {
      hp: { current: 100, max: 100 },
      energy: { current: 100, max: 100 },
    },
  });

  if (!launched.ok) return launched;

  const mine = createMineRunState({
    seed,
    boardSize,
    board: options.board,
  });
  const run: ActiveMineRunState = {
    ...launched.run,
    kind: "mine",
    mine,
  };

  return {
    ok: true,
    run,
    mine,
    next: attachMineRun(launched.next, run),
  };
}

export function digMineSoilTile(state: GameState, x: number, y: number): MineActionResult {
  return resolveMineAction(state, x, y, "soil");
}

export function breakMineRockTile(state: GameState, x: number, y: number): MineActionResult {
  return resolveMineAction(state, x, y, "rock");
}

export function extractMineRun(state: GameState): FinishMiniGameRunResult {
  const activeRun = state.miniGames.activeRun;
  if (!isMineRun(activeRun)) return { ok: false, next: state, reason: "NO_ACTIVE_RUN" };
  return succeedMiniGameRun(state);
}

export function abandonMineRun(state: GameState): FinishMiniGameRunResult {
  const activeRun = state.miniGames.activeRun;
  if (!isMineRun(activeRun)) return { ok: false, next: state, reason: "NO_ACTIVE_RUN" };
  return abandonMiniGameRun(state);
}
