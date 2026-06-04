import type { GameState } from "../../game/state.js";
import type { EquipmentSlot } from "../../items/types.js";
import {
  getResourceDefinitionOrThrow,
  normalizeResourceId,
  type ResourceCosts,
} from "../../resources/index.js";

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

export type ForgeRecipeCategory = "forge_weapon" | "forge_armor" | "forge_accessory";
export type ForgeRecipeRarityRoll = "weightedByForgeLevel";

export type ForgeRecipeUnlockConditions = Readonly<{
  requiredForgeLevel?: number;
  requiredBossId?: string;
  requiredChapter?: number;
  requiredQuestId?: string;
  requiredWorldLevel?: number;
}>;

export type ForgeOutputBaseDefinition = Readonly<{
  id: string;
  category: ForgeRecipeCategory;
  slot: EquipmentSlot;
  baseName: string;
}>;

export type ForgeRecipe = Readonly<{
  id: ForgeRecipeId;
  label: string;
  category: ForgeRecipeCategory;
  outputBaseId: string;
  ingredients: ResourceCosts;
  unlockConditions: ForgeRecipeUnlockConditions;
  rarityRoll: ForgeRecipeRarityRoll;
}>;

export type ForgeRecipeLockReason =
  | "FORGE_NOT_BUILT"
  | "FORGE_LEVEL_TOO_LOW"
  | "WORLD_LEVEL_TOO_LOW"
  | "CHAPTER_REQUIRED"
  | "QUEST_REQUIRED"
  | "BOSS_REQUIRED";

const FORGE_RECIPE_CATEGORIES = new Set<ForgeRecipeCategory>([
  "forge_weapon",
  "forge_armor",
  "forge_accessory",
]);

export const FORGE_OUTPUT_BASES: Readonly<Record<string, ForgeOutputBaseDefinition>> = {
  sword: { id: "sword", category: "forge_weapon", slot: "main_hand", baseName: "Sword" },
  iron_sword: { id: "iron_sword", category: "forge_weapon", slot: "main_hand", baseName: "Iron Sword" },
  dagger: { id: "dagger", category: "forge_weapon", slot: "main_hand", baseName: "Dagger" },
  axe: { id: "axe", category: "forge_weapon", slot: "main_hand", baseName: "Axe" },
  greatsword: { id: "greatsword", category: "forge_weapon", slot: "main_hand", baseName: "Greatsword" },
  pistol: { id: "pistol", category: "forge_weapon", slot: "main_hand", baseName: "Pistol" },
  bow: { id: "bow", category: "forge_weapon", slot: "main_hand", baseName: "Bow" },
  shield: { id: "shield", category: "forge_weapon", slot: "off_hand", baseName: "Shield" },
  spear: { id: "spear", category: "forge_weapon", slot: "main_hand", baseName: "Spear" },
  grimoire: { id: "grimoire", category: "forge_weapon", slot: "main_hand", baseName: "Grimoire" },
  staff: { id: "staff", category: "forge_weapon", slot: "main_hand", baseName: "Staff" },
  helmet: { id: "helmet", category: "forge_armor", slot: "helmet", baseName: "Helmet" },
  armor: { id: "armor", category: "forge_armor", slot: "chest", baseName: "Armor" },
  cape: { id: "cape", category: "forge_armor", slot: "cape", baseName: "Cape" },
  ring: { id: "ring", category: "forge_accessory", slot: "ring", baseName: "Ring" },
  relic: { id: "relic", category: "forge_accessory", slot: "artifact", baseName: "Relic" },
};

function recipe(params: {
  id: ForgeRecipeId;
  label: string;
  category: ForgeRecipeCategory;
  outputBaseId: string;
  ingredients: ResourceCosts;
  requiredForgeLevel: number;
  requiredWorldLevel?: number;
  requiredChapter?: number;
  requiredQuestId?: string;
  requiredBossId?: string;
}): ForgeRecipe {
  const {
    requiredForgeLevel,
    requiredWorldLevel,
    requiredChapter,
    requiredQuestId,
    requiredBossId,
    ...definition
  } = params;

  return {
    ...definition,
    unlockConditions: {
      requiredForgeLevel,
      requiredWorldLevel,
      requiredChapter,
      requiredQuestId,
      requiredBossId,
    },
    rarityRoll: "weightedByForgeLevel",
  };
}

export const FORGE_RECIPES: readonly ForgeRecipe[] = [
  recipe({
    id: "iron_sword",
    label: "Iron Sword",
    category: "forge_weapon",
    outputBaseId: "iron_sword",
    ingredients: { iron_ore: 4 },
    requiredForgeLevel: 1,
  }),
  recipe({
    id: "iron_helmet",
    label: "Iron Helmet",
    category: "forge_armor",
    outputBaseId: "helmet",
    ingredients: { iron_ore: 3 },
    requiredForgeLevel: 1,
  }),
  recipe({
    id: "copper_ring",
    label: "Quartz Ring",
    category: "forge_accessory",
    outputBaseId: "ring",
    ingredients: { quartz: 3 },
    requiredForgeLevel: 1,
  }),
  recipe({
    id: "BASIC_SWORD",
    label: "Basic Sword",
    category: "forge_weapon",
    outputBaseId: "sword",
    ingredients: { iron_ore: 3 },
    requiredForgeLevel: 1,
  }),
  recipe({
    id: "BASIC_ARMOR",
    label: "Basic Armor",
    category: "forge_armor",
    outputBaseId: "armor",
    ingredients: { iron_ore: 2, old_wood: 2 },
    requiredForgeLevel: 1,
  }),
  recipe({
    id: "BASIC_CAPE",
    label: "Basic Cape",
    category: "forge_armor",
    outputBaseId: "cape",
    ingredients: { old_wood: 2, iron_ore: 1 },
    requiredForgeLevel: 1,
  }),
  recipe({
    id: "BASIC_ARTIFACT",
    label: "Basic Relic",
    category: "forge_accessory",
    outputBaseId: "relic",
    ingredients: { quartz: 3, sapphire: 1 },
    requiredForgeLevel: 1,
  }),
  recipe({
    id: "weapon_sword",
    label: "Sword",
    category: "forge_weapon",
    outputBaseId: "sword",
    ingredients: { iron_ore: 3 },
    requiredForgeLevel: 1,
  }),
  recipe({
    id: "weapon_dagger",
    label: "Dagger",
    category: "forge_weapon",
    outputBaseId: "dagger",
    ingredients: { iron_ore: 2, silver_ore: 1 },
    requiredForgeLevel: 2,
  }),
  recipe({
    id: "weapon_axe",
    label: "Axe",
    category: "forge_weapon",
    outputBaseId: "axe",
    ingredients: { iron_ore: 3, old_wood: 1 },
    requiredForgeLevel: 3,
  }),
  recipe({
    id: "weapon_greatsword",
    label: "Greatsword",
    category: "forge_weapon",
    outputBaseId: "greatsword",
    ingredients: { iron_ore: 5 },
    requiredForgeLevel: 4,
  }),
  recipe({
    id: "weapon_pistol",
    label: "Pistol",
    category: "forge_weapon",
    outputBaseId: "pistol",
    ingredients: { iron_ore: 4, silver_ore: 2 },
    requiredForgeLevel: 5,
  }),
  recipe({
    id: "weapon_bow",
    label: "Bow",
    category: "forge_weapon",
    outputBaseId: "bow",
    ingredients: { old_wood: 5, iron_ore: 1 },
    requiredForgeLevel: 6,
  }),
  recipe({
    id: "weapon_shield",
    label: "Shield",
    category: "forge_weapon",
    outputBaseId: "shield",
    ingredients: { iron_ore: 4, old_wood: 2 },
    requiredForgeLevel: 7,
  }),
  recipe({
    id: "weapon_spear",
    label: "Spear",
    category: "forge_weapon",
    outputBaseId: "spear",
    ingredients: { old_wood: 3, iron_ore: 3 },
    requiredForgeLevel: 8,
  }),
  recipe({
    id: "weapon_grimoire",
    label: "Grimoire",
    category: "forge_weapon",
    outputBaseId: "grimoire",
    ingredients: { quartz: 2, sapphire: 1 },
    requiredForgeLevel: 9,
    requiredWorldLevel: 5,
  }),
  recipe({
    id: "weapon_staff",
    label: "Staff",
    category: "forge_weapon",
    outputBaseId: "staff",
    ingredients: { old_wood: 4, sapphire: 1 },
    requiredForgeLevel: 10,
  }),
] as const;

export function normalizeForgeRecipeIngredients(ingredients: ResourceCosts): ResourceCosts {
  const normalized: Record<string, number> = {};

  for (const [resourceId, amount] of Object.entries(ingredients)) {
    const canonicalId = normalizeResourceId(resourceId);
    const quantity = Math.max(0, Math.floor(amount ?? 0));
    if (quantity > 0) normalized[canonicalId] = (normalized[canonicalId] ?? 0) + quantity;
  }

  return normalized;
}

export function getForgeRecipe(id: ForgeRecipeId): ForgeRecipe | undefined {
  return FORGE_RECIPES.find((r) => r.id === id);
}

export function getForgeOutputBase(outputBaseId: string): ForgeOutputBaseDefinition | undefined {
  return FORGE_OUTPUT_BASES[outputBaseId];
}

export function getEffectiveForgeLevel(state: GameState): number {
  if (!state.buildings.forge.built) return 0;
  return Math.max(1, Math.floor(state.buildings.forge.level ?? 0));
}

function hasCompletedChapter(state: GameState, chapterId: number): boolean {
  return state.story.completedChapters.has(chapterId);
}

function hasCompletedQuest(state: GameState, questId: string): boolean {
  return state.story.completedEvents.has(questId);
}

function hasDefeatedBoss(state: GameState, bossId: string): boolean {
  return state.story.completedEvents.has(bossId);
}

export function getForgeRecipeLockReason(state: GameState, recipe: ForgeRecipe): ForgeRecipeLockReason | null {
  const unlocks = recipe.unlockConditions;
  if (!state.buildings.forge.built) return "FORGE_NOT_BUILT";
  if (getEffectiveForgeLevel(state) < (unlocks.requiredForgeLevel ?? 1)) return "FORGE_LEVEL_TOO_LOW";
  if (unlocks.requiredWorldLevel !== undefined && state.progression.worldLevel < unlocks.requiredWorldLevel) {
    return "WORLD_LEVEL_TOO_LOW";
  }
  if (unlocks.requiredChapter !== undefined && !hasCompletedChapter(state, unlocks.requiredChapter)) {
    return "CHAPTER_REQUIRED";
  }
  if (unlocks.requiredQuestId !== undefined && !hasCompletedQuest(state, unlocks.requiredQuestId)) {
    return "QUEST_REQUIRED";
  }
  if (unlocks.requiredBossId !== undefined && !hasDefeatedBoss(state, unlocks.requiredBossId)) {
    return "BOSS_REQUIRED";
  }
  return null;
}

export function isForgeRecipeAvailable(state: GameState, recipe: ForgeRecipe): boolean {
  return getForgeRecipeLockReason(state, recipe) === null;
}

export function getAvailableForgeRecipes(state: GameState): ForgeRecipe[] {
  return FORGE_RECIPES.filter((recipe) => isForgeRecipeAvailable(state, recipe));
}

export function validateForgeRecipeRegistry(
  recipes: readonly ForgeRecipe[] = FORGE_RECIPES,
  outputBases: Readonly<Record<string, ForgeOutputBaseDefinition>> = FORGE_OUTPUT_BASES,
): void {
  const ids = new Set<string>();

  for (const recipe of recipes) {
    if (!recipe.id) throw new Error("Forge recipe has an empty id");
    if (ids.has(recipe.id)) throw new Error(`Duplicate Forge recipe id: ${recipe.id}`);
    ids.add(recipe.id);

    if (!FORGE_RECIPE_CATEGORIES.has(recipe.category)) {
      throw new Error(`Invalid Forge recipe category for ${recipe.id}: ${recipe.category}`);
    }

    const outputBase = outputBases[recipe.outputBaseId];
    if (!outputBase) {
      throw new Error(`Forge recipe ${recipe.id} references unknown outputBaseId: ${recipe.outputBaseId}`);
    }
    if (outputBase.category !== recipe.category) {
      throw new Error(`Forge recipe ${recipe.id} category does not match output base ${recipe.outputBaseId}`);
    }

    const requiredForgeLevel = recipe.unlockConditions.requiredForgeLevel;
    if (requiredForgeLevel !== undefined && (!Number.isInteger(requiredForgeLevel) || requiredForgeLevel < 1)) {
      throw new Error(`Invalid requiredForgeLevel for Forge recipe ${recipe.id}: ${requiredForgeLevel}`);
    }

    if (recipe.rarityRoll !== "weightedByForgeLevel") {
      throw new Error(`Invalid rarityRoll for Forge recipe ${recipe.id}: ${recipe.rarityRoll}`);
    }

    for (const [resourceId, amount] of Object.entries(recipe.ingredients)) {
      const canonicalId = normalizeResourceId(resourceId);
      getResourceDefinitionOrThrow(canonicalId);
      if (amount === undefined || !Number.isInteger(amount) || amount <= 0) {
        throw new Error(`Invalid ingredient amount for Forge recipe ${recipe.id}/${resourceId}: ${amount}`);
      }
    }
  }
}

validateForgeRecipeRegistry();
