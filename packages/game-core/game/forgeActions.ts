import type { GameState } from "./state.js";
import { craftEquipmentFromRecipe } from "../building/forge/craft.js";
import {
  getEffectiveForgeLevel,
  getForgeRecipe,
  getForgeRecipeLockReason,
  type ForgeRecipeId,
} from "../building/forge/recipes.js";
import { forgeRecycleEquipment } from "../building/forge/recycle.js";
import { forgeUpgradeEquipment } from "../building/forge/upgrade.js";
import type { ResourceCosts } from "../resources/index.js";
import { addItem, findItem } from "../items/inventory.js";
import { isEquipmentItem, isItemRarity, type ItemRarity } from "../items/types.js";
import { expectedIlvl } from "../progression/expectedIlvl.js";
import { createSeededRng, hashStringSeed, type SeededRng } from "../random/index.js";

function createCraftedItemId(state: GameState, recipeId: ForgeRecipeId): string {
  const matchingItems = state.inventory.items.filter((item) => item.id.startsWith(`forge_${recipeId}_`)).length;
  return `forge_${recipeId}_${state.progression.worldLevel}_${matchingItems + 1}`;
}

export type ForgeCraftResult = {
  next: GameState;
  ok: boolean;
  createdItemId?: string;
  rolledRarity?: ItemRarity;
  consumedResources?: ResourceCosts;
  reason?:
    | "FORGE_LOCKED"
    | "FORGE_NOT_BUILT"
    | "RECIPE_NOT_FOUND"
    | "OUTPUT_BASE_NOT_FOUND"
    | "FORGE_LEVEL_TOO_LOW"
    | "WORLD_LEVEL_TOO_LOW"
    | "CHAPTER_REQUIRED"
    | "QUEST_REQUIRED"
    | "BOSS_REQUIRED"
    | "NOT_ENOUGH_RESOURCES";
};

export type ForgeCraftOptions = {
  allowLocked?: boolean;
  rng?: Pick<SeededRng, "pickWeighted">;
  seed?: number;
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

  const itemLevel = expectedIlvl(state.progression.worldLevel);
  const seed = options.seed ?? hashStringSeed(`${recipe.id}:${state.progression.worldLevel}:${state.inventory.items.length}`);
  const crafted = craftEquipmentFromRecipe({
    recipeId: recipe.id,
    resourceStock: state.resources,
    forgeLevel: getEffectiveForgeLevel(state),
    defeatedBossIds: [...state.story.completedEvents],
    itemLevel,
    rng: options.rng ?? createSeededRng(seed),
    seed,
    itemId: createCraftedItemId(state, recipe.id),
  });

  if (!crafted.ok) return { next: state, ok: false, reason: crafted.reason };

  return {
    ok: true,
    createdItemId: crafted.craftedItem.id,
    rolledRarity: crafted.rolledRarity,
    consumedResources: crafted.consumedResources,
    next: {
      ...state,
      resources: crafted.updatedResourceStock,
      inventory: addItem(state.inventory, crafted.craftedItem),
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
  const upgraded = forgeUpgradeEquipment({
    item: { ...item, rarity: normalizedRarity },
    resourceStock: state.resources,
    wallet: state.wallet,
  });
  if (!upgraded.ok) return { next: state, ok: false, reason: upgraded.reason };

  const nextItems = state.inventory.items.map((it) => (it.id === itemId ? upgraded.upgradedItem : it));

  return {
    ok: true,
    next: {
      ...state,
      resources: upgraded.updatedResourceStock,
      inventory: { items: nextItems },
      wallet: upgraded.updatedWallet,
    },
  };
}

export type ForgeRecycleResult = {
  next: GameState;
  ok: boolean;
  ecuRefund?: number;
  itemDestroyed?: true;
  preciousStoneItemId?: string;
  recipeMaterials?: readonly [];
  reason?: "ITEM_NOT_FOUND";
};

export type ForgeRecycleOptions = {
  rng?: Pick<SeededRng, "nextFloat">;
  seed?: number;
  /** @deprecated Explicit roll retained as a deterministic brownfield test seam. */
  preciousStoneRoll?: number;
};

/**
 * Recycles an item into ECU plus a placeholder chance for a matching-rarity precious stone.
 */
export function forgeRecycle(state: GameState, itemId: string, options: ForgeRecycleOptions = {}): ForgeRecycleResult {
  const item = findItem(state.inventory, itemId);
  if (!item || !isEquipmentItem(item)) return { next: state, ok: false, reason: "ITEM_NOT_FOUND" };

  const rarity = isItemRarity(item.rarity) ? item.rarity : "COMMON";
  const normalizedItem = { ...item, rarity };
  const rng =
    options.preciousStoneRoll === undefined
      ? options.rng ?? createSeededRng(options.seed ?? hashStringSeed(item.id))
      : { nextFloat: () => options.preciousStoneRoll! };
  const recycleResult = forgeRecycleEquipment({
    item: normalizedItem,
    inventory: state.inventory,
    wallet: state.wallet,
    rng,
  });
  if (!recycleResult.ok) return { next: state, ok: false, reason: recycleResult.reason };

  return {
    ok: true,
    ecuRefund: recycleResult.ecuGained,
    itemDestroyed: recycleResult.itemDestroyed,
    preciousStoneItemId: recycleResult.preciousStone?.id,
    recipeMaterials: recycleResult.recipeMaterials,
    next: {
      ...state,
      inventory: recycleResult.updatedInventory ?? state.inventory,
      wallet: recycleResult.updatedWallet,
    },
  };
}
