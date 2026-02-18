import { ageCoeffFromWorldLevel, ageFromWorldLevel } from "./age.js";

export const WORLD_MAX_LEVEL = 50;

// WXP = floor(XP_gained * 0.10)
export function convertXpToWxp(xpGained: number): number {
  return Math.floor(Math.max(0, xpGained) * 0.10);
}

// WXP_to_next(W) = round( 140 * W^2.2 * AgeCoeff(W) )
export function wxpNext(worldLevel: number): number {
  const W = Math.max(1, Math.floor(worldLevel));
  if (W >= WORLD_MAX_LEVEL) return 0;

  const base = 140 * Math.pow(W, 2.2);
  const coeff = ageCoeffFromWorldLevel(W);
  return Math.round(base * coeff);
}

export type WorldWxpResult = {
  newWorldLevel: number;
  newWorldWxp: number;
  leveledUp: boolean;
  levelsGained: number;
};

export function applyWorldWxp(
  currentWorldLevel: number,
  currentWorldWxp: number,
  gainedWxp: number
): WorldWxpResult {
  let level = Math.max(1, Math.floor(currentWorldLevel));
  let wxp = Math.max(0, currentWorldWxp) + Math.max(0, gainedWxp);
  let gained = 0;

  while (level < WORLD_MAX_LEVEL) {
    const toNext = wxpNext(level);
    if (toNext <= 0) break;
    if (wxp < toNext) break;

    wxp -= toNext;
    level += 1;
    gained += 1;
  }

  if (level >= WORLD_MAX_LEVEL) wxp = 0;

  return {
    newWorldLevel: level,
    newWorldWxp: wxp,
    leveledUp: gained > 0,
    levelsGained: gained,
  };
}

// RewardMult = 1 + 0.03 * (WorldLevel-1)
export function rewardMultiplierFromWorldLevel(worldLevel: number): number {
  const W = Math.max(1, Math.floor(worldLevel));
  return 1 + 0.03 * (W - 1);
}

// TempleRateWXP(min) = 10 * TempleLevel * (1 + 0.05 * (Age-1))
export function templeRateWxpPerMin(
  templeLevel: 1 | 2 | 3 | 4 | 5,
  worldLevel: number
): number {
  const age = ageFromWorldLevel(worldLevel);
  return 10 * templeLevel * (1 + 0.05 * (age - 1));
}
