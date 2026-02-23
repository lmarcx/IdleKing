import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { buildBuilding } from "../game/buildingBuildActions.js";
import { addQty } from "../resources/types.js";
import { getBuildCost } from "../building/buildCosts.js";

test("buildBuilding requires building unlocked and enough resources", () => {
  let s = createInitialGameState();

  // Forum locked before chapter 1
  {
    const r = buildBuilding(s, "FORUM");
    assert.equal(r.ok, false);
    assert.equal(r.reason, "BUILDING_LOCKED");
  }

  // Unlock chapter 1 (Forum/Farm/Mine/Kitchen)
  s = completeChapterAction(s, 1).next;

  // Not enough resources
  {
    const r = buildBuilding(s, "FORUM");
    assert.equal(r.ok, false);
    assert.equal(r.reason, "NOT_ENOUGH_RESOURCES");
    assert.ok(r.cost);
  }

  // Give enough resources and build
  const cost = getBuildCost("FORUM");
  s = {
    ...s,
    resources: {
      ...s.resources,
      WOOD: (cost.WOOD ?? 0),
      STONE: (cost.STONE ?? 0),
      WATER: (cost.WATER ?? 0),
      GOLD: (cost.GOLD ?? 0),
    },
  };

  const built = buildBuilding(s, "FORUM");
  assert.equal(built.ok, true);
  assert.equal(built.next.buildings.forum.built, true);

  // Cannot build twice
  const built2 = buildBuilding(built.next, "FORUM");
  assert.equal(built2.ok, false);
  assert.equal(built2.reason, "ALREADY_BUILT");
});

test("buildBuilding works for Farm (chapter 1) with simple resources helper", () => {
  let s = createInitialGameState();
  s = completeChapterAction(s, 1).next;

  const cost = getBuildCost("FARM");
  s = {
    ...s,
    resources: addQty(addQty(s.resources, "STONE", cost.STONE ?? 0), "WOOD", cost.WOOD ?? 0),
  };

  const r = buildBuilding(s, "FARM");
  assert.equal(r.ok, true);
  assert.equal(r.next.buildings.farm.built, true);
});