import test from "node:test";
import assert from "node:assert/strict";

import { tickAllBuildings } from "../building/tick.js";
import { createInitialGameState } from "../game/state.js";
import { loadGameWithReport } from "../game/save.js";
import { addQty, getQty } from "../resources/types.js";

test("tickAllBuildings ignores retired Farm, Mine, and Temple passive allocations", () => {
  const initial = createInitialGameState();
  const state = {
    ...initial,
    buildings: {
      ...initial.buildings,
      farm: {
        ...initial.buildings.farm,
        unlocked: true,
        built: true,
        active: true,
        allocation: { WOOD: 5 },
      } as any,
      mine: {
        ...initial.buildings.mine,
        unlocked: true,
        built: true,
        active: true,
        allocation: { COPPER: 5 },
      } as any,
      temple: {
        ...initial.buildings.temple,
        unlocked: true,
        built: true,
        active: true,
        allocation: { XP_GLOBAL: 5 },
      } as any,
    },
  };
  const beforeStamina = state.villagers.list.map((villager) => villager.stamina);

  const result = tickAllBuildings(state, 10);

  assert.equal(getQty(result.next.resources, "WOOD"), 0);
  assert.equal(getQty(result.next.resources, "COPPER"), 0);
  assert.equal(getQty(result.next.resources, "XP_GLOBAL"), 0);
  assert.deepEqual(result.next.villagers.list.map((villager) => villager.stamina), beforeStamina);
  assert.deepEqual(result.logs, []);
});

test("save migration drops legacy passive allocation fields without losing player data", () => {
  const savedAt = 1_000;
  const oldState: any = {
    ...createInitialGameState({ nowMs: savedAt }),
    resources: addQty({}, "WOOD", 7),
  };
  oldState.buildings.farm = {
    ...oldState.buildings.farm,
    unlocked: true,
    built: true,
    active: true,
    allocation: { WOOD: 3 },
  };
  oldState.buildings.mine = {
    ...oldState.buildings.mine,
    unlocked: true,
    built: true,
    active: true,
    allocation: { COPPER: 2 },
  };
  oldState.buildings.temple = {
    ...oldState.buildings.temple,
    unlocked: true,
    built: true,
    active: true,
    allocation: { XP_GLOBAL: 1 },
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

    assert.equal(getQty(loaded.state.resources, "WOOD"), 7);
    assert.equal(loaded.state.buildings.farm.built, true);
    assert.equal(loaded.state.buildings.mine.built, true);
    assert.equal(loaded.state.buildings.temple.built, true);
    assert.equal("allocation" in (loaded.state.buildings.farm as any), false);
    assert.equal("allocation" in (loaded.state.buildings.mine as any), false);
    assert.equal("allocation" in (loaded.state.buildings.temple as any), false);
  } finally {
    Date.now = previousDateNow;
    globalThis.localStorage = previousLocalStorage;
  }
});
