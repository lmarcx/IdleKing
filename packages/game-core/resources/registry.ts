import type { ItemRarity } from "../items/types.js";
import { assertValidRegistries, defineRegistry } from "../registry/index.js";
import type { CanonicalResourceId } from "./types.js";

export const RESOURCE_MAX_STACK = 999;

export const RESOURCE_TYPES = [
  "wood",
  "ore",
  "gem",
  "meat",
  "vegetable",
  "monster",
  "boss",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export type ResourceDefinition = Readonly<{
  id: CanonicalResourceId;
  name: string;
  type: ResourceType;
  rarity: ItemRarity;
  value: number;
  sources: readonly string[];
  uses: readonly string[];
  maxStack: typeof RESOURCE_MAX_STACK;
  tradable: true;
}>;

/**
 * DEFERRED balancing: Phase 5 freezes resource identities and relationships,
 * but final resource values still need an economy balancing pass.
 */
export const RESOURCE_VALUE_PLACEHOLDERS = {
  COMMON: 5,
  UNCOMMON: 15,
  RARE: 50,
  EPIC: 150,
  LEGENDARY: 500,
  BOSS_CORE_EPIC: 250,
  BOSS_CORE_LEGENDARY: 800,
} as const;

const common = RESOURCE_VALUE_PLACEHOLDERS.COMMON;
const uncommon = RESOURCE_VALUE_PLACEHOLDERS.UNCOMMON;
const rare = RESOURCE_VALUE_PLACEHOLDERS.RARE;
const epic = RESOURCE_VALUE_PLACEHOLDERS.EPIC;

function resource(
  definition: Omit<ResourceDefinition, "maxStack" | "tradable">
): ResourceDefinition {
  return { ...definition, maxStack: RESOURCE_MAX_STACK, tradable: true };
}

export const RESOURCE_DEFINITIONS: readonly ResourceDefinition[] = [
  resource({ id: "iron_ore", name: "Iron Ore", type: "ore", rarity: "COMMON", value: common, sources: ["mine", "skeletons"], uses: ["forge_weapons", "forge_armor", "forge_upgrade"] }),
  resource({ id: "cold_iron", name: "Cold Iron", type: "ore", rarity: "UNCOMMON", value: uncommon, sources: ["mine_glacial_era"], uses: ["forge_frost_weapons", "forge_frost_armor"] }),
  resource({ id: "silver_ore", name: "Silver Ore", type: "ore", rarity: "UNCOMMON", value: uncommon, sources: ["mine", "funeral_champion", "frozen_apprentice"], uses: ["forge_accessory", "forge_staff", "forge_pistol"] }),
  resource({ id: "quartz", name: "Quartz", type: "gem", rarity: "COMMON", value: common, sources: ["mine"], uses: ["forge_accessory", "forge_rings", "forge_upgrade"] }),
  resource({ id: "sapphire", name: "Sapphire", type: "gem", rarity: "RARE", value: rare, sources: ["mine", "glacial_elites"], uses: ["forge_frost_gear", "forge_rings", "forge_staff"] }),
  resource({ id: "pale_diamond", name: "Pale Diamond", type: "gem", rarity: "EPIC", value: epic, sources: ["mine_rare"], uses: ["forge_legendary_frost", "forge_catalyst"] }),
  resource({ id: "old_wood", name: "Old Wood", type: "wood", rarity: "COMMON", value: common, sources: ["mine_gathering", "farm_gathering"], uses: ["forge_early_weapons", "forge_armor", "forge_shield"] }),
  resource({ id: "ashwood", name: "Ashwood", type: "wood", rarity: "UNCOMMON", value: uncommon, sources: ["corrupted_dragonoids", "farm"], uses: ["forge_funeral_weapons", "forge_funeral_armor"] }),
  resource({ id: "frostpine", name: "Frostpine", type: "wood", rarity: "UNCOMMON", value: uncommon, sources: ["gathering_glacial_era"], uses: ["forge_frost_bow", "forge_frost_staff"] }),
  resource({ id: "frostroot", name: "Frostroot", type: "vegetable", rarity: "UNCOMMON", value: uncommon, sources: ["farm_glacial_era"], uses: ["kitchen_frost_resist"] }),
  resource({ id: "tomato", name: "Tomato", type: "vegetable", rarity: "COMMON", value: common, sources: ["farm"], uses: ["kitchen"] }),
  resource({ id: "carrot", name: "Carrot", type: "vegetable", rarity: "COMMON", value: common, sources: ["farm"], uses: ["kitchen"] }),
  resource({ id: "tough_meat", name: "Tough Meat", type: "meat", rarity: "COMMON", value: common, sources: ["farm", "skeletons"], uses: ["kitchen", "forge_bone_knife", "forge_rings"] }),
  resource({ id: "frozen_fish", name: "Frozen Fish", type: "meat", rarity: "UNCOMMON", value: uncommon, sources: ["sirens", "frozen_marine_creatures"], uses: ["kitchen_frost_soup"] }),
  resource({ id: "shadow_residue", name: "Shadow Residue", type: "monster", rarity: "COMMON", value: common, sources: ["war_shadows", "funeral_spectres"], uses: ["forge_funeral_blade", "forge_spectral_shiv", "forge_sets"] }),
  resource({ id: "spectral_dust", name: "Spectral Dust", type: "monster", rarity: "UNCOMMON", value: uncommon, sources: ["dark_spectres"], uses: ["forge_funeral_weapons", "forge_funeral_armor", "forge_catalyst"] }),
  resource({ id: "bone_fragment", name: "Bone Fragment", type: "monster", rarity: "COMMON", value: common, sources: ["funeral_skeletons"], uses: ["forge_bone_knife", "market_sell"] }),
  resource({ id: "dragon_scale_fragment", name: "Dragon Scale Fragment", type: "monster", rarity: "RARE", value: rare, sources: ["dragonoids", "ash_guardian"], uses: ["forge_funeral_defense", "market_sell"] }),
  resource({ id: "frozen_echo", name: "Frozen Echo", type: "monster", rarity: "UNCOMMON", value: uncommon, sources: ["cold_spectres", "frozen_mages"], uses: ["forge_frost_weapons", "forge_frost_armor", "forge_rings"] }),
  resource({ id: "pearlescent_scale", name: "Pearlescent Scale", type: "monster", rarity: "RARE", value: rare, sources: ["sirens", "fallen_rain_lord"], uses: ["forge_frost_marine", "market_sell"] }),
  resource({ id: "cold_shell_fragment", name: "Cold Shell Fragment", type: "monster", rarity: "UNCOMMON", value: uncommon, sources: ["frozen_marine_creatures"], uses: ["market_sell"] }),
  resource({ id: "archival_fragment", name: "Archival Fragment", type: "monster", rarity: "RARE", value: rare, sources: ["frozen_mages", "arathas_aberrations"], uses: ["forge_arathas_arcane", "market_sell"] }),
  resource({ id: "experimental_tissue", name: "Experimental Tissue", type: "monster", rarity: "RARE", value: rare, sources: ["arathas_aberrations"], uses: ["market_sell"] }),
  resource({ id: "dark_amalgam_core", name: "Dark Amalgam Core", type: "boss", rarity: "EPIC", value: RESOURCE_VALUE_PLACEHOLDERS.BOSS_CORE_EPIC, sources: ["dark_amalgam"], uses: ["forge_funeral_blade", "glacial_era_catalyst"] }),
  resource({ id: "dragon_ash_core", name: "Dragon Ash Core", type: "boss", rarity: "EPIC", value: RESOURCE_VALUE_PLACEHOLDERS.BOSS_CORE_EPIC, sources: ["dragon_shadow"], uses: ["forge_dragon_gear", "forge_catalyst"] }),
  resource({ id: "frost_amalgam_core", name: "Frost Amalgam Core", type: "boss", rarity: "EPIC", value: RESOURCE_VALUE_PLACEHOLDERS.BOSS_CORE_EPIC, sources: ["frost_amalgam"], uses: ["forge_frost_weapons"] }),
  resource({ id: "archmage_sigil", name: "Archmage Sigil", type: "boss", rarity: "EPIC", value: RESOURCE_VALUE_PLACEHOLDERS.BOSS_CORE_EPIC, sources: ["corrupted_archmage"], uses: ["forge_arathas_staff", "forge_icebound_grimoire"] }),
  resource({ id: "frozen_queen_tear", name: "Frozen Queen Tear", type: "boss", rarity: "LEGENDARY", value: RESOURCE_VALUE_PLACEHOLDERS.BOSS_CORE_LEGENDARY, sources: ["allaeva"], uses: ["forge_white_queen_gear", "deluge_era_catalyst"] }),
] as const;

export const RESOURCE_REGISTRY = defineRegistry({
  name: "resources",
  entries: RESOURCE_DEFINITIONS,
});

export const RESOURCE_ALIASES = {
  iron_scrap: "iron_ore",
  iron: "iron_ore",
  sapphire_fragment: "sapphire",
  silver: "silver_ore",
  wood: "old_wood",
  meat: "tough_meat",
  gems: "quartz",
  fallen_rain_pearl: "pearlescent_scale",
} as const satisfies Readonly<Record<string, CanonicalResourceId>>;

const RESOURCE_BY_ID = new Map<CanonicalResourceId, ResourceDefinition>(
  RESOURCE_DEFINITIONS.map((definition) => [definition.id, definition])
);

export function normalizeResourceId(input: string): CanonicalResourceId {
  const normalized = input.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const alias = RESOURCE_ALIASES[normalized as keyof typeof RESOURCE_ALIASES];
  if (alias) return alias;
  if (RESOURCE_BY_ID.has(normalized as CanonicalResourceId)) return normalized as CanonicalResourceId;
  throw new Error(`Unknown MVP resource id: ${input}`);
}

export function getResourceDefinition(resourceId: string): ResourceDefinition | undefined {
  try {
    return RESOURCE_BY_ID.get(normalizeResourceId(resourceId));
  } catch {
    return undefined;
  }
}

export function getResourceDefinitionOrThrow(resourceId: string): ResourceDefinition {
  const definition = getResourceDefinition(resourceId);
  if (!definition) throw new Error(`Unknown MVP resource id: ${resourceId}`);
  return definition;
}

export function validateResourceRegistry(
  definitions: readonly ResourceDefinition[] = RESOURCE_DEFINITIONS,
  aliases: Readonly<Record<string, string>> = RESOURCE_ALIASES
): void {
  assertValidRegistries([defineRegistry({ name: "resources", entries: definitions })]);
  const ids = new Set<string>();
  const validTypes = new Set<string>(RESOURCE_TYPES);

  for (const definition of definitions) {
    ids.add(definition.id);
    if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(definition.id)) {
      throw new Error(`Invalid resource id: ${definition.id}`);
    }
    if (!validTypes.has(definition.type)) {
      throw new Error(`Invalid resource type for ${definition.id}: ${definition.type}`);
    }
    if (definition.maxStack !== RESOURCE_MAX_STACK) {
      throw new Error(`Invalid maxStack for ${definition.id}: ${definition.maxStack}`);
    }
    if (!Number.isFinite(definition.value) || definition.value < 0) {
      throw new Error(`Invalid resource value for ${definition.id}: ${definition.value}`);
    }
    if (definition.uses.length === 0 && !(definition.tradable && definition.value >= 0)) {
      throw new Error(`Resource ${definition.id} needs at least one use or market_sell value`);
    }
    if (definition.tradable !== true) {
      throw new Error(`Resource ${definition.id} must be tradable`);
    }
  }

  for (const [alias, resourceId] of Object.entries(aliases)) {
    if (!ids.has(resourceId)) {
      throw new Error(`Resource alias ${alias} references unknown MVP resource id: ${resourceId}`);
    }
  }
}

validateResourceRegistry();
