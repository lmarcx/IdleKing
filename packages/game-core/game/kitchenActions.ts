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

/**
 * Crafts a dish in the Kitchen by consuming resources and draining villager stamina.
 * This is a manual action (no building tick involved).
 */
export function cookDish(
  state: GameState,
  dishId: DishId,
  villagerId: string
): CookDishResult {
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

  const villIndex = state.villagers.list.findIndex((v) => v.id === villagerId);
  if (villIndex < 0) {
    return { next: state, ok: false, reason: "VILLAGER_NOT_FOUND" };
  }

  const vill = state.villagers.list[villIndex];
  if (vill.stamina <= 0) {
    return { next: state, ok: false, reason: "VILLAGER_NO_STAMINA" };
  }

  // Check resources
  if (!hasAtLeast(state.resources, recipe.cost)) {
    return { next: state, ok: false, reason: "NOT_ENOUGH_RESOURCES" };
  }

  // Spend resources
  let nextResources = spend(state.resources, recipe.cost);

  // Add outputs
  for (const [k, v] of Object.entries(recipe.output)) {
    const rid = k as ResourceId;
    nextResources = addQty(nextResources, rid, v ?? 0);
  }

  // Drain stamina (percentage of max stamina: 100)
  const pct = Math.max(0, Math.min(1, recipe.staminaCostPct));
  const staminaCost = Math.ceil(100 * pct);

  const nextVillagers = state.villagers.list.slice();
  nextVillagers[villIndex] = {
    ...vill,
    stamina: Math.max(0, vill.stamina - staminaCost),
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