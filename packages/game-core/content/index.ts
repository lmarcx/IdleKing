import {
  FORGE_RECIPES,
  FORGE_OUTPUT_BASES,
  type ForgeRecipe,
} from "../building/forge/recipes.js";
import { craftEquipmentFromRecipe } from "../building/forge/craft.js";
import {
  FORGE_CRAFT_RARITIES,
  getForgeUpgradeMaxLevel,
} from "../building/forge/rules.js";
import { forgeRecycleEquipment } from "../building/forge/recycle.js";
import { forgeUpgradeEquipment } from "../building/forge/upgrade.js";
import { CANONICAL_BUILDING_IDS } from "../building/progression.js";
import { CURRENCIES, createDefaultWalletState, grantCurrency, isCurrencyId } from "../currencies/index.js";
import {
  applyDamageToPlayer,
  applyDashCost,
  applySprintCost,
  createCombatRuntimeState,
  handlePlayerDeathAtCheckpoint,
  regenerateResources,
  spendMana,
  spendStamina,
} from "../combat/runtime/index.js";
import {
  EQUIPMENT_SETS,
  RINGS_SKILLS_MAP,
  generateEquipmentItem,
  validateRingsSkillsMap,
} from "../equipment/index.js";
import {
  EFFECT_SET_IDS,
  EFFECT_SET_REGISTRY,
  validateEffectSetRegistry,
  type EffectSetDefinition,
} from "../effectSets/index.js";
import { createInitialGameState } from "../game/state.js";
import { forumRankUpWorld } from "../game/forumActions.js";
import { ITEM_RARITIES } from "../items/index.js";
import {
  BOSS_EQUIPMENT_RARITY_WEIGHTS,
  ENEMY_LOOT_TABLES,
  type EnemyLootTableDefinition,
} from "../loot/mvpConfig.js";
import { getCurrencyBalance } from "../currencies/index.js";
import {
  RESOURCE_DEFINITIONS,
  addResourceToStock,
  canSpendResources,
  spendResources,
  type ResourceDefinition,
} from "../resources/index.js";
import {
  DEFAULT_UNLOCKED_ERAS,
  ERA_REGISTRY,
  isEraPlayable,
  unlockEraAtTimeGate,
  validateSpecialItemsAndEraRegistry,
  type EraDefinition,
} from "../specialItems/index.js";
import {
  completeDungeon,
  STORY_BOSS_REGISTRY,
  STORY_CHAPTER_REGISTRY,
  STORY_DUNGEON_REGISTRY,
  validateStoryProgressionRegistry,
  type StoryBossDefinition,
  type StoryChapterDefinition,
  type StoryDungeonDefinition,
} from "../story/progressionMvp.js";
import { getCanonicalResourceQuantity } from "../resources/index.js";
import { PLAYER_LEVEL_SKILL_POINTS_GAIN_DISABLED } from "../game/playerXpActions.js";
import { createSeededRng } from "../random/index.js";
import { wxpNext } from "../progression/worldXp.js";
import {
  applyWorldResourceRegenForElapsed,
  createDefaultWorldResourcesState,
  maxWorldEnergy,
  worldEnergyRegenPerMinute,
} from "../world/worldResources.js";

export const MVP_BOSS_ROSTER = [
  "dark_amalgam",
  "dragon_shadow",
  "frost_amalgam",
  "corrupted_archmage",
  "fallen_rain_lord",
  "allaeva",
] as const;

export type MvpBossId = typeof MVP_BOSS_ROSTER[number];

export type MvpContentGraphValidationInput = Readonly<{
  chapters?: readonly StoryChapterDefinition[];
  dungeons?: readonly StoryDungeonDefinition[];
  bosses?: readonly StoryBossDefinition[];
  resources?: readonly ResourceDefinition[];
  recipes?: readonly ForgeRecipe[];
  lootTables?: readonly EnemyLootTableDefinition[];
  effectSets?: readonly EffectSetDefinition[];
  eras?: readonly EraDefinition[];
}>;

export type MvpContentGraphValidationResult = Readonly<{
  ok: boolean;
  errors: readonly string[];
}>;

const MVP_BOSS_SET = new Set<string>(MVP_BOSS_ROSTER);
const MVP_RARITY_SET = new Set<string>(ITEM_RARITIES);
const FORBIDDEN_ACTIVE_LABELS = [
  "Mythic",
  "Divine",
  "Ancient",
  "Duel",
  "Boss Rush",
  "Expeditions",
  "Raid",
  "Chapter III",
  "Evolve",
  "Enchant",
  "Fusion",
] as const;

export function validateMvpContentGraph(
  input: MvpContentGraphValidationInput = {},
): MvpContentGraphValidationResult {
  const errors: string[] = [];
  const chapters = input.chapters ?? STORY_CHAPTER_REGISTRY;
  const dungeons = input.dungeons ?? STORY_DUNGEON_REGISTRY;
  const bosses = input.bosses ?? STORY_BOSS_REGISTRY;
  const resources = input.resources ?? RESOURCE_DEFINITIONS;
  const recipes = input.recipes ?? FORGE_RECIPES;
  const lootTables = input.lootTables ?? ENEMY_LOOT_TABLES;
  const effectSets = input.effectSets ?? EFFECT_SET_REGISTRY;
  const eras = input.eras ?? ERA_REGISTRY;

  runValidation(errors, () => validateStoryProgressionRegistry(chapters, dungeons, bosses));
  runValidation(errors, () => validateEffectSetRegistry(effectSets));
  runValidation(errors, () => validateSpecialItemsAndEraRegistry(eras));
  runValidation(errors, () => validateRingsSkillsMap(RINGS_SKILLS_MAP));

  const chapterIds = new Set(chapters.map((chapter) => chapter.chapterId));
  const dungeonIds = new Set(dungeons.map((dungeon) => dungeon.id));
  const bossIds = new Set(bosses.map((boss) => boss.id));
  const resourceIds = new Set(resources.map((resource) => resource.id));
  const producedStoryEvents = collectProducedStoryEvents(chapters, dungeons, bosses);

  validateRoster(errors, bosses, dungeons);
  validateChapterDungeonRefs(errors, chapters, dungeonIds);
  validateDungeonBossRefs(errors, dungeons, bossIds);
  validateBossDungeonRefs(errors, bosses, dungeonIds, dungeons);
  validateStoryRewards(errors, dungeons, resourceIds);
  validateRecipeRefs(errors, recipes, resourceIds, bossIds);
  validateLootTables(errors, lootTables, resourceIds);
  validateEffectSetSources(errors, effectSets, bossIds, producedStoryEvents);
  validateResourcesClosed(errors, resources);
  validateEquipmentSets(errors);
  validateTimeGateEras(errors, eras, producedStoryEvents);
  validateAntiScope(errors, {
    chapters,
    dungeons,
    bosses,
    recipes,
    effectSets,
    eras,
    chapterIds,
  });
  validateStoryFirstClearAndSpecialRewards(errors);

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function assertValidMvpContentGraph(input: MvpContentGraphValidationInput = {}): void {
  const result = validateMvpContentGraph(input);
  if (!result.ok) {
    throw new Error(`Invalid MVP content graph:\n${result.errors.join("\n")}`);
  }
}

export function assertMvpNoSoftLockGuards(): void {
  const errors: string[] = [];

  runValidation(errors, validateCombatResourceGuards);
  runValidation(errors, validateWorldResourceGuards);
  runValidation(errors, validateEconomySoftLockGuards);
  runValidation(errors, validateStoryTimeGateSoftLockGuards);

  if (errors.length > 0) {
    throw new Error(`Invalid MVP no-soft-lock guards:\n${errors.join("\n")}`);
  }
}

function runValidation(errors: string[], validate: () => void): void {
  try {
    validate();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
}

function validateRoster(
  errors: string[],
  bosses: readonly StoryBossDefinition[],
  dungeons: readonly StoryDungeonDefinition[],
): void {
  const bossIds = bosses.map((boss) => boss.id).sort();
  const expected = [...MVP_BOSS_ROSTER].sort();
  if (bossIds.join(",") !== expected.join(",")) {
    errors.push(`MVP boss roster mismatch: expected ${expected.join(",")} got ${bossIds.join(",")}`);
  }
  for (const boss of bosses) {
    if (!MVP_BOSS_SET.has(boss.id)) errors.push(`Non-MVP boss active: ${boss.id}`);
  }

  const royalAbyss = dungeons.find((dungeon) => dungeon.id === "royal_abyss");
  if (royalAbyss?.bossId !== "fallen_rain_lord") {
    errors.push("Gouffre Royal must reference fallen_rain_lord");
  }
  const frostSource = dungeons.find((dungeon) => dungeon.id === "frost_source");
  if (frostSource?.bossId !== "allaeva") {
    errors.push("Source du Givre must reference allaeva");
  }
  const arathas = dungeons.find((dungeon) => dungeon.id === "arathas_academy");
  if (arathas?.bossId !== "corrupted_archmage") {
    errors.push("Academie d'Arathas must reference corrupted_archmage");
  }

  const allaeva = bosses.find((boss) => boss.id === "allaeva");
  if (allaeva?.phases !== 2) errors.push("Allaeva must have exactly 2 phases");
  const archmage = bosses.find((boss) => boss.id === "corrupted_archmage");
  if (archmage?.phases !== 2) errors.push("Corrupted Archmage must have exactly 2 phases");
}

function validateChapterDungeonRefs(
  errors: string[],
  chapters: readonly StoryChapterDefinition[],
  dungeonIds: Set<string>,
): void {
  for (const chapter of chapters) {
    for (const dungeonId of chapter.dungeonIds) {
      if (!dungeonIds.has(dungeonId)) errors.push(`Chapter ${chapter.chapterId} references unknown dungeon: ${dungeonId}`);
    }
  }
}

function validateDungeonBossRefs(
  errors: string[],
  dungeons: readonly StoryDungeonDefinition[],
  bossIds: Set<string>,
): void {
  for (const dungeon of dungeons) {
    if (dungeon.bossId !== null && !bossIds.has(dungeon.bossId)) {
      errors.push(`Dungeon ${dungeon.id} references unknown boss: ${dungeon.bossId}`);
    }
  }
}

function validateBossDungeonRefs(
  errors: string[],
  bosses: readonly StoryBossDefinition[],
  dungeonIds: Set<string>,
  dungeons: readonly StoryDungeonDefinition[],
): void {
  for (const boss of bosses) {
    if (!dungeonIds.has(boss.dungeonId)) {
      errors.push(`Boss ${boss.id} references unknown dungeon: ${boss.dungeonId}`);
      continue;
    }
    const dungeon = dungeons.find((candidate) => candidate.id === boss.dungeonId);
    if (dungeon?.bossId !== boss.id) {
      errors.push(`Boss ${boss.id} is not the bossId of dungeon ${boss.dungeonId}`);
    }
  }
}

function validateStoryRewards(
  errors: string[],
  dungeons: readonly StoryDungeonDefinition[],
  resourceIds: Set<string>,
): void {
  for (const dungeon of dungeons) {
    validateRewardBundle(errors, dungeon.firstClearRewards, resourceIds, `${dungeon.id} firstClearRewards`);
    validateRewardBundle(errors, dungeon.replayRewards, resourceIds, `${dungeon.id} replayRewards`);
  }
}

function validateRewardBundle(
  errors: string[],
  rewards: StoryDungeonDefinition["firstClearRewards"],
  resourceIds: Set<string>,
  owner: string,
): void {
  for (const reward of rewards.resources ?? []) {
    if (!resourceIds.has(reward.resourceId as any)) {
      errors.push(`${owner} references unknown resource: ${reward.resourceId}`);
    }
    if (!Number.isInteger(reward.amount) || reward.amount <= 0) {
      errors.push(`${owner} has invalid resource amount for ${reward.resourceId}: ${reward.amount}`);
    }
  }
  for (const reward of rewards.currencies ?? []) {
    if (!isCurrencyId(reward.currencyId)) {
      errors.push(`${owner} references unknown currency: ${reward.currencyId}`);
    }
    if (!Number.isInteger(reward.amount) || reward.amount <= 0) {
      errors.push(`${owner} has invalid currency amount for ${reward.currencyId}: ${reward.amount}`);
    }
  }
}

function validateRecipeRefs(
  errors: string[],
  recipes: readonly ForgeRecipe[],
  resourceIds: Set<string>,
  bossIds: Set<string>,
): void {
  const outputBaseIds = new Set(Object.keys(FORGE_OUTPUT_BASES));
  const recipeIds = new Set<string>();
  for (const recipe of recipes) {
    if (recipeIds.has(recipe.id)) errors.push(`Duplicate Forge recipe id: ${recipe.id}`);
    recipeIds.add(recipe.id);
    if (!outputBaseIds.has(recipe.outputBaseId)) {
      errors.push(`Forge recipe ${recipe.id} references unknown outputBaseId: ${recipe.outputBaseId}`);
    }
    if (recipe.unlockConditions.requiredBossId && !bossIds.has(recipe.unlockConditions.requiredBossId)) {
      errors.push(`Forge recipe ${recipe.id} references unknown boss: ${recipe.unlockConditions.requiredBossId}`);
    }
    if (recipe.rarityRoll !== "weightedByForgeLevel") {
      errors.push(`Forge recipe ${recipe.id} must use weightedByForgeLevel`);
    }
    for (const [resourceId, amount] of Object.entries(recipe.ingredients)) {
      if (!resourceIds.has(resourceId)) {
        errors.push(`Forge recipe ${recipe.id} references unknown resource: ${resourceId}`);
      }
      if (amount === undefined || !Number.isInteger(amount) || amount <= 0) {
        errors.push(`Forge recipe ${recipe.id} has invalid amount for ${resourceId}: ${amount}`);
      }
    }
  }
}

function validateLootTables(
  errors: string[],
  lootTables: readonly EnemyLootTableDefinition[],
  resourceIds: Set<string>,
): void {
  const ids = new Set<string>();
  for (const lootTable of lootTables) {
    if (ids.has(lootTable.id)) errors.push(`Duplicate loot table id: ${lootTable.id}`);
    ids.add(lootTable.id);
    for (const drop of lootTable.drops) {
      if (!resourceIds.has(drop.resourceId)) {
        errors.push(`Loot table ${lootTable.id} references unknown resource: ${drop.resourceId}`);
      }
    }
  }
}

function validateEffectSetSources(
  errors: string[],
  effectSets: readonly EffectSetDefinition[],
  bossIds: Set<string>,
  storyEvents: Set<string>,
): void {
  for (const effectSet of effectSets) {
    if (effectSet.source.kind === "boss_first_clear" && !bossIds.has(effectSet.source.id)) {
      errors.push(`Effect Set ${effectSet.id} references unknown boss source: ${effectSet.source.id}`);
    }
    if (effectSet.source.kind === "story_event" && !storyEvents.has(effectSet.source.id)) {
      errors.push(`Effect Set ${effectSet.id} references unknown story event source: ${effectSet.source.id}`);
    }
  }
}

function validateResourcesClosed(errors: string[], resources: readonly ResourceDefinition[]): void {
  const ids = new Set<string>();
  for (const resource of resources) {
    if (ids.has(resource.id)) errors.push(`Duplicate resource id: ${resource.id}`);
    ids.add(resource.id);
    const resourceId = String(resource.id);
    if (resourceId === "fragment_du_temps" || resourceId === "kaleidoscope") {
      errors.push(`${resource.id} must not be registered as a resource`);
    }
    if (!MVP_RARITY_SET.has(resource.rarity)) {
      errors.push(`Resource ${resource.id} uses non-MVP rarity: ${resource.rarity}`);
    }
    if (resource.uses.length === 0 && !(resource.tradable && resource.value > 0)) {
      errors.push(`Resource ${resource.id} needs recipe use or market_sell/value usability`);
    }
  }
}

function validateEquipmentSets(errors: string[]): void {
  const ids = new Set<string>();
  for (const set of EQUIPMENT_SETS) {
    if (ids.has(set.id)) errors.push(`Duplicate equipment set id: ${set.id}`);
    ids.add(set.id);
    if (set.status !== "active" && set.status !== "placeholder") {
      errors.push(`Invalid equipment set status for ${set.id}: ${set.status}`);
    }
  }
}

function validateTimeGateEras(
  errors: string[],
  eras: readonly EraDefinition[],
  storyEvents: Set<string>,
): void {
  const eraIds = new Set(eras.map((era) => era.id));
  for (const eraId of DEFAULT_UNLOCKED_ERAS) {
    if (!eraIds.has(eraId)) errors.push(`Default unlocked era does not exist: ${eraId}`);
  }
  for (const era of eras) {
    if (era.id === "era_deluge" && era.playable) errors.push("era_deluge must stay teaser locked");
    for (const flag of era.unlockConditions.storyFlags) {
      if (!storyEvents.has(flag)) errors.push(`Era ${era.id} references unknown story flag: ${flag}`);
    }
  }
}

function validateAntiScope(
  errors: string[],
  content: Readonly<{
    chapters: readonly StoryChapterDefinition[];
    dungeons: readonly StoryDungeonDefinition[];
    bosses: readonly StoryBossDefinition[];
    recipes: readonly ForgeRecipe[];
    effectSets: readonly EffectSetDefinition[];
    eras: readonly EraDefinition[];
    chapterIds: Set<string>;
  }>,
): void {
  if (content.chapterIds.has("chapter_iii" as any)) errors.push("Chapter III must not be active");
  if ((CANONICAL_BUILDING_IDS as readonly string[]).includes("WORLD_GATE")) {
    errors.push("World Gate must not be canonical active building");
  }
  if (!PLAYER_LEVEL_SKILL_POINTS_GAIN_DISABLED) {
    errors.push("Player Level path must not grant skill points in MVP");
  }

  if (EFFECT_SET_REGISTRY.length !== EFFECT_SET_IDS.length) {
    errors.push("Future Effect Sets must not be active");
  }
  for (const rarity of FORGE_CRAFT_RARITIES) {
    if (!MVP_RARITY_SET.has(rarity)) errors.push(`Forge craft rarity out of MVP: ${rarity}`);
  }
  for (const weighted of BOSS_EQUIPMENT_RARITY_WEIGHTS) {
    if (!MVP_RARITY_SET.has(weighted.value)) errors.push(`Boss equipment rarity out of MVP: ${weighted.value}`);
  }
  for (const currency of CURRENCIES) {
    if (currency.id !== "ECU" && currency.id !== "BOSS_TOKEN") {
      errors.push(`Advanced currency active in MVP: ${currency.id}`);
    }
  }

  const activeLabels = [
    ...content.chapters.map((chapter) => `${chapter.chapterId} ${chapter.title}`),
    ...content.dungeons.map((dungeon) => `${dungeon.id} ${dungeon.title}`),
    ...content.bosses.map((boss) => `${boss.id} ${boss.name}`),
    ...content.recipes.map((recipe) => `${recipe.id} ${recipe.label} ${recipe.category}`),
    ...content.effectSets.map((effectSet) => `${effectSet.id} ${effectSet.name}`),
    ...content.eras.map((era) => `${era.id} ${era.title}`),
  ];
  for (const label of activeLabels) {
    for (const forbidden of FORBIDDEN_ACTIVE_LABELS) {
      if (label.toLowerCase().includes(forbidden.toLowerCase())) {
        errors.push(`Forbidden active MVP content label "${forbidden}" found in: ${label}`);
      }
    }
  }
}

function validateStoryFirstClearAndSpecialRewards(errors: string[]): void {
  let state = createInitialGameState();
  const prologue = completeDungeon(state, "prologue_wastelands");
  if (!prologue.ok) {
    errors.push(`Prologue first clear failed: ${prologue.reason}`);
    return;
  }
  state = prologue.next;
  if (!state.specialItems.dropOfDarknessOwned) errors.push("dark_amalgam first clear must grant the Drop of Darkness");
  if (state.specialItems.kaleidoscopeOwned) errors.push("dark_amalgam must not grant the Kaleidoscope (Chapter I item)");
  if (getCurrencyBalance(state.wallet, "BOSS_TOKEN") !== 1) errors.push("dark_amalgam first clear must grant one BOSS_TOKEN");
  if (getCanonicalResourceQuantity(state.resources, "dark_amalgam_core") !== 1) {
    errors.push("dark_amalgam first clear must grant dark_amalgam_core once");
  }

  const replay = completeDungeon(state, "prologue_wastelands");
  if (!replay.ok) {
    errors.push(`Prologue replay failed: ${replay.reason}`);
    return;
  }
  if (getCurrencyBalance(replay.next.wallet, "BOSS_TOKEN") !== 1) {
    errors.push("Replay must not grant first-clear BOSS_TOKEN again");
  }
  if (getCanonicalResourceQuantity(replay.next.resources, "dark_amalgam_core") !== 1) {
    errors.push("Replay must not grant unique boss resource again");
  }

  state = completeDungeon(state, "funeral_mausoleum").next;
  const dragon = completeDungeon(state, "ashen_peak");
  if (!dragon.ok) {
    errors.push(`dragon_shadow first clear failed: ${dragon.reason}`);
    return;
  }
  state = {
    ...dragon.next,
    progression: {
      ...dragon.next.progression,
      worldLevel: 5,
    },
  };
  if (!state.specialItems.kaleidoscopeOwned) errors.push("dragon_shadow first clear must grant the Kaleidoscope");
  if (state.specialItems.fragmentDuTemps < 1) errors.push("dragon_shadow first clear must grant Fragment du Temps");
  if (!state.story.completedEvents.has("chapter_i_complete")) errors.push("dragon_shadow path must produce chapter_i_complete");

  for (const dungeonId of ["frozen_river", "reflection_cavern", "royal_abyss", "arathas_academy", "frost_source"]) {
    const result = completeDungeon(state, dungeonId);
    if (!result.ok) {
      errors.push(`${dungeonId} first clear failed: ${result.reason}`);
      return;
    }
    state = result.next;
  }
  if (state.specialItems.fragmentDuTemps < 2) errors.push("allaeva first clear must grant Fragment du Temps");
  if (!state.story.completedEvents.has("chapter_ii_complete")) errors.push("Allaeva path must produce chapter_ii_complete");
  if (!state.story.completedEvents.has("time_gate_phase_8_ready")) errors.push("Allaeva path must produce time_gate_phase_8_ready");
  const deluge = ERA_REGISTRY.find((era) => era.id === "era_deluge");
  if (deluge?.playable) errors.push("Era Deluge must not become playable during content pass");
}

function validateCombatResourceGuards(): void {
  const runtime = createCombatRuntimeState({
    player: {
      hpMax: 100,
      hpCurrent: 250,
      manaMax: 50,
      manaCurrent: 0,
      staminaMax: 50,
      staminaCurrent: 0,
      manaRegenPerSecond: 5,
      staminaRegenPerSecond: 10,
      attack: 10,
    },
    enemy: { hpMax: 100 },
  });
  if (runtime.player.hpCurrent !== runtime.player.hpMax) throw new Error("Combat HP must clamp to max");

  const regenerated = regenerateResources(runtime, 1);
  if (regenerated.player.manaCurrent <= 0) throw new Error("Mana regen must restore above 0");
  if (regenerated.player.staminaCurrent <= 0) throw new Error("Stamina regen must restore above 0");

  const dashBlocked = applyDashCost(runtime);
  if (dashBlocked.ok || dashBlocked.reason !== "NOT_ENOUGH_STAMINA") {
    throw new Error("Dash must fail cleanly when Stamina is insufficient");
  }

  const sprinted = applySprintCost({ ...runtime, player: { ...runtime.player, staminaCurrent: 1 } }, 999);
  if (sprinted.player.staminaCurrent < 0) throw new Error("Sprint must not make Stamina negative");

  const dead = applyDamageToPlayer(spendMana(spendStamina(regenerated, 999), 999), 999);
  if (dead.player.hpCurrent !== 0 || !dead.player.respawnRequired) {
    throw new Error("Player death must clamp HP to 0 and require respawn");
  }
  const respawned = handlePlayerDeathAtCheckpoint(dead);
  if (respawned.player.hpCurrent <= 0 || respawned.player.manaCurrent <= 0 || respawned.player.staminaCurrent <= 0) {
    throw new Error("Checkpoint respawn must restore HP/Mana/Stamina");
  }
}

function validateWorldResourceGuards(): void {
  const world = createDefaultWorldResourcesState(1, 1_000);
  if (maxWorldEnergy(1) <= 0) throw new Error("World Energy max must be positive");
  if (worldEnergyRegenPerMinute(1) < 0) throw new Error("World Energy regen must be non-negative");

  const regened = applyWorldResourceRegenForElapsed(
    { ...world, energy: { ...world.energy, current: 0 }, hp: { ...world.hp, current: 0 } },
    1,
    10 * 60_000,
  );
  if (regened.energy.current <= 0) throw new Error("World Energy regen must restore above 0");
  if (regened.energy.current > regened.energy.max) throw new Error("World Energy must clamp to max");

  const forumState = {
    ...createInitialGameState(),
    progression: { ...createInitialGameState().progression, worldWxp: wxpNext(1) },
    buildings: {
      ...createInitialGameState().buildings,
      forum: {
        ...createInitialGameState().buildings.forum,
        unlocked: true,
        built: true,
        active: true,
        status: "built" as const,
        level: 1,
      },
    },
    world: { ...world, energy: { ...world.energy, current: 0 } },
  };
  const ranked = forumRankUpWorld(forumState);
  if (!ranked.rankedUp || ranked.next.world.energy.current <= 0) {
    throw new Error("Forum World level-up must keep a World Energy refill path");
  }
}

function validateEconomySoftLockGuards(): void {
  const stock = addResourceToStock({}, "iron_ore", 10_000);
  if (getCanonicalResourceQuantity(stock, "iron_ore") !== 999) {
    throw new Error("Resource stock must clamp to 999");
  }
  if (canSpendResources({}, { iron_ore: 1 })) {
    throw new Error("Resource spending must detect insufficiency");
  }
  try {
    spendResources({}, { iron_ore: 1 });
    throw new Error("spendResources should have thrown");
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("Not enough")) throw error;
  }

  const craft = craftEquipmentFromRecipe({
    recipeId: "weapon_sword",
    resourceStock: {},
    forgeLevel: 1,
    itemLevel: 1,
    rng: createSeededRng(12_012),
  });
  if (craft.ok || craft.reason !== "NOT_ENOUGH_RESOURCES") {
    throw new Error("Forge craft must fail cleanly when resources are insufficient");
  }

  const cappedItem = generateEquipmentItem({
    id: "capped-common",
    itemLevel: 1,
    rarity: "COMMON",
    seed: "capped-common",
    slot: "main_hand",
  });
  const upgrade = forgeUpgradeEquipment({
    item: { ...cappedItem, upgradeLevel: getForgeUpgradeMaxLevel("COMMON") },
    resourceStock: stock,
    wallet: grantCurrency(createDefaultWalletState(), "ECU", 999),
  });
  if (upgrade.ok || upgrade.reason !== "MAX_UPGRADE_LEVEL") {
    throw new Error("Forge upgrade must fail cleanly at cap");
  }

  const recycled = forgeRecycleEquipment({
    item: cappedItem,
    inventory: { items: [cappedItem] },
    wallet: createDefaultWalletState(),
    rng: { nextFloat: () => 1 },
  });
  if (!recycled.ok || recycled.recipeMaterials.length !== 0 || recycled.itemDestroyed !== true) {
    throw new Error("Forge recycle must destroy item and never return recipe materials");
  }
}

function validateStoryTimeGateSoftLockGuards(): void {
  let state = createInitialGameState();
  state = {
    ...state,
    buildings: {
      ...state.buildings,
      timeGate: {
        ...state.buildings.timeGate,
        active: true,
        built: true,
        level: 1,
        status: "built",
        unlocked: true,
      },
    },
  };
  const prologue = completeDungeon(state, "prologue_wastelands");
  if (!prologue.ok || !prologue.next.specialItems.dropOfDarknessOwned) {
    throw new Error("dark_amalgam first clear must grant the Drop of Darkness");
  }
  const replay = completeDungeon(prologue.next, "prologue_wastelands");
  if (!replay.ok || replay.firstClear || getCurrencyBalance(replay.next.wallet, "BOSS_TOKEN") !== 1) {
    throw new Error("Replay must stay possible without duplicating unique rewards");
  }
  state = completeDungeon(prologue.next, "funeral_mausoleum").next;
  const dragon = completeDungeon(state, "ashen_peak");
  if (!dragon.ok || !dragon.next.specialItems.kaleidoscopeOwned || dragon.next.specialItems.fragmentDuTemps !== 1) {
    throw new Error("dragon_shadow first clear must grant the Kaleidoscope and one Fragment du Temps");
  }
  state = {
    ...dragon.next,
    progression: { ...dragon.next.progression, worldLevel: 5 },
  };
  const unlockedEra = unlockEraAtTimeGate(state, "era_glaciaire");
  if (!unlockedEra.ok || unlockedEra.next.specialItems.fragmentDuTemps !== 0) {
    throw new Error("Time Gate must consume Fragment and unlock era_glaciaire");
  }
  state = unlockedEra.next;
  for (const dungeonId of ["frozen_river", "reflection_cavern", "royal_abyss", "arathas_academy", "frost_source"] as const) {
    const result = completeDungeon(state, dungeonId);
    if (!result.ok) throw new Error(`Chapter II path blocked after Time Gate: ${dungeonId}`);
    state = result.next;
  }
  if (!state.story.completedEvents.has("chapter_ii_complete")) throw new Error("Chapter II completion must remain reachable");
  if (isEraPlayable("era_deluge")) throw new Error("era_deluge must remain teaser locked");
}

function collectProducedStoryEvents(
  chapters: readonly StoryChapterDefinition[],
  dungeons: readonly StoryDungeonDefinition[],
  bosses: readonly StoryBossDefinition[],
): Set<string> {
  const events = new Set<string>();
  for (const chapter of chapters) {
    for (const flag of chapter.storyFlagsProduced) events.add(flag);
  }
  for (const dungeon of dungeons) {
    events.add(dungeon.id);
    for (const flag of dungeon.storyFlagsProduced) events.add(flag);
  }
  for (const boss of bosses) {
    events.add(boss.id);
    for (const flag of boss.storyFlagsProduced) events.add(flag);
  }
  return events;
}

assertValidMvpContentGraph();
assertMvpNoSoftLockGuards();
