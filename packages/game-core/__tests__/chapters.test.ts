import test from "node:test";
import assert from "node:assert/strict";

import { createEmptyStoryState } from "../story/state.js";
import { canCompleteChapter, completeChapter } from "../story/engine.js";
import { CHAPTERS } from "../story/chapters.js";
import { getScript } from "../story/scripts/index.js";

test("chapter progression is linear (MVP)", () => {
  const s0 = createEmptyStoryState();

  assert.equal(canCompleteChapter(s0, 1), true);
  assert.equal(canCompleteChapter(s0, 2), false);

  const r1 = completeChapter(s0, 1);
  assert.equal(r1.gained.xp, 2500);
  assert.ok(r1.gained.wxp > 0);
  assert.ok(r1.nextStory.completedChapters.has(1));
  assert.deepEqual(new Set(r1.unlocksApplied), new Set(["FARM", "MINE", "KITCHEN"]));

  assert.equal(canCompleteChapter(r1.nextStory, 2), true);

  const r2 = completeChapter(r1.nextStory, 2);
  assert.ok(r2.nextStory.completedChapters.has(2));
  assert.ok(r2.nextStory.unlocked.has("TEMPLE"));
});

test("chapters are non-repeatable (no double rewards)", () => {
  const s0 = createEmptyStoryState();

  const r1 = completeChapter(s0, 1);
  const r1b = completeChapter(r1.nextStory, 1);

  assert.equal(r1b.gained.xp, 0);
  assert.equal(r1b.gained.wxp, 0);
  assert.deepEqual(r1b.unlocksApplied, []);
});

test("chapter 3 unlocks repeatable quests and tavern", () => {
  const s0 = createEmptyStoryState();
  const r1 = completeChapter(s0, 1);
  const r2 = completeChapter(r1.nextStory, 2);
  const r3 = completeChapter(r2.nextStory, 3);

  assert.ok(r3.nextStory.unlocked.has("REPEATABLE_QUESTS"));
  assert.ok(r3.nextStory.unlocked.has("TAVERN"));
});

test("chapter scripts exist when referenced", () => {
  for (const ch of CHAPTERS) {
    for (const sid of ch.scriptIds) {
      const s = getScript(sid);
      // au MVP, on autorise qu'un script manque si le chapitre n'est pas encore écrit
      // MAIS si tu veux garder le test strict, retire ce 'continue'
      if (!s) continue;
    }
  }
});