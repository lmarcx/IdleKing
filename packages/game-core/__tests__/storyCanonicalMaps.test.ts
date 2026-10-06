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
import { getCanonicalDungeonLayout, getDungeonLayout, getStoryMapRuntimeErrors } from "../story/dungeonLayouts.js";
import { getLevelScript } from "../story/levelScripts.js";
import { STORY_DUNGEON_REGISTRY } from "../story/progressionMvp.js";
import { validatePlayableMap } from "../level-editor/map-loader.js";
import { TEST_MAP_01 } from "../level-editor/sample-maps.js";
import type { PlayableMap } from "../level-editor/types.js";

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

test("every Story dungeon has a canonical map that drives its live runtime", () => {
  for (const dungeon of STORY_DUNGEON_REGISTRY) {
    assert.ok(getCanonicalStoryMap(dungeon.id), `expected a canonical map for ${dungeon.id}`);
    assert.equal(hasCanonicalStoryMap(dungeon.id), true);
    assert.equal(isCanonicalStoryRuntimeReady(dungeon.id), true, `expected ${dungeon.id} to be runtime-ready`);
  }
  assert.deepEqual([...STORY_CANONICAL_RUNTIME_READY_DUNGEON_IDS].sort(), Object.keys(STORY_CANONICAL_MAPS).sort());
});

test("the live layout of a runtime-ready dungeon comes from its canonical map", () => {
  for (const dungeon of STORY_DUNGEON_REGISTRY) {
    assert.deepEqual(getDungeonLayout(dungeon.id), getCanonicalDungeonLayout(dungeon.id), dungeon.id);
  }
});

test("canonical maps are valid PlayableMaps and playable as their Story dungeon", () => {
  for (const [dungeonId, map] of Object.entries(STORY_CANONICAL_MAPS)) {
    assert.deepEqual(validatePlayableMap(map).errors, [], dungeonId);
    assert.equal(map.id, dungeonId);
    assert.equal(map.mode, "story");
    assert.ok(map.enemies.filter((enemy) => enemy.isBoss).length <= 1, dungeonId);
    const layout = getCanonicalDungeonLayout(dungeonId);
    assert.ok(layout);
    assert.deepEqual(getStoryMapRuntimeErrors(dungeonId, layout), [], dungeonId);
  }
});

test("prologue_wastelands' canonical map keeps the scripted Prologue: ambush, arena boss, eight beat anchors", () => {
  const map = STORY_CANONICAL_MAPS.prologue_wastelands;
  assert.ok(map);
  const bossEnemies = map.enemies.filter((enemy) => enemy.isBoss);
  assert.equal(bossEnemies.length, 1);
  assert.equal(bossEnemies[0]?.enemyId, "boss_dark_amalgam");
  assert.equal(map.enemies.length, 6, "5 shadows + the Amalgam");
  const beatIds = map.triggers.flatMap((trigger) => (trigger.story?.kind === "beat" ? [trigger.story.beatId] : []));
  assert.deepEqual(beatIds, getLevelScript("prologue_wastelands")?.beats.map((beat) => beat.id));
  assert.ok(map.triggers.some((trigger) => trigger.story?.kind === "zone" && trigger.story.spawnOnBeat === "shadows"));
});

test("canonical Story maps carry no reward/unlock/story-flag data", () => {
  for (const map of Object.values(STORY_CANONICAL_MAPS)) {
    const record = map as unknown as Record<string, unknown>;
    for (const forbiddenKey of ["rewards", "firstClearRewards", "replayRewards", "storyFlags", "storyFlagsProduced", "unlockConditions"]) {
      assert.equal(forbiddenKey in record, false, `PlayableMap must not carry "${forbiddenKey}" -- that belongs to STORY_DUNGEON_REGISTRY`);
    }
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

test("canonical Story maps reference real enemy archetypes", async () => {
  const { STORY_CANONICAL_MAPS } = await import("../content/story/maps/index.js");
  const { getEnemyArchetype } = await import("../enemies/index.js");
  for (const [dungeonId, map] of Object.entries(STORY_CANONICAL_MAPS)) {
    for (const enemy of map.enemies) {
      assert.ok(getEnemyArchetype(enemy.enemyId), `${dungeonId}/${enemy.id} -> ${enemy.enemyId}`);
    }
  }
});
