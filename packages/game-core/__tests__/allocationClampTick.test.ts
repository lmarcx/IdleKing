import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { tickAllBuildings } from "../building/tick.js";
import { setFarmAllocation } from "../game/buildingActions.js";
import { getQty } from "../resources/types.js";

test("Allocation is clamped to villagers count => production is clamped too", () => {
  let s = createInitialGameState();

  s = completeChapterAction(s, 1).next;

  s = {
    ...s,
    buildings: {
      ...s.buildings,
      farm: { ...s.buildings.farm, built: true, active: true },
    },
  };

  // request 100 villagers on WATER, but we only have 5 villagers
  s = setFarmAllocation(s, { WATER: 100 });

  const waterBefore = getQty(s.resources, "WATER");
  const r = tickAllBuildings(s, 1);

  const waterAfter = getQty(r.next.resources, "WATER");

  // should be clamped to 5 workers => +5 per minute
  assert.equal(waterAfter, waterBefore + 5);
});