import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { tickAllBuildings } from "../building/tick.js";
import { setFarmAllocation, setTempleWxpAllocation } from "../game/buildingActions.js";
import { getQty } from "../resources/types.js";

test("allocation produces resources and consumes stamina", () => {
  let s = createInitialGameState();

  // unlock farm/mine/kitchen at ch1, temple at ch2
  s = completeChapterAction(s, 1).next;
  s = completeChapterAction(s, 2).next;

  // build & activate farm + temple
  s = {
    ...s,
    buildings: {
      ...s.buildings,
      farm: { ...s.buildings.farm, unlocked: true, built: true, active: true },
      temple: { ...s.buildings.temple, unlocked: true, built: true, active: true },
    },
  };

  // allocate 2 villagers to water, 1 to temple wxp
  s = setFarmAllocation(s, { WATER: 2 });
  s = setTempleWxpAllocation(s, 1);

  const staminaBefore = s.villagers.list.map(v => v.stamina);
  const waterBefore = getQty(s.resources, "WATER");

  const r = tickAllBuildings(s, 1);

  const waterAfter = getQty(r.next.resources, "WATER");
  const staminaAfter = r.next.villagers.list.map(v => v.stamina);

  assert.equal(waterAfter, waterBefore + 2);
  assert.ok(staminaAfter.some((x, i) => x < staminaBefore[i]));
});