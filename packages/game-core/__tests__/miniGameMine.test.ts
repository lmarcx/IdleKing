import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import {
  breakMineRockTile,
  digMineSoilTile,
  extractMineRun,
  failMiniGameRun,
  generateMineBoard,
  MINE_RUN_ENEMY_DAMAGE,
  MINE_RUN_ENERGY_COST_PER_ACTION,
  startMineRun,
  type MineBoard,
  type MineTile,
} from "../minigames/index.js";
import { getQty, type ResourceStock } from "../resources/types.js";

function makeTile(
  x: number,
  y: number,
  patch: Partial<MineTile> = {},
): MineTile {
  return {
    x,
    y,
    type: "soil",
    content: "empty",
    revealed: false,
    dug: false,
    ...patch,
  };
}

function makeBoard(options: {
  floor?: number;
  size?: number;
  seed?: number;
  patches?: Record<string, Partial<MineTile>>;
} = {}): MineBoard {
  const size = options.size ?? 3;
  const tiles: MineTile[] = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      tiles.push(makeTile(x, y, options.patches?.[`${x},${y}`]));
    }
  }

  return {
    floor: options.floor ?? 1,
    size,
    seed: options.seed ?? 123,
    tiles,
  };
}

function requireStartedMine(board: MineBoard) {
  const state = createInitialGameState({ nowMs: 1_000 });
  const started = startMineRun(state, { board, seed: board.seed, nowMs: 2_000 });
  assert.equal(started.ok, true);
  if (!started.ok) throw new Error("Expected mine run to start");
  return started;
}

test("Mine board generation is deterministic and includes one stair before max floor", () => {
  const first = generateMineBoard({ floor: 1, seed: 42, size: 5 });
  const second = generateMineBoard({ floor: 1, seed: 42, size: 5 });
  const different = generateMineBoard({ floor: 1, seed: 43, size: 5 });

  assert.deepEqual(first, second);
  assert.notDeepEqual(first, different);
  assert.equal(first.size, 5);
  assert.equal(first.tiles.length, 25);
  assert.equal(first.tiles.filter((tile) => tile.content === "stair").length, 1);
  assert.ok(first.tiles.every((tile) => tile.type === "soil" || tile.type === "rock"));
  assert.ok(first.tiles.every((tile) => tile.content === "resource" || tile.content === "empty" || tile.content === "enemy" || tile.content === "stair"));
});

test("digging a Mine soil tile consumes run Energy and reveals adjacent hints", () => {
  const board = makeBoard();
  const started = requireStartedMine(board);

  const dug = digMineSoilTile(started.next, 1, 1);

  assert.equal(dug.ok, true);
  if (!dug.ok) return;
  assert.equal(dug.failed, false);
  assert.equal(dug.run.runResources.energy?.current, 100 - MINE_RUN_ENERGY_COST_PER_ACTION);
  assert.equal(dug.tile.dug, true);
  assert.equal(dug.tile.revealed, true);
  assert.ok(dug.tile.adjacentHints);
  assert.equal(dug.mine.revealedTileKeys.length, 9);
});

test("breaking a Mine resource rock adds temporary reward without committing it", () => {
  const reward = { iron_ore: 2 } satisfies ResourceStock;
  const board = makeBoard({
    patches: {
      "1,1": { type: "rock", content: "resource", resourceReward: reward },
    },
  });
  const started = requireStartedMine(board);

  const broken = breakMineRockTile(started.next, 1, 1);

  assert.equal(broken.ok, true);
  if (!broken.ok) return;
  assert.deepEqual(broken.run.temporaryRewards, reward);
  assert.equal(getQty(broken.next.resources, "iron_ore"), 0);
});

test("Mine enemy tile reduces run HP", () => {
  const board = makeBoard({
    patches: {
      "1,1": { type: "soil", content: "enemy" },
    },
  });
  const started = requireStartedMine(board);

  const dug = digMineSoilTile(started.next, 1, 1);

  assert.equal(dug.ok, true);
  if (!dug.ok) return;
  assert.equal(dug.run.runResources.hp?.current, 100 - MINE_RUN_ENEMY_DAMAGE);
});

test("Mine stair advances floor and regenerates the board", () => {
  const board = makeBoard({
    floor: 1,
    seed: 777,
    patches: {
      "1,1": { type: "soil", content: "stair" },
    },
  });
  const started = requireStartedMine(board);

  const dug = digMineSoilTile(started.next, 1, 1);

  assert.equal(dug.ok, true);
  if (!dug.ok) return;
  assert.equal(dug.outcome, "stair");
  assert.equal(dug.mine.currentFloor, 2);
  assert.equal(dug.mine.board.floor, 2);
  assert.equal(dug.mine.dugTileKeys.length, 0);
  assert.notEqual(dug.mine.board.seed, board.seed);
});

test("Mine extract commits temporary rewards", () => {
  const board = makeBoard({
    patches: {
      "1,1": { type: "rock", content: "resource", resourceReward: { iron_ore: 2 } },
    },
  });
  const started = requireStartedMine(board);
  const broken = breakMineRockTile(started.next, 1, 1);
  assert.equal(broken.ok, true);
  if (!broken.ok) return;

  const extracted = extractMineRun(broken.next);

  assert.equal(extracted.ok, true);
  if (!extracted.ok) return;
  assert.equal(getQty(extracted.next.resources, "iron_ore"), 2);
  assert.equal(extracted.next.miniGames.activeRun, null);
  assert.equal(extracted.next.miniGames.lastRun?.status, "success");
});

test("Mine failure discards temporary rewards", () => {
  const board = makeBoard({
    patches: {
      "1,1": { type: "rock", content: "resource", resourceReward: { iron_ore: 2 } },
    },
  });
  const started = requireStartedMine(board);
  const broken = breakMineRockTile(started.next, 1, 1);
  assert.equal(broken.ok, true);
  if (!broken.ok) return;

  const failed = failMiniGameRun(broken.next);

  assert.equal(failed.ok, true);
  if (!failed.ok) return;
  assert.equal(getQty(failed.next.resources, "iron_ore"), 0);
  assert.equal(failed.next.miniGames.lastRun?.status, "failed");
});

test("Mine run fails when run Energy reaches zero and discards rewards", () => {
  const board = makeBoard({
    patches: {
      "1,1": { type: "rock", content: "resource", resourceReward: { iron_ore: 2 } },
    },
  });
  const started = requireStartedMine(board);
  const activeRun = started.next.miniGames.activeRun;
  assert.ok(activeRun);
  if (!activeRun) return;

  const lowEnergyState = {
    ...started.next,
    miniGames: {
      ...started.next.miniGames,
      activeRun: {
        ...activeRun,
        runResources: {
          ...activeRun.runResources,
          energy: { current: MINE_RUN_ENERGY_COST_PER_ACTION, max: 100 },
        },
      },
    },
  };

  const broken = breakMineRockTile(lowEnergyState, 1, 1);

  assert.equal(broken.ok, true);
  if (!broken.ok) return;
  assert.equal(broken.failed, true);
  assert.equal(broken.next.miniGames.activeRun, null);
  assert.equal(broken.next.miniGames.lastRun?.status, "failed");
  assert.equal(getQty(broken.next.resources, "iron_ore"), 0);
});

test("Mine actions fail outside an active mine run", () => {
  const state = createInitialGameState({ nowMs: 1_000 });

  const dug = digMineSoilTile(state, 1, 1);
  const broken = breakMineRockTile(state, 1, 1);

  assert.equal(dug.ok, false);
  if (!dug.ok) assert.equal(dug.reason, "NO_ACTIVE_MINE_RUN");
  assert.equal(broken.ok, false);
  if (!broken.ok) assert.equal(broken.reason, "NO_ACTIVE_MINE_RUN");
});

test("Mine max floor handling prevents boards beyond floor 100", () => {
  const generated = generateMineBoard({ floor: 100, maxFloors: 100, seed: 99, size: 5 });
  assert.equal(generated.floor, 100);
  assert.equal(generated.tiles.filter((tile) => tile.content === "stair").length, 0);

  const board = makeBoard({
    floor: 100,
    seed: 99,
    patches: {
      "1,1": { type: "soil", content: "stair" },
    },
  });
  const started = requireStartedMine(board);
  const dug = digMineSoilTile(started.next, 1, 1);

  assert.equal(dug.ok, true);
  if (!dug.ok) return;
  assert.equal(dug.mine.currentFloor, 100);
  assert.equal(dug.mine.board.floor, 100);
});
