/*import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { claimCornucopia, CORNUCOPIA_STAMINA_COST, getCornucopiaClaimables } from "../building/cornucopiaActions.js";
import { getQty } from "../resources/types.js";
import { CORNUCOPIA_BUILDING } from "../building/cornucopiaBuilding.js";

test("cornucopia: is available from start (no unlock/build/active required)", () => {
  const s0 = createInitialGameState();

  // Par design: déjà dispo
  assert.equal(s0.buildings.cornucopia.unlocked, true);
  assert.equal(s0.buildings.cornucopia.built, true);
  assert.equal(s0.buildings.cornucopia.active, true);
});

test("cornucopia: claimables are raw resources only (farm + mine) and exclude XP_GLOBAL", () => {
  const s0 = createInitialGameState();

  const claimables = getCornucopiaClaimables(s0);

  assert.ok(claimables.length > 0);
  assert.equal(claimables.includes("XP_GLOBAL"), false);

  // sanity: should include early raw resources (Age I)
  assert.ok(claimables.includes("WOOD"));
  assert.ok(claimables.includes("STONE"));
});

test("cornucopia: claim succeeds for an unlocked raw resource and consumes cornucopia stamina", () => {
  const s0 = createInitialGameState();

  const r = claimCornucopia(s0, { resourceId: "WOOD" });
  assert.equal(r.ok, true);
  if (!r.ok) return;

  assert.equal(getQty(r.next.resources, "WOOD"), r.amount);
  assert.equal(r.next.buildings.cornucopia.stamina, s0.buildings.cornucopia.stamina - CORNUCOPIA_STAMINA_COST);
});

test("cornucopia: claim fails if stamina is insufficient", () => {
  const s0 = createInitialGameState();

  const s1 = {
    ...s0,
    buildings: {
      ...s0.buildings,
      cornucopia: {
        ...s0.buildings.cornucopia,
        stamina: CORNUCOPIA_STAMINA_COST - 1,
      },
    },
  };

  const r = claimCornucopia(s1, { resourceId: "WOOD" });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.error, "NO_STAMINA");
});

test("cornucopia: claim fails for locked resource (not available in current age)", () => {
  const s0 = createInitialGameState();

  // Exemple: une ressource clairement plus tardive (Age II+)
  const r = claimCornucopia(s0, { resourceId: "IRON" });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.error, "LOCKED_RESOURCE");
});

test("cornucopia: stamina regenerates via tick and caps at staminaMax", () => {
  const s0 = createInitialGameState();

  const s1 = {
    ...s0,
    buildings: {
      ...s0.buildings,
      cornucopia: {
        ...s0.buildings.cornucopia,
        stamina: 95,
        staminaMax: 100,
        level: 1,
      },
    },
  };

  const out = CORNUCOPIA_BUILDING.tick(s1, { minutes: 999 });
  assert.equal(out.next.buildings.cornucopia.stamina, 100);
});*/