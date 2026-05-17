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
  level: number;
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
 * Cap villageois : dépend du level du Temple et de l'Age.
 * - Base: 3 villagers / temple level
 * - Age bonus: +1 per Age (so Age I -> +1, Age V -> +5)
 * => cap = level*3 + age
 */
export function templeMaxVillagers(
  templeLevel: 1 | 2 | 3 | 4 | 5,
  worldLevel: number
): number {
  const age = ageFromWorldLevel(worldLevel);
  return templeLevel * 3 + age;
}

/**
 * Rendement décroissant exponentiel inverse (bonus saturant)
 * bonus = maxBonus * (1 - exp(-k * v))
 *
 * - maxBonus: cap du bonus (ex: 0.60 => +60% max)
 * - k: vitesse de saturation
 */
export function templeVillagerBonusMultiplier(
  assignedVillagers: number,
  maxBonus = 0.6,
  k = 0.25
): number {
  const v = Math.max(0, Math.floor(assignedVillagers));
  const bonus = maxBonus * (1 - Math.exp(-k * v));
  return 1 + bonus;
}

/**
 * TempleRateWXP(min)
 * Base: 10 * TempleLevel * (1 + 0.05*(Age-1))
 * Villagers: bonus saturant + cap villageois
 */
export function templeProductionPerMin(
  templeLevel: 1 | 2 | 3 | 4 | 5,
  worldLevel: number,
  assignedVillagers: number
): number {
  const age = ageFromWorldLevel(worldLevel);

  const base = 10 * templeLevel * (1 + 0.05 * (age - 1));

  const cap = templeMaxVillagers(templeLevel, worldLevel);
  const vCapped = Math.min(Math.max(0, Math.floor(assignedVillagers)), cap);

  const mult = templeVillagerBonusMultiplier(vCapped);

  return Math.floor(base * mult);
}

/**
 * Simulation de la production de WXP du temple sur une période donnée.
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
