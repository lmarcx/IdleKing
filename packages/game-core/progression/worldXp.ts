import { ageCoeffFromWorldLevel, ageFromWorldLevel } from "./age";

export const WORLD_MAX_LEVEL = 50;

// WXP = floor(XP_gained * 0.10)
export function convertXpToWxp(xpGained: number): number {
  return Math.floor(Math.max(0, xpGained) * 0.10);
}

// WXP_to_next(W) = round( 140 * W^2.2 * AgeCoeff(W) )
export function wxpToNextWorldLevel(worldLevel: number): number {
  if (worldLevel < 1 || worldLevel >= WORLD_MAX_LEVEL) return 0;
  const base = 140 * Math.pow(worldLevel, 2.2);
  const coeff = ageCoeffFromWorldLevel(worldLevel);
  return Math.round(base * coeff);
}

// RewardMult = 1 + 0.03 * (WorldLevel-1)
export function rewardMultiplierFromWorldLevel(worldLevel: number): number {
  if (worldLevel < 1) return 1;
  return 1 + 0.03 * (worldLevel - 1);
}

// ilvlMax = 20 * WorldLevel (cap loot system 1000)
export function ilvlMaxFromWorldLevel(worldLevel: number): number {
  return Math.min(1000, 20 * Math.max(1, worldLevel));
}

// TempleRateWXP(min) = 10 * TempleLevel * (1 + 0.05 * (Age-1))
export function templeRateWxpPerMin(
  templeLevel: 1 | 2 | 3 | 4 | 5,
  worldLevel: number
): number {
  const age = ageFromWorldLevel(worldLevel);
  return 10 * templeLevel * (1 + 0.05 * (age - 1));
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
  let level = currentWorldLevel;
  let wxp = currentWorldWxp + Math.max(0, gainedWxp);
  let gained = 0;

  while (level < WORLD_MAX_LEVEL) {
    const toNext = wxpToNextWorldLevel(level);
    if (toNext <= 0) break;
    if (wxp < toNext) break;
    wxp -= toNext;
    level += 1;
    gained += 1;
  }

  if (level >= WORLD_MAX_LEVEL) wxp = 0;

  return { newWorldLevel: level, newWorldWxp: wxp, leveledUp: gained > 0, levelsGained: gained };
}
