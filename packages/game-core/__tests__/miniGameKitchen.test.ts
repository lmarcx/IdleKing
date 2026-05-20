import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { loadGameWithReport } from "../game/save.js";
import {
  finalizeKitchenRun,
  KITCHEN_RECIPES,
  KITCHEN_SUCCESS_POINTS_MAX,
  startKitchenRun,
  submitKitchenPatternInput,
} from "../minigames/index.js";
import { getQty } from "../resources/types.js";

function createKitchenReadyState() {
  const state = createInitialGameState({ nowMs: 1_000 });
  return {
    ...state,
    resources: {
      ...state.resources,
      MEAT: 10,
      WATER: 10,
      CARROT: 10,
      TOMATO: 10,
    },
  };
}

test("Kitchen start consumes World Energy", () => {
  const state = createKitchenReadyState();

  const started = startKitchenRun(state, "STEW", { nowMs: 2_000, seed: 1 });

  assert.equal(started.ok, true);
  if (!started.ok) return;
  assert.equal(started.next.world.energy.current, state.world.energy.current - 10);
  assert.equal(started.run.kind, "kitchen");
  assert.equal(started.run.runResources.successPoints, KITCHEN_SUCCESS_POINTS_MAX);
});

test("Kitchen start consumes recipe ingredients", () => {
  const state = createKitchenReadyState();

  const started = startKitchenRun(state, "STEW", { nowMs: 2_000, seed: 1 });

  assert.equal(started.ok, true);
  if (!started.ok) return;
  assert.equal(getQty(started.next.resources, "MEAT"), 8);
  assert.equal(getQty(started.next.resources, "WATER"), 9);
});

test("Kitchen wrong pattern input reduces success points", () => {
  const state = createKitchenReadyState();
  const started = startKitchenRun(state, "STEW", {
    currentPattern: ["up"],
    seed: 1,
    successPoints: 50,
  });
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const result = submitKitchenPatternInput(started.next, "down");

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.accepted, false);
  assert.equal(result.kitchen.successPoints, 35);
  assert.equal(result.failed, false);
});

test("Kitchen correct pattern input progresses the pattern", () => {
  const state = createKitchenReadyState();
  const started = startKitchenRun(state, "STEW", {
    currentPattern: ["up", "down"],
    seed: 1,
    successPoints: 50,
  });
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const result = submitKitchenPatternInput(started.next, "up");

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.accepted, true);
  assert.equal(result.patternCompleted, false);
  assert.equal(result.kitchen.currentPatternProgress, 1);
  assert.equal(result.kitchen.successPoints, 50);
});

test("Kitchen successPoints reaching 0 fails and discards rewards", () => {
  const state = createKitchenReadyState();
  const started = startKitchenRun(state, "STEW", {
    currentPattern: ["up"],
    seed: 1,
    successPoints: 10,
  });
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const result = submitKitchenPatternInput(started.next, "left");

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.failed, true);
  assert.equal(result.next.miniGames.activeRun, null);
  assert.equal(result.next.miniGames.lastRun?.status, "failed");
  assert.equal(result.next.inventory.items.length, state.inventory.items.length);
});

test("Kitchen finalize with success points commits a consumable reward", () => {
  const state = createKitchenReadyState();
  const started = startKitchenRun(state, "STEW", { seed: 1, successPoints: 80 });
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const finalized = finalizeKitchenRun(started.next);

  assert.equal(finalized.ok, true);
  if (!finalized.ok) return;
  assert.equal(finalized.next.miniGames.activeRun, null);
  assert.equal(finalized.next.miniGames.lastRun?.status, "success");
  assert.equal(finalized.itemRewardsCommitted.length, 1);
  assert.equal(finalized.next.inventory.items.length, state.inventory.items.length + 1);
  assert.equal(finalized.next.inventory.items.at(-1)?.id, "food_stew");
});

test("Kitchen reward carries quality", () => {
  const state = createKitchenReadyState();
  const started = startKitchenRun(state, "SALAD", { seed: 1, successPoints: 37 });
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const finalized = finalizeKitchenRun(started.next);

  assert.equal(finalized.ok, true);
  if (!finalized.ok) return;
  assert.equal(finalized.quality, 37);
  assert.equal(finalized.itemRewardsCommitted[0]?.quality, 37);
  const reward = finalized.next.inventory.items.at(-1);
  assert.equal(reward?.id, "food_salad");
  assert.equal(reward && !("slot" in reward) ? reward.quality : undefined, 37);
});

test("old saves migrate safely with Kitchen mini-game defaults", () => {
  const savedAt = 1_000;
  const oldState: any = createInitialGameState({ nowMs: savedAt });
  oldState.miniGames = {
    activeRun: {
      id: "old-kitchen-run",
      kind: "kitchen",
      status: "running",
      startedAt: savedAt,
      worldEnergyCost: 10,
      consumedCosts: {
        worldEnergy: 10,
        resources: { MEAT: 2, WATER: 1 },
      },
      temporaryRewards: {},
      runResources: {
        successPoints: 50,
        successPointsMax: 100,
      },
      kitchen: {
        recipe: KITCHEN_RECIPES[0],
        successPoints: 50,
        currentPattern: ["up"],
        currentPatternProgress: 0,
        correctStreak: 0,
        completedPatterns: 0,
        seed: 1,
      },
    },
    lastRun: null,
  };

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

    assert.equal(loaded.state.miniGames.activeRun?.kind, "kitchen");
    assert.deepEqual(loaded.state.miniGames.activeRun?.temporaryItemRewards, []);
  } finally {
    Date.now = previousDateNow;
    globalThis.localStorage = previousLocalStorage;
  }
});
