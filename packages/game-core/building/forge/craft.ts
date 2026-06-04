import { generateEquipmentItem } from "../../equipment/index.js";
import type { EquipmentItem, ItemRarity } from "../../items/types.js";
import type { SeededRng } from "../../random/index.js";
import {
  canSpendResources,
  spendResources,
  type ResourceCosts,
  type ResourceStock,
} from "../../resources/index.js";
import { rollCraftRarityForForgeLevel } from "./rules.js";
import {
  FORGE_OUTPUT_BASES,
  FORGE_RECIPES,
  getForgeOutputBase,
  normalizeForgeRecipeIngredients,
  type ForgeOutputBaseDefinition,
  type ForgeRecipe,
  type ForgeRecipeId,
} from "./recipes.js";

export type CraftEquipmentFromRecipeInput = Readonly<{
  recipeId: ForgeRecipeId;
  resourceStock: ResourceStock;
  forgeLevel: number;
  itemLevel: number;
  rng: Pick<SeededRng, "pickWeighted">;
  itemId?: string;
  seed?: string | number;
  recipes?: readonly ForgeRecipe[];
  outputBases?: Readonly<Record<string, ForgeOutputBaseDefinition>>;
}>;

export type CraftEquipmentFromRecipeResult =
  | Readonly<{
      ok: true;
      updatedResourceStock: ResourceStock;
      craftedItem: EquipmentItem;
      rolledRarity: ItemRarity;
      consumedResources: ResourceCosts;
      recipe: ForgeRecipe;
    }>
  | Readonly<{
      ok: false;
      updatedResourceStock: ResourceStock;
      reason:
        | "RECIPE_NOT_FOUND"
        | "OUTPUT_BASE_NOT_FOUND"
        | "FORGE_LEVEL_TOO_LOW"
        | "NOT_ENOUGH_RESOURCES";
    }>;

export function craftEquipmentFromRecipe(input: CraftEquipmentFromRecipeInput): CraftEquipmentFromRecipeResult {
  const recipes = input.recipes ?? FORGE_RECIPES;
  const outputBases = input.outputBases ?? FORGE_OUTPUT_BASES;
  const recipe = recipes.find((candidate) => candidate.id === input.recipeId);
  if (!recipe) {
    return { ok: false, updatedResourceStock: input.resourceStock, reason: "RECIPE_NOT_FOUND" };
  }

  const requiredForgeLevel = recipe.unlockConditions.requiredForgeLevel ?? 1;
  if (Math.max(1, Math.floor(input.forgeLevel)) < requiredForgeLevel) {
    return { ok: false, updatedResourceStock: input.resourceStock, reason: "FORGE_LEVEL_TOO_LOW" };
  }

  const outputBase = outputBases[recipe.outputBaseId] ?? getForgeOutputBase(recipe.outputBaseId);
  if (!outputBase) {
    return { ok: false, updatedResourceStock: input.resourceStock, reason: "OUTPUT_BASE_NOT_FOUND" };
  }

  const consumedResources = normalizeForgeRecipeIngredients(recipe.ingredients);
  if (!canSpendResources(input.resourceStock, consumedResources)) {
    return { ok: false, updatedResourceStock: input.resourceStock, reason: "NOT_ENOUGH_RESOURCES" };
  }

  const rolledRarity = rollCraftRarityForForgeLevel(input.forgeLevel, input.rng);
  const updatedResourceStock = spendResources(input.resourceStock, consumedResources);
  const craftedItem = generateEquipmentItem({
    baseItemId: outputBase.id,
    id: input.itemId,
    itemLevel: input.itemLevel,
    name: outputBase.baseName,
    rarity: rolledRarity,
    seed: input.seed ?? `${recipe.id}:${input.itemLevel}:${rolledRarity}`,
    slot: outputBase.slot,
  });

  return {
    ok: true,
    updatedResourceStock,
    craftedItem,
    rolledRarity,
    consumedResources,
    recipe,
  };
}
