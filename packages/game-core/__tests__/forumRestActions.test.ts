import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { completeChapterAction } from "../game/actions.js";
import { restVillager, REST_STAMINA_GAIN } from "../game/forumRestActions.js";

function unlockAndBuildForum(s: ReturnType<typeof createInitialGameState>) {
  // Chapter 1 unlocks Forum in MVP.
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

test("restVillager requires Forum unlocked and built", () => {
  let s = createInitialGameState();

  // Locked
  {
    const r = restVillager(s, "v1");
    assert.equal(r.ok, false);
    assert.equal(r.reason, "FORUM_LOCKED");
  }

  // Unlocked but not built
  s = completeChapterAction(s, 1).next;
  {
    const r = restVillager(s, "v1");
    assert.equal(r.ok, false);
    assert.equal(r.reason, "FORUM_NOT_BUILT");
  }
});

test("restVillager restores stamina up to cap 100", () => {
  let s = createInitialGameState();
  s = unlockAndBuildForum(s);

  // Set villager stamina low
  s = {
    ...s,
    villagers: {
      list: s.villagers.list.map((v, i) => (i === 0 ? { ...v, stamina: 40 } : v)),
    },
  };

  const before = s.villagers.list[0].stamina;
  const r = restVillager(s, s.villagers.list[0].id);

  assert.equal(r.ok, true);
  const after = r.next.villagers.list[0].stamina;
  assert.equal(after, Math.min(100, before + REST_STAMINA_GAIN));
});

test("restVillager fails if stamina already full", () => {
  let s = createInitialGameState();
  s = unlockAndBuildForum(s);

  const r = restVillager(s, s.villagers.list[0].id);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "ALREADY_FULL");
});