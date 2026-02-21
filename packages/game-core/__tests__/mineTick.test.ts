import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { tickAllBuildings } from "../building/tick.js";
import { setMineAllocation } from "../game/buildingActions.js";
import { getQty } from "../resources/types.js";

test("Mine produces 1 unit/min/villager according to allocation and drains stamina", () => {
  let s = createInitialGameState();

  s = completeChapterAction(s, 1).next;

  // build + activate mine
  s = {
    ...s,
    buildings: {
      ...s.buildings,
      mine: { ...s.buildings.mine, built: true, active: true },
    },
  };

  // allocate 2 villagers to GOLD
  s = setMineAllocation(s, { GOLD: 2 });

  const goldBefore = getQty(s.resources, "GOLD");
  const staminaBefore = s.villagers.list.map((v) => v.stamina);

  const r = tickAllBuildings(s, 3); // 3 minutes

  const goldAfter = getQty(r.next.resources, "GOLD");
  const staminaAfter = r.next.villagers.list.map((v) => v.stamina);

  // 2 workers * 1 per min * 3 minutes = +6
  assert.equal(goldAfter, goldBefore + 6);
  assert.ok(staminaAfter.some((x, i) => x < staminaBefore[i]));
});