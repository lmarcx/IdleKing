import type { ResourceId } from "../../resources/types.js";
import type { ItemRarity, ItemSlot } from "../../items/types.js";

export type ForgeRecipeId = "BASIC_SWORD" | "BASIC_ARMOR" | (string & {});

export type ForgeRecipe = {
  id: ForgeRecipeId;
  label: string;

  slot: ItemSlot;
  baseName: string;
  rarity: ItemRarity;

  cost: Partial<Record<ResourceId, number>>;

  staminaCostPct: number; // 0..1
};

export const FORGE_RECIPES: ForgeRecipe[] = [
  {
    id: "BASIC_SWORD",
    label: "Basic Sword",
    slot: "WEAPON",
    baseName: "Sword",
    rarity: "COMMON",
    cost: { COPPER: 3 },
    staminaCostPct: 0.25,
  },
  {
    id: "BASIC_ARMOR",
    label: "Basic Armor",
    slot: "ARMOR",
    baseName: "Armor",
    rarity: "COMMON",
    cost: { COPPER: 2, STONE: 2 },
    staminaCostPct: 0.25,
  },
];

export function getForgeRecipe(id: ForgeRecipeId): ForgeRecipe | undefined {
  return FORGE_RECIPES.find((r) => r.id === id);
}