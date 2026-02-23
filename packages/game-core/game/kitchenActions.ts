import type { GameState } from "./state.js";
import { getKitchenRecipe, type DishId } from "../building/kitchen/recipes.js";
import { hasAtLeast, spend, addQty, type ResourceId } from "../resources/types.js";

export type CookDishResult = {
  next: GameState;
  ok: boolean;
  reason?:
    | "KITCHEN_LOCKED"
    | "KITCHEN_NOT_BUILT"
    | "RECIPE_NOT_FOUND"
    | "VILLAGER_NOT_FOUND"
    | "VILLAGER_NO_STAMINA"
    | "NOT_ENOUGH_RESOURCES";
};

function staminaCostFromPct(pct: number): number {
  const p = Math.max(0, Math.min(1, pct));
  return Math.ceil(100 * p);
}

/**
 * Crafts a dish in the Kitchen by consuming resources and draining villager stamina.
 * This is an explicit action (no per-minute building tick involved).
 */
export function cookDish(state: GameState, dishId: DishId, villagerId: string): CookDishResult {
  // Kitchen must be unlocked and built to allow crafting.
  if (!state.buildings.kitchen.unlocked) {
    return { next: state, ok: false, reason: "KITCHEN_LOCKED" };
  }
  if (!state.buildings.kitchen.built) {
    return { next: state, ok: false, reason: "KITCHEN_NOT_BUILT" };
  }

  const recipe = getKitchenRecipe(dishId);
  if (!recipe) {
    return { next: state, ok: false, reason: "RECIPE_NOT_FOUND" };
  }

  const idx = state.villagers.list.findIndex((v) => v.id === villagerId);
  if (idx < 0) {
    return { next: state, ok: false, reason: "VILLAGER_NOT_FOUND" };
  }

  const v = state.villagers.list[idx];
  if (v.stamina <= 0) {
    return { next: state, ok: false, reason: "VILLAGER_NO_STAMINA" };
  }

  // Ingredients check is done before any mutation.
  if (!hasAtLeast(state.resources, recipe.cost)) {
    return { next: state, ok: false, reason: "NOT_ENOUGH_RESOURCES" };
  }

  // Spend ingredients.
  let nextResources = spend(state.resources, recipe.cost);

  // Add outputs.
  for (const [k, v] of Object.entries(recipe.output)) {
    const id = k as ResourceId;
    nextResources = addQty(nextResources, id, v ?? 0);
  }

  // Drain stamina.
  const staminaCost = staminaCostFromPct(recipe.staminaCostPct);
  const nextVillagers = state.villagers.list.slice();
  nextVillagers[idx] = {
    ...v,
    stamina: Math.max(0, v.stamina - staminaCost),
  };

  return {
    ok: true,
    next: {
      ...state,
      resources: nextResources,
      villagers: { list: nextVillagers },
    },
  };
}