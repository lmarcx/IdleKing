import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { withUnlockedBuildings } from "./support/fixtures.js";
import { addQty, getQty } from "../resources/types.js";
import { recruitVillager, recruitVillagerCost } from "../game/forumRecruitActions.js";

function unlockAndBuildForum(s: ReturnType<typeof createInitialGameState>) {
  s = withUnlockedBuildings(s, ["FORUM"]);

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
  s = withUnlockedBuildings(s, ["FORUM"]);
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
    resources: addQty(addQty(s.resources, "tough_meat", cost.meat), "silver_ore", cost.gold),
  };

  const meatBefore = getQty(s.resources, "tough_meat");
  const goldBefore = getQty(s.resources, "silver_ore");

  const r = recruitVillager(s);
  assert.equal(r.ok, true);

  assert.equal(r.next.villagers.list.length, beforeCount + 1);
  assert.equal(r.next.villagers.list[beforeCount].stamina, 100);

  assert.equal(getQty(r.next.resources, "tough_meat"), meatBefore - cost.meat);
  assert.equal(getQty(r.next.resources, "silver_ore"), goldBefore - cost.gold);
});

test("recruitVillager fails if not enough resources", () => {
  let s = createInitialGameState();
  s = unlockAndBuildForum(s);

  const r = recruitVillager(s);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "NOT_ENOUGH_RESOURCES");
  assert.ok(r.cost);
});