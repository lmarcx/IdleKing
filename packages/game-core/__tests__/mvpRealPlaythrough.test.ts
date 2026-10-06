import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, type GameState } from "../game/state.js";
import { buildBuilding } from "../game/buildingBuildActions.js";
import { convertTempleGlobalXp } from "../game/templeActions.js";
import { forumRankUpWorld } from "../game/forumActions.js";
import { getBuildCost } from "../building/buildCosts.js";
import { getQty } from "../resources/types.js";
import { unlockEraAtTimeGate } from "../specialItems/index.js";
import {
  STORY_MIN_WORLD_LEVEL,
  canEnterDungeon,
  completeDungeon,
  getStoryChapterDefinition,
} from "../story/progressionMvp.js";
import { grantStock } from "./support/fixtures.js";
import type { BuildingId } from "../building/types.js";

/**
 * Plays the MVP through the same actions the UI exposes (completeDungeon, build, Temple
 * conversion, Forum rank-up, Time Gate). The only shortcut is gathering: build costs are granted
 * as if the player had run the Mine/Farm mini-games. World Level, flags and buildings are never
 * forced — this is the soft-lock guard the older playthrough tests could not provide.
 */
function clear(state: GameState, dungeonId: string): GameState {
  assert.equal(canEnterDungeon(state, dungeonId), true, `${dungeonId} must be enterable`);
  const result = completeDungeon(state, dungeonId);
  assert.equal(result.ok, true);
  return result.next;
}

function gatherAndBuild(state: GameState, buildingId: BuildingId): GameState {
  const funded = { ...state, resources: grantStock(state.resources, getBuildCost(buildingId)) };
  const result = buildBuilding(funded, buildingId);
  assert.equal(result.ok, true, `${buildingId} must be buildable (${result.reason ?? "ok"})`);
  return result.next;
}

function bankXpAndRankUp(state: GameState): GameState {
  let next = state;
  const xp = getQty(next.resources, "XP_GLOBAL");
  if (xp > 0) {
    const converted = convertTempleGlobalXp(next, "worldWxp", xp);
    assert.equal(converted.ok, true);
    if (converted.ok) next = converted.next;
  }
  for (let guard = 0; guard < 50; guard += 1) {
    const ranked = forumRankUpWorld(next);
    if (!ranked.rankedUp) break;
    next = ranked.next;
  }
  return next;
}

test("MVP is completable from a fresh save without forcing World Level", () => {
  let state = createInitialGameState();

  state = clear(state, "prologue_wastelands");
  state = gatherAndBuild(state, "MINE");
  state = gatherAndBuild(state, "FARM");

  state = clear(state, "funeral_mausoleum");
  state = gatherAndBuild(state, "TEMPLE");
  state = gatherAndBuild(state, "FORUM");

  for (const dungeonId of ["frozen_river", "time_vestige", "ashen_peak"]) {
    state = clear(state, dungeonId);
  }
  state = gatherAndBuild(state, "FORGE");
  state = gatherAndBuild(state, "TIME_GATE");
  state = bankXpAndRankUp(state);

  // Farm Chapter I until the Chapter II World Level gate opens.
  const target = STORY_MIN_WORLD_LEVEL.chapter_ii_glaciaire;
  let replays = 0;
  while (state.progression.worldLevel < target) {
    state = bankXpAndRankUp(clear(state, "ashen_peak"));
    replays += 1;
    assert.ok(replays <= 8, `Chapter II gate needs too many replays (${replays})`);
  }

  const era = unlockEraAtTimeGate(state, "era_glaciaire");
  assert.equal(era.ok, true, era.ok ? "" : era.reason);
  state = era.next;

  for (const dungeonId of getStoryChapterDefinition("chapter_ii_glaciaire")?.dungeonIds ?? []) {
    state = clear(state, dungeonId);
  }

  assert.equal(state.story.completedEvents.has("chapter_ii_complete"), true);
  assert.ok(state.progression.playerLevel >= 8, `player level ${state.progression.playerLevel} too low at MVP end`);
});

test("dungeon completion grants player XP and Temple XP, replays a quarter of it", () => {
  const first = completeDungeon(createInitialGameState(), "prologue_wastelands");
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.ok(first.xp.playerXp > 0 && first.xp.globalXp > 0);
  assert.ok(first.next.progression.playerLevel > 1 || first.next.progression.playerXp > 0);
  assert.equal(getQty(first.next.resources, "XP_GLOBAL"), first.xp.globalXp);

  const replay = completeDungeon(first.next, "prologue_wastelands");
  assert.equal(replay.ok, true);
  if (!replay.ok) return;
  assert.equal(replay.xp.globalXp, Math.floor(first.xp.globalXp * 0.25));
});
