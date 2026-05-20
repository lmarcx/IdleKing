import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { allocateGlobalXp } from "../game/xpAllocation.js";
import { addQty, getQty } from "../resources/types.js";

test("Temple manual XP_GLOBAL allocation routes existing XP to player and world", () => {
  const state = {
    ...createInitialGameState(),
    resources: addQty({}, "XP_GLOBAL", 3),
  };

  const xpBefore = getQty(state.resources, "XP_GLOBAL");
  const playerLevelBefore = state.progression.playerLevel;
  const playerXpBefore = state.progression.playerXp;
  const worldLevelBefore = state.progression.worldLevel;
  const worldWxpBefore = state.progression.worldWxp;

  const allocated = allocateGlobalXp(state, { toPlayerXp: 2, toWorldXp: 1 });

  assert.equal(getQty(allocated.resources, "XP_GLOBAL"), xpBefore - 3);
  assert.ok(
    allocated.progression.playerLevel > playerLevelBefore ||
      allocated.progression.playerXp >= playerXpBefore,
  );
  assert.equal(allocated.progression.worldLevel, worldLevelBefore);
  assert.equal(allocated.progression.worldWxp, worldWxpBefore + 1);
});
