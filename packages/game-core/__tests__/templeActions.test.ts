import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { convertTempleGlobalXp } from "../game/templeActions.js";
import { xpNext } from "../progression/xpCurve.js";
import { getQty } from "../resources/types.js";

function builtTempleState(resources: ReturnType<typeof createInitialGameState>["resources"] = {}) {
  const state = createInitialGameState();
  return {
    ...state,
    resources,
    buildings: {
      ...state.buildings,
      temple: {
        ...state.buildings.temple,
        unlocked: true,
        built: true,
        active: true,
      },
    },
  };
}

test("Temple converts XP_GLOBAL to playerXp", () => {
  const state = builtTempleState({ XP_GLOBAL: 10 });

  const result = convertTempleGlobalXp(state, "playerXp", 6);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.next.progression.playerXp, 6);
  assert.equal(getQty(result.next.resources, "XP_GLOBAL"), 4);
});

test("Temple consumes XP_GLOBAL", () => {
  const state = builtTempleState({ XP_GLOBAL: 8 });

  const result = convertTempleGlobalXp(state, "playerXp", 3);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(getQty(result.next.resources, "XP_GLOBAL"), 5);
});

test("Temple levels up player when threshold is reached", () => {
  const threshold = xpNext(1);
  const state = builtTempleState({ XP_GLOBAL: threshold });

  const result = convertTempleGlobalXp(state, "playerXp", threshold);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.next.progression.playerLevel, 2);
  assert.equal(result.next.progression.playerXp, 0);
  assert.equal(result.player?.leveledUp, true);
});

test("Temple converts XP_GLOBAL to worldWxp without automatic rank up", () => {
  const base = builtTempleState({ XP_GLOBAL: 10 });
  const state = {
    ...base,
    progression: {
      ...base.progression,
      worldLevel: 1,
      worldWxp: 139,
    },
  };

  const result = convertTempleGlobalXp(state, "worldWxp", 10);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.next.progression.worldLevel, 1);
  assert.equal(result.next.progression.worldWxp, 149);
  assert.equal(getQty(result.next.resources, "XP_GLOBAL"), 0);
});

test("Temple refuses conversion when XP_GLOBAL is insufficient", () => {
  const state = builtTempleState({ XP_GLOBAL: 2 });

  const result = convertTempleGlobalXp(state, "worldWxp", 3);

  assert.equal(result.ok, false);
  assert.equal(result.next, state);
  if (result.ok) return;
  assert.equal(result.reason, "NOT_ENOUGH_XP_GLOBAL");
});

test("Temple refuses conversion when unlocked but not built", () => {
  const base = createInitialGameState();
  const state = {
    ...base,
    resources: { XP_GLOBAL: 5 },
    buildings: {
      ...base.buildings,
      temple: {
        ...base.buildings.temple,
        unlocked: true,
        built: false,
      },
    },
  };

  const result = convertTempleGlobalXp(state, "playerXp", 5);

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "TEMPLE_NOT_BUILT");
});
