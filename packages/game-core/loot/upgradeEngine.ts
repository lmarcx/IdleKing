import type { GeneratedItem } from "./itemGenerator.js";
import type { Element, CombatStats } from "../power/types.js";
import { computeItemPowerFromStats, emptyCombatStats } from "../power/itemScore.js";
import { tierFromWorldLevel } from "./budget.js";

export type UpgradeCost = {
  kingamas: number;
  materials: Array<{ id: string; amount: number }>;
};

export type UpgradeConfig = {
  maxUpgradeLevel: number;
  statPerLevelMultiplier: number; // ex: 0.06
  costGrowth: number; // ex: 1.35
  baseKingamas: number; // ex: 5
};

export const DEFAULT_UPGRADE_CONFIG: UpgradeConfig = {
  maxUpgradeLevel: 10,
  statPerLevelMultiplier: 0.06,
  costGrowth: 1.35,
  baseKingamas: 5,
};

const RARITY_FACTOR: Record<GeneratedItem["rarity"], number> = {
  COMMON: 1.0,
  RARE: 1.5,
  EPIC: 2.4,
  LEGENDARY: 4.0,
};

const TIER_FACTOR = [1, 2, 4, 7, 12] as const;

function scaleStats(base: GeneratedItem["baseStats"], multiplier: number) {
  const resists = base.resists ? { ...base.resists } : undefined;
  const elemental = base.elemental ? { ...base.elemental } : undefined;

  const scaled = {
    ...base,
    hp: base.hp != null ? base.hp * multiplier : undefined,
    attack: base.attack != null ? base.attack * multiplier : undefined,
    armor: base.armor != null ? base.armor * multiplier : undefined,
    critChance: base.critChance != null ? base.critChance * multiplier : undefined,
    critDmg: base.critDmg != null ? base.critDmg * multiplier : undefined,
    speedRating: base.speedRating != null ? base.speedRating * multiplier : undefined,
    pierceRating: base.pierceRating != null ? base.pierceRating * multiplier : undefined,
    resists,
    elemental,
  } as const;

  if (scaled.resists) {
    for (const k of Object.keys(scaled.resists)) {
      const key = k as Element;
      const v = scaled.resists[key];
      if (typeof v === "number") scaled.resists[key] = v * multiplier;
    }
  }

  if (scaled.elemental) {
    for (const k of Object.keys(scaled.elemental)) {
      const key = k as Element;
      const v = scaled.elemental[key];
      if (typeof v === "number") scaled.elemental[key] = v * multiplier;
    }
  }

  return scaled;
}

function toCombatStats(itemStats: GeneratedItem["stats"]): CombatStats {
  const base = emptyCombatStats();
  return {
    ...base,
    hp: Math.round(itemStats.hp ?? 0),
    attack: Number((itemStats.attack ?? 0).toFixed(4)),
    armor: Number((itemStats.armor ?? 0).toFixed(4)),
    resists: { ...base.resists, ...(itemStats.resists ?? {}) },
    elemental: { ...base.elemental, ...(itemStats.elemental ?? {}) },
    critChance: itemStats.critChance ?? 0,
    critDmg: 1.5 + (itemStats.critDmg ?? 0),
    speedRating: Math.round(itemStats.speedRating ?? 0),
    pierceRating: Math.round(itemStats.pierceRating ?? 0),
  };
}

export function getUpgradeCost(
  item: GeneratedItem,
  worldLevel: number,
  cfg: UpgradeConfig = DEFAULT_UPGRADE_CONFIG
): UpgradeCost {
  const next = item.upgradeLevel + 1;
  const tier = tierFromWorldLevel(worldLevel);
  const tierFactor = TIER_FACTOR[Math.max(0, Math.min(4, tier - 1))] ?? 1;

  const rarityFactor = RARITY_FACTOR[item.rarity] ?? 1;

  const kingamas = Math.round(
    cfg.baseKingamas * Math.pow(cfg.costGrowth, next) * tierFactor * rarityFactor
  );

  const matId = `mat_${item.element.toLowerCase()}_t${tier}`;
  const amount = Math.max(1, Math.round(1 + next * 0.6));

  return { kingamas, materials: [{ id: matId, amount }] };
}

export function canUpgrade(item: GeneratedItem, cfg: UpgradeConfig = DEFAULT_UPGRADE_CONFIG) {
  return item.upgradeLevel < cfg.maxUpgradeLevel;
}

export function applyUpgrade(
  item: GeneratedItem,
  worldLevel: number,
  cfg: UpgradeConfig = DEFAULT_UPGRADE_CONFIG
): GeneratedItem {
  if (!canUpgrade(item, cfg)) return item;

  const nextLevel = item.upgradeLevel + 1;
  const mult = 1 + cfg.statPerLevelMultiplier * nextLevel;

  // ✅ Always scale from baseStats (stable, monotonic)
  const nextStats = scaleStats(item.baseStats, mult);

  const tier = tierFromWorldLevel(worldLevel);
  const itemPower = computeItemPowerFromStats(toCombatStats(nextStats), tier);

  return {
    ...item,
    upgradeLevel: nextLevel,
    stats: nextStats,
    itemPower,
  };
}
