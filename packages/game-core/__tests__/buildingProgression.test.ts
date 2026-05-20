import test from "node:test";
import assert from "node:assert/strict";

import { completeChapterAction } from "../game/actions.js";
import { buildBuilding } from "../game/buildingBuildActions.js";
import { forumRankUpWorld } from "../game/forumActions.js";
import { loadGameWithReport } from "../game/save.js";
import { createInitialGameState } from "../game/state.js";
import {
  getBuildingUpgradeCost,
  refreshAllBuildingStatuses,
  upgradeBuilding,
} from "../building/progression.js";
import { getBuildCost } from "../building/buildCosts.js";
import { wxpNext } from "../progression/worldXp.js";
import { addQty, getQty } from "../resources/types.js";

function addStock(state: ReturnType<typeof createInitialGameState>, stock: Record<string, number>) {
  return {
    ...state,
    resources: Object.entries(stock).reduce(
      (resources, [resourceId, amount]) => addQty(resources, resourceId as any, amount),
      state.resources,
    ),
  };
}

test("canonical building migration fills status, levels, and new building placeholders", () => {
  const savedAt = 1_000;
  const oldState: any = createInitialGameState({ nowMs: savedAt });
  oldState.progression.worldLevel = 3;
  oldState.buildings.forum = {
    active: true,
    built: true,
    level: 8,
    unlocked: true,
  };
  delete oldState.buildings.market;
  delete oldState.buildings.worldGate;
  delete oldState.buildings.bank;

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

    assert.equal(loaded.state.buildings.forum.level, 3);
    assert.equal(loaded.state.buildings.forum.status, "built");
    assert.equal(loaded.state.buildings.market.status, "unlocked");
    assert.equal(loaded.state.buildings.worldGate.status, "unlocked");
    assert.equal(loaded.state.buildings.bank.status, "unlocked");
  } finally {
    Date.now = previousDateNow;
    globalThis.localStorage = previousLocalStorage;
  }
});

test("build action moves an unlocked building to built level 1", () => {
  let state = completeChapterAction(createInitialGameState(), 1).next;
  state = addStock(state, getBuildCost("FORUM") as Record<string, number>);

  const result = buildBuilding(state, "FORUM");

  assert.equal(result.ok, true);
  assert.equal(result.next.buildings.forum.built, true);
  assert.equal(result.next.buildings.forum.active, true);
  assert.equal(result.next.buildings.forum.level, 1);
  assert.equal(result.next.buildings.forum.status, "built");
});

test("upgrade action increases level and respects the WorldLevel cap", () => {
  let state = completeChapterAction(createInitialGameState(), 1).next;
  state = addStock(state, getBuildCost("FORUM") as Record<string, number>);
  const built = buildBuilding(state, "FORUM");
  assert.equal(built.ok, true);

  state = {
    ...built.next,
    progression: {
      ...built.next.progression,
      worldLevel: 2,
    },
  };
  state = refreshAllBuildingStatuses(state);
  state = addStock(state, getBuildingUpgradeCost("FORUM", 1) as Record<string, number>);

  const result = upgradeBuilding(state, "FORUM");

  assert.equal(result.ok, true);
  assert.equal(result.next.buildings.forum.level, 2);
  assert.equal(result.next.buildings.forum.status, "built");
  assert.equal(getQty(result.next.resources, "WOOD"), 0);
});

test("upgrade refuses to exceed WorldLevel", () => {
  const base = createInitialGameState();
  const state = refreshAllBuildingStatuses({
    ...base,
    progression: {
      ...base.progression,
      worldLevel: 2,
    },
    buildings: {
      ...base.buildings,
      forge: {
        ...base.buildings.forge,
        active: true,
        built: true,
        level: 2,
        unlocked: true,
      },
    },
  });

  const result = upgradeBuilding(state, "FORGE");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "WORLD_LEVEL_TOO_LOW");
  assert.equal(result.next.buildings.forge.level, 2);
});

test("maxed status is applied at canonical max level", () => {
  const base = createInitialGameState();
  const state = refreshAllBuildingStatuses({
    ...base,
    progression: {
      ...base.progression,
      worldLevel: 50,
    },
    buildings: {
      ...base.buildings,
      bank: {
        ...base.buildings.bank,
        active: true,
        built: true,
        level: 50,
        unlocked: true,
      },
    },
  });

  assert.equal(state.buildings.bank.level, 50);
  assert.equal(state.buildings.bank.status, "maxed");

  const result = upgradeBuilding(state, "BANK");
  assert.equal(result.ok, false);
  assert.equal(result.reason, "AT_MAX_LEVEL");
});

test("locked, unlocked, built, and upgradeable transitions stay canonical", () => {
  let state = createInitialGameState();
  assert.equal(state.buildings.forum.status, "locked");

  state = completeChapterAction(state, 1).next;
  assert.equal(state.buildings.forum.status, "unlocked");

  state = addStock(state, getBuildCost("FORUM") as Record<string, number>);
  const built = buildBuilding(state, "FORUM");
  assert.equal(built.ok, true);
  state = built.next;
  assert.equal(state.buildings.forum.status, "built");

  const ranked = forumRankUpWorld({
    ...state,
    progression: {
      ...state.progression,
      worldWxp: wxpNext(1),
    },
  });

  assert.equal(ranked.rankedUp, true);
  assert.equal(ranked.next.buildings.forum.status, "upgradeable");
});
