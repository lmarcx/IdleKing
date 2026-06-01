import type { GameState } from "./state.js";
import { getForgeRecipe, getForgeRecipeLockReason, type ForgeRecipeId } from "../building/forge/recipes.js";
import {
  canForgeUpgrade,
  createPreciousStoneItem,
  FORGE_PRECIOUS_STONE_DROP_CHANCE,
  getForgeRecycleEcuRefund,
  getForgeUpgradeCost,
  getForgeUpgradeLevel,
  getUpgradedEquipmentStats,
} from "../building/forge/rules.js";
import { grantCurrency, spendCurrency } from "../currencies/index.js";
import { generateEquipmentItem } from "../equipment/index.js";
import { hasAtLeast, spend } from "../resources/types.js";
import { addItem, findItem, removeItem } from "../items/inventory.js";
import { isEquipmentItem, isItemRarity, type Item, type NonEquipmentItem } from "../items/types.js";
import { expectedIlvl } from "../progression/expectedIlvl.js";

function createCraftedItemId(state: GameState, recipeId: ForgeRecipeId): string {
  const matchingItems = state.inventory.items.filter((item) => item.id.startsWith(`forge_${recipeId}_`)).length;
  return `forge_${recipeId}_${state.progression.worldLevel}_${matchingItems + 1}`;
}

function addStackableInventoryItem(items: Item[], item: NonEquipmentItem): Item[] {
  const existingIndex = items.findIndex((entry) => entry.id === item.id && !isEquipmentItem(entry));
  if (existingIndex < 0) return [...items, item];

  const next = items.slice();
  const existing = next[existingIndex] as NonEquipmentItem;
  next[existingIndex] = {
    ...existing,
    quantity: Math.max(0, Math.floor(existing.quantity ?? 1)) + Math.max(1, Math.floor(item.quantity ?? 1)),
  };
  return next;
}

export type ForgeCraftResult = {
  next: GameState;
  ok: boolean;
  createdItemId?: string;
  reason?:
    | "FORGE_LOCKED"
    | "FORGE_NOT_BUILT"
    | "RECIPE_NOT_FOUND"
    | "FORGE_LEVEL_TOO_LOW"
    | "WORLD_LEVEL_TOO_LOW"
    | "NOT_ENOUGH_RESOURCES";
};

export type ForgeCraftOptions = {
  allowLocked?: boolean;
};

/**
 * Crafts an equipment item by directly consuming recipe resources.
 * Item ilvl is derived from the current world level snapshot at craft time.
 */
export function forgeCraft(
  state: GameState,
  recipeId: ForgeRecipeId,
  options: ForgeCraftOptions = {},
): ForgeCraftResult {
  if (!state.buildings.forge.unlocked && options.allowLocked !== true) {
    return { next: state, ok: false, reason: "FORGE_LOCKED" };
  }
  if (!state.buildings.forge.built) {
    return { next: state, ok: false, reason: "FORGE_NOT_BUILT" };
  }

  const recipe = getForgeRecipe(recipeId);
  if (!recipe) return { next: state, ok: false, reason: "RECIPE_NOT_FOUND" };

  const lockReason = getForgeRecipeLockReason(state, recipe);
  if (lockReason) return { next: state, ok: false, reason: lockReason };

  if (!hasAtLeast(state.resources, recipe.cost)) {
    return { next: state, ok: false, reason: "NOT_ENOUGH_RESOURCES" };
  }

  const nextResources = spend(state.resources, recipe.cost);

  const itemLevel = expectedIlvl(state.progression.worldLevel);
  const item = generateEquipmentItem({
    id: createCraftedItemId(state, recipe.id),
    slot: recipe.slot,
    name: recipe.baseName,
    itemLevel,
    rarity: recipe.rarity,
  });

  return {
    ok: true,
    createdItemId: item.id,
    next: {
      ...state,
      resources: nextResources,
      inventory: addItem(state.inventory, item),
    },
  };
}

export type ForgeUpgradeResult = {
  next: GameState;
  ok: boolean;
  reason?: "ITEM_NOT_FOUND" | "MAX_UPGRADE_LEVEL" | "NOT_ENOUGH_RESOURCES" | "NOT_ENOUGH_CURRENCY";
};

/**
 * Upgrades an item by consuming direct Forge V2 placeholder costs.
 * Phase 8A preserves fixed ilvl and item identity; only upgradeLevel changes.
 */
export function forgeUpgrade(
  state: GameState,
  itemId: string
): ForgeUpgradeResult {
  const item = findItem(state.inventory, itemId);
  if (!item || !isEquipmentItem(item)) return { next: state, ok: false, reason: "ITEM_NOT_FOUND" };

  const normalizedRarity = isItemRarity(item.rarity) ? item.rarity : "COMMON";
  const normalizedItem = { ...item, rarity: normalizedRarity, upgradeLevel: getForgeUpgradeLevel(item) };
  if (!canForgeUpgrade(normalizedItem)) return { next: state, ok: false, reason: "MAX_UPGRADE_LEVEL" };

  const cost = getForgeUpgradeCost(normalizedItem);
  if (!hasAtLeast(state.resources, cost.resources)) {
    return { next: state, ok: false, reason: "NOT_ENOUGH_RESOURCES" };
  }

  let nextWallet = state.wallet;
  for (const [currencyId, amount] of Object.entries(cost.currencies)) {
    const spent = spendCurrency(nextWallet, currencyId, amount ?? 0);
    if (!spent.ok) return { next: state, ok: false, reason: "NOT_ENOUGH_CURRENCY" };
    nextWallet = spent.wallet;
  }

  const nextResources = spend(state.resources, cost.resources);
  const rolledStats = normalizedItem.rolledStats ?? normalizedItem.baseStats ?? normalizedItem.stats;
  const nextUpgradeLevel = normalizedItem.upgradeLevel + 1;
  const upgraded = {
    ...normalizedItem,
    baseStats: normalizedItem.baseStats ?? rolledStats,
    rolledStats,
    stats: getUpgradedEquipmentStats(
      rolledStats,
      normalizedItem.rarity,
      normalizedItem.itemLevel ?? normalizedItem.ilvl ?? 1,
      nextUpgradeLevel,
    ),
    upgradeLevel: nextUpgradeLevel,
  };
  const nextItems = state.inventory.items.map((it) => (it.id === itemId ? upgraded : it));

  return {
    ok: true,
    next: {
      ...state,
      resources: nextResources,
      inventory: { items: nextItems },
      wallet: nextWallet,
    },
  };
}

export type ForgeRecycleResult = {
  next: GameState;
  ok: boolean;
  ecuRefund?: number;
  preciousStoneItemId?: string;
  reason?: "ITEM_NOT_FOUND";
};

export type ForgeRecycleOptions = {
  preciousStoneRoll?: number;
};

/**
 * Recycles an item into ECU plus a placeholder chance for a matching-rarity precious stone.
 */
export function forgeRecycle(state: GameState, itemId: string, options: ForgeRecycleOptions = {}): ForgeRecycleResult {
  const item = findItem(state.inventory, itemId);
  if (!item || !isEquipmentItem(item)) return { next: state, ok: false, reason: "ITEM_NOT_FOUND" };

  const rarity = isItemRarity(item.rarity) ? item.rarity : "COMMON";
  const ecuRefund = getForgeRecycleEcuRefund(item);
  const roll = options.preciousStoneRoll ?? Math.random();
  const preciousStone = roll < FORGE_PRECIOUS_STONE_DROP_CHANCE ? createPreciousStoneItem(rarity) : null;

  const nextInv = removeItem(state.inventory, itemId);
  const nextItems = preciousStone ? addStackableInventoryItem(nextInv.items, preciousStone) : nextInv.items;

  return {
    ok: true,
    ecuRefund,
    preciousStoneItemId: preciousStone?.id,
    next: {
      ...state,
      inventory: { items: nextItems },
      wallet: grantCurrency(state.wallet, "ECU", ecuRefund),
    },
  };
}
