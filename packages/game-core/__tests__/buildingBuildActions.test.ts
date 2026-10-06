import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { buildBuilding } from "../game/buildingBuildActions.js";
import { getBuildCost } from "../building/buildCosts.js";
import { completeDungeon } from "../story/progressionMvp.js";
import { getResourceDefinition } from "../resources/index.js";
import { grantStock, isStockDrained } from "./support/fixtures.js";

test("buildBuilding requires building unlocked and enough resources", () => {
  let s = createInitialGameState();

  // Forum locked before the Mausolee
  {
    const r = buildBuilding(s, "FORUM");
    assert.equal(r.ok, false);
    assert.equal(r.reason, "BUILDING_LOCKED");
  }

  s = completeDungeon(s, "prologue_wastelands").next;
  s = completeDungeon(s, "funeral_mausoleum").next;

  // Not enough resources
  {
    const r = buildBuilding({ ...s, resources: {} }, "FORUM");
    assert.equal(r.ok, false);
    assert.equal(r.reason, "NOT_ENOUGH_RESOURCES");
    assert.ok(r.cost);
  }

  const cost = getBuildCost("FORUM");
  s = { ...s, resources: grantStock({}, cost) };

  const built = buildBuilding(s, "FORUM");
  assert.equal(built.ok, true);
  assert.equal(built.next.buildings.forum.built, true);
  assert.equal(isStockDrained(built.next.resources, cost), true);

  // Cannot build twice
  const built2 = buildBuilding(built.next, "FORUM");
  assert.equal(built2.ok, false);
  assert.equal(built2.reason, "ALREADY_BUILT");
});

test("buildBuilding works for Farm right after the Prologue", () => {
  let s = completeDungeon(createInitialGameState(), "prologue_wastelands").next;
  s = { ...s, resources: grantStock(s.resources, getBuildCost("FARM")) };

  const r = buildBuilding(s, "FARM");
  assert.equal(r.ok, true);
  assert.equal(r.next.buildings.farm.built, true);
});

test("every MVP build cost uses only registered canonical resources", () => {
  for (const buildingId of ["MINE", "FARM", "TEMPLE", "FORUM", "FORGE", "KITCHEN", "MARKET", "BANK", "TIME_GATE"]) {
    const cost = getBuildCost(buildingId);
    assert.ok(Object.keys(cost).length > 0, `${buildingId} must have a cost`);
    for (const resourceId of Object.keys(cost)) {
      assert.ok(getResourceDefinition(resourceId), `${buildingId} cost uses non-canonical resource ${resourceId}`);
    }
  }
});

test("buildBuilding refuses when building is locked", () => {
  const state = createInitialGameState();

  const result = buildBuilding(state, "FORGE");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "BUILDING_LOCKED");
});

test("buildBuilding can build a normally locked building with dev override", () => {
  const base = createInitialGameState();
  const cost = getBuildCost("FORGE");
  const state = { ...base, resources: grantStock({}, cost) };

  const result = buildBuilding(state, "FORGE", { allowLocked: true });

  assert.equal(result.ok, true);
  assert.equal(result.next.buildings.forge.unlocked, false);
  assert.equal(result.next.buildings.forge.built, true);
  assert.equal(isStockDrained(result.next.resources, cost), true);
});

test("buildBuilding refuses when building is already built", () => {
  const base = createInitialGameState();
  const state = {
    ...base,
    buildings: {
      ...base.buildings,
      forge: {
        ...base.buildings.forge,
        unlocked: true,
        built: true,
      },
    },
  };

  const result = buildBuilding(state, "FORGE");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "ALREADY_BUILT");
});

test("buildBuilding consumes Forge resources and marks Forge built", () => {
  const base = createInitialGameState();
  const cost = getBuildCost("FORGE");
  const state = {
    ...base,
    resources: grantStock({}, cost),
    buildings: {
      ...base.buildings,
      forge: {
        ...base.buildings.forge,
        unlocked: true,
        built: false,
      },
    },
  };

  const result = buildBuilding(state, "FORGE");

  assert.equal(result.ok, true);
  assert.equal(result.next.buildings.forge.built, true);
  assert.equal(result.next.buildings.forge.active, true);
  assert.equal(isStockDrained(result.next.resources, cost), true);
});
