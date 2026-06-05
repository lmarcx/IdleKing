import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { loadGameWithReport } from "../game/save.js";
import {
  abandonMiniGameRun,
  addMiniGameTemporaryRewards,
  failMiniGameRun,
  launchMiniGameRun,
  succeedMiniGameRun,
} from "../minigames/index.js";
import { getQty } from "../resources/types.js";

test("mini-game launch fails without required World Energy", () => {
  const state = createInitialGameState({ nowMs: 1_000 });
  const depleted = {
    ...state,
    world: {
      ...state.world,
      energy: { ...state.world.energy, current: 4 },
    },
  };

  const result = launchMiniGameRun(depleted, "mine", { worldEnergyCost: 5, nowMs: 2_000 });

  assert.equal(result.ok, false);
  assert.equal(result.next.world.energy.current, 4);
  if (result.ok) return;
  assert.equal(result.reason, "NOT_ENOUGH_WORLD_ENERGY");
});

test("mini-game launch consumes World Energy and creates a running run", () => {
  const state = createInitialGameState({ nowMs: 1_000 });

  const result = launchMiniGameRun(state, "farm", { worldEnergyCost: 12, nowMs: 2_000, id: "run-1" });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.next.world.energy.current, state.world.energy.current - 12);
  assert.equal(result.run.id, "run-1");
  assert.equal(result.run.kind, "farm");
  assert.equal(result.run.status, "running");
  assert.equal(result.run.consumedCosts.worldEnergy, 12);
});

test("mini-game success commits temporary rewards", () => {
  const state = createInitialGameState({ nowMs: 1_000 });
  const launched = launchMiniGameRun(state, "mine", { nowMs: 2_000 });
  assert.equal(launched.ok, true);
  if (!launched.ok) return;

  const rewarded = addMiniGameTemporaryRewards(launched.next, { iron_ore: 3, quartz: 1 }, launched.run.id);
  assert.equal(rewarded.ok, true);
  if (!rewarded.ok) return;

  const finished = succeedMiniGameRun(rewarded.next, { runId: launched.run.id, nowMs: 3_000 });

  assert.equal(finished.ok, true);
  if (!finished.ok) return;
  assert.equal(getQty(finished.next.resources, "iron_ore"), 3);
  assert.equal(getQty(finished.next.resources, "quartz"), 1);
  assert.deepEqual(finished.rewardsCommitted, { iron_ore: 3, quartz: 1 });
  assert.equal(finished.next.miniGames.activeRun, null);
  assert.equal(finished.next.miniGames.lastRun?.status, "success");
});

test("mini-game failure discards temporary rewards", () => {
  const state = createInitialGameState({ nowMs: 1_000 });
  const launched = launchMiniGameRun(state, "mine", { nowMs: 2_000 });
  assert.equal(launched.ok, true);
  if (!launched.ok) return;

  const rewarded = addMiniGameTemporaryRewards(launched.next, { iron_ore: 3 }, launched.run.id);
  assert.equal(rewarded.ok, true);
  if (!rewarded.ok) return;

  const finished = failMiniGameRun(rewarded.next, { runId: launched.run.id, nowMs: 3_000 });

  assert.equal(finished.ok, true);
  if (!finished.ok) return;
  assert.equal(getQty(finished.next.resources, "iron_ore"), 0);
  assert.deepEqual(finished.rewardsCommitted, {});
  assert.equal(finished.outcome, "failed");
  assert.equal(finished.next.miniGames.lastRun?.status, "failed");
});

test("mini-game abandon discards temporary rewards and counts as failure", () => {
  const state = createInitialGameState({ nowMs: 1_000 });
  const launched = launchMiniGameRun(state, "farm", { nowMs: 2_000 });
  assert.equal(launched.ok, true);
  if (!launched.ok) return;

  const rewarded = addMiniGameTemporaryRewards(launched.next, { tomato: 5 }, launched.run.id);
  assert.equal(rewarded.ok, true);
  if (!rewarded.ok) return;

  const finished = abandonMiniGameRun(rewarded.next, { runId: launched.run.id, nowMs: 3_000 });

  assert.equal(finished.ok, true);
  if (!finished.ok) return;
  assert.equal(getQty(finished.next.resources, "tomato"), 0);
  assert.equal(finished.outcome, "failed");
  assert.equal(finished.next.miniGames.lastRun?.status, "abandoned");
});

test("mini-game run-local HP and Energy initialize on launch", () => {
  const state = createInitialGameState({ nowMs: 1_000 });

  const launched = launchMiniGameRun(state, "mine", { nowMs: 2_000 });

  assert.equal(launched.ok, true);
  if (!launched.ok) return;
  assert.deepEqual(launched.run.runResources.hp, { current: 100, max: 100 });
  assert.deepEqual(launched.run.runResources.energy, { current: 100, max: 100 });
});

test("old saves migrate with default mini-game runtime state", () => {
  const savedAt = 1_000;
  const oldState: any = createInitialGameState({ nowMs: savedAt });
  delete oldState.miniGames;

  const store = new Map<string, string>();
  const previousLocalStorage = globalThis.localStorage;
  globalThis.localStorage = {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };

  const previousDateNow = Date.now;
  Date.now = () => savedAt;

  try {
    localStorage.setItem(
      "idle_king_save_v1",
      JSON.stringify({
        schemaVersion: 1,
        savedAt,
        state: oldState,
      }),
    );

    const loaded = loadGameWithReport();
    assert.ok(loaded);
    if (!loaded) return;

    assert.deepEqual(loaded.state.miniGames, { activeRun: null, lastRun: null });
  } finally {
    Date.now = previousDateNow;
    globalThis.localStorage = previousLocalStorage;
  }
});
