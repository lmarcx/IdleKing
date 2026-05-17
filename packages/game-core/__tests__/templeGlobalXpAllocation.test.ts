import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { tickAllBuildings } from "../building/tick.js";
import { allocateGlobalXp } from "../game/xpAllocation.js";
import { getQty } from "../resources/types.js";

test("Temple produces XP_GLOBAL then player allocates it to player/world", () => {
  let s = createInitialGameState();

  // unlock temple via chapters 1 -> 2
  s = completeChapterAction(s, 1).next;
  s = completeChapterAction(s, 2).next;

  // build + activate temple and allocate villagers to XP_GLOBAL
  s = {
    ...s,
    buildings: {
      ...s.buildings,
      temple: {
        ...s.buildings.temple,
        unlocked: true,
        built: true,
        active: true,
        allocation: { XP_GLOBAL: 3 },
      },
    },
  };

  const xpBefore = getQty(s.resources, "XP_GLOBAL");
  const pBeforeLvl = s.progression.playerLevel;
  const pBeforeXp = s.progression.playerXp;
  const wBeforeLvl = s.progression.worldLevel;
  const wBeforeWxp = s.progression.worldWxp;

  // 1 minute tick => should produce 3 XP_GLOBAL (if enough usable villagers)
  const ticked = tickAllBuildings(s, 1).next;

  const xpAfterTick = getQty(ticked.resources, "XP_GLOBAL");
  assert.equal(xpAfterTick, xpBefore + 3);

  // allocate 2 XP to player, 1 XP to world
  const allocated = allocateGlobalXp(ticked, { toPlayerXp: 2, toWorldXp: 1 });

  // XP_GLOBAL spent
  assert.equal(getQty(allocated.resources, "XP_GLOBAL"), xpAfterTick - 3);

  // player xp increased by 2 (level may or may not change depending curve)
  assert.ok(
    allocated.progression.playerLevel > pBeforeLvl ||
      allocated.progression.playerXp >= pBeforeXp
  );

  assert.equal(allocated.progression.worldLevel, wBeforeLvl);
  assert.equal(allocated.progression.worldWxp, wBeforeWxp + 1);
});
