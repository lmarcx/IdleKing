import test from "node:test";
import assert from "node:assert/strict";

import {
  xpNext,
  xpTotal,
  PLAYER_MAX_LEVEL,
  applyPlayerXp,
  baseStatsMultiplier,
  totalXpToMax,
} from "../progression/index.js";

test("xpNext() matches formula expectations at a few levels", () => {
  // We verify deterministic known values computed from the doc formula:
  // XP_to_next(L) = round(60*L^2.15 + 15*1.07^L)

  // L=1: round(60*1 + 15*1.07) = round(60 + 16.05) = 76
  assert.equal(xpNext(1), 76);

  // L=10: value should be stable and > L=1
  assert.ok(xpNext(10) > xpNext(1));

  // L=49 exists (since max level 50), L=50 should be 0
  assert.ok(xpNext(49) > 0);
  assert.equal(xpNext(50), 0);
  assert.equal(xpNext(999), 0);
});

test("xpTotal() is cumulative sum of xpNext()", () => {
  // xpTotal(1) = 0 by definition (already level 1)
  assert.equal(xpTotal(1), 0);

  // xpTotal(2) should equal xpNext(1)
  assert.equal(xpTotal(2), xpNext(1));

  // xpTotal(5) should equal sum xpNext(1..4)
  const expected = xpNext(1) + xpNext(2) + xpNext(3) + xpNext(4);
  assert.equal(xpTotal(5), expected);

  // capped at max level
  assert.equal(xpTotal(PLAYER_MAX_LEVEL + 10), xpTotal(PLAYER_MAX_LEVEL));
});

test("applyPlayerXp() levels up correctly and caps at max", () => {
  // Give exactly enough xp to reach level 2
  {
    const res = applyPlayerXp(1, 0, xpNext(1));
    assert.equal(res.newLevel, 2);
    assert.equal(res.newXp, 0);
    assert.equal(res.leveledUp, true);
    assert.equal(res.levelsGained, 1);
  }

  // Give slightly less -> no level up
  {
    const res = applyPlayerXp(1, 0, xpNext(1) - 1);
    assert.equal(res.newLevel, 1);
    assert.equal(res.newXp, xpNext(1) - 1);
    assert.equal(res.leveledUp, false);
    assert.equal(res.levelsGained, 0);
  }

  // Big gain should cap at level 50 and xp=0
  {
    const res = applyPlayerXp(1, 0, 10_000_000);
    assert.equal(res.newLevel, PLAYER_MAX_LEVEL);
    assert.equal(res.newXp, 0);
    assert.ok(res.levelsGained > 0);
  }
});

test("baseStatsMultiplier() matches spec (level 50 => +39.2%)", () => {
  // BaseStatsMultiplier(L) = 1 + (L-1) * 0.008
  assert.equal(baseStatsMultiplier(1), 1);
  assert.equal(baseStatsMultiplier(50), 1 + 49 * 0.008); // 1.392
});

test("totalXpToMax() is consistent with xpTotal()", () => {
  assert.equal(totalXpToMax(), xpTotal(PLAYER_MAX_LEVEL));
});