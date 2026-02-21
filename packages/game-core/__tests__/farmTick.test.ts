import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { tickAllBuildings } from "../building/tick.js";
import { setFarmAllocation } from "../game/buildingActions.js";
import { getQty } from "../resources/types.js";

test("Farm produces 1 unit/min/villager according to allocation and drains stamina", () => {
  let s = createInitialGameState();

  // chapter 1 unlocks farm/mine/kitchen
  s = completeChapterAction(s, 1).next;

  // build + activate farm
  s = {
    ...s,
    buildings: {
      ...s.buildings,
      farm: { ...s.buildings.farm, built: true, active: true },
    },
  };

  // allocate 3 villagers to WATER (we have 5 villagers total)
  s = setFarmAllocation(s, { WATER: 3 });

  const waterBefore = getQty(s.resources, "WATER");
  const staminaBefore = s.villagers.list.map((v) => v.stamina);

  const r = tickAllBuildings(s, 2); // 2 minutes

  const waterAfter = getQty(r.next.resources, "WATER");
  const staminaAfter = r.next.villagers.list.map((v) => v.stamina);

  // 3 workers * 1 per min * 2 minutes = +6
  assert.equal(waterAfter, waterBefore + 6);

  // at least one villager stamina decreased
  assert.ok(staminaAfter.some((x, i) => x < staminaBefore[i]));
});