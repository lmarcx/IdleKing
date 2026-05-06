import { createDefaultPlayerSkillsState } from "../combat/skills/index.js";
import { applyXpGain } from "../progression/applyXpGain.js";
import { applyPlayerXp, type PlayerXpResult } from "../progression/xp.js";
import type { XpGain } from "../progression/sources.js";
import type { WorldWxpResult } from "../progression/worldXp.js";
import type { GameState } from "./state.js";

export type AppliedPlayerXpGain = {
  next: GameState;
  player: PlayerXpResult;
  skillPointsGained: number;
};

export type AppliedGameXpGain = {
  next: GameState;
  player: PlayerXpResult;
  world: WorldWxpResult;
  skillPointsGained: number;
};

function addSkillPointsForPlayerLevels(state: GameState, levelsGained: number): GameState {
  const skills = state.skills ?? createDefaultPlayerSkillsState();
  const skillPointsGained = Math.max(0, Math.floor(levelsGained));

  if (skillPointsGained <= 0) return { ...state, skills };

  return {
    ...state,
    skills: {
      ...skills,
      skillPoints: Math.max(0, skills.skillPoints) + skillPointsGained,
    },
  };
}

export function applyPlayerXpGain(state: GameState, gainedXp: number): AppliedPlayerXpGain {
  const player = applyPlayerXp(state.progression.playerLevel, state.progression.playerXp, gainedXp);
  const skillPointsGained = Math.max(0, player.levelsGained);
  const nextWithProgression: GameState = {
    ...state,
    progression: {
      ...state.progression,
      playerLevel: player.newLevel,
      playerXp: player.newXp,
    },
  };

  return {
    next: addSkillPointsForPlayerLevels(nextWithProgression, skillPointsGained),
    player,
    skillPointsGained,
  };
}

export function applyGameXpGain(state: GameState, gain: XpGain): AppliedGameXpGain {
  const progression = applyXpGain(state.progression, gain);
  const skillPointsGained = Math.max(0, progression.player.levelsGained);
  const nextWithProgression: GameState = {
    ...state,
    progression: progression.next,
  };

  return {
    ...progression,
    next: addSkillPointsForPlayerLevels(nextWithProgression, skillPointsGained),
    skillPointsGained,
  };
}
