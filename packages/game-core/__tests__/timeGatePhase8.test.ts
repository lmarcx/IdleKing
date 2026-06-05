import test from "node:test";
import assert from "node:assert/strict";

import { BUILDINGS as BUILDING_MODULES } from "../building/registry.js";
import {
  CANONICAL_BUILDING_IDS,
  getBuildingState,
  isCanonicalBuildingId,
} from "../building/progression.js";
import { createInitialGameState, type GameState } from "../game/state.js";
import {
  ERA_REGISTRY,
  canUnlockEraAtTimeGate,
  grantFragmentDuTemps,
  grantKaleidoscope,
  hasKaleidoscope,
  isEraPlayable,
  isEraUnlocked,
  spendFragmentDuTemps,
  unlockEraAtTimeGate,
} from "../specialItems/index.js";
import { completeDungeon } from "../story/progressionMvp.js";
import { getResourceDefinition } from "../resources/index.js";
import { EQUIPMENT_SETS } from "../equipment/index.js";
import { EQUIPMENT_SLOTS } from "../items/types.js";
import { SKILL_REGISTRY } from "../skills/index.js";
import { getBuildingDef } from "../world/buildings.js";

function builtTimeGate(state: GameState): GameState {
  return {
    ...state,
    buildings: {
      ...state.buildings,
      timeGate: {
        ...state.buildings.timeGate,
        active: true,
        built: true,
        level: 1,
        status: "built",
        unlocked: true,
      },
    },
  };
}

function worldReady(state: GameState): GameState {
  return {
    ...state,
    progression: {
      ...state.progression,
      worldLevel: 5,
    },
  };
}

function withChapterICompleteFlags(state: GameState): GameState {
  return {
    ...state,
    story: {
      ...state.story,
      completedEvents: new Set([
        ...state.story.completedEvents,
        "chapter_i_complete",
        "kaleidoscope_chapter_i_component_ready",
      ]),
    },
  };
}

test("grantKaleidoscope is one-time", () => {
  const state = createInitialGameState();

  const first = grantKaleidoscope(state);
  const second = grantKaleidoscope(first);

  assert.equal(hasKaleidoscope(state), false);
  assert.equal(hasKaleidoscope(first), true);
  assert.equal(second, first);
});

test("grant and spend Fragment du Temps never touch resourceStock", () => {
  const state = createInitialGameState();
  const granted = grantFragmentDuTemps(state, 2);
  const spent = spendFragmentDuTemps(granted, 1);

  assert.equal(granted.specialItems.fragmentDuTemps, 2);
  assert.deepEqual(granted.resources, state.resources);
  assert.equal(spent.ok, true);
  if (!spent.ok) return;
  assert.equal(spent.next.specialItems.fragmentDuTemps, 1);
  assert.deepEqual(spent.next.resources, state.resources);
});

test("spend Fragment du Temps fails when insufficient and clamps invalid amounts", () => {
  const state = createInitialGameState();

  const invalid = spendFragmentDuTemps(state, 0);
  assert.equal(invalid.ok, false);
  if (invalid.ok) return;
  assert.equal(invalid.reason, "INVALID_AMOUNT");

  const insufficient = spendFragmentDuTemps(state, 1);
  assert.equal(insufficient.ok, false);
  if (insufficient.ok) return;
  assert.equal(insufficient.reason, "INSUFFICIENT_FRAGMENT_DU_TEMPS");
  assert.equal(insufficient.next.specialItems.fragmentDuTemps, 0);
});

test("Time Gate exists as canonical building and World Gate is legacy-only", () => {
  const state = createInitialGameState();

  assert.ok(BUILDING_MODULES.some((building) => building.id === "TIME_GATE"));
  assert.equal(BUILDING_MODULES.some((building) => building.id === "WORLD_GATE"), false);
  assert.ok(CANONICAL_BUILDING_IDS.includes("TIME_GATE"));
  assert.equal((CANONICAL_BUILDING_IDS as readonly string[]).includes("WORLD_GATE"), false);
  assert.equal(isCanonicalBuildingId("TIME_GATE"), true);
  assert.equal(isCanonicalBuildingId("WORLD_GATE"), false);
  assert.equal(getBuildingState(state, "TIME_GATE"), state.buildings.timeGate);

  const definition = getBuildingDef("TIME_GATE");
  assert.equal(definition.name, "Time Gate");
  assert.equal(definition.role, "era_unlock");
  assert.deepEqual(definition.actions, ["world_modes", "open_modal"]);
});

test("canUnlockEraAtTimeGate reports false without Kaleidoscope, Fragment, story, or WorldLevel", () => {
  const base = builtTimeGate(createInitialGameState());
  assert.equal(canUnlockEraAtTimeGate(base, "era_glaciaire"), false);

  const withKaleidoscope = grantKaleidoscope(base);
  assert.equal(canUnlockEraAtTimeGate(withKaleidoscope, "era_glaciaire"), false);

  const withFragment = grantFragmentDuTemps(withKaleidoscope, 1);
  assert.equal(canUnlockEraAtTimeGate(withFragment, "era_glaciaire"), false);

  const withStory = withChapterICompleteFlags(withFragment);
  assert.equal(canUnlockEraAtTimeGate(withStory, "era_glaciaire"), false);

  const ready = worldReady(withStory);
  assert.equal(canUnlockEraAtTimeGate(ready, "era_glaciaire"), true);
});

test("unlockEraAtTimeGate consumes Fragment du Temps and unlocks era_glaciaire", () => {
  const state = worldReady(withChapterICompleteFlags(grantFragmentDuTemps(grantKaleidoscope(builtTimeGate(createInitialGameState())), 1)));

  const result = unlockEraAtTimeGate(state, "era_glaciaire");

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.fragmentDuTempsSpent, 1);
  assert.equal(result.next.specialItems.fragmentDuTemps, 0);
  assert.equal(isEraUnlocked(result.next, "era_glaciaire"), true);
});

test("era_deluge remains teaser locked and non-playable after Chapter II", () => {
  const state = worldReady({
    ...withChapterICompleteFlags(grantFragmentDuTemps(grantKaleidoscope(builtTimeGate(createInitialGameState())), 2)),
    story: {
      ...createInitialGameState().story,
      completedEvents: new Set([
        "chapter_i_complete",
        "kaleidoscope_chapter_i_component_ready",
        "chapter_ii_complete",
        "time_gate_phase_8_ready",
      ]),
    },
  });

  assert.equal(isEraPlayable("era_deluge"), false);
  assert.equal(canUnlockEraAtTimeGate(state, "era_deluge"), false);
  const result = unlockEraAtTimeGate(state, "era_deluge");
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "ERA_NOT_PLAYABLE");
});

test("boss first clears grant special story items without resource registry use", () => {
  let state = createInitialGameState();
  const prologue = completeDungeon(state, "prologue_wastelands");
  assert.equal(prologue.ok, true);
  if (!prologue.ok) return;
  assert.equal(prologue.next.specialItems.kaleidoscopeOwned, true);

  state = completeDungeon(prologue.next, "funeral_mausoleum").next;
  const dragon = completeDungeon(state, "ashen_peak");
  assert.equal(dragon.ok, true);
  if (!dragon.ok) return;
  assert.equal(dragon.next.specialItems.fragmentDuTemps, 1);

  const replay = completeDungeon(dragon.next, "ashen_peak");
  assert.equal(replay.ok, true);
  if (!replay.ok) return;
  assert.equal(replay.next.specialItems.fragmentDuTemps, 1);
});

test("Fragment du Temps and Kaleidoscope are absent from resources, equipment, artifacts, skills, and effect sets", () => {
  assert.equal(getResourceDefinition("fragment_du_temps"), undefined);
  assert.equal(getResourceDefinition("kaleidoscope"), undefined);
  assert.equal(EQUIPMENT_SLOTS.includes("artifact"), true);
  assert.equal(EQUIPMENT_SLOTS.includes("kaleidoscope" as any), false);
  assert.equal("fragment_du_temps" in SKILL_REGISTRY, false);
  assert.equal("kaleidoscope" in SKILL_REGISTRY, false);
  assert.equal(EQUIPMENT_SETS.some((set) => String(set.id) === "kaleidoscope" || String(set.id) === "fragment_du_temps"), false);
});

test("Era registry has unique ids and no active modes outside MVP", () => {
  assert.deepEqual([...new Set(ERA_REGISTRY.map((era) => era.id))], ERA_REGISTRY.map((era) => era.id));
  assert.equal(ERA_REGISTRY.some((era) => era.id === "era_deluge" && era.playable), false);
  assert.equal(ERA_REGISTRY.filter((era) => era.playable).every((era) => era.id === "era_funebre" || era.id === "era_glaciaire"), true);
});
