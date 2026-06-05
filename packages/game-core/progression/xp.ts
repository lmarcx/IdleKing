// progression/xp.ts
import { xpNext, PLAYER_MAX_LEVEL } from "./xpCurve.js";

export type PlayerProgressionState = {
  playerLevel: number;
  playerXp: number;
};

export type PlayerXpResult = {
  newLevel: number;
  newXp: number;
  leveledUp: boolean;
  levelsGained: number;
};

export function applyPlayerXp(
  currentLevel: number,
  currentXp: number,
  gainedXp: number
): PlayerXpResult {
  let level = currentLevel;
  let xp = currentXp + Math.max(0, gainedXp);
  let gained = 0;

  while (level < PLAYER_MAX_LEVEL) {
    const toNext = xpNext(level);
    if (toNext <= 0) break;
    if (xp < toNext) break;

    xp -= toNext;
    level++;
    gained++;
  }

  if (level >= PLAYER_MAX_LEVEL) xp = 0;

  return {
    newLevel: level,
    newXp: xp,
    leveledUp: gained > 0,
    levelsGained: gained,
  };
}

export function getXpRequiredForPlayerLevel(level: number): number {
  return xpNext(level);
}

export function getPlayerLevelFromXp(xp: number): number {
  let level = 1;
  let remainingXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));

  while (level < PLAYER_MAX_LEVEL) {
    const required = getXpRequiredForPlayerLevel(level);
    if (required <= 0 || remainingXp < required) break;
    remainingXp -= required;
    level += 1;
  }

  return level;
}

export function addPlayerXp<T extends PlayerProgressionState>(state: T, amount: number): T {
  const player = applyPlayerXp(state.playerLevel, state.playerXp, amount);
  return {
    ...state,
    playerLevel: player.newLevel,
    playerXp: player.newXp,
  };
}
