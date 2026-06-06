import assert from "node:assert/strict";
import test from "node:test";

import { forumRankUpWorld } from "../game/forumActions.js";
import { createInitialGameState, type GameState } from "../game/state.js";
import { loadGameWithReport, saveGame } from "../game/save.js";
import { generateEquipmentItem } from "../equipment/index.js";
import { getCurrencyBalance } from "../currencies/index.js";
import { canEnterDungeon, completeDungeon } from "../story/progressionMvp.js";
import {
  isEraPlayable,
  isEraUnlocked,
  unlockEraAtTimeGate,
} from "../specialItems/index.js";
import {
  applyWorldResourceRegenForElapsed,
  maxWorldEnergy,
  maxWorldHp,
} from "../world/worldResources.js";
import { addResourceToStock, getCanonicalResourceQuantity } from "../resources/index.js";

const SAVE_KEY = "idle_king_save_v1";

function withMockLocalStorage<T>(run: (store: Map<string, string>) => T): T {
  const store = new Map<string, string>();
  const previousLocalStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
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
    },
  });

  try {
    return run(store);
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: previousLocalStorage,
    });
  }
}

function oldNoisySaveState(savedAt: number): any {
  const state: any = createInitialGameState({ nowMs: savedAt });
  const legacyRing = generateEquipmentItem({ slot: "ring", itemLevel: 1, id: "legacy-ring", skillId: "SK-001" });
  state.inventory.items = [legacyRing];
  state.equipment = {
    totalResonance: 999,
    effectSlots: 99,
    equipped: {
      ring: legacyRing.id,
    },
  };
  state.resources = {
    iron_ore: 5_000,
    quartz: 3,
    fragment_du_temps: 99,
    kaleidoscope: 1,
  };
  state.wallet = {
    balances: {
      ECU: 10,
      BOSS_TOKEN: 1,
      DUEL_TOKEN: 999,
    },
  };
  state.story = {
    completedChapters: [],
    completedLevels: [],
    completedEvents: [],
    discoveredEvents: [],
    unlocked: [],
    defeatedBossIds: ["dark_amalgam"],
  };
  state.buildings = {
    ...state.buildings,
    timeGate: undefined,
    worldGate: {
      active: true,
      built: true,
      level: 1,
      maxLevel: 50,
      status: "built",
      unlocked: true,
    },
  };
  state.skills = {
    ...state.skills,
    skillPoints: 777,
  };
  delete state.specialItems;
  delete state.effectSets;
  delete state.bank;
  delete state.world;
  delete state.miniGames;
  state.totalResonance = 123;
  state.effectSlots = 12;
  state.power = 999_999;
  state.aggregatedStats = { dps: 99, mitigation: 99 };
  state.combatRuntime = { hp: 1, mana: 1, stamina: 1 };
  state.dps = 99;
  state.mitigation = 99;
  return state;
}

function writeOldSave(store: Map<string, string>, state: any, savedAt = 1_000): void {
  store.set(
    SAVE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      savedAt,
      state,
    }),
  );
}

function completeFirstClear(state: GameState, dungeonId: string): GameState {
  assert.equal(canEnterDungeon(state, dungeonId), true, `${dungeonId} should be enterable`);
  const result = completeDungeon(state, dungeonId);
  assert.equal(result.ok, true, `${dungeonId} should complete`);
  if (!result.ok) return state;
  return result.next;
}

function runMvpPlaythroughFromNormalizedState(state: GameState): GameState {
  let next = {
    ...state,
    progression: {
      ...state.progression,
      worldLevel: 1,
    },
  };
  next = completeFirstClear(next, "prologue_wastelands");
  next = completeFirstClear(next, "funeral_mausoleum");
  next = completeFirstClear(next, "ashen_peak");
  next = {
    ...next,
    progression: {
      ...next.progression,
      worldLevel: 5,
    },
  };
  const era = unlockEraAtTimeGate(next, "era_glaciaire");
  assert.equal(era.ok, true);
  if (!era.ok) return next;
  next = era.next;
  for (const dungeonId of ["frozen_river", "reflection_cavern", "royal_abyss", "arathas_academy", "frost_source"] as const) {
    next = completeFirstClear(next, dungeonId);
  }
  return next;
}

test("old save normalizes missing MVP slices, legacy ring, worldGate, and story fields without throw", () => {
  withMockLocalStorage((store) => {
    writeOldSave(store, oldNoisySaveState(1_000));

    const loaded = loadGameWithReport();

    assert.ok(loaded);
    if (!loaded) return;
    const state = loaded.state;
    assert.equal(state.progression.playerLevel, 1);
    assert.equal(state.progression.playerXp, 0);
    assert.equal(state.progression.worldLevel, 1);
    assert.equal(state.progression.worldWxp, 0);
    assert.equal(getCurrencyBalance(state.wallet, "ECU"), 10);
    assert.equal(getCurrencyBalance(state.wallet, "BOSS_TOKEN"), 1);
    assert.equal(state.specialItems.kaleidoscopeOwned, false);
    assert.equal(state.specialItems.fragmentDuTemps, 0);
    assert.deepEqual(state.specialItems.unlockedEras, ["era_funebre"]);
    assert.deepEqual(state.effectSets.unlockedEffectSetIds, []);
    assert.deepEqual(state.effectSets.slottedEffects, []);
    assert.equal(state.story.completedDungeonIds.size, 0);
    assert.equal(state.story.firstClearFlags.size, 0);
    assert.equal(state.story.completedEvents.has("dark_amalgam"), true);
    assert.equal(state.story.completedEvents.has("boss:dark_amalgam:defeated"), true);
    assert.equal(state.buildings.timeGate.built, true);
    assert.equal(state.buildings.timeGate.unlocked, true);
    assert.equal(state.equipment.equipped.ring, null);
    assert.deepEqual(state.equipment.equipped.rings, ["legacy-ring", null, null, null, null]);
  });
});

test("save normalization strips derived and critical transient fields", () => {
  withMockLocalStorage((store) => {
    saveGame(oldNoisySaveState(1_000) as GameState);
    const raw = store.get(SAVE_KEY);
    assert.ok(raw);
    if (!raw) return;
    const serialized = JSON.stringify(JSON.parse(raw).state);

    for (const forbidden of [
      "totalResonance",
      "effectSlots",
      "aggregatedStats",
      "combatRuntime",
      "mitigation",
      "dps",
      "DUEL_TOKEN",
    ]) {
      assert.equal(serialized.includes(forbidden), false, `${forbidden} should not be persisted`);
    }
    assert.equal(Object.prototype.hasOwnProperty.call(JSON.parse(raw).state, "power"), false);
  });
});

test("normalized legacy save can traverse the MVP playthrough path", () => {
  withMockLocalStorage((store) => {
    const oldState = oldNoisySaveState(1_000);
    oldState.story.defeatedBossIds = [];
    writeOldSave(store, oldState);
    const loaded = loadGameWithReport();
    assert.ok(loaded);
    if (!loaded) return;

    const finalState = runMvpPlaythroughFromNormalizedState(loaded.state);

    assert.equal(finalState.story.completedEvents.has("chapter_ii_complete"), true);
    assert.equal(finalState.story.completedEvents.has("time_gate_phase_8_ready"), true);
    assert.equal(isEraUnlocked(finalState, "era_glaciaire"), true);
    assert.equal(isEraPlayable("era_deluge"), false);
  });
});

test("save hardening prevents minimal soft-locks after normalization", () => {
  withMockLocalStorage((store) => {
    writeOldSave(store, oldNoisySaveState(1_000));
    const loaded = loadGameWithReport();
    assert.ok(loaded);
    if (!loaded) return;
    const state = loaded.state;

    const regened = applyWorldResourceRegenForElapsed({
      energy: { ...state.world.energy, current: 0, lastRegenAt: 1_000 },
      hp: { ...state.world.hp, current: 0, lastRegenAt: 1_000 },
    }, state.progression.worldLevel, 10 * 60_000);
    assert.ok(regened.energy.current > 0);
    assert.ok(regened.hp.current > 0);
    assert.equal(regened.energy.max, maxWorldEnergy(state.progression.worldLevel));
    assert.equal(regened.hp.max, maxWorldHp(state.progression.worldLevel));

    const forum = forumRankUpWorld(state);
    assert.equal(forum.rankedUp, false);
    assert.equal(forum.reason, "FORUM_LOCKED");

    const timeGate = unlockEraAtTimeGate(state, "era_glaciaire");
    assert.equal(timeGate.ok, false);
    if (timeGate.ok) return;
    assert.ok(["KALEIDOSCOPE_REQUIRED", "FRAGMENT_DU_TEMPS_REQUIRED", "STORY_FLAG_MISSING", "WORLD_LEVEL_TOO_LOW"].includes(timeGate.reason));

    const first = completeDungeon(state, "prologue_wastelands");
    assert.equal(first.ok, true);
    if (!first.ok) return;
    const replay = completeDungeon(first.next, "prologue_wastelands");
    assert.equal(replay.ok, true);
    if (!replay.ok) return;
    assert.equal(replay.firstClear, false);
  });
});

test("resourceStock is clamped to stack max 999 during save load normalization", () => {
  withMockLocalStorage((store) => {
    const oldState = oldNoisySaveState(1_000);
    oldState.resources = addResourceToStock({}, "iron_ore", 10_000);
    writeOldSave(store, oldState);

    const loaded = loadGameWithReport();

    assert.ok(loaded);
    if (!loaded) return;
    assert.equal(getCanonicalResourceQuantity(loaded.state.resources, "iron_ore"), 999);
  });
});
