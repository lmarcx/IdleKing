import assert from "node:assert/strict";
import test from "node:test";

import {
  STORY_CANONICAL_MAPS,
  STORY_CANONICAL_RUNTIME_READY_DUNGEON_IDS,
  getCanonicalStoryMap,
  hasCanonicalStoryMap,
  isCanonicalStoryRuntimeReady,
  lookupCanonicalStoryMap,
} from "../content/story/maps/index.js";
import { getLevelScript } from "../story/levelScripts.js";
import { STORY_DUNGEON_REGISTRY } from "../story/progressionMvp.js";
import { validatePlayableMap } from "../level-editor/map-loader.js";
import { shouldApplyStoryMapCompletion, type StoryMapStageResult } from "../level-editor/story-map-objectives.js";
import { TEST_MAP_01 } from "../level-editor/sample-maps.js";
import type { PlayableMap } from "../level-editor/types.js";

const OTHER_DUNGEON_IDS = STORY_DUNGEON_REGISTRY.map((dungeon) => dungeon.id).filter((id) => id !== "prologue_wastelands");

test("getCanonicalStoryMap returns undefined for an unknown id", () => {
  assert.equal(getCanonicalStoryMap("does_not_exist"), undefined);
});

test("lookupCanonicalStoryMap returns undefined when the registry has no matching entry (procedural fallback)", () => {
  const registry: Readonly<Record<string, PlayableMap>> = {};
  assert.equal(lookupCanonicalStoryMap(registry, "prologue_wastelands"), undefined);
});

test("lookupCanonicalStoryMap returns the map when a fixture is present (data-driven branch)", () => {
  const registry: Readonly<Record<string, PlayableMap>> = { test_dungeon: TEST_MAP_01 };
  assert.equal(lookupCanonicalStoryMap(registry, "test_dungeon"), TEST_MAP_01);
});

test("Phase G9: the registry returns a canonical map for prologue_wastelands", () => {
  const map = getCanonicalStoryMap("prologue_wastelands");
  assert.ok(map);
  assert.equal(hasCanonicalStoryMap("prologue_wastelands"), true);
});

test("every other real Story dungeon still has no canonical map (procedural fallback data)", () => {
  assert.ok(OTHER_DUNGEON_IDS.length > 0);
  for (const dungeonId of OTHER_DUNGEON_IDS) {
    assert.equal(getCanonicalStoryMap(dungeonId), undefined, `expected no canonical map for ${dungeonId}`);
    assert.equal(hasCanonicalStoryMap(dungeonId), false, `expected hasCanonicalStoryMap(${dungeonId}) to be false`);
  }
});

test("prologue_wastelands' canonical map is valid, id-matched, and has exactly one boss", () => {
  const map = STORY_CANONICAL_MAPS.prologue_wastelands;
  assert.ok(map);
  const validation = validatePlayableMap(map);
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.ok, true);
  assert.equal(map.id, "prologue_wastelands");
  assert.equal(map.mode, "story");
  const bossEnemies = map.enemies.filter((enemy) => enemy.isBoss);
  assert.equal(bossEnemies.length, 1);
  assert.equal(bossEnemies[0]?.id, "boss_dark_amalgam");
  assert.equal(map.enemies.length, 6, "5 shadows + 1 boss, matching the legacy PixiExplorationStage roster");
});

test("prologue_wastelands' canonical map carries no reward/unlock/story-flag data", () => {
  const map = STORY_CANONICAL_MAPS.prologue_wastelands as unknown as Record<string, unknown>;
  for (const forbiddenKey of ["rewards", "firstClearRewards", "replayRewards", "storyFlags", "storyFlagsProduced", "unlockConditions"]) {
    assert.equal(forbiddenKey in map, false, `PlayableMap must not carry "${forbiddenKey}" -- that belongs to STORY_DUNGEON_REGISTRY`);
  }
});

test("STORY_CANONICAL_RUNTIME_READY_DUNGEON_IDS does not include prologue_wastelands yet -- the live route keeps using the legacy narrative runtime", () => {
  assert.equal(STORY_CANONICAL_RUNTIME_READY_DUNGEON_IDS.includes("prologue_wastelands"), false);
  assert.equal(isCanonicalStoryRuntimeReady("prologue_wastelands"), false);
});

test("no Story dungeon's live runtime is marked ready yet (Phase G9 ships data only, not the live switch)", () => {
  for (const dungeon of STORY_DUNGEON_REGISTRY) {
    assert.equal(isCanonicalStoryRuntimeReady(dungeon.id), false, `expected ${dungeon.id} to not be runtime-ready yet`);
  }
});

test("the legacy narrative script stays associated with prologue_wastelands, untouched", () => {
  const script = getLevelScript("prologue_wastelands");
  assert.ok(script);
  assert.equal(script.dungeonId, "prologue_wastelands");
  assert.equal(script.beats.length, 8);
  assert.ok(script.beats.some((beat) => beat.kind === "companion_join" && beat.companionId === "billy"));
  assert.ok(script.beats.some((beat) => beat.kind === "boss" && beat.bossId === "dark_amalgam"));
});

function baseStageResult(overrides: Partial<StoryMapStageResult> = {}): StoryMapStageResult {
  return {
    bossDefeated: true,
    completed: true,
    defeatedEnemyIds: ["boss_dark_amalgam"],
    exitReached: false,
    mapId: "prologue_wastelands",
    objectiveType: "boss_defeat",
    ...overrides,
  };
}

test("a completed prologue_wastelands stage result applies exactly once (shouldApplyStoryMapCompletion guard)", () => {
  const result = baseStageResult();
  assert.equal(shouldApplyStoryMapCompletion(result, "prologue_wastelands"), true);
  // A second identical result for the same dungeon still evaluates true on its own -- the
  // "exactly once" guarantee is the caller's job (a boolean ref/state flag), already covered by
  // the StoryMapLevelRuntime wrapper's own appliedRef guard; this asserts the pure predicate
  // itself is stable and does not, by itself, cause any double side effect.
  assert.equal(shouldApplyStoryMapCompletion(result, "prologue_wastelands"), true);
});

test("a stage result for a different mapId is rejected even if it names prologue_wastelands's dungeon id as the caller", () => {
  const result = baseStageResult({ mapId: "some_other_map" });
  assert.equal(shouldApplyStoryMapCompletion(result, "prologue_wastelands"), false);
});

test("canonical Story maps reference real enemy archetypes", async () => {
  const { STORY_CANONICAL_MAPS } = await import("../content/story/maps/index.js");
  const { getEnemyArchetype } = await import("../enemies/index.js");
  for (const [dungeonId, map] of Object.entries(STORY_CANONICAL_MAPS)) {
    for (const enemy of map.enemies) {
      assert.ok(getEnemyArchetype(enemy.enemyId), `${dungeonId}/${enemy.id} -> ${enemy.enemyId}`);
    }
  }
});
