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
import { getQty } from "../resources/types.js";

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

test("cornucopia claimables follow WL progression", () => {
  const s0 = createInitialGameState();

  // WL 1
  const s1 = {
    ...s0,
    progression: { ...s0.progression, worldLevel: 1 },
  };

  const claim1 = getCornucopiaClaimables(s1);
  assert.ok(claim1.includes("WOOD"));
  assert.ok(!claim1.includes("IRON"));

  // WL 11
  const s11 = {
    ...s0,
    progression: { ...s0.progression, worldLevel: 11 },
  };

  const claim11 = getCornucopiaClaimables(s11);
  assert.ok(claim11.includes("IRON"));
  assert.ok(!claim11.includes("PLATINUM"));

  // WL 21
  const s21 = {
    ...s0,
    progression: { ...s0.progression, worldLevel: 21 },
  };

  const claim21 = getCornucopiaClaimables(s21);
  assert.ok(claim21.includes("PLATINUM"));
  assert.ok(!claim21.includes("MITHRIL"));
});

/* ---------------------------------------------------------
   CORNUCOPIA CANNOT BYPASS PROGRESSION
--------------------------------------------------------- */

test("cornucopia refuses locked resource", () => {
  const s0 = createInitialGameState();

  const s1 = {
    ...s0,
    progression: { ...s0.progression, worldLevel: 1 },
  };

  const res = claimCornucopia(s1, { resourceId: "IRON" });
  assert.equal(res.ok, false);
});

test("cornucopia claim grants the selected resource without consuming stamina", () => {
  const s0 = createInitialGameState();
  const beforeStamina = s0.buildings.cornucopia.stamina;

  const res = claimCornucopia(s0, { resourceId: "WOOD" });
  assert.equal(res.ok, true);
  if (!res.ok) return;

  assert.equal(res.resourceId, "WOOD");
  assert.equal(getQty(res.next.resources, "WOOD"), res.amount);
  assert.equal(res.next.buildings.cornucopia.stamina, beforeStamina);
  assert.equal(res.staminaSpent, 0);
});
