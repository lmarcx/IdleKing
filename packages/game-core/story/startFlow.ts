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

/** Flag produced by clearing the prologue dungeon — the Kingdom is found. */
export const KINGDOM_DISCOVERED_FLAG = "kingdom_discovered";

/** Set once the one-time Kingdom arrival dialogue has been shown. */
export const KINGDOM_ARRIVAL_SEEN_FLAG = "kingdom_arrival_seen";

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

/** Mark the one-time Kingdom arrival dialogue as shown. Idempotent. */
export function markKingdomArrivalSeen(state: GameState): GameState {
  if (getStoryFlags(state).has(KINGDOM_ARRIVAL_SEEN_FLAG)) return state;
  return completeStoryEvent(state, KINGDOM_ARRIVAL_SEEN_FLAG);
}

/**
 * The Kingdom arrival dialogue plays once, the first time the player reaches the
 * Kingdom after discovering it at the end of the prologue.
 */
export function shouldShowKingdomArrival(state: GameState): boolean {
  const flags = getStoryFlags(state);
  return flags.has(KINGDOM_DISCOVERED_FLAG) && !flags.has(KINGDOM_ARRIVAL_SEEN_FLAG);
}
