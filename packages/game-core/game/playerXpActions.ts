import { applyXpGain } from "../progression/applyXpGain.js";
import { applyPlayerXp, type PlayerXpResult } from "../progression/xp.js";
import type { XpGain } from "../progression/sources.js";
import type { GameState } from "./state.js";

export const PLAYER_LEVEL_SKILL_POINTS_GAIN_DISABLED = true;

export type AppliedPlayerXpGain = {
  next: GameState;
  player: PlayerXpResult;
  skillPointsGained: number;
};

export type AppliedGameXpGain = {
  next: GameState;
  player: PlayerXpResult;
  world: ReturnType<typeof applyXpGain>["world"];
  skillPointsGained: number;
};

export function applyPlayerXpGain(state: GameState, gainedXp: number): AppliedPlayerXpGain {
  const player = applyPlayerXp(state.progression.playerLevel, state.progression.playerXp, gainedXp);
  const nextWithProgression: GameState = {
    ...state,
    progression: {
      ...state.progression,
      playerLevel: player.newLevel,
      playerXp: player.newXp,
    },
  };

  return {
    next: nextWithProgression,
    player,
    // Legacy skillPoints still exist for the skill screen, but Phase 7 MVP player levels do not mint them.
    skillPointsGained: 0,
  };
}

export function applyGameXpGain(state: GameState, gain: XpGain): AppliedGameXpGain {
  const progression = applyXpGain(state.progression, gain);
  const nextWithProgression: GameState = {
    ...state,
    progression: progression.next,
  };

  return {
    ...progression,
    next: nextWithProgression,
    // Legacy skillPoints still exist for direct skill tests, but XP gain no longer awards them.
    skillPointsGained: 0,
  };
}
