import type { ResourceId } from "../../resources/types.js";
import type { EquipmentSlot, ItemRarity } from "../../items/types.js";

export type ForgeRecipeId =
  | "iron_sword"
  | "iron_helmet"
  | "copper_ring"
  | "BASIC_SWORD"
  | "BASIC_ARMOR"
  | "BASIC_CAPE"
  | "BASIC_ARTIFACT"
  | (string & {});

export type ForgeRecipe = {
  id: ForgeRecipeId;
  label: string;

  slot: EquipmentSlot;
  baseName: string;
  rarity: ItemRarity;

  cost: Partial<Record<ResourceId, number>>;
};

export const FORGE_RECIPES: ForgeRecipe[] = [
  {
    id: "iron_sword",
    label: "Iron Sword",
    slot: "weapon",
    baseName: "Iron Sword",
    rarity: "COMMON",
    cost: { IRON: 4 },
  },
  {
    id: "iron_helmet",
    label: "Iron Helmet",
    slot: "helmet",
    baseName: "Iron Helmet",
    rarity: "UNCOMMON",
    cost: { IRON: 3 },
  },
  {
    id: "copper_ring",
    label: "Copper Ring",
    slot: "ring",
    baseName: "Copper Ring",
    rarity: "COMMON",
    cost: { COPPER: 3 },
  },
  {
    id: "BASIC_SWORD",
    label: "Basic Sword",
    slot: "weapon",
    baseName: "Sword",
    rarity: "COMMON",
    cost: { COPPER: 3 },
  },
  {
    id: "BASIC_ARMOR",
    label: "Basic Armor",
    slot: "chest",
    baseName: "Armor",
    rarity: "COMMON",
    cost: { COPPER: 2, STONE: 2 },
  },
  {
    id: "BASIC_CAPE",
    label: "Basic Cape",
    slot: "cape",
    baseName: "Cape",
    rarity: "COMMON",
    cost: { WOOD: 2, COPPER: 1 },
  },
  {
    id: "BASIC_ARTIFACT",
    label: "Basic Artifact",
    slot: "artifact",
    baseName: "Relic",
    rarity: "COMMON",
    cost: { STONE: 3, GOLD: 1 },
  },
];

export function getForgeRecipe(id: ForgeRecipeId): ForgeRecipe | undefined {
  return FORGE_RECIPES.find((r) => r.id === id);
}
