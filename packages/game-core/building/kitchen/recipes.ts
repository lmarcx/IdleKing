import type { ResourceStock, ResourceId } from "../../resources/types.js";

export type DishId =
  | "STEW"
  | "SALAD"
  | (string & {});

export type DishRecipe = {
  id: DishId;
  label: string;

  // Ingredients required to craft once
  cost: Partial<Record<ResourceId, number>>;

  // Outputs granted on success
  output: Partial<Record<ResourceId, number>>;

  // Stamina cost as a percentage of max stamina (0..1)
  staminaCostPct: number;
};

export const KITCHEN_RECIPES: DishRecipe[] = [
  {
    id: "STEW",
    label: "Stew",
    cost: { MEAT: 2, WATER: 1 },
    output: { PLATE_STEW: 1 },
    staminaCostPct: 0.25, // 25% stamina
  },
  {
    id: "SALAD",
    label: "Salad",
    cost: { WATER: 1, CARROT: 1, TOMATO: 1 },
    output: { PLATE_SALAD: 1 },
    staminaCostPct: 0.20,
  },
];

export function getKitchenRecipe(id: DishId): DishRecipe | undefined {
  return KITCHEN_RECIPES.find((r) => r.id === id);
}