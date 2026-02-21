import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { setFarmAllocation, setMineAllocation, farmResourcesAvailable, mineResourcesAvailable } from "../game/buildingActions.js";

test("farmResourcesAvailable grows with age", () => {
  // Age I
  const a1 = farmResourcesAvailable(1);
  assert.ok(a1.includes("WATER"));
  assert.ok(!a1.includes("WHEAT"));

  // Age II (world 11+)
  const a2 = farmResourcesAvailable(11);
  assert.ok(a2.includes("WHEAT"));
});

test("mineResourcesAvailable grows with age", () => {
  const a1 = mineResourcesAvailable(1);
  assert.ok(a1.includes("GOLD"));
  assert.ok(!a1.includes("IRON"));

  const a2 = mineResourcesAvailable(11);
  assert.ok(a2.includes("IRON"));
});

test("setFarmAllocation filters invalid resources and clamps to villagers count", () => {
  let s = createInitialGameState(); // 5 villagers
  // worldLevel 1 => Age I (no WHEAT)
  s = setFarmAllocation(s, { WATER: 4, WHEAT: 10, WOOD: 10 } as any);

  // WHEAT must be removed (not available)
  assert.equal((s.buildings.farm.allocation as any).WHEAT, undefined);

  // total must be <= 5
  const sum =
    (s.buildings.farm.allocation.WATER ?? 0) +
    (s.buildings.farm.allocation.WOOD ?? 0) +
    (s.buildings.farm.allocation.STONE ?? 0) +
    (s.buildings.farm.allocation.MEAT ?? 0);

  assert.ok(sum <= 5);
  assert.equal(sum, 5);
});

test("setMineAllocation filters invalid resources and clamps to villagers count", () => {
  let s = createInitialGameState(); // 5 villagers
  // worldLevel 1 => Age I (no IRON)
  s = setMineAllocation(s, { GOLD: 3, IRON: 5, COPPER: 5 } as any);

  assert.equal((s.buildings.mine.allocation as any).IRON, undefined);

  const sum =
    (s.buildings.mine.allocation.GOLD ?? 0) +
    (s.buildings.mine.allocation.COPPER ?? 0) +
    (s.buildings.mine.allocation.SILVER ?? 0);

  assert.ok(sum <= 5);
  assert.equal(sum, 5);
});