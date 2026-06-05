import assert from "node:assert/strict";
import test from "node:test";

import { getBuildCost } from "../building/buildCosts.js";
import { CANONICAL_BUILDING_IDS } from "../building/progression.js";
import { assertValidMvpContentGraph } from "../content/index.js";
import { getCurrencyBalance } from "../currencies/index.js";
import { EFFECT_SET_REGISTRY } from "../effectSets/index.js";
import { buildBuilding } from "../game/buildingBuildActions.js";
import { createInitialGameState, type GameState } from "../game/state.js";
import { getCanonicalResourceQuantity, getResourceDefinition } from "../resources/index.js";
import {
  ERA_REGISTRY,
  isEraPlayable,
  isEraUnlocked,
  unlockEraAtTimeGate,
} from "../specialItems/index.js";
import {
  canEnterDungeon,
  completeDungeon,
  getAvailableChapters,
  STORY_CHAPTER_REGISTRY,
  STORY_DUNGEON_REGISTRY,
} from "../story/progressionMvp.js";

const MVP_PLAYTHROUGH_DUNGEONS = [
  "prologue_wastelands",
  "funeral_mausoleum",
  "ashen_peak",
  "frozen_river",
  "reflection_cavern",
  "royal_abyss",
  "arathas_academy",
  "frost_source",
] as const;

const MVP_BOSSES = [
  "dark_amalgam",
  "dragon_shadow",
  "frost_amalgam",
  "fallen_rain_lord",
  "corrupted_archmage",
  "allaeva",
] as const;

function buildTimeGateWithRealHelper(state: GameState): GameState {
  const buildCost = getBuildCost("TIME_GATE");
  const result = buildBuilding(
    {
      ...state,
      resources: {
        ...state.resources,
        ...buildCost,
      },
    },
    "TIME_GATE",
  );

  assert.equal(result.ok, true);
  return result.next;
}

function withWorldLevelFixture(state: GameState, worldLevel: number): GameState {
  // Focused integration fixture: Phase 11 validates Story + WorldLevel gates,
  // but this playthrough is not testing Forum/Temple rank-up economics.
  return {
    ...state,
    progression: {
      ...state.progression,
      worldLevel,
    },
  };
}

function completeFirstClear(state: GameState, dungeonId: string): GameState {
  assert.equal(canEnterDungeon(state, dungeonId), true, `${dungeonId} should be enterable`);
  const result = completeDungeon(state, dungeonId);
  assert.equal(result.ok, true, `${dungeonId} should complete`);
  if (!result.ok) return state;
  assert.equal(result.firstClear, true, `${dungeonId} should be a first clear`);
  return result.next;
}

function assertBossDefeated(state: GameState, bossId: string): void {
  assert.equal(state.story.completedEvents.has(bossId), true, `${bossId} id event missing`);
  assert.equal(state.story.completedEvents.has(`boss:${bossId}:defeated`), true, `${bossId} defeated flag missing`);
}

function assertNoSpecialItemsInResourceStock(state: GameState): void {
  assert.equal(getResourceDefinition("fragment_du_temps"), undefined);
  assert.equal(getResourceDefinition("kaleidoscope"), undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(state.resources, "fragment_du_temps"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(state.resources, "kaleidoscope"), false);
}

test("full MVP playthrough succeeds from Prologue to Chapter II end", () => {
  assert.doesNotThrow(() => assertValidMvpContentGraph());

  let state = buildTimeGateWithRealHelper(createInitialGameState());
  assert.equal(state.buildings.timeGate.built, true);
  assert.deepEqual(getAvailableChapters(state).map((chapter) => chapter.chapterId), ["prologue"]);
  assert.equal((CANONICAL_BUILDING_IDS as readonly string[]).includes("WORLD_GATE"), false);

  state = completeFirstClear(state, "prologue_wastelands");
  assertBossDefeated(state, "dark_amalgam");
  assert.equal(state.story.completedEvents.has("kingdom_discovered"), true);
  assert.equal(state.story.completedEvents.has("prologue_complete"), true);
  assert.equal(state.specialItems.kaleidoscopeOwned, true);
  assert.equal(state.specialItems.fragmentDuTemps, 0);
  assert.equal(getCurrencyBalance(state.wallet, "BOSS_TOKEN"), 1);
  assert.equal(getCanonicalResourceQuantity(state.resources, "dark_amalgam_core"), 1);
  assertNoSpecialItemsInResourceStock(state);

  const replay = completeDungeon(state, "prologue_wastelands");
  assert.equal(replay.ok, true);
  if (!replay.ok) return;
  assert.equal(replay.firstClear, false);
  assert.equal(replay.next.specialItems.kaleidoscopeOwned, true);
  assert.equal(replay.next.specialItems.fragmentDuTemps, 0);
  assert.equal(getCurrencyBalance(replay.next.wallet, "BOSS_TOKEN"), 1);
  assert.equal(getCanonicalResourceQuantity(replay.next.resources, "dark_amalgam_core"), 1);
  state = replay.next;

  assert.ok(getAvailableChapters(state).some((chapter) => chapter.chapterId === "chapter_i_funebre"));
  state = completeFirstClear(state, "funeral_mausoleum");
  state = completeFirstClear(state, "ashen_peak");
  assertBossDefeated(state, "dragon_shadow");
  assert.equal(state.story.completedEvents.has("chapter_i_complete"), true);
  assert.equal(state.story.completedEvents.has("kaleidoscope_chapter_i_component_ready"), true);
  assert.equal(state.specialItems.fragmentDuTemps, 1);

  state = withWorldLevelFixture(state, 5);
  const unlockGlacial = unlockEraAtTimeGate(state, "era_glaciaire");
  assert.equal(unlockGlacial.ok, true);
  if (!unlockGlacial.ok) return;
  assert.equal(unlockGlacial.fragmentDuTempsSpent, 1);
  assert.equal(unlockGlacial.next.specialItems.fragmentDuTemps, 0);
  assert.equal(isEraUnlocked(unlockGlacial.next, "era_glaciaire"), true);
  state = unlockGlacial.next;

  assert.ok(getAvailableChapters(state).some((chapter) => chapter.chapterId === "chapter_ii_glaciaire"));
  for (const dungeonId of [
    "frozen_river",
    "reflection_cavern",
    "royal_abyss",
    "arathas_academy",
    "frost_source",
  ] as const) {
    state = completeFirstClear(state, dungeonId);
  }

  for (const bossId of MVP_BOSSES) assertBossDefeated(state, bossId);
  assert.equal(state.story.completedEvents.has("chapter_ii_complete"), true);
  assert.equal(state.story.completedEvents.has("time_gate_phase_8_ready"), true);
  assert.equal(state.specialItems.fragmentDuTemps, 1);
  assert.equal(isEraPlayable("era_deluge"), false);
  assert.equal(ERA_REGISTRY.find((era) => era.id === "era_deluge")?.teaser, true);
  assert.equal(unlockEraAtTimeGate(state, "era_deluge").ok, false);
  assertNoSpecialItemsInResourceStock(state);
});

test("MVP playthrough graph stays scoped to active Prologue through Chapter II content", () => {
  assert.deepEqual(MVP_PLAYTHROUGH_DUNGEONS, [
    "prologue_wastelands",
    "funeral_mausoleum",
    "ashen_peak",
    "frozen_river",
    "reflection_cavern",
    "royal_abyss",
    "arathas_academy",
    "frost_source",
  ]);
  for (const dungeonId of MVP_PLAYTHROUGH_DUNGEONS) {
    assert.ok(STORY_DUNGEON_REGISTRY.some((dungeon) => dungeon.id === dungeonId));
  }
  assert.equal(STORY_CHAPTER_REGISTRY.some((chapter) => String(chapter.chapterId).includes("iii")), false);
  assert.equal(EFFECT_SET_REGISTRY.length, 5);
});

test("Story gates ignore POWER and PlayerLevel during the MVP playthrough", () => {
  let state = buildTimeGateWithRealHelper(createInitialGameState());
  state = completeFirstClear(state, "prologue_wastelands");
  state = completeFirstClear(state, "funeral_mausoleum");
  state = completeFirstClear(state, "ashen_peak");
  state = withWorldLevelFixture(state, 5);
  state = unlockEraAtTimeGate(state, "era_glaciaire").next;

  const noisyState = {
    ...state,
    progression: {
      ...state.progression,
      playerLevel: 1,
      worldLevel: 5,
    },
    power: 0,
    equipmentPower: 0,
  } as GameState & { power: number; equipmentPower: number };

  assert.equal(canEnterDungeon(noisyState, "frozen_river"), true);
});
