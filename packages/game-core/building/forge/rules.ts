import type { WalletState } from "../../currencies/types.js";
import {
  EQUIPMENT_UPGRADE_CAP_BY_RARITY,
  getUpgradeCapForRarity,
} from "../../equipment/rules.js";
import type { EquipmentItem, EquipmentStats, ItemRarity, NonEquipmentItem } from "../../items/types.js";
import type { SeededRng } from "../../random/index.js";
import type { ResourceStock } from "../../resources/types.js";

export const FORGE_UPGRADE_BREAKPOINTS = [3, 6, 9, 12] as const;

export const FORGE_RARITY_UPGRADE_CAP = EQUIPMENT_UPGRADE_CAP_BY_RARITY;

export const FORGE_CRAFT_RARITIES: readonly ItemRarity[] = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
] as const;

export const FORGE_CRAFT_BASE_RARITY_WEIGHTS: Readonly<Record<ItemRarity, number>> = {
  COMMON: 50,
  UNCOMMON: 25,
  RARE: 15,
  EPIC: 8,
  LEGENDARY: 2,
};

/**
 * DEFERRED balancing: Phase 6 only locks the direction of the curve.
 * Higher Forge Level shifts weight from Common/Uncommon into Rare+.
 */
export const FORGE_CRAFT_RARITY_WEIGHT_SHIFT_PER_LEVEL: Readonly<Record<ItemRarity, number>> = {
  COMMON: -1.2,
  UNCOMMON: -0.25,
  RARE: 0.75,
  EPIC: 0.45,
  LEGENDARY: 0.25,
};

// DEFERRED balancing: locked recycle model, placeholder Precious Stone rate.
export const FORGE_PRECIOUS_STONE_DROP_CHANCE = 0.2;

const FORGE_UPGRADE_STAT_RATE: Record<ItemRarity, number> = {
  COMMON: 0.05,
  UNCOMMON: 0.05,
  RARE: 0.05,
  EPIC: 0.055,
  LEGENDARY: 0.06,
};

const PRECIOUS_STONE_NAME: Record<ItemRarity, string> = {
  COMMON: "Precious Stone Common",
  UNCOMMON: "Precious Stone Uncommon",
  RARE: "Precious Stone Rare",
  EPIC: "Precious Stone Epic",
  LEGENDARY: "Precious Stone Legendary",
};

function normalizeForgeLevel(forgeLevel: number): number {
  return Math.max(1, Math.floor(Number.isFinite(forgeLevel) ? forgeLevel : 1));
}

export function getForgeCraftRarityWeights(forgeLevel: number): Readonly<Record<ItemRarity, number>> {
  const levelDelta = normalizeForgeLevel(forgeLevel) - 1;

  return {
    COMMON: Math.max(20, FORGE_CRAFT_BASE_RARITY_WEIGHTS.COMMON + FORGE_CRAFT_RARITY_WEIGHT_SHIFT_PER_LEVEL.COMMON * levelDelta),
    UNCOMMON: Math.max(15, FORGE_CRAFT_BASE_RARITY_WEIGHTS.UNCOMMON + FORGE_CRAFT_RARITY_WEIGHT_SHIFT_PER_LEVEL.UNCOMMON * levelDelta),
    RARE: Math.min(40, FORGE_CRAFT_BASE_RARITY_WEIGHTS.RARE + FORGE_CRAFT_RARITY_WEIGHT_SHIFT_PER_LEVEL.RARE * levelDelta),
    EPIC: Math.min(28, FORGE_CRAFT_BASE_RARITY_WEIGHTS.EPIC + FORGE_CRAFT_RARITY_WEIGHT_SHIFT_PER_LEVEL.EPIC * levelDelta),
    LEGENDARY: Math.min(18, FORGE_CRAFT_BASE_RARITY_WEIGHTS.LEGENDARY + FORGE_CRAFT_RARITY_WEIGHT_SHIFT_PER_LEVEL.LEGENDARY * levelDelta),
  };
}

export function rollCraftRarityForForgeLevel(forgeLevel: number, rng: Pick<SeededRng, "pickWeighted">): ItemRarity {
  const weights = getForgeCraftRarityWeights(forgeLevel);
  return rng.pickWeighted(FORGE_CRAFT_RARITIES.map((rarity) => ({ value: rarity, weight: weights[rarity] })));
}

export type ForgeUpgradeCost = {
  resources: ResourceStock;
  currencies: Partial<WalletState["balances"]>;
};

export function getForgeUpgradeMaxLevel(rarity: ItemRarity = "COMMON"): number {
  return getUpgradeCapForRarity(rarity);
}

export function getForgeUpgradeLevel(item: Pick<EquipmentItem, "upgradeLevel">): number {
  return Math.max(0, Math.floor(item.upgradeLevel ?? 0));
}

export function canForgeUpgrade(item: EquipmentItem): boolean {
  return getForgeUpgradeLevel(item) < getForgeUpgradeMaxLevel(item.rarity ?? "COMMON");
}

export function getForgeUpgradeBreakpointsReached(upgradeLevel: number): number[] {
  const safeLevel = Math.max(0, Math.floor(upgradeLevel));
  return FORGE_UPGRADE_BREAKPOINTS.filter((breakpoint) => safeLevel >= breakpoint);
}

export function getNextForgeUpgradeBreakpoint(upgradeLevel: number, rarity: ItemRarity = "COMMON"): number | null {
  const safeLevel = Math.max(0, Math.floor(upgradeLevel));
  const maxLevel = getForgeUpgradeMaxLevel(rarity);
  return FORGE_UPGRADE_BREAKPOINTS.find((breakpoint) => breakpoint > safeLevel && breakpoint <= maxLevel) ?? null;
}

export function didReachForgeUpgradeBreakpoint(previousLevel: number, nextLevel: number): boolean {
  const previous = getForgeUpgradeBreakpointsReached(previousLevel).length;
  const next = getForgeUpgradeBreakpointsReached(nextLevel).length;
  return next > previous;
}

function safeStat(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  return Number.isFinite(value) ? value : 0;
}

function scaleStat(value: number | undefined, multiplier: number): number | undefined {
  const safeValue = safeStat(value);
  if (safeValue === undefined) return undefined;
  return Math.max(1, Math.round(safeValue * multiplier));
}

export function getForgeUpgradeStatMultiplier(
  rarity: ItemRarity = "COMMON",
  ilvl = 1,
  upgradeLevel = 0,
): number {
  const safeIlvl = Math.max(1, Math.min(1000, Math.floor(Number.isFinite(ilvl) ? ilvl : 1)));
  const safeLevel = Math.max(0, Math.floor(Number.isFinite(upgradeLevel) ? upgradeLevel : 0));
  const ilvlRateBonus = Math.floor((safeIlvl - 1) / 200) * 0.0025;
  return 1 + safeLevel * (FORGE_UPGRADE_STAT_RATE[rarity] + ilvlRateBonus);
}

export function getUpgradedEquipmentStats(
  baseStats: EquipmentStats,
  rarity: ItemRarity = "COMMON",
  ilvl = 1,
  upgradeLevel = 0,
): EquipmentStats {
  const multiplier = getForgeUpgradeStatMultiplier(rarity, ilvl, upgradeLevel);
  return {
    hp: scaleStat(baseStats.hp, multiplier),
    attack: scaleStat(baseStats.attack, multiplier),
    defense: scaleStat(baseStats.defense, multiplier),
    power: scaleStat(baseStats.power, multiplier),
  };
}

export function getForgeUpgradeCost(item: EquipmentItem): ForgeUpgradeCost {
  const nextLevel = getForgeUpgradeLevel(item) + 1;
  const ilvl = item.itemLevel ?? item.ilvl ?? 1;

  return {
    // PLACEHOLDER Phase 8A tuning: one GOLD per 50 ilvl, scaling with target upgrade level.
    resources: { GOLD: Math.max(1, Math.ceil(ilvl / 50)) * nextLevel },
    // PLACEHOLDER Phase 8A tuning: ECU sink proves currency costs are supported by Forge V2.
    currencies: { ECU: nextLevel },
  };
}

export function getForgeItemValue(item: EquipmentItem): number {
  return Math.max(1, Math.floor(item.value ?? item.itemLevel ?? item.ilvl ?? 1));
}

export function getForgeRecycleEcuRefund(item: EquipmentItem): number {
  return Math.floor(getForgeItemValue(item) * 0.5);
}

export function getPreciousStoneId(rarity: ItemRarity = "COMMON"): string {
  return `precious_stone_${rarity.toLowerCase()}`;
}

export function createPreciousStoneItem(rarity: ItemRarity = "COMMON", quantity = 1): NonEquipmentItem {
  return {
    id: getPreciousStoneId(rarity),
    kind: "material",
    name: PRECIOUS_STONE_NAME[rarity],
    quantity: Math.max(1, Math.floor(quantity)),
    value: 0,
  };
}
