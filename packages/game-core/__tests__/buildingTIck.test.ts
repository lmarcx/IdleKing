import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { tickAllBuildings } from "../building/tick.js";
import { getQty } from "../resources/types.js";

test("tickAllBuildings runs temple and consumes stamina on workers", () => {
  let s = createInitialGameState();

  // unlock temple via chapters 1 -> 2
  s = completeChapterAction(s, 1).next;
  s = completeChapterAction(s, 2).next;

  // build + activate + allocate villagers to XP_GLOBAL
  s = {
    ...s,
    buildings: {
      ...s.buildings,
      temple: {
        ...s.buildings.temple,
        built: true,
        active: true,
        allocation: { XP_GLOBAL: 2 },
      },
    },
  };

  const beforeXpGlobal = getQty(s.resources, "XP_GLOBAL");
  const beforeStamina = s.villagers.list.map((v) => v.stamina);

  const res = tickAllBuildings(s, 1);

  const afterXpGlobal = getQty(res.next.resources, "XP_GLOBAL");
  const afterStamina = res.next.villagers.list.map((v) => v.stamina);

  assert.equal(afterXpGlobal, beforeXpGlobal + 2);
  assert.ok(afterStamina.some((x, i) => x < beforeStamina[i]));
});