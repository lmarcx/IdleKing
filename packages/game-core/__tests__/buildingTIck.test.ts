import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { tickAllBuildings } from "../building/tick.js";

test("tickAllBuildings runs temple and consumes stamina on workers", () => {
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
  const beforeStamina = s.villagers.list.map((v) => v.stamina);

  const res = tickAllBuildings(s, 1); // 1 minute

  const afterW = res.next.progression.worldWxp;
  const afterStamina = res.next.villagers.list.map((v) => v.stamina);

  assert.ok(afterW >= beforeW);
  assert.ok(res.logs.length > 0);

  // au moins un villageois doit avoir perdu de la stamina (workers)
  assert.ok(afterStamina.some((x, i) => x < beforeStamina[i]));
});