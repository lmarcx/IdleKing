import type { ResourceId } from "../../resources/types.js";
import type { KitchenPatternInput, KitchenRecipe, KitchenRecipeId, KitchenResourceTarget } from "./types.js";

export const KITCHEN_RECIPES: KitchenRecipe[] = [
  {
    id: "STEW",
    name: "Stew",
    ingredientCosts: { MEAT: 2, WATER: 1 },
    rarity: "COMMON",
    baseRewardItemId: "food_stew",
    patternComplexity: 3,
  },
  {
    id: "SALAD",
    name: "Salad",
    ingredientCosts: { WATER: 1, CARROT: 1, TOMATO: 1 },
    rarity: "COMMON",
    baseRewardItemId: "food_salad",
    patternComplexity: 4,
  },
];

const PATTERN_INPUTS: KitchenPatternInput[] = ["up", "right", "down", "left"];
const DECOY_RESOURCES: ResourceId[] = ["STONE", "WOOD", "COPPER", "WHEAT", "EGG", "APPLE"];

function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.floor(value), min), max);
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number) {
  let state = seed >>> 0;
  return {
    int(maxExclusive: number) {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return Math.floor((state / 0x100000000) * Math.max(1, maxExclusive));
    },
  };
}

export function getKitchenMiniGameRecipe(recipeId: KitchenRecipeId): KitchenRecipe | undefined {
  return KITCHEN_RECIPES.find((recipe) => recipe.id === recipeId);
}

export function generateKitchenPattern(recipe: KitchenRecipe, seed: number, patternIndex: number): KitchenPatternInput[] {
  const length = clampInt(recipe.patternComplexity, 1, 12);
  const rng = createRandom(hashSeed(`${recipe.id}:${seed}:${patternIndex}`));

  return Array.from({ length }, () => PATTERN_INPUTS[rng.int(PATTERN_INPUTS.length)]);
}

export function generateKitchenResourceTargets(recipe: KitchenRecipe, seed: number): KitchenResourceTarget[] {
  const recipeResourceIds = Object.keys(recipe.ingredientCosts) as ResourceId[];
  const recipeResourceSet = new Set<ResourceId>(recipeResourceIds);
  const decoys = DECOY_RESOURCES.filter((resourceId) => !recipeResourceSet.has(resourceId)).slice(0, 3);
  const resources = [...recipeResourceIds, ...decoys];
  const rng = createRandom(hashSeed(`${recipe.id}:${seed}:targets`));

  return resources
    .map((resourceId, index) => ({
      id: `kitchen-target-${index}`,
      resourceId,
      isRecipeResource: recipeResourceSet.has(resourceId),
      resolved: false,
      sort: rng.int(10_000),
    }))
    .sort((left, right) => left.sort - right.sort)
    .map(({ sort: _sort, ...target }) => target);
}
