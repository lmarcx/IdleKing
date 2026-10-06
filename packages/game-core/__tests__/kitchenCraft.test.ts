import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { withUnlockedBuildings } from "./support/fixtures.js";
import { cookDish } from "../game/kitchenActions.js";
import { addQty, getQty } from "../resources/types.js";

test("Kitchen craft consumes ingredients, produces plate, drains villager stamina", () => {
  let s = createInitialGameState();

  // Chapter 1 unlocks kitchen
  s = withUnlockedBuildings(s, ["KITCHEN"]);

  // Build kitchen (unlocked but not auto-built)
  s = {
    ...s,
    buildings: {
      ...s.buildings,
      kitchen: { ...s.buildings.kitchen, built: true },
    },
  };

  // Add ingredients
  s = { ...s, resources: addQty(addQty(s.resources, "MEAT", 2), "WATER", 1) };

  const vId = s.villagers.list[0].id;
  const staminaBefore = s.villagers.list[0].stamina;
  const stewBefore = getQty(s.resources, "PLATE_STEW");

  const r = cookDish(s, "STEW", vId);

  assert.equal(r.ok, true);
  assert.equal(getQty(r.next.resources, "PLATE_STEW"), stewBefore + 1);
  assert.equal(getQty(r.next.resources, "MEAT"), 0);
  assert.equal(getQty(r.next.resources, "WATER"), 0);

  const staminaAfter = r.next.villagers.list[0].stamina;
  assert.ok(staminaAfter < staminaBefore);
});

test("Kitchen craft fails if not built", () => {
  let s = createInitialGameState();
  s = withUnlockedBuildings(s, ["KITCHEN"]);

  const r = cookDish(s, "STEW", "v1");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "KITCHEN_NOT_BUILT");
});

test("Kitchen craft fails if not enough resources", () => {
  let s = createInitialGameState();
  s = withUnlockedBuildings(s, ["KITCHEN"]);

  s = {
    ...s,
    buildings: {
      ...s.buildings,
      kitchen: { ...s.buildings.kitchen, built: true },
    },
  };

  const r = cookDish(s, "STEW", "v1");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "NOT_ENOUGH_RESOURCES");
});