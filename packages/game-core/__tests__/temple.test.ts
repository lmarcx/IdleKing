import test from "node:test";
import assert from "node:assert/strict";

import {
  templeMaxVillagers,
  templeVillagerBonusMultiplier,
  templeProductionPerMin,
  simulateTempleProduction,
} from "../building/temple.js";

test("templeMaxVillagers() scales with level and age", () => {
  // Age I (world <= 10)
  assert.equal(templeMaxVillagers(1, 1), 1 * 3 + 1); // 4
  assert.equal(templeMaxVillagers(2, 1), 2 * 3 + 1); // 7

  // Age V (world >= 41)
  assert.equal(templeMaxVillagers(1, 45), 1 * 3 + 5); // 8
  assert.equal(templeMaxVillagers(5, 45), 5 * 3 + 5); // 20
});

test("templeVillagerBonusMultiplier() increases but saturates", () => {
  const m0 = templeVillagerBonusMultiplier(0);
  const m2 = templeVillagerBonusMultiplier(2);
  const m8 = templeVillagerBonusMultiplier(8);
  const m20 = templeVillagerBonusMultiplier(20);

  assert.equal(m0, 1);
  assert.ok(m2 > m0);
  assert.ok(m8 > m2);

  // saturation: gain between 8->20 is smaller than 2->8 (roughly)
  assert.ok((m20 - m8) < (m8 - m2));
});

test("templeProductionPerMin() respects villager cap", () => {
  // world 1 => age 1, cap for level 1 = 4
  const capped = templeProductionPerMin(1, 1, 999);
  const atCap = templeProductionPerMin(1, 1, 4);
  assert.equal(capped, atCap);
});

test("simulateTempleProduction() is perMin * minutes floored", () => {
  const perMin = templeProductionPerMin(1, 1, 2);
  assert.equal(simulateTempleProduction(10, 1, 1, 2), perMin * 10);

  // minutes floored
  assert.equal(simulateTempleProduction(10.9, 1, 1, 2), perMin * 10);
  assert.equal(simulateTempleProduction(-5, 1, 1, 2), 0);
});