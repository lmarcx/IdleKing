import type { GameState } from "./state.js";
import { completeChapter } from "../story/engine.js";
import { applyUnlocks } from "./unlocks.js";
import { applyGameXpGain } from "./playerXpActions.js";

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
  const progRes = applyGameXpGain(state, storyRes.gained);

  // build next state
  let next: GameState = {
    ...progRes.next,
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
