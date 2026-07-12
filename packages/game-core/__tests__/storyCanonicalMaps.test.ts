import assert from "node:assert/strict";
import test from "node:test";

import { getCanonicalStoryMap, hasCanonicalStoryMap, lookupCanonicalStoryMap, STORY_CANONICAL_MAPS } from "../content/story/maps/index.js";
import { TEST_MAP_01 } from "../level-editor/sample-maps.js";
import type { PlayableMap } from "../level-editor/types.js";

test("STORY_CANONICAL_MAPS is empty in Phase G6 -- hasCanonicalStoryMap is false for a real dungeon id", () => {
  assert.equal(hasCanonicalStoryMap("prologue_wastelands"), false);
});

test("getCanonicalStoryMap returns undefined for an unknown id", () => {
  assert.equal(getCanonicalStoryMap("does_not_exist"), undefined);
});

test("getCanonicalStoryMap reads through the real (currently empty) STORY_CANONICAL_MAPS registry", () => {
  assert.deepEqual(STORY_CANONICAL_MAPS, {});
});

test("lookupCanonicalStoryMap returns undefined when the registry has no matching entry (procedural fallback)", () => {
  const registry: Readonly<Record<string, PlayableMap>> = {};
  assert.equal(lookupCanonicalStoryMap(registry, "prologue_wastelands"), undefined);
});

test("lookupCanonicalStoryMap returns the map when a fixture is present (data-driven branch)", () => {
  const registry: Readonly<Record<string, PlayableMap>> = { test_dungeon: TEST_MAP_01 };
  assert.equal(lookupCanonicalStoryMap(registry, "test_dungeon"), TEST_MAP_01);
});
