import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import {
  abandonFarmRun,
  FARM_GOLDEN_TIMER_BONUS_MS,
  FARM_RUN_BOMB_DAMAGE,
  FARM_RUN_ENERGY_COST_PER_ACTION,
  generateFarmSpawns,
  hitFarmSpawn,
  startFarmRun,
  tickFarmTimer,
  type FarmSpawn,
} from "../minigames/index.js";
import { getQty, type ResourceStock } from "../resources/types.js";

function makeSpawn(patch: Partial<FarmSpawn> = {}): FarmSpawn {
  return {
    id: "spawn-1",
    kind: "fruit",
    reward: { WHEAT: 1 },
    hit: false,
    x: 0.5,
    y: 0.5,
    ...patch,
  };
}

function requireStartedFarm(options: Parameters<typeof startFarmRun>[1] = {}) {
  const state = createInitialGameState({ nowMs: 1_000 });
  const started = startFarmRun(state, { nowMs: 2_000, seed: 42, ...options });
  assert.equal(started.ok, true);
  if (!started.ok) throw new Error("Expected farm run to start");
  return started;
}

test("Farm spawn generation is deterministic", () => {
  const first = generateFarmSpawns({ seed: 77, wave: 2, count: 6 });
  const second = generateFarmSpawns({ seed: 77, wave: 2, count: 6 });
  const different = generateFarmSpawns({ seed: 78, wave: 2, count: 6 });

  assert.deepEqual(first, second);
  assert.notDeepEqual(first, different);
  assert.equal(first.length, 6);
  assert.ok(first.every((spawn) => spawn.kind === "fruit" || spawn.kind === "bomb" || spawn.kind === "golden_fruit"));
});

test("Farm start consumes World Energy", () => {
  const state = createInitialGameState({ nowMs: 1_000 });

  const started = startFarmRun(state, { nowMs: 2_000, worldEnergyCost: 12 });

  assert.equal(started.ok, true);
  if (!started.ok) return;
  assert.equal(started.next.world.energy.current, state.world.energy.current - 12);
  assert.equal(started.run.kind, "farm");
  assert.equal(started.run.status, "running");
});

test("Farm fruit hit adds temporary reward", () => {
  const reward = { WHEAT: 2 } satisfies ResourceStock;
  const started = requireStartedFarm({ spawns: [makeSpawn({ reward })] });

  const hit = hitFarmSpawn(started.next, "spawn-1");

  assert.equal(hit.ok, true);
  if (!hit.ok) return;
  assert.deepEqual(hit.run.temporaryRewards, reward);
  assert.equal(getQty(hit.next.resources, "WHEAT"), 0);
  assert.equal(hit.spawn.hit, true);
});

test("Farm bomb hit reduces run HP", () => {
  const started = requireStartedFarm({
    spawns: [makeSpawn({ kind: "bomb", reward: undefined })],
  });

  const hit = hitFarmSpawn(started.next, "spawn-1");

  assert.equal(hit.ok, true);
  if (!hit.ok) return;
  assert.equal(hit.run.runResources.hp?.current, 100 - FARM_RUN_BOMB_DAMAGE);
});

test("Farm golden fruit adds reward and timer", () => {
  const reward = { APPLE: 2 } satisfies ResourceStock;
  const started = requireStartedFarm({
    timerMs: 20_000,
    timerMaxMs: 60_000,
    spawns: [makeSpawn({ kind: "golden_fruit", reward })],
  });

  const hit = hitFarmSpawn(started.next, "spawn-1");

  assert.equal(hit.ok, true);
  if (!hit.ok) return;
  assert.deepEqual(hit.run.temporaryRewards, reward);
  assert.equal(hit.farm.timerMs, 20_000 + FARM_GOLDEN_TIMER_BONUS_MS);
  assert.equal(hit.run.runResources.timerMs, 20_000 + FARM_GOLDEN_TIMER_BONUS_MS);
});

test("Farm action consumes run Energy", () => {
  const started = requireStartedFarm({ spawns: [makeSpawn()] });

  const hit = hitFarmSpawn(started.next, "spawn-1");

  assert.equal(hit.ok, true);
  if (!hit.ok) return;
  assert.equal(hit.run.runResources.energy?.current, 100 - FARM_RUN_ENERGY_COST_PER_ACTION);
});

test("Farm timer reaching zero commits temporary rewards", () => {
  const started = requireStartedFarm({
    timerMs: 1_000,
    timerMaxMs: 60_000,
    spawns: [makeSpawn({ reward: { WHEAT: 3 } })],
  });
  const hit = hitFarmSpawn(started.next, "spawn-1");
  assert.equal(hit.ok, true);
  if (!hit.ok) return;

  const ticked = tickFarmTimer(hit.next, 1_000);

  assert.equal(ticked.ok, true);
  if (!ticked.ok) return;
  assert.equal(ticked.finished, true);
  assert.equal(ticked.next.miniGames.activeRun, null);
  assert.equal(ticked.next.miniGames.lastRun?.status, "success");
  assert.equal(getQty(ticked.next.resources, "WHEAT"), 3);
});

test("Farm HP reaching zero discards temporary rewards", () => {
  const started = requireStartedFarm({
    spawns: [
      makeSpawn({ id: "fruit", reward: { WHEAT: 2 } }),
      makeSpawn({ id: "bomb", kind: "bomb", reward: undefined }),
    ],
  });
  const fruitHit = hitFarmSpawn(started.next, "fruit");
  assert.equal(fruitHit.ok, true);
  if (!fruitHit.ok) return;
  const activeRun = fruitHit.next.miniGames.activeRun;
  assert.ok(activeRun);
  if (!activeRun) return;

  const lowHpState = {
    ...fruitHit.next,
    miniGames: {
      ...fruitHit.next.miniGames,
      activeRun: {
        ...activeRun,
        runResources: {
          ...activeRun.runResources,
          hp: { current: FARM_RUN_BOMB_DAMAGE, max: 100 },
        },
      },
    },
  };

  const bombHit = hitFarmSpawn(lowHpState, "bomb");

  assert.equal(bombHit.ok, true);
  if (!bombHit.ok) return;
  assert.equal(bombHit.failed, true);
  assert.equal(bombHit.next.miniGames.activeRun, null);
  assert.equal(bombHit.next.miniGames.lastRun?.status, "failed");
  assert.equal(getQty(bombHit.next.resources, "WHEAT"), 0);
});

test("Farm Energy reaching zero discards temporary rewards", () => {
  const started = requireStartedFarm({
    spawns: [
      makeSpawn({ id: "fruit-1", reward: { WHEAT: 2 } }),
      makeSpawn({ id: "fruit-2", reward: { TOMATO: 1 } }),
    ],
  });
  const firstHit = hitFarmSpawn(started.next, "fruit-1");
  assert.equal(firstHit.ok, true);
  if (!firstHit.ok) return;
  const activeRun = firstHit.next.miniGames.activeRun;
  assert.ok(activeRun);
  if (!activeRun) return;

  const lowEnergyState = {
    ...firstHit.next,
    miniGames: {
      ...firstHit.next.miniGames,
      activeRun: {
        ...activeRun,
        runResources: {
          ...activeRun.runResources,
          energy: { current: FARM_RUN_ENERGY_COST_PER_ACTION, max: 100 },
        },
      },
    },
  };

  const secondHit = hitFarmSpawn(lowEnergyState, "fruit-2");

  assert.equal(secondHit.ok, true);
  if (!secondHit.ok) return;
  assert.equal(secondHit.failed, true);
  assert.equal(secondHit.next.miniGames.lastRun?.status, "failed");
  assert.equal(getQty(secondHit.next.resources, "WHEAT"), 0);
  assert.equal(getQty(secondHit.next.resources, "TOMATO"), 0);
});

test("Farm abandon discards temporary rewards", () => {
  const started = requireStartedFarm({ spawns: [makeSpawn({ reward: { WHEAT: 2 } })] });
  const hit = hitFarmSpawn(started.next, "spawn-1");
  assert.equal(hit.ok, true);
  if (!hit.ok) return;

  const abandoned = abandonFarmRun(hit.next);

  assert.equal(abandoned.ok, true);
  if (!abandoned.ok) return;
  assert.equal(abandoned.next.miniGames.activeRun, null);
  assert.equal(abandoned.next.miniGames.lastRun?.status, "abandoned");
  assert.equal(getQty(abandoned.next.resources, "WHEAT"), 0);
});

test("Farm actions fail outside an active Farm run", () => {
  const state = createInitialGameState({ nowMs: 1_000 });

  const hit = hitFarmSpawn(state, "spawn-1");
  const ticked = tickFarmTimer(state, 1_000);

  assert.equal(hit.ok, false);
  if (!hit.ok) assert.equal(hit.reason, "NO_ACTIVE_FARM_RUN");
  assert.equal(ticked.ok, false);
  if (!ticked.ok) assert.equal(ticked.reason, "NO_ACTIVE_FARM_RUN");
});
