import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, type GameState } from "../game/state.js";
import {
  applyDungeonBuildingUnlocks,
  completeDungeon,
  reconcileStoryBuildingUnlocks,
  STORY_DUNGEON_REGISTRY,
} from "../story/progressionMvp.js";

function clear(state: GameState, dungeonId: string): GameState {
  const result = completeDungeon(state, dungeonId);
  assert.equal(result.ok, true, `${dungeonId} should be completable`);
  return result.next;
}

test("a fresh game starts with gathering and economy buildings locked", () => {
  const state = createInitialGameState();
  for (const key of ["forum", "temple", "farm", "mine", "kitchen", "forge", "market", "bank"] as const) {
    assert.equal(state.buildings[key].unlocked, false, `${key} must start locked`);
  }
});

test("Chapter I dungeons unlock the Kingdom buildings in story order", () => {
  let state = clear(createInitialGameState(), "prologue_wastelands");
  assert.equal(state.buildings.mine.unlocked, true);
  assert.equal(state.buildings.farm.unlocked, true);
  assert.equal(state.buildings.temple.unlocked, false);
  assert.equal(state.buildings.mine.built, false, "unlocking never builds");

  state = clear(state, "funeral_mausoleum");
  assert.equal(state.buildings.temple.unlocked, true);
  assert.equal(state.buildings.forum.unlocked, true);
  assert.equal(state.buildings.forge.unlocked, false);

  state = clear(state, "frozen_river");
  for (const key of ["forge", "market", "bank", "kitchen"] as const) {
    assert.equal(state.buildings[key].unlocked, true, `${key} unlocks at Rive Figee`);
    assert.equal(state.story.unlocked.has(key.toUpperCase()), true);
  }
});

test("every MVP building that starts locked is unlocked by exactly one dungeon", () => {
  const unlockedBy = new Map<string, string>();
  for (const dungeon of STORY_DUNGEON_REGISTRY) {
    for (const buildingId of dungeon.buildingUnlocks) unlockedBy.set(buildingId, dungeon.id);
  }
  for (const buildingId of ["FORUM", "TEMPLE", "FARM", "MINE", "KITCHEN", "FORGE", "MARKET", "BANK"]) {
    assert.ok(unlockedBy.has(buildingId), `${buildingId} must be unlocked by a story dungeon`);
  }
});

test("building unlocks are idempotent and survive replays", () => {
  const once = clear(createInitialGameState(), "prologue_wastelands");
  const built = {
    ...once,
    buildings: { ...once.buildings, mine: { ...once.buildings.mine, built: true, level: 3 } },
  };
  const replayed = clear(built, "prologue_wastelands");
  assert.equal(replayed.buildings.mine.built, true);
  assert.equal(replayed.buildings.mine.level, 3);
  assert.equal(applyDungeonBuildingUnlocks(replayed, "prologue_wastelands"), replayed);
});

test("save reconciliation unlocks buildings for dungeons cleared before unlocks existed", () => {
  const legacy = createInitialGameState();
  legacy.story.completedDungeonIds.add("prologue_wastelands");
  legacy.story.completedDungeonIds.add("funeral_mausoleum");

  const reconciled = reconcileStoryBuildingUnlocks(legacy);
  assert.equal(reconciled.buildings.mine.unlocked, true);
  assert.equal(reconciled.buildings.temple.unlocked, true);
  assert.equal(reconciled.buildings.forge.unlocked, false);
});
