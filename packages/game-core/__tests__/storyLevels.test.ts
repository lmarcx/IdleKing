import test from "node:test";
import assert from "node:assert/strict";

import { createEmptyStoryState } from "../story/state.js";
import {
  completeStoryLevel,
  getStoryLevelStatus,
  getVisibleStoryChaptersWithLevels,
  isStoryLevelAvailable,
} from "../story/levels.js";
import type { StoryState } from "../story/state.js";
import type { UnlockId } from "../story/types.js";

function withUnlockedChapter(chapterId: number): StoryState {
  return {
    ...createEmptyStoryState(),
    unlocked: new Set<UnlockId>([`CHAPTER_${chapterId}` as UnlockId]),
  };
}

test("story level 1 is available when its chapter is unlocked", () => {
  const state = withUnlockedChapter(2);

  assert.equal(isStoryLevelAvailable(state, "ch02-lv01"), true);
  assert.equal(getStoryLevelStatus(state, "ch02-lv01"), "available");
});

test("story level 2 is locked until level 1 is completed", () => {
  const state = withUnlockedChapter(2);

  assert.equal(isStoryLevelAvailable(state, "ch02-lv02"), false);
  assert.equal(getStoryLevelStatus(state, "ch02-lv02"), "locked");
});

test("story level 2 becomes available after level 1 completion", () => {
  const state = completeStoryLevel(withUnlockedChapter(2), "ch02-lv01");

  assert.equal(isStoryLevelAvailable(state, "ch02-lv02"), true);
  assert.equal(getStoryLevelStatus(state, "ch02-lv02"), "available");
});

test("required special story level is available after all standard levels are completed", () => {
  let state = withUnlockedChapter(2);
  state = completeStoryLevel(state, "ch02-lv01");
  state = completeStoryLevel(state, "ch02-lv02");
  state = completeStoryLevel(state, "ch02-lv03");

  assert.equal(isStoryLevelAvailable(state, "ch02-sp01"), true);
  assert.equal(getStoryLevelStatus(state, "ch02-sp01"), "available");
});

test("visible story chapter levels do not expose internal events", () => {
  const state = withUnlockedChapter(2);
  const chapters = getVisibleStoryChaptersWithLevels(state);
  const chapter2 = chapters.find((chapter) => chapter.id === 2);

  assert.ok(chapter2);
  assert.ok(chapter2.levels.length > 0);
  assert.equal("events" in chapter2.levels[0], false);
});
