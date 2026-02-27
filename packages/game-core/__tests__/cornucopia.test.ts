import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { claimCornucopia, CORNUCOPIA_STAMINA_COST } from "../building/cornucopiaActions.js";
import { getQty } from "../resources/types.js";
import { CORNUCOPIA_BUILDING } from "../building/cornucopiaBuilding.js";

test("cornucopia: claim consumes cornucopia stamina and grants resource", () => {
  const s0 = createInitialGameState();

  const s1 = {
    ...s0,
    buildings: {
      ...s0.buildings,
      cornucopia: {
        ...s0.buildings.cornucopia,
        unlocked: true,
        built: true,
        active: true,
        level: 1,
        stamina: 100,
        staminaMax: 100,
      },
    },
  };

  const res = claimCornucopia(s1, { resourceId: "WOOD" });
  assert.equal(res.ok, true);
  if (!res.ok) return;

  assert.equal(getQty(res.next.resources, "WOOD"), res.amount);
  assert.equal(res.next.buildings.cornucopia.stamina, 100 - CORNUCOPIA_STAMINA_COST);
});

test("cornucopia: claim fails when not enough stamina", () => {
  const s0 = createInitialGameState();

  const s1 = {
    ...s0,
    buildings: {
      ...s0.buildings,
      cornucopia: {
        ...s0.buildings.cornucopia,
        unlocked: true,
        built: true,
        active: true,
        level: 1,
        stamina: CORNUCOPIA_STAMINA_COST - 1,
        staminaMax: 100,
      },
    },
  };

  const res = claimCornucopia(s1, { resourceId: "STONE" });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.equal(res.error, "NO_STAMINA");
});

test("cornucopia: XP_GLOBAL is invalid (excluded)", () => {
  const s0 = createInitialGameState();

  const s1 = {
    ...s0,
    buildings: {
      ...s0.buildings,
      cornucopia: {
        ...s0.buildings.cornucopia,
        unlocked: true,
        built: true,
        active: true,
        stamina: 100,
        staminaMax: 100,
      },
    },
  };

  const res = claimCornucopia(s1, { resourceId: "XP_GLOBAL" });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.equal(res.error, "INVALID_RESOURCE");
});

test("cornucopia: stamina regenerates on tick (built+unlocked)", () => {
  const s0 = createInitialGameState();

  const s1 = {
    ...s0,
    buildings: {
      ...s0.buildings,
      cornucopia: {
        ...s0.buildings.cornucopia,
        unlocked: true,
        built: true,
        active: false, // regen même inactive (selon règle du building)
        level: 1,
        stamina: 10,
        staminaMax: 100,
      },
    },
  };

  const out = CORNUCOPIA_BUILDING.tick(s1, { minutes: 30 });
  const s2 = out.next;

  assert.ok(s2.buildings.cornucopia.stamina > 10);
  assert.ok(s2.buildings.cornucopia.stamina <= 100);
});

test("cornucopia: stamina never exceeds staminaMax", () => {
  const s0 = createInitialGameState();

  const s1 = {
    ...s0,
    buildings: {
      ...s0.buildings,
      cornucopia: {
        ...s0.buildings.cornucopia,
        unlocked: true,
        built: true,
        active: true,
        level: 5,
        stamina: 99,
        staminaMax: 100,
      },
    },
  };

  const out = CORNUCOPIA_BUILDING.tick(s1, { minutes: 9999 });
  assert.equal(out.next.buildings.cornucopia.stamina, 100);
});