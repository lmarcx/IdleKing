import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { cookDish } from "../game/kitchenActions.js";
import { addQty, getQty } from "../resources/types.js";

function unlockAndBuildKitchen(s: ReturnType<typeof createInitialGameState>) {
  // Chapter progression is linear in MVP.
  s = completeChapterAction(s, 1).next;

  // Kitchen must be built to allow cooking actions.
  s = {
    ...s,
    buildings: {
      ...s.buildings,
      kitchen: { ...s.buildings.kitchen, built: true, active: true },
    },
  };

  return s;
}

test("Kitchen cookDish consumes ingredients, produces dish, drains villager stamina", () => {
  let s = createInitialGameState();
  s = unlockAndBuildKitchen(s);

  // Give ingredients for STEW: 2 MEAT + 1 WATER
  s = {
    ...s,
    resources: addQty(addQty(s.resources, "MEAT", 2), "WATER", 1),
  };

  const vId = s.villagers.list[0].id;
  const staminaBefore = s.villagers.list[0].stamina;

  const plateBefore = getQty(s.resources, "PLATE_STEW");

  const r = cookDish(s, "STEW", vId);
  assert.equal(r.ok, true);

  assert.equal(getQty(r.next.resources, "MEAT"), 0);
  assert.equal(getQty(r.next.resources, "WATER"), 0);
  assert.equal(getQty(r.next.resources, "PLATE_STEW"), plateBefore + 1);

  const staminaAfter = r.next.villagers.list[0].stamina;
  assert.ok(staminaAfter < staminaBefore);
});

test("Kitchen cookDish fails if not built", () => {
  let s = createInitialGameState();
  s = completeChapterAction(s, 1).next; // unlocked but not built

  const r = cookDish(s, "STEW", "v1");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "KITCHEN_NOT_BUILT");
});

test("Kitchen cookDish fails if not enough resources", () => {
  let s = createInitialGameState();
  s = unlockAndBuildKitchen(s);

  const r = cookDish(s, "STEW", "v1");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "NOT_ENOUGH_RESOURCES");
});

test("Kitchen cookDish fails if villager has no stamina", () => {
  let s = createInitialGameState();
  s = unlockAndBuildKitchen(s);

  // Give ingredients so only stamina can block.
  s = {
    ...s,
    resources: addQty(addQty(s.resources, "MEAT", 2), "WATER", 1),
  };

  // Force villager stamina to 0.
  s = {
    ...s,
    villagers: {
      list: s.villagers.list.map((v, i) => (i === 0 ? { ...v, stamina: 0 } : v)),
    },
  };

  const r = cookDish(s, "STEW", s.villagers.list[0].id);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "VILLAGER_NO_STAMINA");
});