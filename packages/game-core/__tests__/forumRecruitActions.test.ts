import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { addQty, getQty } from "../resources/types.js";
import { recruitVillager, recruitVillagerCost } from "../game/forumRecruitActions.js";

function unlockAndBuildForum(s: ReturnType<typeof createInitialGameState>) {
  s = completeChapterAction(s, 1).next;

  s = {
    ...s,
    buildings: {
      ...s.buildings,
      forum: { ...s.buildings.forum, built: true, active: true },
    },
  };

  return s;
}

test("recruitVillager requires Forum unlocked and built", () => {
  let s = createInitialGameState();

  // Locked
  {
    const r = recruitVillager(s);
    assert.equal(r.ok, false);
    assert.equal(r.reason, "FORUM_LOCKED");
  }

  // Unlocked but not built
  s = completeChapterAction(s, 1).next;
  {
    const r = recruitVillager(s);
    assert.equal(r.ok, false);
    assert.equal(r.reason, "FORUM_NOT_BUILT");
  }
});

test("recruitVillager spends resources and adds a villager with full stamina", () => {
  let s = createInitialGameState();
  s = unlockAndBuildForum(s);

  const beforeCount = s.villagers.list.length;
  const cost = recruitVillagerCost(beforeCount);

  // Provide enough resources for the current cost.
  s = {
    ...s,
    resources: addQty(addQty(s.resources, "MEAT", cost.meat), "GOLD", cost.gold),
  };

  const meatBefore = getQty(s.resources, "MEAT");
  const goldBefore = getQty(s.resources, "GOLD");

  const r = recruitVillager(s);
  assert.equal(r.ok, true);

  assert.equal(r.next.villagers.list.length, beforeCount + 1);
  assert.equal(r.next.villagers.list[beforeCount].stamina, 100);

  assert.equal(getQty(r.next.resources, "MEAT"), meatBefore - cost.meat);
  assert.equal(getQty(r.next.resources, "GOLD"), goldBefore - cost.gold);
});

test("recruitVillager fails if not enough resources", () => {
  let s = createInitialGameState();
  s = unlockAndBuildForum(s);

  const r = recruitVillager(s);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "NOT_ENOUGH_RESOURCES");
  assert.ok(r.cost);
});