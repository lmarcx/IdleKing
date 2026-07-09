import test from "node:test";
import assert from "node:assert/strict";

import {
  PROLOGUE_WASTELANDS_SCRIPT,
  getLevelScript,
  getLevelScriptBossId,
  getStoryDungeonDefinition,
  validateLevelScriptRegistry,
} from "../index.js";

test("the level script registry validates at boot", () => {
  assert.doesNotThrow(() => validateLevelScriptRegistry());
});

test("prologue script targets a real dungeon and the prologue boss", () => {
  const script = getLevelScript("prologue_wastelands");
  assert.ok(script);
  assert.ok(getStoryDungeonDefinition(script!.dungeonId));
  assert.equal(getLevelScriptBossId("prologue_wastelands"), "dark_amalgam");
});

test("prologue beats follow the canon order and cover the key moments", () => {
  const kinds = PROLOGUE_WASTELANDS_SCRIPT.beats.map((beat) => beat.kind);
  // spawn_wave (Ombres) before boss before companion_join (Billy).
  const waveIndex = kinds.indexOf("spawn_wave");
  const bossIndex = kinds.indexOf("boss");
  const companionIndex = kinds.indexOf("companion_join");
  assert.ok(waveIndex >= 0 && bossIndex > waveIndex, "boss comes after the first wave");
  assert.ok(companionIndex > bossIndex, "Billy joins after the boss");

  const billy = PROLOGUE_WASTELANDS_SCRIPT.beats.find((beat) => beat.kind === "companion_join");
  assert.equal(billy?.companionId, "billy");

  // The Drop of Darkness is acquired after the boss.
  const drop = PROLOGUE_WASTELANDS_SCRIPT.beats.find((beat) => beat.itemId === "drop_of_darkness");
  assert.ok(drop, "drop_of_darkness beat exists");
});

test("every beat has non-empty text and a unique id", () => {
  const ids = new Set<string>();
  for (const beat of PROLOGUE_WASTELANDS_SCRIPT.beats) {
    assert.ok(beat.text.trim().length > 0, `beat ${beat.id} has text`);
    assert.ok(!ids.has(beat.id), `beat id ${beat.id} is unique`);
    ids.add(beat.id);
  }
});
