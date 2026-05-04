import type { GameState } from "./state.js";
import { getForgeRecipe, type ForgeRecipeId } from "../building/forge/recipes.js";
import { generateEquipmentItem } from "../equipment/index.js";
import { hasAtLeast, spend, addQty, type ResourceId } from "../resources/types.js";
import { addItem, findItem, removeItem } from "../items/inventory.js";
import { isEquipmentItem } from "../items/types.js";
import { expectedIlvl } from "../progression/expectedIlvl.js";

function staminaCostFromPct(pct: number): number {
  const p = Math.max(0, Math.min(1, pct));
  return Math.ceil(100 * p);
}

function createCraftedItemId(state: GameState, recipeId: ForgeRecipeId): string {
  const matchingItems = state.inventory.items.filter((item) => item.id.startsWith(`forge_${recipeId}_`)).length;
  return `forge_${recipeId}_${state.progression.worldLevel}_${matchingItems + 1}`;
}

export type ForgeCraftResult = {
  next: GameState;
  ok: boolean;
  createdItemId?: string;
  reason?:
    | "FORGE_LOCKED"
    | "FORGE_NOT_BUILT"
    | "RECIPE_NOT_FOUND"
    | "VILLAGER_NOT_FOUND"
    | "VILLAGER_NO_STAMINA"
    | "NOT_ENOUGH_RESOURCES";
};

export type ForgeCraftOptions = {
  allowLocked?: boolean;
};

/**
 * Crafts an equipment item by consuming resources and villager stamina.
 * Item ilvl is derived from the current world level snapshot at craft time.
 */
export function forgeCraft(
  state: GameState,
  recipeId: ForgeRecipeId,
  villagerId: string,
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

  const idx = state.villagers.list.findIndex((v) => v.id === villagerId);
  if (idx < 0) return { next: state, ok: false, reason: "VILLAGER_NOT_FOUND" };

  const v = state.villagers.list[idx];
  if (v.stamina <= 0) return { next: state, ok: false, reason: "VILLAGER_NO_STAMINA" };

  if (!hasAtLeast(state.resources, recipe.cost)) {
    return { next: state, ok: false, reason: "NOT_ENOUGH_RESOURCES" };
  }

  // Spend resources
  const nextResources = spend(state.resources, recipe.cost);

  // Create item
  const itemLevel = expectedIlvl(state.progression.worldLevel);
  const item = generateEquipmentItem({
    id: createCraftedItemId(state, recipe.id),
    slot: recipe.slot,
    name: recipe.baseName,
    itemLevel,
    rarity: recipe.rarity,
  });

  // Drain stamina
  const cost = staminaCostFromPct(recipe.staminaCostPct);
  const nextVillagers = state.villagers.list.slice();
  nextVillagers[idx] = { ...v, stamina: Math.max(0, v.stamina - cost) };

  return {
    ok: true,
    createdItemId: item.id,
    next: {
      ...state,
      resources: nextResources,
      inventory: addItem(state.inventory, item),
      villagers: { list: nextVillagers },
    },
  };
}

export type ForgeUpgradeResult = {
  next: GameState;
  ok: boolean;
  reason?: "ITEM_NOT_FOUND" | "VILLAGER_NOT_FOUND" | "VILLAGER_NO_STAMINA" | "NOT_ENOUGH_RESOURCES";
};

/**
 * Upgrades an item by consuming resources and stamina.
 * MVP: +10 ilvl per upgrade, cost scales with current ilvl.
 */
export function forgeUpgrade(
  state: GameState,
  itemId: string,
  villagerId: string
): ForgeUpgradeResult {
  const item = findItem(state.inventory, itemId);
  if (!item || !isEquipmentItem(item)) return { next: state, ok: false, reason: "ITEM_NOT_FOUND" };

  const idx = state.villagers.list.findIndex((v) => v.id === villagerId);
  if (idx < 0) return { next: state, ok: false, reason: "VILLAGER_NOT_FOUND" };

  const v = state.villagers.list[idx];
  if (v.stamina <= 0) return { next: state, ok: false, reason: "VILLAGER_NO_STAMINA" };

  // MVP upgrade cost rule (simple, deterministic):
  // cost = 1 GOLD per 50 ilvl (min 1)
  const currentItemLevel = item.itemLevel ?? item.ilvl ?? 1;
  const goldCost = Math.max(1, Math.ceil(currentItemLevel / 50));
  const costStock: Partial<Record<ResourceId, number>> = { GOLD: goldCost };

  if (!hasAtLeast(state.resources, costStock)) {
    return { next: state, ok: false, reason: "NOT_ENOUGH_RESOURCES" };
  }

  const nextResources = spend(state.resources, costStock);

  // Upgrade rule: +10 ilvl, regenerated through the same MVP stat model.
  const upgraded = generateEquipmentItem({
    id: item.id,
    name: item.name,
    slot: item.slot,
    itemLevel: currentItemLevel + 10,
    rarity: item.rarity,
  });

  // Replace in inventory
  const nextItems = state.inventory.items.map((it) => (it.id === itemId ? upgraded : it));

  // Drain stamina (MVP fixed 20%)
  const staminaCost = staminaCostFromPct(0.2);
  const nextVillagers = state.villagers.list.slice();
  nextVillagers[idx] = { ...v, stamina: Math.max(0, v.stamina - staminaCost) };

  return {
    ok: true,
    next: {
      ...state,
      resources: nextResources,
      inventory: { items: nextItems },
      villagers: { list: nextVillagers },
    },
  };
}

export type ForgeRecycleResult = {
  next: GameState;
  ok: boolean;
  reason?: "ITEM_NOT_FOUND";
};

/**
 * Recycles an item into basic resources.
 * MVP: returns a fraction of the original crafting value approximated by ilvl.
 */
export function forgeRecycle(state: GameState, itemId: string): ForgeRecycleResult {
  const item = findItem(state.inventory, itemId);
  if (!item || !isEquipmentItem(item)) return { next: state, ok: false, reason: "ITEM_NOT_FOUND" };

  // MVP recycle returns COPPER based on ilvl (simple and deterministic)
  const copper = Math.max(1, Math.floor((item.itemLevel ?? item.ilvl ?? 1) / 40));

  const nextInv = removeItem(state.inventory, itemId);
  const nextResources = addQty(state.resources, "COPPER", copper);

  return {
    ok: true,
    next: {
      ...state,
      inventory: nextInv,
      resources: nextResources,
    },
  };
}
