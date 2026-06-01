import type { ResourceId } from "../../resources/types.js";
import type { EquipmentSlot, ItemRarity } from "../../items/types.js";
import type { GameState } from "../../game/state.js";

export type ForgeRecipeId =
  | "iron_sword"
  | "iron_helmet"
  | "copper_ring"
  | "BASIC_SWORD"
  | "BASIC_ARMOR"
  | "BASIC_CAPE"
  | "BASIC_ARTIFACT"
  | "weapon_sword"
  | "weapon_dagger"
  | "weapon_axe"
  | "weapon_greatsword"
  | "weapon_pistol"
  | "weapon_bow"
  | "weapon_shield"
  | "weapon_spear"
  | "weapon_grimoire"
  | "weapon_staff"
  | (string & {});

export type ForgeRecipeLockReason = "FORGE_NOT_BUILT" | "FORGE_LEVEL_TOO_LOW" | "WORLD_LEVEL_TOO_LOW";

export type ForgeRecipe = {
  id: ForgeRecipeId;
  label: string;

  slot: EquipmentSlot;
  baseName: string;
  rarity: ItemRarity;

  cost: Partial<Record<ResourceId, number>>;

  requiredForgeLevel: number;
  requiredWorldLevel?: number;
  requiredQuestIds?: string[];
  requiredBossIds?: string[];
};

export const FORGE_RECIPES: ForgeRecipe[] = [
  {
    id: "iron_sword",
    label: "Iron Sword",
    slot: "main_hand",
    baseName: "Iron Sword",
    rarity: "COMMON",
    cost: { IRON: 4 },
    requiredForgeLevel: 1,
  },
  {
    id: "iron_helmet",
    label: "Iron Helmet",
    slot: "helmet",
    baseName: "Iron Helmet",
    rarity: "UNCOMMON",
    cost: { IRON: 3 },
    requiredForgeLevel: 1,
  },
  {
    id: "copper_ring",
    label: "Copper Ring",
    slot: "ring",
    baseName: "Copper Ring",
    rarity: "COMMON",
    cost: { COPPER: 3 },
    requiredForgeLevel: 1,
  },
  {
    id: "BASIC_SWORD",
    label: "Basic Sword",
    slot: "main_hand",
    baseName: "Sword",
    rarity: "COMMON",
    cost: { COPPER: 3 },
    requiredForgeLevel: 1,
  },
  {
    id: "BASIC_ARMOR",
    label: "Basic Armor",
    slot: "chest",
    baseName: "Armor",
    rarity: "COMMON",
    cost: { COPPER: 2, STONE: 2 },
    requiredForgeLevel: 1,
  },
  {
    id: "BASIC_CAPE",
    label: "Basic Cape",
    slot: "cape",
    baseName: "Cape",
    rarity: "COMMON",
    cost: { WOOD: 2, COPPER: 1 },
    requiredForgeLevel: 1,
  },
  {
    id: "BASIC_ARTIFACT",
    label: "Basic Artifact",
    slot: "artifact",
    baseName: "Relic",
    rarity: "COMMON",
    cost: { STONE: 3, GOLD: 1 },
    requiredForgeLevel: 1,
  },
  {
    id: "weapon_sword",
    label: "Sword",
    slot: "main_hand",
    baseName: "Sword",
    rarity: "COMMON",
    cost: { COPPER: 3 },
    requiredForgeLevel: 1,
  },
  {
    id: "weapon_dagger",
    label: "Dagger",
    slot: "main_hand",
    baseName: "Dagger",
    rarity: "COMMON",
    cost: { COPPER: 2, IRON: 1 },
    requiredForgeLevel: 2,
  },
  {
    id: "weapon_axe",
    label: "Axe",
    slot: "main_hand",
    baseName: "Axe",
    rarity: "COMMON",
    cost: { IRON: 3, WOOD: 1 },
    requiredForgeLevel: 3,
  },
  {
    id: "weapon_greatsword",
    label: "Greatsword",
    slot: "main_hand",
    baseName: "Greatsword",
    rarity: "COMMON",
    cost: { IRON: 5 },
    requiredForgeLevel: 4,
  },
  {
    id: "weapon_pistol",
    label: "Pistol",
    slot: "main_hand",
    baseName: "Pistol",
    rarity: "COMMON",
    cost: { IRON: 4, COPPER: 2 },
    requiredForgeLevel: 5,
  },
  {
    id: "weapon_bow",
    label: "Bow",
    slot: "main_hand",
    baseName: "Bow",
    rarity: "COMMON",
    cost: { WOOD: 5, IRON: 1 },
    requiredForgeLevel: 6,
  },
  {
    id: "weapon_shield",
    label: "Shield",
    slot: "off_hand",
    baseName: "Shield",
    rarity: "COMMON",
    cost: { IRON: 4, WOOD: 2 },
    requiredForgeLevel: 7,
  },
  {
    id: "weapon_spear",
    label: "Spear",
    slot: "main_hand",
    baseName: "Spear",
    rarity: "COMMON",
    cost: { WOOD: 3, IRON: 3 },
    requiredForgeLevel: 8,
  },
  {
    id: "weapon_grimoire",
    label: "Grimoire",
    slot: "main_hand",
    baseName: "Grimoire",
    rarity: "COMMON",
    cost: { PAPER: 2, INK: 1 },
    requiredForgeLevel: 9,
    requiredWorldLevel: 5,
    requiredQuestIds: [],
    requiredBossIds: [],
  },
  {
    id: "weapon_staff",
    label: "Staff",
    slot: "main_hand",
    baseName: "Staff",
    rarity: "COMMON",
    cost: { WOOD: 4, RUNES: 1 },
    requiredForgeLevel: 10,
    requiredQuestIds: [],
    requiredBossIds: [],
  },
];

export function getForgeRecipe(id: ForgeRecipeId): ForgeRecipe | undefined {
  return FORGE_RECIPES.find((r) => r.id === id);
}

export function getEffectiveForgeLevel(state: GameState): number {
  if (!state.buildings.forge.built) return 0;
  return Math.max(1, Math.floor(state.buildings.forge.level ?? 0));
}

export function getForgeRecipeLockReason(state: GameState, recipe: ForgeRecipe): ForgeRecipeLockReason | null {
  if (!state.buildings.forge.built) return "FORGE_NOT_BUILT";
  if (getEffectiveForgeLevel(state) < recipe.requiredForgeLevel) return "FORGE_LEVEL_TOO_LOW";
  if (recipe.requiredWorldLevel !== undefined && state.progression.worldLevel < recipe.requiredWorldLevel) {
    return "WORLD_LEVEL_TOO_LOW";
  }
  return null;
}

export function isForgeRecipeAvailable(state: GameState, recipe: ForgeRecipe): boolean {
  return getForgeRecipeLockReason(state, recipe) === null;
}

export function getAvailableForgeRecipes(state: GameState): ForgeRecipe[] {
  return FORGE_RECIPES.filter((recipe) => isForgeRecipeAvailable(state, recipe));
}
