import type { GameState } from "../game/state.js";
import { completeStoryEvent, getStoryFlags } from "./progressionMvp.js";

/**
 * Story flag set once the opening cinematic has been watched (or skipped).
 * Persisted through `story.completedEvents`, which the save layer already
 * serializes, so the start-flow survives a reload.
 */
export const INTRO_SEEN_FLAG = "intro_seen";

/** Flag produced by clearing the prologue dungeon (see progressionMvp). */
export const PROLOGUE_COMPLETE_FLAG = "prologue_complete";

/**
 * Where a player should land when entering the game. Derived purely from story
 * flags so it is deterministic and resumes correctly after a reload.
 */
export type StartFlowStep = "cinematic" | "prologue" | "kingdom";

/** Mark the opening cinematic as seen. Idempotent. */
export function markIntroSeen(state: GameState): GameState {
  if (getStoryFlags(state).has(INTRO_SEEN_FLAG)) return state;
  return completeStoryEvent(state, INTRO_SEEN_FLAG);
}

export function hasSeenIntro(state: GameState): boolean {
  return getStoryFlags(state).has(INTRO_SEEN_FLAG);
}

export function isPrologueComplete(state: GameState): boolean {
  return getStoryFlags(state).has(PROLOGUE_COMPLETE_FLAG);
}

/**
 * Opening flow state machine:
 * - cinematic until the intro has been seen,
 * - then the playable prologue until it is cleared,
 * - then the kingdom.
 */
export function getStartFlowStep(state: GameState): StartFlowStep {
  if (!hasSeenIntro(state)) return "cinematic";
  if (!isPrologueComplete(state)) return "prologue";
  return "kingdom";
}
