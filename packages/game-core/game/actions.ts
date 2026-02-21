import type { GameState } from "./state.js";
import { completeChapter } from "../story/engine.js";
import { applyXpGain } from "../progression/applyXpGain.js";
import { applyUnlocks } from "./unlocks.js";

export type CompleteChapterActionResult = {
  next: GameState;
  // infos utiles pour UI/log
  gainedXp: number;
  gainedWxp: number;
  unlocksApplied: string[];
};

export function completeChapterAction(
  state: GameState,
  chapterId: number
): CompleteChapterActionResult {
  const storyRes = completeChapter(state.story, chapterId as any);

  // apply xp + wxp
  const progRes = applyXpGain(state.progression, storyRes.gained);

  // build next state
  let next: GameState = {
    ...state,
    progression: progRes.next,
    story: storyRes.nextStory,
  };

  // apply unlocks
  next = applyUnlocks(next, storyRes.unlocksApplied);

  return {
    next,
    gainedXp: storyRes.gained.xp,
    gainedWxp: storyRes.gained.wxp,
    unlocksApplied: storyRes.unlocksApplied,
  };
}