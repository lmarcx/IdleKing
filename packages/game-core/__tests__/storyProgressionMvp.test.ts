import test from "node:test";
import assert from "node:assert/strict";

import {
  canEnterDungeon,
  completeDungeon,
  completeStoryEvent,
  getAvailableChapters,
  getAvailableDungeons,
  getStoryBossDefinition,
  getStoryDungeonDefinition,
  getStoryDungeonLockReasons,
  STORY_CHAPTER_REGISTRY,
  STORY_DUNGEON_REGISTRY,
  validateStoryProgressionRegistry,
  type StoryDungeonDefinition,
} from "../story/progressionMvp.js";
import { createInitialGameState, type GameState } from "../game/state.js";
import { getCurrencyBalance } from "../currencies/index.js";
import { getCanonicalResourceQuantity } from "../resources/index.js";

function withWorldLevel(state: GameState, worldLevel: number): GameState {
  return {
    ...state,
    progression: {
      ...state.progression,
      worldLevel,
    },
  };
}

function withStoryFlags(state: GameState, flags: readonly string[]): GameState {
  return {
    ...state,
    story: {
      ...state.story,
      completedEvents: new Set([...state.story.completedEvents, ...flags]),
    },
  };
}

test("Prologue is available at the start and Chapter I is locked until Prologue completion", () => {
  const state = createInitialGameState();
  const available = getAvailableChapters(state).map((chapter) => chapter.chapterId);

  assert.deepEqual(available, ["prologue"]);
  assert.equal(canEnterDungeon(state, "prologue_wastelands"), true);
  assert.equal(canEnterDungeon(state, "funeral_mausoleum"), false);

  const completed = completeDungeon(state, "prologue_wastelands");
  assert.equal(completed.ok, true);
  if (!completed.ok) return;

  const nextAvailable = getAvailableChapters(completed.next).map((chapter) => chapter.chapterId);
  assert.ok(nextAvailable.includes("chapter_i_funebre"));
  assert.equal(completed.next.story.completedEvents.has("kingdom_discovered"), true);
  assert.equal(completed.next.story.completedEvents.has("prologue_complete"), true);
  assert.equal(completed.next.story.completedEvents.has("dark_amalgam"), true);
});

test("Chapter II is locked until Chapter I flags and required WorldLevel are reached", () => {
  let state = createInitialGameState();
  state = completeDungeon(state, "prologue_wastelands").next;
  state = completeDungeon(state, "funeral_mausoleum").next;
  state = completeDungeon(state, "ashen_peak").next;

  assert.equal(state.story.completedEvents.has("chapter_i_complete"), true);
  assert.equal(getAvailableChapters(state).some((chapter) => chapter.chapterId === "chapter_ii_glaciaire"), false);
  assert.equal(canEnterDungeon(state, "frozen_river"), false);

  const worldReady = withWorldLevel(state, 5);
  assert.equal(getAvailableChapters(worldReady).some((chapter) => chapter.chapterId === "chapter_ii_glaciaire"), true);
  assert.equal(canEnterDungeon(worldReady, "frozen_river"), true);
});

test("canEnterDungeon fails on missing storyFlag and insufficient WorldLevel only", () => {
  const state = createInitialGameState();
  assert.equal(canEnterDungeon(state, "funeral_mausoleum"), false);

  const missingWorldLevel = withStoryFlags(state, ["chapter_i_complete"]);
  assert.equal(canEnterDungeon(missingWorldLevel, "frozen_river"), false);

  const storyAndWorldReady = withWorldLevel(missingWorldLevel, 5);
  assert.equal(canEnterDungeon(storyAndWorldReady, "frozen_river"), true);
});

test("canEnterDungeon does not gate on POWER or PlayerLevel", () => {
  const state = {
    ...withWorldLevel(withStoryFlags(createInitialGameState(), ["chapter_i_complete"]), 5),
    progression: {
      ...withWorldLevel(createInitialGameState(), 5).progression,
      playerLevel: 1,
      worldLevel: 5,
    },
    power: 0,
    equipmentPower: 0,
  } as GameState & { power: number; equipmentPower: number };

  assert.equal(canEnterDungeon(state, "frozen_river"), true);
  assert.equal(getAvailableDungeons(state).some((dungeon) => dungeon.id === "frozen_river"), true);
});

test("first clear grants unique rewards and replay removes unique rewards", () => {
  const state = createInitialGameState();

  const first = completeDungeon(state, "prologue_wastelands");
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.firstClear, true);
  assert.equal(first.next.story.firstClearFlags.has("first_clear:prologue_wastelands"), true);
  assert.equal(getCurrencyBalance(first.next.wallet, "BOSS_TOKEN"), 1);
  assert.equal(getCanonicalResourceQuantity(first.next.resources, "dark_amalgam_core"), 1);

  const replay = completeDungeon(first.next, "prologue_wastelands");
  assert.equal(replay.ok, true);
  if (!replay.ok) return;
  assert.equal(replay.firstClear, false);
  assert.equal(getCurrencyBalance(replay.next.wallet, "BOSS_TOKEN"), 1);
  assert.equal(getCurrencyBalance(replay.next.wallet, "ECU"), 5);
  assert.equal(getCanonicalResourceQuantity(replay.next.resources, "dark_amalgam_core"), 1);
  assert.equal(getCanonicalResourceQuantity(replay.next.resources, "shadow_residue"), 2);
});

test("completeStoryEvent records immutable story flags", () => {
  const state = createInitialGameState();
  const next = completeStoryEvent(state, "custom_story_flag");

  assert.equal(state.story.completedEvents.has("custom_story_flag"), false);
  assert.equal(next.story.completedEvents.has("custom_story_flag"), true);
});

test("Gouffre Royal is a boss dungeon with Seigneur de la Pluie Dechu", () => {
  const dungeon = getStoryDungeonDefinition("royal_abyss");
  assert.ok(dungeon);
  assert.equal(dungeon.title, "Gouffre Royal");
  assert.equal(dungeon.era, "era_funebre");
  assert.equal(dungeon.chapterId, "chapter_ii_glaciaire");
  assert.equal(dungeon.type, "boss");
  assert.equal(dungeon.replayable, true);
  assert.equal(dungeon.bossId, "fallen_rain_lord");

  const boss = getStoryBossDefinition("fallen_rain_lord");
  assert.ok(boss);
  assert.equal(boss.dungeonId, "royal_abyss");
  assert.equal(boss.chapterId, "chapter_ii_glaciaire");
});

test("story dungeon lock reasons expose missing Story and WorldLevel gates for UI", () => {
  const state = createInitialGameState();
  const reasons = getStoryDungeonLockReasons(state, "royal_abyss");

  assert.deepEqual(
    reasons.map((reason) => reason.kind),
    ["worldLevel", "storyFlag"],
  );
  assert.ok(reasons.some((reason) => reason.kind === "worldLevel" && reason.required === 5 && reason.current === 1));
  assert.ok(reasons.some((reason) => reason.kind === "storyFlag" && reason.flag === "reflection_cavern_cleared"));
});

test("Allaeva has two phases in the MVP boss registry", () => {
  const boss = getStoryBossDefinition("allaeva");

  assert.ok(boss);
  assert.equal(boss.phases, 2);
});

test("MVP boss phase counts are locked", () => {
  const archmage = getStoryBossDefinition("corrupted_archmage");
  const allaeva = getStoryBossDefinition("allaeva");
  const frostAmalgam = getStoryBossDefinition("frost_amalgam");

  assert.ok(archmage);
  assert.ok(allaeva);
  assert.ok(frostAmalgam);

  assert.equal(archmage.phases, 2);
  assert.equal(allaeva.phases, 2);
  assert.equal(frostAmalgam.phases, 1);
});

test("MVP story registry has no active Chapter III content", () => {
  assert.deepEqual(STORY_CHAPTER_REGISTRY.map((chapter) => chapter.chapterId), [
    "prologue",
    "chapter_i_funebre",
    "chapter_ii_glaciaire",
  ]);
  assert.equal(STORY_DUNGEON_REGISTRY.some((dungeon) => !["prologue", "chapter_i_funebre", "chapter_ii_glaciaire"].includes(dungeon.chapterId)), false);
  assert.equal(STORY_DUNGEON_REGISTRY.some((dungeon) => /chapter_iii|ch03|nebuleux/i.test(dungeon.id)), false);
});

test("story progression registry validation rejects non-MVP gates and bad refs", () => {
  const baseDungeon = STORY_DUNGEON_REGISTRY[0];

  assert.doesNotThrow(() => validateStoryProgressionRegistry());
  assert.throws(
    () =>
      validateStoryProgressionRegistry(undefined, [
        { ...baseDungeon, unlockConditions: { ...baseDungeon.unlockConditions, requiredPower: 999 } as any },
      ]),
    /Invalid dungeon .* gating key/,
  );
  assert.throws(
    () =>
      validateStoryProgressionRegistry(undefined, [
        { ...baseDungeon, unlockConditions: { ...baseDungeon.unlockConditions, minPlayerLevel: 10 } as any },
      ]),
    /Invalid dungeon .* gating key/,
  );
  assert.throws(
    () =>
      validateStoryProgressionRegistry(undefined, [
        { ...baseDungeon, id: "ch03_forbidden", chapterId: "chapter_iii" as any } satisfies StoryDungeonDefinition,
      ]),
    /Chapter III\+ dungeon is active/,
  );
});
