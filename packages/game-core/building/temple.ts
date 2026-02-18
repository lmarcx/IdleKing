import { ageFromWorldLevel } from "../progression/age.js";

export type Resources = {
  wood: number;
  stone: number;
  water: number;
  gold: number;
};

export type TempleState = {
  unlocked: boolean;
  built: boolean;
  level: 1 | 2 | 3 | 4 | 5;
  assignedVillagers: number;
};

export const TEMPLE_MAX_LEVEL = 5;
export const TEMPLE_UNLOCK_CHAPTER = 2;

/**
 * Base construction cost for level 1 Temple
 */
export const TEMPLE_BASE_COST: Resources = {
  wood: 200,
  stone: 150,
  water: 100,
  gold: 300,
};

export function templeUpgradeCost(level: number): Resources {
  const L = Math.max(1, Math.floor(level));
  const multiplier = 1 + (L - 1) * 0.6;

  return {
    wood: Math.round(TEMPLE_BASE_COST.wood * multiplier),
    stone: Math.round(TEMPLE_BASE_COST.stone * multiplier),
    water: Math.round(TEMPLE_BASE_COST.water * multiplier),
    gold: Math.round(TEMPLE_BASE_COST.gold * multiplier),
  };
}

/**
 * TempleRateWXP(min)
 * Base: 10 * TempleLevel * (1 + 0.05*(Age-1))
 * Village bonus: +5% per villager (MVP)
 */
export function templeProductionPerMin(
  templeLevel: 1 | 2 | 3 | 4 | 5,
  worldLevel: number,
  assignedVillagers: number
): number {
  const age = ageFromWorldLevel(worldLevel);

  const base = 10 * templeLevel * (1 + 0.05 * (age - 1));

  const villagerMultiplier = 1 + assignedVillagers * 0.05;

  return Math.floor(base * villagerMultiplier);
}


/**
 * Simulation de la production de WXP du temple sur une période donnée, en tenant compte des upgrades et des villageois assignés.
 */
export function simulateTempleProduction(
  minutes: number,
  templeLevel: 1 | 2 | 3 | 4 | 5,
  worldLevel: number,
  assignedVillagers: number
): number {
  const perMin = templeProductionPerMin(
    templeLevel,
    worldLevel,
    assignedVillagers
  );

  return perMin * Math.max(0, Math.floor(minutes));
}
