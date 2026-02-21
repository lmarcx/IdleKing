import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";

test("completeChapterAction applies XP + unlocks", () => {
  const s0 = createInitialGameState();

  const r1 = completeChapterAction(s0, 1);
  assert.equal(r1.gainedXp, 2500);
  assert.ok(r1.next.story.unlocked.has("FARM"));
  assert.ok(r1.next.story.unlocked.has("MINE"));
  assert.ok(r1.next.story.unlocked.has("KITCHEN"));

  const r2 = completeChapterAction(r1.next, 2);
  assert.ok(r2.next.story.unlocked.has("TEMPLE"));
  assert.equal(r2.next.buildings.temple.unlocked, true);
});