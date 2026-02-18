import test from "node:test";
import assert from "node:assert/strict";

import {
  convertXpToWxp,
  wxpNext,
  applyWorldWxp,
  WORLD_MAX_LEVEL,
  rewardMultiplierFromWorldLevel,
  templeRateWxpPerMin,
  expectedIlvl,
  ageFromWorldLevel,
  ageCoeffFromWorldLevel,
} from "../progression/index.js";

test("convertXpToWxp() is 10% floored", () => {
  assert.equal(convertXpToWxp(0), 0);
  assert.equal(convertXpToWxp(9), 0);
  assert.equal(convertXpToWxp(10), 1);
  assert.equal(convertXpToWxp(2500), 250);
});

test("ageFromWorldLevel() and coeff mapping is correct", () => {
  assert.equal(ageFromWorldLevel(1), 1);
  assert.equal(ageFromWorldLevel(10), 1);
  assert.equal(ageFromWorldLevel(11), 2);
  assert.equal(ageFromWorldLevel(20), 2);
  assert.equal(ageFromWorldLevel(21), 3);
  assert.equal(ageFromWorldLevel(31), 4);
  assert.equal(ageFromWorldLevel(41), 5);

  assert.equal(ageCoeffFromWorldLevel(1), 1.0);
  assert.equal(ageCoeffFromWorldLevel(15), 1.15);
  assert.equal(ageCoeffFromWorldLevel(25), 1.35);
  assert.equal(ageCoeffFromWorldLevel(35), 1.6);
  assert.equal(ageCoeffFromWorldLevel(45), 1.9);
});

test("wxpNext() increases with world level and caps at max", () => {
  assert.ok(wxpNext(1) > 0);
  assert.ok(wxpNext(10) > wxpNext(1));
  assert.ok(wxpNext(49) > 0);

  assert.equal(wxpNext(50), 0);
  assert.equal(wxpNext(999), 0);
});

test("applyWorldWxp() levels up correctly and caps at max", () => {
  // exactly enough to reach next world level
  {
    const res = applyWorldWxp(1, 0, wxpNext(1));
    assert.equal(res.newWorldLevel, 2);
    assert.equal(res.newWorldWxp, 0);
    assert.equal(res.leveledUp, true);
    assert.equal(res.levelsGained, 1);
  }

  // big gain should cap at max: compute enough WXP to reach WORLD_MAX_LEVEL
  {
    let required = 0;
    for (let w = 1; w < WORLD_MAX_LEVEL; w++) required += wxpNext(w);

    const res = applyWorldWxp(1, 0, required + 1);

    assert.equal(res.newWorldLevel, WORLD_MAX_LEVEL);
    assert.equal(res.newWorldWxp, 0);
    assert.ok(res.levelsGained > 0);
  }

});

test("rewardMultiplierFromWorldLevel() matches spec (world 50 => x2.47)", () => {
  // RewardMult = 1 + 0.03 * (WorldLevel-1)
  assert.equal(rewardMultiplierFromWorldLevel(1), 1);
  assert.equal(rewardMultiplierFromWorldLevel(50), 1 + 0.03 * 49); // 2.47
});

test("expectedIlvl() matches spec and caps at 1000", () => {
  assert.equal(expectedIlvl(1), 20);
  assert.equal(expectedIlvl(50), 1000);
  assert.equal(expectedIlvl(999), 1000);
});

test("templeRateWxpPerMin() matches spec examples", () => {
  // TempleRateWXP(min) = 10 * TempleLevel * (1 + 0.05 * (Age-1))
  // Age depends on worldLevel
  // Age1: factor 1.00
  assert.equal(templeRateWxpPerMin(1, 1), 10);
  assert.equal(templeRateWxpPerMin(2, 1), 20);

  // Age5: factor 1 + 0.05*(5-1) = 1.2
  assert.equal(templeRateWxpPerMin(1, 45), 12);
  assert.equal(templeRateWxpPerMin(5, 45), 60);
});
