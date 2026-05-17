import type { GameState } from "./state.js";
import { canRankUpWorld, rankUpWorldOnce } from "../progression/worldXp.js";
import { refillWorldResources } from "../world/worldResources.js";
import { refreshAllBuildingStatuses } from "../building/progression.js";

export type ForumRankUpWorldResult = {
  next: GameState;
  rankedUp: boolean;
  reason?: "FORUM_LOCKED" | "FORUM_NOT_BUILT" | "NOT_ENOUGH_WXP" | "AT_MAX_LEVEL";
};

/**
 * Performs a manual World Rank Up through the Forum.
 * WXP is treated as a bank; rank-ups are explicit actions instead of automatic leveling.
 */
export function forumRankUpWorld(state: GameState): ForumRankUpWorldResult {
  if (!state.buildings.forum.unlocked) {
    return { next: state, rankedUp: false, reason: "FORUM_LOCKED" };
  }
  if (!state.buildings.forum.built) {
    return { next: state, rankedUp: false, reason: "FORUM_NOT_BUILT" };
  }

  const level = state.progression.worldLevel;
  const wxp = state.progression.worldWxp;

  if (level >= 50) {
    return { next: state, rankedUp: false, reason: "AT_MAX_LEVEL" };
  }
  if (!canRankUpWorld(level, wxp)) {
    return { next: state, rankedUp: false, reason: "NOT_ENOUGH_WXP" };
  }

  const r = rankUpWorldOnce(level, wxp);
  if (!r.rankedUp) {
    return { next: state, rankedUp: false, reason: "NOT_ENOUGH_WXP" };
  }

  const next: GameState = {
    ...state,
    progression: {
      ...state.progression,
      worldLevel: r.newWorldLevel,
      worldWxp: r.newWorldWxp,
    },
    world: refillWorldResources(state.world, r.newWorldLevel),
  };

  return {
    rankedUp: true,
    next: refreshAllBuildingStatuses(next, r.newWorldLevel),
  };
}
