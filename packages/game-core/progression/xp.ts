// progression/xp.ts
import { xpNext, PLAYER_MAX_LEVEL } from "./xpCurve.js";

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
