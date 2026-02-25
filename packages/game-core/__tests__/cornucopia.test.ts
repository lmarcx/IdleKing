import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { claimCornucopia, CORNUCOPIA_COOLDOWN_MS } from "../building/cornucopiaActions.js";
import { getQty } from "../resources/types.js";

test("cornucopia: claim succeeds and adds chosen resource", () => {
  const s0 = createInitialGameState();

  const s1 = {
    ...s0,
    buildings: {
      ...s0.buildings,
      cornucopia: { unlocked: true, built: true, active: true, level: 1, lastClaimAtMs: null },
    },
  };

  const now = 1_000_000;
  const res = claimCornucopia(s1, { resourceId: "WOOD", nowMs: now });

  assert.equal(res.ok, true);
  if (!res.ok) return;

  assert.equal(res.resourceId, "WOOD");
  assert.equal(getQty(res.next.resources, "WOOD"), res.amount);
  assert.equal(res.next.buildings.cornucopia.lastClaimAtMs, now);
});

test("cornucopia: XP_GLOBAL is invalid (excluded)", () => {
  const s0 = createInitialGameState();
  const s1 = {
    ...s0,
    buildings: {
      ...s0.buildings,
      cornucopia: { unlocked: true, built: true, active: true, level: 1, lastClaimAtMs: null },
    },
  };

  const res = claimCornucopia(s1, { resourceId: "XP_GLOBAL", nowMs: 123 });

  assert.equal(res.ok, false);
  if (res.ok) return;

  assert.equal(res.error, "INVALID_RESOURCE");
});

test("cornucopia: requires unlocked + built + active", () => {
  const base = createInitialGameState();
  const now = 123;

  {
    const s = {
      ...base,
      buildings: {
        ...base.buildings,
        cornucopia: { unlocked: false, built: true, active: true, level: 1, lastClaimAtMs: null },
      },
    };
    const r = claimCornucopia(s, { resourceId: "STONE", nowMs: now });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, "NOT_UNLOCKED");
  }

  {
    const s = {
      ...base,
      buildings: {
        ...base.buildings,
        cornucopia: { unlocked: true, built: false, active: true, level: 1, lastClaimAtMs: null },
      },
    };
    const r = claimCornucopia(s, { resourceId: "STONE", nowMs: now });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, "NOT_BUILT");
  }

  {
    const s = {
      ...base,
      buildings: {
        ...base.buildings,
        cornucopia: { unlocked: true, built: true, active: false, level: 1, lastClaimAtMs: null },
      },
    };
    const r = claimCornucopia(s, { resourceId: "STONE", nowMs: now });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, "NOT_ACTIVE");
  }
});

test("cornucopia: cooldown blocks second claim and returns remainingMs", () => {
  const s0 = createInitialGameState();
  const t0 = 10_000;

  const s1 = {
    ...s0,
    buildings: {
      ...s0.buildings,
      cornucopia: { unlocked: true, built: true, active: true, level: 1, lastClaimAtMs: null },
    },
  };

  const first = claimCornucopia(s1, { resourceId: "WATER", nowMs: t0 });
  assert.equal(first.ok, true);
  if (!first.ok) return;

  const t1 = t0 + CORNUCOPIA_COOLDOWN_MS - 1;
  const second = claimCornucopia(first.next, { resourceId: "WATER", nowMs: t1 });

  assert.equal(second.ok, false);
  if (second.ok) return;

  assert.equal(second.error, "COOLDOWN");
  assert.ok(typeof second.remainingMs === "number");
  assert.ok(second.remainingMs! > 0);
});

test("cornucopia: scaling increases with worldLevel and building level", () => {
  const s0 = createInitialGameState();

  const low = {
    ...s0,
    progression: { ...s0.progression, worldLevel: 1 },
    buildings: {
      ...s0.buildings,
      cornucopia: { unlocked: true, built: true, active: true, level: 1, lastClaimAtMs: null },
    },
  };

  const high = {
    ...s0,
    progression: { ...s0.progression, worldLevel: 50 },
    buildings: {
      ...s0.buildings,
      cornucopia: { unlocked: true, built: true, active: true, level: 5, lastClaimAtMs: null },
    },
  };

  const r1 = claimCornucopia(low, { resourceId: "MEAT", nowMs: 1 });
  const r2 = claimCornucopia(high, { resourceId: "MEAT", nowMs: 1 });

  assert.equal(r1.ok, true);
  assert.equal(r2.ok, true);
  if (!r1.ok || !r2.ok) return;

  assert.ok(r2.amount > r1.amount);
});