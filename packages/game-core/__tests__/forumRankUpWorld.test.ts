import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { addWorldWxp, wxpNext } from "../progression/worldXp.js";
import { forumRankUpWorld } from "../game/forumActions.js";

test("Forum rank-up requires forum unlocked and built", () => {
  let s = createInitialGameState();

  // Without unlock
  {
    const r = forumRankUpWorld(s);
    assert.equal(r.rankedUp, false);
    assert.equal(r.reason, "FORUM_LOCKED");
  }

  // Unlock forum via chapter 1
  s = completeChapterAction(s, 1).next;

  // Still not built
  {
    const r = forumRankUpWorld(s);
    assert.equal(r.rankedUp, false);
    assert.equal(r.reason, "FORUM_NOT_BUILT");
  }

  // Build forum
  s = {
    ...s,
    buildings: {
      ...s.buildings,
      forum: { ...s.buildings.forum, built: true },
    },
  };

  // Not enough WXP
  {
    const r = forumRankUpWorld(s);
    assert.equal(r.rankedUp, false);
    assert.equal(r.reason, "NOT_ENOUGH_WXP");
  }

  // Add enough WXP to rank up once
  const need = wxpNext(s.progression.worldLevel);
  const banked = addWorldWxp(s.progression.worldLevel, s.progression.worldWxp, need);

  s = {
    ...s,
    progression: {
      ...s.progression,
      worldLevel: banked.newWorldLevel,
      worldWxp: banked.newWorldWxp,
    },
  };

  const r2 = forumRankUpWorld(s);
  assert.equal(r2.rankedUp, true);
  assert.ok(r2.next.progression.worldWxp < s.progression.worldWxp);
  assert.equal(
  r2.next.progression.worldLevel,
  s.progression.worldLevel + 1
);
});