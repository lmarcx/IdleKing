import test from "node:test";
import assert from "node:assert/strict";

import { buildBuilding } from "../game/buildingBuildActions.js";
import { completeChapterAction } from "../game/actions.js";
import { createInitialGameState } from "../game/state.js";
import { applyGameXpGain } from "../game/playerXpActions.js";
import { applyOfflineProgress } from "../game/offlineProgress.js";
import { forumRankUpWorld } from "../game/forumActions.js";
import { convertTempleGlobalXp } from "../game/templeActions.js";
import { loadGameWithReport } from "../game/save.js";
import {
  createDefaultWalletState,
  getCurrencyBalance,
  grantCurrency,
  spendCurrency,
} from "../currencies/index.js";
import { addQty, getQty } from "../resources/types.js";
import { wxpNext } from "../progression/worldXp.js";
import {
  applyWorldResourceRegenForElapsed,
  createDefaultWorldResourcesState,
  maxWorldEnergy,
  maxWorldHp,
  worldEnergyRegenPerMinute,
  worldHpRegenPerMinute,
} from "../world/worldResources.js";

test("world hp and energy formulas scale from world level", () => {
  assert.equal(maxWorldEnergy(1), 100);
  assert.equal(maxWorldEnergy(3), 120);
  assert.equal(maxWorldHp(1), 100);
  assert.equal(maxWorldHp(3), 150);
  assert.equal(worldEnergyRegenPerMinute(3), 1.2);
  assert.equal(worldHpRegenPerMinute(3), 0.6);
});

test("world resource regen caps at max", () => {
  const world = createDefaultWorldResourcesState(1, 1_000);
  const depleted = {
    energy: { ...world.energy, current: 95 },
    hp: { ...world.hp, current: 98 },
  };

  const regened = applyWorldResourceRegenForElapsed(depleted, 1, 10 * 60000);

  assert.equal(regened.energy.current, maxWorldEnergy(1));
  assert.equal(regened.hp.current, maxWorldHp(1));
  assert.equal(regened.energy.lastRegenAt, 601_000);
  assert.equal(regened.hp.lastRegenAt, 601_000);
});

test("offline progress regenerates world hp and energy", () => {
  const state = createInitialGameState({ nowMs: 1_000 });
  const depleted = {
    ...state,
    world: {
      energy: { ...state.world.energy, current: 0, lastRegenAt: 1_000 },
      hp: { ...state.world.hp, current: 0, lastRegenAt: 1_000 },
    },
  };

  const result = applyOfflineProgress(depleted, 10);

  assert.equal(result.next.world.energy.current, 10);
  assert.equal(result.next.world.hp.current, 5);
  assert.equal(result.next.world.energy.lastRegenAt, 601_000);
  assert.equal(result.next.world.hp.lastRegenAt, 601_000);
});

test("Forum world rank-up refills world hp and energy at the new level", () => {
  let state = createInitialGameState({ nowMs: 1_000 });
  state = completeChapterAction(state, 1).next;
  state = {
    ...state,
    resources: {
      WOOD: 20,
      STONE: 20,
      WATER: 10,
      GOLD: 10,
    },
  };

  const built = buildBuilding(state, "FORUM");
  assert.equal(built.ok, true);

  const ready = {
    ...built.next,
    progression: {
      ...built.next.progression,
      worldWxp: wxpNext(1),
    },
    world: {
      energy: { ...built.next.world.energy, current: 0 },
      hp: { ...built.next.world.hp, current: 0 },
    },
  };

  const ranked = forumRankUpWorld(ready);

  assert.equal(ranked.rankedUp, true);
  assert.equal(ranked.next.progression.worldLevel, 2);
  assert.equal(ranked.next.world.energy.current, maxWorldEnergy(2));
  assert.equal(ranked.next.world.hp.current, maxWorldHp(2));
});

test("Temple converts XP_GLOBAL to WXP at 1:1 without auto rank-up", () => {
  let state = createInitialGameState({ nowMs: 1_000 });
  state = {
    ...state,
    resources: addQty(state.resources, "XP_GLOBAL", wxpNext(1) + 5),
    buildings: {
      ...state.buildings,
      temple: {
        ...state.buildings.temple,
        unlocked: true,
        built: true,
        active: true,
      },
    },
  };

  const result = convertTempleGlobalXp(state, "worldWxp", wxpNext(1) + 5);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.next.progression.worldLevel, 1);
  assert.equal(result.next.progression.worldWxp, wxpNext(1) + 5);
  assert.equal(getQty(result.next.resources, "XP_GLOBAL"), 0);
});

test("generic XP gain banks WXP without auto world rank-up", () => {
  const state = createInitialGameState({ nowMs: 1_000 });
  const result = applyGameXpGain(state, { xp: 0, wxp: wxpNext(1) + 5 });

  assert.equal(result.next.progression.worldLevel, 1);
  assert.equal(result.next.progression.worldWxp, wxpNext(1) + 5);
});

test("story chapter completion does not directly grant WXP", () => {
  const state = createInitialGameState({ nowMs: 1_000 });
  const result = completeChapterAction(state, 1);

  assert.equal(result.gainedXp, 2500);
  assert.equal(result.gainedWxp, 0);
  assert.equal(result.next.progression.worldWxp, 0);
});

test("ECU wallet grants and spends without touching resources", () => {
  const wallet = grantCurrency(createDefaultWalletState(), "ECU", 25);
  assert.equal(getCurrencyBalance(wallet, "ECU"), 25);

  const spent = spendCurrency(wallet, "ECU", 10);
  assert.equal(spent.ok, true);
  assert.equal(getCurrencyBalance(spent.wallet, "ECU"), 15);

  const failed = spendCurrency(spent.wallet, "ECU", 99);
  assert.equal(failed.ok, false);
  assert.equal(getCurrencyBalance(failed.wallet, "ECU"), 15);
});

test("save migration fills world, wallet, building defaults, and revives story Sets", () => {
  const savedAt = 1_000;
  const oldState: any = createInitialGameState({ nowMs: savedAt });
  delete oldState.world;
  delete oldState.wallet;
  oldState.story = {
    completedChapters: [1],
    completedLevels: ["ch01-lv01"],
    discoveredEvents: ["ch01-lv01.event.1"],
    completedEvents: ["ch01-lv01.event.1"],
    unlocked: ["FORUM"],
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

    assert.equal(getCurrencyBalance(loaded.state.wallet, "ECU"), 0);
    assert.equal(loaded.state.world.energy.current, maxWorldEnergy(1));
    assert.equal(loaded.state.world.hp.current, maxWorldHp(1));
    assert.equal(loaded.state.buildings.cornucopia.built, true);
    assert.equal(loaded.state.story.completedChapters.has(1), true);
    assert.equal(loaded.state.story.unlocked.has("FORUM"), true);
    assert.equal(loaded.state.story.discoveredEvents.has("ch01-lv01.event.1"), true);
  } finally {
    Date.now = previousDateNow;
    globalThis.localStorage = previousLocalStorage;
  }
});
