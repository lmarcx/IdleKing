import { isCurrencyId, spendCurrency, type WalletState } from "../../currencies/index.js";
import { upgradeEquipment } from "../../equipment/rules.js";
import type { EquipmentItem, ItemRarity } from "../../items/types.js";
import {
  canSpendResources,
  spendResources,
  type ResourceCosts,
  type ResourceStock,
} from "../../resources/index.js";
import {
  canForgeUpgrade,
  getForgeUpgradeCost,
  getForgeUpgradeLevel,
  getUpgradedEquipmentStats,
} from "./rules.js";

export type ForgeUpgradeEquipmentInput = Readonly<{
  item: EquipmentItem | null | undefined;
  resourceStock: ResourceStock;
  wallet: WalletState;
}>;

export type ForgeUpgradeEquipmentResult =
  | Readonly<{
      ok: true;
      upgradedItem: EquipmentItem;
      updatedResourceStock: ResourceStock;
      updatedWallet: WalletState;
      consumedResources: ResourceCosts;
      consumedCurrencies: Partial<WalletState["balances"]>;
    }>
  | Readonly<{
      ok: false;
      reason: "ITEM_NOT_FOUND" | "MAX_UPGRADE_LEVEL" | "NOT_ENOUGH_RESOURCES" | "NOT_ENOUGH_CURRENCY";
    }>;

export function forgeUpgradeEquipment(input: ForgeUpgradeEquipmentInput): ForgeUpgradeEquipmentResult {
  const item = input.item;
  if (!item) return { ok: false, reason: "ITEM_NOT_FOUND" };

  const normalizedItem: EquipmentItem = {
    ...item,
    rarity: item.rarity as ItemRarity,
    upgradeLevel: getForgeUpgradeLevel(item),
  };
  if (!canForgeUpgrade(normalizedItem)) return { ok: false, reason: "MAX_UPGRADE_LEVEL" };

  const cost = getForgeUpgradeCost(normalizedItem);
  if (!canSpendResources(input.resourceStock, cost.resources)) {
    return { ok: false, reason: "NOT_ENOUGH_RESOURCES" };
  }

  let updatedWallet = input.wallet;
  for (const [currencyId, amount] of Object.entries(cost.currencies)) {
    if (!isCurrencyId(currencyId)) return { ok: false, reason: "NOT_ENOUGH_CURRENCY" };
    const spent = spendCurrency(updatedWallet, currencyId, amount ?? 0);
    if (!spent.ok) return { ok: false, reason: "NOT_ENOUGH_CURRENCY" };
    updatedWallet = spent.wallet;
  }

  const nextLevelItem = upgradeEquipment(normalizedItem);
  const rolledStats = normalizedItem.rolledStats ?? normalizedItem.baseStats ?? normalizedItem.stats;
  const upgradedItem: EquipmentItem = {
    ...nextLevelItem,
    baseStats: normalizedItem.baseStats ?? rolledStats,
    rolledStats,
    stats: getUpgradedEquipmentStats(
      rolledStats,
      normalizedItem.rarity,
      normalizedItem.itemLevel ?? normalizedItem.ilvl ?? 1,
      nextLevelItem.upgradeLevel,
    ),
  };

  return {
    ok: true,
    upgradedItem,
    updatedResourceStock: spendResources(input.resourceStock, cost.resources),
    updatedWallet,
    consumedResources: cost.resources,
    consumedCurrencies: cost.currencies,
  };
}
