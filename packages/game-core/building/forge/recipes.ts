import type { GameState } from "../../game/state.js";
import type { EquipmentSlot } from "../../items/types.js";
import {
  getResourceDefinitionOrThrow,
  normalizeResourceId,
  type ResourceCosts,
} from "../../resources/index.js";
import {
  getEquipmentSlotForWeaponFamily,
  getWeaponFamilyDefinition,
  getWeaponFamilyUnlockLevel,
  type WeaponFamily,
} from "./weapons.js";

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
  | "boss_funeral_blade"
  | "boss_ashen_axe"
  | "boss_ashen_spear"
  | "boss_dragonbone_greatsword"
  | "boss_dragon_ash_shield"
  | "boss_frostfang_dagger"
  | "boss_frostbound_longsword"
  | "boss_arathas_staff"
  | "boss_icebound_grimoire"
  | "boss_frozen_royal_shield"
  | "boss_queens_tear_necklace"
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
  weaponFamily?: WeaponFamily;
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

export const FORGE_MVP_BOSS_IDS = [
  "dark_amalgam",
  "dragon_shadow",
  "frost_amalgam",
  "corrupted_archmage",
  "allaeva",
] as const;

const FORGE_MVP_BOSS_ID_SET = new Set<string>(FORGE_MVP_BOSS_IDS);

export const FORGE_OUTPUT_BASES: Readonly<Record<string, ForgeOutputBaseDefinition>> = {
  sword: { id: "sword", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("sword"), baseName: "Sword", weaponFamily: "sword" },
  iron_sword: { id: "iron_sword", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("sword"), baseName: "Iron Sword", weaponFamily: "sword" },
  dagger: { id: "dagger", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("dagger"), baseName: "Dagger", weaponFamily: "dagger" },
  axe: { id: "axe", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("axe"), baseName: "Axe", weaponFamily: "axe" },
  greatsword: { id: "greatsword", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("greatsword"), baseName: "Greatsword", weaponFamily: "greatsword" },
  pistol: { id: "pistol", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("pistol"), baseName: "Pistol", weaponFamily: "pistol" },
  bow: { id: "bow", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("bow"), baseName: "Bow", weaponFamily: "bow" },
  shield: { id: "shield", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("shield"), baseName: "Shield", weaponFamily: "shield" },
  spear: { id: "spear", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("spear"), baseName: "Spear", weaponFamily: "spear" },
  grimoire: { id: "grimoire", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("grimoire"), baseName: "Grimoire", weaponFamily: "grimoire" },
  staff: { id: "staff", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("staff"), baseName: "Staff", weaponFamily: "staff" },
  funeral_blade: { id: "funeral_blade", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("sword"), baseName: "Funeral Blade", weaponFamily: "sword" },
  ashen_axe: { id: "ashen_axe", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("axe"), baseName: "Ashen Axe", weaponFamily: "axe" },
  ashen_spear: { id: "ashen_spear", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("spear"), baseName: "Ashen Spear", weaponFamily: "spear" },
  dragonbone_greatsword: { id: "dragonbone_greatsword", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("greatsword"), baseName: "Dragonbone Greatsword", weaponFamily: "greatsword" },
  dragon_ash_shield: { id: "dragon_ash_shield", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("shield"), baseName: "Dragon Ash Shield", weaponFamily: "shield" },
  frostfang_dagger: { id: "frostfang_dagger", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("dagger"), baseName: "Frostfang Dagger", weaponFamily: "dagger" },
  frostbound_longsword: { id: "frostbound_longsword", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("sword"), baseName: "Frostbound Longsword", weaponFamily: "sword" },
  arathas_staff: { id: "arathas_staff", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("staff"), baseName: "Arathas Staff", weaponFamily: "staff" },
  icebound_grimoire: { id: "icebound_grimoire", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("grimoire"), baseName: "Icebound Grimoire", weaponFamily: "grimoire" },
  frozen_royal_shield: { id: "frozen_royal_shield", category: "forge_weapon", slot: getEquipmentSlotForWeaponFamily("shield"), baseName: "Frozen Royal Shield", weaponFamily: "shield" },
  helmet: { id: "helmet", category: "forge_armor", slot: "helmet", baseName: "Helmet" },
  armor: { id: "armor", category: "forge_armor", slot: "chest", baseName: "Armor" },
  cape: { id: "cape", category: "forge_armor", slot: "cape", baseName: "Cape" },
  ring: { id: "ring", category: "forge_accessory", slot: "ring", baseName: "Ring" },
  necklace: { id: "necklace", category: "forge_accessory", slot: "necklace", baseName: "Necklace" },
  queens_tear_necklace: { id: "queens_tear_necklace", category: "forge_accessory", slot: "necklace", baseName: "Queen's Tear Necklace" },
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
  recipe({
    id: "boss_funeral_blade",
    label: "Funeral Blade",
    category: "forge_weapon",
    outputBaseId: "funeral_blade",
    ingredients: { spectral_dust: 3, shadow_residue: 5, dark_amalgam_core: 1 },
    requiredForgeLevel: 1,
    requiredBossId: "dark_amalgam",
  }),
  recipe({
    id: "boss_ashen_axe",
    label: "Ashen Axe",
    category: "forge_weapon",
    outputBaseId: "ashen_axe",
    ingredients: { ashwood: 3, dragon_scale_fragment: 2, dragon_ash_core: 1 },
    requiredForgeLevel: 3,
    requiredBossId: "dragon_shadow",
  }),
  recipe({
    id: "boss_ashen_spear",
    label: "Ashen Spear",
    category: "forge_weapon",
    outputBaseId: "ashen_spear",
    ingredients: { ashwood: 3, dragon_scale_fragment: 2, dragon_ash_core: 1 },
    requiredForgeLevel: 8,
    requiredBossId: "dragon_shadow",
  }),
  recipe({
    id: "boss_dragonbone_greatsword",
    label: "Dragonbone Greatsword",
    category: "forge_weapon",
    outputBaseId: "dragonbone_greatsword",
    ingredients: { bone_fragment: 4, dragon_scale_fragment: 3, dragon_ash_core: 1 },
    requiredForgeLevel: 4,
    requiredBossId: "dragon_shadow",
  }),
  recipe({
    id: "boss_dragon_ash_shield",
    label: "Dragon Ash Shield",
    category: "forge_weapon",
    outputBaseId: "dragon_ash_shield",
    ingredients: { ashwood: 2, dragon_scale_fragment: 3, dragon_ash_core: 1 },
    requiredForgeLevel: 7,
    requiredBossId: "dragon_shadow",
  }),
  recipe({
    id: "boss_frostfang_dagger",
    label: "Frostfang Dagger",
    category: "forge_weapon",
    outputBaseId: "frostfang_dagger",
    ingredients: { cold_iron: 2, frozen_echo: 3, frost_amalgam_core: 1 },
    requiredForgeLevel: 2,
    requiredBossId: "frost_amalgam",
  }),
  recipe({
    id: "boss_frostbound_longsword",
    label: "Frostbound Longsword",
    category: "forge_weapon",
    outputBaseId: "frostbound_longsword",
    ingredients: { cold_iron: 3, sapphire: 1, frost_amalgam_core: 1 },
    requiredForgeLevel: 1,
    requiredBossId: "frost_amalgam",
  }),
  recipe({
    id: "boss_arathas_staff",
    label: "Arathas Staff",
    category: "forge_weapon",
    outputBaseId: "arathas_staff",
    ingredients: { frostpine: 3, archival_fragment: 2, archmage_sigil: 1 },
    requiredForgeLevel: 10,
    requiredBossId: "corrupted_archmage",
  }),
  recipe({
    id: "boss_icebound_grimoire",
    label: "Icebound Grimoire",
    category: "forge_weapon",
    outputBaseId: "icebound_grimoire",
    ingredients: { quartz: 2, archival_fragment: 2, archmage_sigil: 1 },
    requiredForgeLevel: 9,
    requiredBossId: "corrupted_archmage",
  }),
  recipe({
    id: "boss_frozen_royal_shield",
    label: "Frozen Royal Shield",
    category: "forge_weapon",
    outputBaseId: "frozen_royal_shield",
    ingredients: { cold_iron: 4, frozen_echo: 2, frozen_queen_tear: 1 },
    requiredForgeLevel: 7,
    requiredBossId: "allaeva",
  }),
  recipe({
    id: "boss_queens_tear_necklace",
    label: "Queen's Tear Necklace",
    category: "forge_accessory",
    outputBaseId: "queens_tear_necklace",
    ingredients: { sapphire: 2, pearlescent_scale: 1, frozen_queen_tear: 1 },
    requiredForgeLevel: 1,
    requiredBossId: "allaeva",
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

export function getCanonicalForgeRecipeRequiredLevel(recipe: ForgeRecipe): number {
  const outputBase = getForgeOutputBase(recipe.outputBaseId);
  const recipeLevel = recipe.unlockConditions.requiredForgeLevel ?? 1;
  const weaponLevel =
    recipe.category === "forge_weapon" && outputBase?.weaponFamily
      ? getWeaponFamilyUnlockLevel(outputBase.weaponFamily)
      : 1;
  return Math.max(recipeLevel, weaponLevel);
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
  if (getEffectiveForgeLevel(state) < getCanonicalForgeRecipeRequiredLevel(recipe)) return "FORGE_LEVEL_TOO_LOW";
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
    if (recipe.category === "forge_weapon") {
      if (!outputBase.weaponFamily) {
        throw new Error(`Forge weapon recipe ${recipe.id} output base has no weapon family`);
      }
      if (!getWeaponFamilyDefinition(outputBase.weaponFamily)) {
        throw new Error(`Forge recipe ${recipe.id} references unknown weapon family: ${outputBase.weaponFamily}`);
      }
      const canonicalLevel = getWeaponFamilyUnlockLevel(outputBase.weaponFamily);
      const recipeLevel = recipe.unlockConditions.requiredForgeLevel;
      if (recipeLevel !== canonicalLevel) {
        throw new Error(
          `Forge recipe ${recipe.id} requiredForgeLevel ${recipeLevel} must match ${outputBase.weaponFamily} ladder level ${canonicalLevel}`,
        );
      }
    }

    const requiredForgeLevel = recipe.unlockConditions.requiredForgeLevel;
    if (requiredForgeLevel !== undefined && (!Number.isInteger(requiredForgeLevel) || requiredForgeLevel < 1)) {
      throw new Error(`Invalid requiredForgeLevel for Forge recipe ${recipe.id}: ${requiredForgeLevel}`);
    }

    if (String(recipe.id).startsWith("boss_") && !recipe.unlockConditions.requiredBossId) {
      throw new Error(`Boss-gated Forge recipe ${recipe.id} must declare requiredBossId`);
    }
    if (
      recipe.unlockConditions.requiredBossId !== undefined &&
      !FORGE_MVP_BOSS_ID_SET.has(recipe.unlockConditions.requiredBossId)
    ) {
      throw new Error(`Forge recipe ${recipe.id} references non-MVP boss id: ${recipe.unlockConditions.requiredBossId}`);
    }

    if (recipe.rarityRoll !== "weightedByForgeLevel") {
      throw new Error(`Invalid rarityRoll for Forge recipe ${recipe.id}: ${recipe.rarityRoll}`);
    }

    if (recipe.id === "boss_funeral_blade") {
      for (const resourceId of Object.keys(recipe.ingredients)) {
        if (resourceId === "fallen_rain_pearl" || normalizeResourceId(resourceId) === "pearlescent_scale") {
          throw new Error("Funeral Blade must not reference fallen_rain_pearl or pearlescent_scale");
        }
      }
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
