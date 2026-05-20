import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { ageFromWorldLevel } from "../progression/age.js";
import { getCornucopiaClaimables, claimCornucopia } from "../building/cornucopiaActions.js";
import { ALL_RESOURCES, getQty } from "../resources/types.js";

test("ageFromWorldLevel maps correctly", () => {
  assert.equal(ageFromWorldLevel(1), 1);
  assert.equal(ageFromWorldLevel(10), 1);
  assert.equal(ageFromWorldLevel(11), 2);
  assert.equal(ageFromWorldLevel(20), 2);
  assert.equal(ageFromWorldLevel(21), 3);
  assert.equal(ageFromWorldLevel(30), 3);
  assert.equal(ageFromWorldLevel(31), 4);
  assert.equal(ageFromWorldLevel(40), 4);
  assert.equal(ageFromWorldLevel(41), 5);
  assert.equal(ageFromWorldLevel(999), 5);
});

test("cornucopia claimables expose all known resources for dev console", () => {
  const state = createInitialGameState();
  const claimables = getCornucopiaClaimables(state);

  assert.deepEqual(claimables, ALL_RESOURCES);
  assert.ok(claimables.includes("WOOD"));
  assert.ok(claimables.includes("IRON"));
  assert.ok(claimables.includes("XP_GLOBAL"));
});

test("cornucopia claim adds the requested quantity", () => {
  const state = createInitialGameState();
  const result = claimCornucopia(state, { resourceId: "IRON", amount: 250 });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.resourceId, "IRON");
  assert.equal(result.amount, 250);
  assert.equal(getQty(result.next.resources, "IRON"), 250);
});

test("cornucopia refuses invalid quantity", () => {
  const state = createInitialGameState();
  const result = claimCornucopia(state, { resourceId: "WOOD", amount: 0 });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error, "INVALID_AMOUNT");
});

test("cornucopia clamps quantity to the dev safe maximum", () => {
  const state = createInitialGameState();
  const result = claimCornucopia(state, { resourceId: "WOOD", amount: 10000000 });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.amount, 999999);
  assert.equal(getQty(result.next.resources, "WOOD"), 999999);
});

test("cornucopia claim grants the selected resource without consuming stamina", () => {
  const state = createInitialGameState();
  const beforeStamina = state.buildings.cornucopia.stamina;
  const result = claimCornucopia(state, { resourceId: "WOOD", amount: 5 });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.resourceId, "WOOD");
  assert.equal(result.amount, 5);
  assert.equal(getQty(result.next.resources, "WOOD"), 5);
  assert.equal(result.next.buildings.cornucopia.stamina, beforeStamina);
  assert.equal(result.staminaSpent, 0);
});
