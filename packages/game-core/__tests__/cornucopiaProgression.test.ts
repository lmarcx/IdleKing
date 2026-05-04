import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { ageFromWorldLevel } from "../progression/age.js";
import {
  farmResourcesAvailable,
  mineResourcesAvailable,
} from "../game/buildingActions.js";
import {
  getCornucopiaClaimables,
  claimCornucopia,
} from "../building/cornucopiaActions.js";
import { ALL_RESOURCES, getQty } from "../resources/types.js";

/* ---------------------------------------------------------
   AGE MAPPING
--------------------------------------------------------- */

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

/* ---------------------------------------------------------
   FARM RESOURCES BY WL
--------------------------------------------------------- */

test("farmResourcesAvailable grows with WL", () => {
  // WL 1 → Age 1
  const wl1 = farmResourcesAvailable(1);
  assert.ok(wl1.includes("WOOD"));
  assert.ok(!wl1.includes("WHEAT"));

  // WL 11 → Age 2
  const wl11 = farmResourcesAvailable(11);
  assert.ok(wl11.includes("WOOD"));
  assert.ok(wl11.includes("WHEAT"));
  assert.ok(!wl11.includes("MILK"));

  // WL 21 → Age 3
  const wl21 = farmResourcesAvailable(21);
  assert.ok(wl21.includes("MILK"));
  assert.ok(!wl21.includes("APPLE"));

  // WL 31 → Age 4
  const wl31 = farmResourcesAvailable(31);
  assert.ok(wl31.includes("APPLE"));
  assert.ok(!wl31.includes("CHERRY"));

  // WL 41 → Age 5
  const wl41 = farmResourcesAvailable(41);
  assert.ok(wl41.includes("CHERRY"));
});

/* ---------------------------------------------------------
   MINE RESOURCES BY WL
--------------------------------------------------------- */

test("mineResourcesAvailable grows with WL", () => {
  // WL 1
  const wl1 = mineResourcesAvailable(1);
  assert.ok(wl1.includes("COPPER"));
  assert.ok(!wl1.includes("IRON"));

  // WL 11
  const wl11 = mineResourcesAvailable(11);
  assert.ok(wl11.includes("IRON"));
  assert.ok(!wl11.includes("PLATINUM"));

  // WL 21
  const wl21 = mineResourcesAvailable(21);
  assert.ok(wl21.includes("PLATINUM"));
  assert.ok(!wl21.includes("MITHRIL"));

  // WL 31
  const wl31 = mineResourcesAvailable(31);
  assert.ok(wl31.includes("MITHRIL"));
  assert.ok(!wl31.includes("ORICHALUM"));

  // WL 41
  const wl41 = mineResourcesAvailable(41);
  assert.ok(wl41.includes("ORICHALUM"));
});

/* ---------------------------------------------------------
   CORNUCOPIA RESPECTS PROGRESSION
--------------------------------------------------------- */

test("cornucopia claimables expose all known resources for dev console", () => {
  const s0 = createInitialGameState();

  const claimables = getCornucopiaClaimables(s0);
  assert.deepEqual(claimables, ALL_RESOURCES);
  assert.ok(claimables.includes("WOOD"));
  assert.ok(claimables.includes("IRON"));
  assert.ok(claimables.includes("XP_GLOBAL"));
});

/* ---------------------------------------------------------
   CORNUCOPIA CANNOT BYPASS PROGRESSION
--------------------------------------------------------- */

test("cornucopia claim adds the requested quantity", () => {
  const s0 = createInitialGameState();

  const res = claimCornucopia(s0, { resourceId: "IRON", amount: 250 });
  assert.equal(res.ok, true);
  if (!res.ok) return;

  assert.equal(res.resourceId, "IRON");
  assert.equal(res.amount, 250);
  assert.equal(getQty(res.next.resources, "IRON"), 250);
});

test("cornucopia refuses invalid quantity", () => {
  const s0 = createInitialGameState();

  const res = claimCornucopia(s0, { resourceId: "WOOD", amount: 0 });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.equal(res.error, "INVALID_AMOUNT");
});

test("cornucopia clamps quantity to the dev safe maximum", () => {
  const s0 = createInitialGameState();

  const res = claimCornucopia(s0, { resourceId: "WOOD", amount: 10000000 });
  assert.equal(res.ok, true);
  if (!res.ok) return;
  assert.equal(res.amount, 999999);
  assert.equal(getQty(res.next.resources, "WOOD"), 999999);
});

test("cornucopia claim grants the selected resource without consuming stamina", () => {
  const s0 = createInitialGameState();
  const beforeStamina = s0.buildings.cornucopia.stamina;

  const res = claimCornucopia(s0, { resourceId: "WOOD", amount: 5 });
  assert.equal(res.ok, true);
  if (!res.ok) return;

  assert.equal(res.resourceId, "WOOD");
  assert.equal(res.amount, 5);
  assert.equal(getQty(res.next.resources, "WOOD"), 5);
  assert.equal(res.next.buildings.cornucopia.stamina, beforeStamina);
  assert.equal(res.staminaSpent, 0);
});
