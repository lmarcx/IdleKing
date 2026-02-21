import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { tickAllBuildings } from "../building/tick.js";

test("tickAllBuildings runs temple when unlocked+built+assigned", () => {
  let s = createInitialGameState();

  // unlock temple via chapters 1 -> 2
  s = completeChapterAction(s, 1).next;
  s = completeChapterAction(s, 2).next;

  // build + assign villagers
  s = {
    ...s,
    buildings: {
      ...s.buildings,
      temple: { ...s.buildings.temple, built: true, assignedVillagers: 2 },
    },
  };

  const beforeW = s.progression.worldWxp;
  const res = tickAllBuildings(s, 3); // 3 minutes
  const afterW = res.next.progression.worldWxp;

  assert.ok(afterW >= beforeW);
  assert.ok(res.logs.length > 0);
});