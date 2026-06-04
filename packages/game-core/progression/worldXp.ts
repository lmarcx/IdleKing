import { ageCoeffFromWorldLevel, ageFromWorldLevel } from "./age.js";

export const WORLD_MAX_LEVEL = 50;

// DEFERRED balancing: Temple MVP player XP to WXP conversion ratio.
export const TEMPLE_PLAYER_XP_TO_WORLD_XP_RATIO = 1;

export type WorldProgressionState = {
  worldLevel: number;
  worldWxp: number;
};

/**
 * Converts Temple XP_GLOBAL into World XP (WXP).
 * Rule: WXP = floor(XP_GLOBAL) at a 1:1 rate.
 */
export function convertXpToWxp(xpGained: number): number {
  return Math.floor(Math.max(0, xpGained));
}

export function convertPlayerXpToWxp(playerXp: number): number {
  return Math.floor(Math.max(0, playerXp) * TEMPLE_PLAYER_XP_TO_WORLD_XP_RATIO);
}

/**
 * Returns the WXP cost to reach the next world level.
 * Formula: WXP_to_next(W) = round( 140 * W^2.2 * AgeCoeff(W) )
 */
export function wxpNext(worldLevel: number): number {
  const W = Math.max(1, Math.floor(worldLevel));
  if (W >= WORLD_MAX_LEVEL) return 0;

  const base = 140 * Math.pow(W, 2.2);
  const coeff = ageCoeffFromWorldLevel(W);
  return Math.round(base * coeff);
}

export function getWorldXpRequired(level: number): number {
  return wxpNext(level);
}

export function getWorldLevelFromXp(xp: number): number {
  let level = 1;
  let remainingWxp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));

  while (level < WORLD_MAX_LEVEL) {
    const required = getWorldXpRequired(level);
    if (required <= 0 || remainingWxp < required) break;
    remainingWxp -= required;
    level += 1;
  }

  return level;
}

/**
 * Result shape used by rank-up helpers (single or looped).
 */
export type WorldWxpResult = {
  newWorldLevel: number;
  newWorldWxp: number;
  leveledUp: boolean;
  levelsGained: number;
};

/**
 * Adds WXP to the world progression WITHOUT leveling up.
 * This is the "bank" behavior. Rank-ups are handled elsewhere (e.g. Forum).
 */
export function addWorldWxp(
  currentWorldLevel: number,
  currentWorldWxp: number,
  gainedWxp: number
): { newWorldLevel: number; newWorldWxp: number } {
  const level = Math.max(1, Math.floor(currentWorldLevel));
  const wxp = Math.max(0, Math.floor(currentWorldWxp));
  const gain = Math.max(0, Math.floor(gainedWxp));

  return {
    newWorldLevel: level,
    newWorldWxp: wxp + gain,
  };
}

export function addWorldXp<T extends WorldProgressionState>(state: T, amount: number): T {
  const world = addWorldWxp(state.worldLevel, state.worldWxp, amount);
  return {
    ...state,
    worldLevel: world.newWorldLevel,
    worldWxp: world.newWorldWxp,
  };
}

/**
 * Returns whether the current WXP bank is sufficient to rank up once.
 */
export function canRankUpWorld(worldLevel: number, worldWxp: number): boolean {
  const level = Math.max(1, Math.floor(worldLevel));
  if (level >= WORLD_MAX_LEVEL) return false;

  const need = wxpNext(level);
  return Math.max(0, Math.floor(worldWxp)) >= need;
}

/**
 * Ranks up the world ONCE if possible.
 * Consumes the required WXP and increments level by 1.
 */
export function rankUpWorldOnce(
  currentWorldLevel: number,
  currentWorldWxp: number
): { newWorldLevel: number; newWorldWxp: number; rankedUp: boolean } {
  const level = Math.max(1, Math.floor(currentWorldLevel));
  const wxp = Math.max(0, Math.floor(currentWorldWxp));

  if (!canRankUpWorld(level, wxp)) {
    return { newWorldLevel: level, newWorldWxp: wxp, rankedUp: false };
  }

  const need = wxpNext(level);
  return {
    newWorldLevel: Math.min(WORLD_MAX_LEVEL, level + 1),
    newWorldWxp: wxp - need,
    rankedUp: true,
  };
}

/**
 * Ranks up the world as many times as possible in a loop.
 * Useful for legacy behavior or debug, but production can use Forum to apply single rank-ups.
 */
export function rankUpWorldMax(
  currentWorldLevel: number,
  currentWorldWxp: number
): WorldWxpResult {
  let level = Math.max(1, Math.floor(currentWorldLevel));
  let wxp = Math.max(0, Math.floor(currentWorldWxp));
  let gained = 0;

  while (canRankUpWorld(level, wxp)) {
    const need = wxpNext(level);
    wxp -= need;
    level += 1;
    gained += 1;

    if (level >= WORLD_MAX_LEVEL) break;
  }

  if (level >= WORLD_MAX_LEVEL) wxp = 0;

  return {
    newWorldLevel: level,
    newWorldWxp: wxp,
    leveledUp: gained > 0,
    levelsGained: gained,
  };
}

/**
 * Legacy helper: adds WXP and auto-levels up immediately.
 * Kept for backward compatibility, but new design should use:
 * - addWorldWxp(...) to accumulate
 * - rankUpWorldOnce(...) (via Forum) to perform rank-ups
 */
export function applyWorldWxp(
  currentWorldLevel: number,
  currentWorldWxp: number,
  gainedWxp: number
): WorldWxpResult {
  const added = addWorldWxp(currentWorldLevel, currentWorldWxp, gainedWxp);
  return rankUpWorldMax(added.newWorldLevel, added.newWorldWxp);
}

/**
 * Reward multiplier derived from world level.
 * Formula: RewardMult = 1 + 0.03 * (WorldLevel-1)
 */
export function rewardMultiplierFromWorldLevel(worldLevel: number): number {
  const W = Math.max(1, Math.floor(worldLevel));
  return 1 + 0.03 * (W - 1);
}

/**
 * Temple base WXP rate reference (used in earlier design).
 * Still kept as a utility for balancing, even if Temple now produces XP_GLOBAL.
 * Formula: 10 * TempleLevel * (1 + 0.05*(Age-1))
 */
export function templeRateWxpPerMin(
  templeLevel: 1 | 2 | 3 | 4 | 5,
  worldLevel: number
): number {
  const age = ageFromWorldLevel(worldLevel);
  return 10 * templeLevel * (1 + 0.05 * (age - 1));
}

/**
 * Total WXP required to reach a given world level from level 1.
 * Example: totalWxpToReach(50) = sum wxpNext(1..49)
 */
export function totalWxpToReach(targetWorldLevel: number): number {
  const target = Math.min(WORLD_MAX_LEVEL, Math.max(1, Math.floor(targetWorldLevel)));

  let total = 0;
  for (let w = 1; w < target; w++) {
    total += wxpNext(w);
  }
  return total;
}

/**
 * Total WXP required to reach WORLD_MAX_LEVEL from level 1.
 */
export function totalWxpToMax(): number {
  return totalWxpToReach(WORLD_MAX_LEVEL);
}
