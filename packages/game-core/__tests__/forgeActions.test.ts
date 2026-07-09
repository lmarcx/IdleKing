import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as gameCore from "../index.js";
import {
  FORGE_RECIPES,
  getCanonicalForgeRecipeRequiredLevel,
  getAvailableForgeRecipes,
  getForgeRecipe,
  getForgeRecipeLockReason,
} from "../building/forge/recipes.js";
import {
  didReachForgeUpgradeBreakpoint,
  FORGE_CRAFT_RARITIES,
  FORGE_PRECIOUS_STONE_DROP_CHANCE,
  getForgeCraftRarityWeights,
  getForgeRecycleEcuRefund,
  getForgeUpgradeBreakpointsReached,
  getForgeUpgradeCost,
  getForgeUpgradeMaxLevel,
  getNextForgeUpgradeBreakpoint,
  getUpgradedEquipmentStats,
  rollCraftRarityForForgeLevel,
} from "../building/forge/rules.js";
import {
  craftEquipmentFromRecipe,
} from "../building/forge/craft.js";
import {
  forgeRecycleEquipment,
} from "../building/forge/recycle.js";
import {
  forgeUpgradeEquipment,
} from "../building/forge/upgrade.js";
import {
  validateForgeRecipeRegistry,
  type ForgeRecipe,
} from "../building/forge/recipes.js";
import {
  assertWeaponFamilyUnlocked,
  getWeaponFamilyUnlockLevel,
  isWeaponFamilyUnlocked,
  WEAPON_FAMILY_UNLOCK_LADDER,
} from "../building/forge/weapons.js";
import { getBuildCost } from "../building/buildCosts.js";
import { createDefaultWalletState, getCurrencyBalance, grantCurrency } from "../currencies/index.js";
import { calculateFinalCharacterStats, createDefaultPlayerEquipmentState, equipItem, generateEquipmentItem } from "../equipment/index.js";
import { completeChapterAction } from "../game/actions.js";
import { buildBuilding } from "../game/buildingBuildActions.js";
import { forgeCraft, forgeRecycle, forgeUpgrade } from "../game/forgeActions.js";
import { loadGame } from "../game/save.js";
import { createInitialGameState, type GameState } from "../game/state.js";
import { addItem } from "../items/inventory.js";
import { isEquipmentItem } from "../items/types.js";
import { expectedIlvl } from "../progression/expectedIlvl.js";
import { createSeededRng } from "../random/index.js";
import { addResourceToStock, getCanonicalResourceQuantity, getResourceDefinitionOrThrow } from "../resources/index.js";
import { getQty, type ResourceStock } from "../resources/types.js";

function grantCraftResources(stock: ResourceStock, resources: Record<string, number>): ResourceStock {
  return Object.entries(resources).reduce(
    (next, [resourceId, amount]) => addResourceToStock(next, resourceId, amount),
    stock,
  );
}

function grantResourceCosts(stock: ResourceStock, resources: ResourceStock): ResourceStock {
  return Object.entries(resources).reduce(
    (next, [resourceId, amount]) => addResourceToStock(next, resourceId, amount ?? 0),
    stock,
  );
}

function createForgeTestState(): GameState {
  return {
    ...createInitialGameState(),
    equipment: createDefaultPlayerEquipmentState(),
    inventory: { items: [] },
  };
}

function progressToChapter4AndBuildForge(s: ReturnType<typeof createInitialGameState>) {
  for (const ch of [1, 2, 3, 4] as const) {
    s = completeChapterAction(s, ch).next;
  }

  return {
    ...s,
    buildings: {
      ...s.buildings,
      forge: { ...s.buildings.forge, built: true, active: true },
    },
  };
}

function withForgeLevel(state: GameState, level: number): GameState {
  return {
    ...state,
    buildings: {
      ...state.buildings,
      forge: {
        ...state.buildings.forge,
        active: true,
        built: true,
        level,
        status: "built",
        unlocked: true,
      },
    },
  };
}

function withDefeatedBoss(state: GameState, bossId: string): GameState {
  return {
    ...state,
    story: {
      ...state.story,
      completedEvents: new Set([...state.story.completedEvents, bossId]),
    },
  };
}

function fundUpgradeCosts(state: GameState, itemId: string): GameState {
  const item = state.inventory.items.find((entry) => entry.id === itemId);
  assert.ok(item && isEquipmentItem(item));
  const cost = getForgeUpgradeCost(item);
  return {
    ...state,
    resources: grantResourceCosts(state.resources, cost.resources),
    wallet: grantCurrency(state.wallet, "ECU", cost.currencies.ECU ?? 0),
  };
}

function findSeedForPreciousStoneDrop(): number {
  for (let seed = 1; seed <= 10_000; seed += 1) {
    if (createSeededRng(seed).nextFloat() < FORGE_PRECIOUS_STONE_DROP_CHANCE) return seed;
  }
  throw new Error("No deterministic Precious Stone seed found");
}

function listFilesRecursive(dir: string, extension: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFilesRecursive(path, extension);
    return extname(entry.name) === extension ? [path] : [];
  });
}

function getEquipmentOrFail(state: GameState, itemId: string) {
  const item = state.inventory.items.find((entry) => entry.id === itemId);
  assert.ok(item && isEquipmentItem(item));
  return item;
}

function withLocalStorageSave(payload: unknown, run: () => void) {
  const store = new Map<string, string>();
  const previousLocalStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      removeItem: (key: string) => {
        store.delete(key);
      },
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    },
  });

  try {
    store.set("idle_king_save_v1", JSON.stringify(payload));
    run();
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: previousLocalStorage,
    });
  }
}

test("Forge craft rarity weights expose only Common through Legendary", () => {
  assert.deepEqual(FORGE_CRAFT_RARITIES, ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"]);
  assert.deepEqual(Object.keys(getForgeCraftRarityWeights(1)), FORGE_CRAFT_RARITIES);
  assert.deepEqual(getForgeCraftRarityWeights(1), {
    COMMON: 50,
    UNCOMMON: 25,
    RARE: 15,
    EPIC: 8,
    LEGENDARY: 2,
  });
});

test("higher Forge Level shifts craft rarity weights toward Rare+", () => {
  const low = getForgeCraftRarityWeights(1);
  const high = getForgeCraftRarityWeights(20);

  assert.ok(high.COMMON < low.COMMON);
  assert.ok(high.RARE + high.EPIC + high.LEGENDARY > low.RARE + low.EPIC + low.LEGENDARY);
});

test("Forge craft rarity roll is deterministic for the same seed and Forge Level", () => {
  const first = rollCraftRarityForForgeLevel(12, createSeededRng(12_345));
  const second = rollCraftRarityForForgeLevel(12, createSeededRng(12_345));

  assert.equal(first, second);
  assert.ok(FORGE_CRAFT_RARITIES.includes(first));
});

test("pure Forge craft consumes registered resources and uses rolled rarity", () => {
  const stock = grantCraftResources({}, { iron_ore: 5 });
  const result = craftEquipmentFromRecipe({
    recipeId: "BASIC_SWORD",
    resourceStock: stock,
    forgeLevel: 10,
    itemLevel: 80,
    rng: { pickWeighted: (entries) => entries.find((entry) => entry.value === "EPIC")?.value ?? entries[0].value },
    itemId: "crafted_epic_sword",
    seed: "crafted-epic-sword",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(getCanonicalResourceQuantity(result.updatedResourceStock, "iron_ore"), 2);
  assert.deepEqual(result.consumedResources, { iron_ore: 3 });
  assert.equal(result.rolledRarity, "EPIC");
  assert.equal(result.craftedItem.rarity, "EPIC");
  assert.equal(result.craftedItem.id, "crafted_epic_sword");
  assert.equal(result.craftedItem.kind, "equipment");
  assert.equal(result.craftedItem.slot, "main_hand");
  assert.equal("rarity" in result.recipe, false);
});

test("pure Forge craft fails without enough resources", () => {
  const result = craftEquipmentFromRecipe({
    recipeId: "BASIC_SWORD",
    resourceStock: grantCraftResources({}, { iron_ore: 2 }),
    forgeLevel: 10,
    itemLevel: 80,
    rng: createSeededRng(1),
  });

  assert.deepEqual(result, {
    ok: false,
    updatedResourceStock: { iron_ore: 2 },
    reason: "NOT_ENOUGH_RESOURCES",
  });
});

test("Forge recipe validation rejects unknown and special item ingredients", () => {
  const validBase = FORGE_RECIPES[0];
  const invalidIngredient = {
    ...validBase,
    id: "invalid_ingredient",
    ingredients: { missing_resource: 1 },
  } satisfies ForgeRecipe;
  const fragmentIngredient = {
    ...validBase,
    id: "fragment_ingredient",
    ingredients: { fragment_du_temps: 1 },
  } satisfies ForgeRecipe;
  const kaleidoscopeIngredient = {
    ...validBase,
    id: "kaleidoscope_ingredient",
    ingredients: { kaleidoscope: 1 },
  } satisfies ForgeRecipe;

  assert.throws(() => validateForgeRecipeRegistry([invalidIngredient]), /Unknown MVP resource id/);
  assert.throws(() => validateForgeRecipeRegistry([fragmentIngredient]), /Unknown MVP resource id/);
  assert.throws(() => validateForgeRecipeRegistry([kaleidoscopeIngredient]), /Unknown MVP resource id/);
});

test("Forge recipe validation enforces ids, category, output base, Forge level, and rarity roll", () => {
  const validBase = FORGE_RECIPES[0];

  assert.doesNotThrow(() => validateForgeRecipeRegistry());
  assert.throws(() => validateForgeRecipeRegistry([validBase, validBase]), /Duplicate Forge recipe id/);
  assert.throws(
    () => validateForgeRecipeRegistry([{ ...validBase, category: "forge_fusion" as any }]),
    /Invalid Forge recipe category/,
  );
  assert.throws(
    () => validateForgeRecipeRegistry([{ ...validBase, outputBaseId: "missing_base" }]),
    /unknown outputBaseId/,
  );
  assert.throws(
    () => validateForgeRecipeRegistry([{ ...validBase, unlockConditions: { requiredForgeLevel: 0 } }]),
    /requiredForgeLevel/,
  );
  assert.throws(
    () => validateForgeRecipeRegistry([{ ...validBase, rarityRoll: "fixed" as any }]),
    /Invalid rarityRoll/,
  );
});

test("Forge craft never produces rarity outside MVP", () => {
  for (const forgeLevel of [1, 10, 50]) {
    for (let seed = 1; seed <= 50; seed += 1) {
      assert.ok(FORGE_CRAFT_RARITIES.includes(rollCraftRarityForForgeLevel(forgeLevel, createSeededRng(seed))));
    }
  }
});

test("Forge MVP exports do not add Evolve, Enchant, or Fusion", () => {
  for (const forbidden of ["forgeEvolve", "forgeEnchant", "forgeFusion", "evolveEquipment", "enchantEquipment", "fuseEquipment"]) {
    assert.equal(forbidden in gameCore, false);
  }
});

test("Forge upgrade and recycle paths do not call Math.random", () => {
  const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  const files = [
    ...listFilesRecursive(join(packageRoot, "building", "forge"), ".js"),
    join(packageRoot, "game", "forgeActions.js"),
    join(packageRoot, "loot", "mvp.js"),
  ];

  for (const file of files) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /Math\.random/, file);
  }
});

test("Forge weapon family ladder is canonical from Forge Level 1 to 10", () => {
  assert.deepEqual(WEAPON_FAMILY_UNLOCK_LADDER, [
    "sword",
    "dagger",
    "axe",
    "greatsword",
    "pistol",
    "bow",
    "shield",
    "spear",
    "grimoire",
    "staff",
  ]);

  for (const [index, family] of WEAPON_FAMILY_UNLOCK_LADDER.entries()) {
    const unlockLevel = index + 1;
    assert.equal(getWeaponFamilyUnlockLevel(family), unlockLevel);
    assert.equal(isWeaponFamilyUnlocked(family, unlockLevel - 1), false);
    assert.equal(isWeaponFamilyUnlocked(family, unlockLevel), true);
    assert.doesNotThrow(() => assertWeaponFamilyUnlocked(family, unlockLevel));
  }
});

test("Forge craft follows the weapon ladder for Sword, Dagger, and Staff", () => {
  let state = withForgeLevel(progressToChapter4AndBuildForge(createForgeTestState()), 1);
  state = { ...state, resources: grantCraftResources(state.resources, { iron_ore: 20, silver_ore: 5, old_wood: 5, sapphire: 5 }) };

  const sword = forgeCraft(state, "weapon_sword", { seed: 201 });
  assert.equal(sword.ok, true);

  const daggerLocked = forgeCraft(state, "weapon_dagger", { seed: 202 });
  assert.equal(daggerLocked.ok, false);
  if (!daggerLocked.ok) assert.equal(daggerLocked.reason, "FORGE_LEVEL_TOO_LOW");

  const dagger = forgeCraft(withForgeLevel(state, 2), "weapon_dagger", { seed: 203 });
  assert.equal(dagger.ok, true);

  const staffLocked = forgeCraft(withForgeLevel(state, 9), "weapon_staff", { seed: 204 });
  assert.equal(staffLocked.ok, false);
  if (!staffLocked.ok) assert.equal(staffLocked.reason, "FORGE_LEVEL_TOO_LOW");

  const staff = forgeCraft(withForgeLevel(state, 10), "weapon_staff", { seed: 205 });
  assert.equal(staff.ok, true);
});

test("Forge boss weapons require boss defeat, Forge Level, and resources", () => {
  let state = withForgeLevel(progressToChapter4AndBuildForge(createForgeTestState()), 2);
  state = {
    ...state,
    resources: grantCraftResources(state.resources, {
      cold_iron: 2,
      frozen_echo: 3,
      frost_amalgam_core: 1,
    }),
  };

  const missingBoss = forgeCraft(state, "boss_frostfang_dagger", { seed: 301 });
  assert.equal(missingBoss.ok, false);
  if (!missingBoss.ok) assert.equal(missingBoss.reason, "BOSS_REQUIRED");

  const crafted = forgeCraft(withDefeatedBoss(state, "frost_amalgam"), "boss_frostfang_dagger", { seed: 302 });
  assert.equal(crafted.ok, true);
  if (!crafted.ok) return;
  const item = crafted.next.inventory.items.find((entry) => entry.id === crafted.createdItemId);
  assert.ok(item && isEquipmentItem(item));
  assert.equal(item.baseItemId, "frostfang_dagger");
  assert.equal(item.name, "Frostfang Dagger");
  assert.equal(getCanonicalResourceQuantity(crafted.next.resources, "frost_amalgam_core"), 0);
});

test("Forge boss weapon remains locked when Forge Level is below its family ladder", () => {
  let state = withForgeLevel(progressToChapter4AndBuildForge(createForgeTestState()), 9);
  state = withDefeatedBoss(state, "corrupted_archmage");
  state = {
    ...state,
    resources: grantCraftResources(state.resources, {
      frostpine: 3,
      archival_fragment: 2,
      archmage_sigil: 1,
    }),
  };

  const result = forgeCraft(state, "boss_arathas_staff", { seed: 303 });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "FORGE_LEVEL_TOO_LOW");
});

test("Forge boss recipes are MVP-only, resource-backed, and correctly gated", () => {
  const bossRecipeIds = [
    "boss_funeral_blade",
    "boss_ashen_axe",
    "boss_ashen_spear",
    "boss_dragonbone_greatsword",
    "boss_dragon_ash_shield",
    "boss_frostfang_dagger",
    "boss_frostbound_longsword",
    "boss_arathas_staff",
    "boss_icebound_grimoire",
    "boss_frozen_royal_shield",
    "boss_queens_tear_necklace",
  ];

  for (const recipeId of bossRecipeIds) {
    const recipe = getForgeRecipe(recipeId);
    assert.ok(recipe, `Missing ${recipeId}`);
    assert.ok(recipe.unlockConditions.requiredBossId, `${recipeId} should require a boss`);
    for (const resourceId of Object.keys(recipe.ingredients)) {
      assert.equal(getResourceDefinitionOrThrow(resourceId).id, resourceId);
    }
  }

  const funeralBlade = getForgeRecipe("boss_funeral_blade");
  assert.ok(funeralBlade);
  assert.equal("fallen_rain_pearl" in funeralBlade.ingredients, false);
  assert.equal("pearlescent_scale" in funeralBlade.ingredients, false);
  assert.deepEqual(Object.keys(funeralBlade.ingredients).sort(), [
    "dark_amalgam_core",
    "shadow_residue",
    "spectral_dust",
  ]);
});

test("Forge recipe validation rejects weapon ladder contradictions and bad boss gates", () => {
  const dagger = getForgeRecipe("weapon_dagger");
  const funeralBlade = getForgeRecipe("boss_funeral_blade");
  assert.ok(dagger);
  assert.ok(funeralBlade);

  assert.equal(getCanonicalForgeRecipeRequiredLevel({ ...dagger, unlockConditions: { requiredForgeLevel: 1 } }), 2);
  assert.throws(
    () => validateForgeRecipeRegistry([{ ...dagger, unlockConditions: { requiredForgeLevel: 1 } }]),
    /must match dagger ladder level 2/,
  );
  assert.throws(
    () => validateForgeRecipeRegistry([{ ...funeralBlade, unlockConditions: { requiredForgeLevel: 1 } }]),
    /must declare requiredBossId/,
  );
  assert.throws(
    () => validateForgeRecipeRegistry([{ ...funeralBlade, unlockConditions: { requiredForgeLevel: 1, requiredBossId: "rain_lord" } }]),
    /non-MVP boss id/,
  );
  assert.throws(
    () => validateForgeRecipeRegistry([{ ...funeralBlade, ingredients: { pearlescent_scale: 1 } }]),
    /Funeral Blade must not reference/,
  );
});

test("Forge craft no longer needs a villager and spends recipe resources", () => {
  let s = progressToChapter4AndBuildForge(createForgeTestState());
  s = {
    ...s,
    resources: grantCraftResources(s.resources, { iron_ore: 10 }),
    villagers: { list: [] },
  };

  const result = forgeCraft(s, "BASIC_SWORD", { seed: 101 });

  assert.equal(result.ok, true);
  assert.ok(result.createdItemId);
  assert.equal(getCanonicalResourceQuantity(result.next.resources, "iron_ore"), 7);
  assert.equal(result.next.villagers.list.length, 0);

  const item = result.next.inventory.items[0];
  assert.ok(isEquipmentItem(item));
  assert.equal(item.slot, "main_hand");
  assert.equal(item.upgradeLevel, 0);
  assert.equal(item.ilvl, expectedIlvl(s.progression.worldLevel));
  assert.equal(item.rarity, result.rolledRarity);
});

test("Forge has MVP recipes that create real equipment items", () => {
  const recipeIds = FORGE_RECIPES.map((recipe) => recipe.id);
  assert.ok(recipeIds.includes("iron_sword"));
  assert.ok(recipeIds.includes("iron_helmet"));
  assert.ok(recipeIds.includes("copper_ring"));
  assert.ok(recipeIds.includes("BASIC_SWORD"));
  assert.ok(recipeIds.includes("BASIC_ARMOR"));
  assert.ok(recipeIds.includes("BASIC_CAPE"));
  assert.ok(recipeIds.includes("BASIC_ARTIFACT"));

  let s = progressToChapter4AndBuildForge(createForgeTestState());
  s = { ...s, resources: grantCraftResources(s.resources, { iron_ore: 20, old_wood: 20, quartz: 20, sapphire: 20 }) };

  const crafted = forgeCraft(s, "BASIC_CAPE", { seed: 102 });
  assert.equal(crafted.ok, true);

  const item = crafted.next.inventory.items[0];
  assert.ok(isEquipmentItem(item));
  assert.equal(item.slot, "cape");
  assert.ok((item.stats.hp ?? 0) > 0);
  assert.ok((item.stats.defense ?? 0) > 0);
  assert.ok((item.stats.power ?? 0) > 0);
});

test("Forge craft still requires the Forge building", () => {
  let s = createForgeTestState();
  for (const ch of [1, 2, 3, 4] as const) {
    s = completeChapterAction(s, ch).next;
  }
  s = { ...s, resources: grantCraftResources(s.resources, { iron_ore: 4 }) };

  const result = forgeCraft(s, "iron_sword");

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "FORGE_NOT_BUILT");
});

test("Forge dev override works after build and still consumes construction resources", () => {
  let s = createForgeTestState();
  const cost = getBuildCost("FORGE");
  s = {
    ...s,
    resources: {
      WOOD: cost.WOOD ?? 0,
      STONE: cost.STONE ?? 0,
      IRON: cost.IRON ?? 0,
      iron_ore: 4,
    },
  };

  const built = buildBuilding(s, "FORGE", { allowLocked: true });
  assert.equal(built.ok, true);
  assert.equal(getQty(built.next.resources, "WOOD"), 0);
  assert.equal(getQty(built.next.resources, "STONE"), 0);
  assert.equal(getQty(built.next.resources, "IRON"), 0);

  const crafted = forgeCraft(built.next, "iron_sword", { allowLocked: true, seed: 103 });

  assert.equal(crafted.ok, true);
  assert.equal(crafted.next.inventory.items.length, 1);
  assert.equal(getCanonicalResourceQuantity(crafted.next.resources, "iron_ore"), 0);
});

test("Forge craft refuses when resources are insufficient", () => {
  let s = progressToChapter4AndBuildForge(createForgeTestState());
  s = { ...s, resources: grantCraftResources(s.resources, { quartz: 2 }) };

  const result = forgeCraft(s, "copper_ring");

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "NOT_ENOUGH_RESOURCES");
  assert.equal(result.next.inventory.items.length, 0);
});

test("Forge crafted itemLevel depends on worldLevel", () => {
  let s = progressToChapter4AndBuildForge(createForgeTestState());
  s = {
    ...s,
    progression: { ...s.progression, worldLevel: 7 },
    resources: grantCraftResources(s.resources, { quartz: 3 }),
  };

  const result = forgeCraft(s, "copper_ring", { seed: 104 });

  assert.equal(result.ok, true);
  const item = result.next.inventory.items[0];
  assert.ok(isEquipmentItem(item));
  assert.equal(item.slot, "ring");
  assert.equal(item.itemLevel, expectedIlvl(7));
});

test("Forge recipe is locked below required Forge level and unlocked at that level", () => {
  const recipe = getForgeRecipe("weapon_dagger");
  assert.ok(recipe);

  let s = withForgeLevel(progressToChapter4AndBuildForge(createForgeTestState()), 1);
  assert.equal(getForgeRecipeLockReason(s, recipe), "FORGE_LEVEL_TOO_LOW");

  s = withForgeLevel(s, 2);
  assert.equal(getForgeRecipeLockReason(s, recipe), null);
});

test("forgeCraft refuses recipes locked by Forge level", () => {
  let s = withForgeLevel(progressToChapter4AndBuildForge(createForgeTestState()), 1);
  s = {
    ...s,
    resources: grantCraftResources(s.resources, { iron_ore: 10, silver_ore: 10 }),
  };

  const result = forgeCraft(s, "weapon_dagger");

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "FORGE_LEVEL_TOO_LOW");
  assert.equal(result.next.inventory.items.length, 0);
});

test("getAvailableForgeRecipes filters by Forge level", () => {
  const level1 = withForgeLevel(progressToChapter4AndBuildForge(createForgeTestState()), 1);
  const level2 = withForgeLevel(level1, 2);

  const level1Ids = getAvailableForgeRecipes(level1).map((recipe) => recipe.id);
  const level2Ids = getAvailableForgeRecipes(level2).map((recipe) => recipe.id);

  assert.ok(level1Ids.includes("weapon_sword"));
  assert.equal(level1Ids.includes("weapon_dagger"), false);
  assert.ok(level2Ids.includes("weapon_dagger"));
});

test("Forge optional WorldLevel requirement locks recipes until met", () => {
  const recipe = getForgeRecipe("weapon_grimoire");
  assert.ok(recipe);

  const belowWorld = withForgeLevel({
    ...progressToChapter4AndBuildForge(createForgeTestState()),
    progression: { playerLevel: 1, playerXp: 0, worldLevel: 4, worldWxp: 0 },
  }, 9);
  const atWorld = {
    ...belowWorld,
    progression: { ...belowWorld.progression, worldLevel: 5 },
  };

  assert.equal(getForgeRecipeLockReason(belowWorld, recipe), "WORLD_LEVEL_TOO_LOW");
  assert.equal(getForgeRecipeLockReason(atWorld, recipe), null);
});

test("Forge craft works for weapon progression recipes once unlocked", () => {
  let s = withForgeLevel(progressToChapter4AndBuildForge(createForgeTestState()), 2);
  s = {
    ...s,
    resources: grantCraftResources(s.resources, { iron_ore: 2, silver_ore: 1 }),
  };

  const result = forgeCraft(s, "weapon_dagger", { seed: 105 });

  assert.equal(result.ok, true);
  const item = result.next.inventory.items[0];
  assert.ok(isEquipmentItem(item));
  assert.equal(item.name, "Dagger");
  assert.equal(item.slot, "main_hand");
});

test("Forge upgrade caps match MVP rarity limits", () => {
  assert.equal(getForgeUpgradeMaxLevel("COMMON"), 6);
  assert.equal(getForgeUpgradeMaxLevel("UNCOMMON"), 6);
  assert.equal(getForgeUpgradeMaxLevel("RARE"), 6);
  assert.equal(getForgeUpgradeMaxLevel("EPIC"), 9);
  assert.equal(getForgeUpgradeMaxLevel("LEGENDARY"), 12);

  for (const [rarity, cap] of [
    ["COMMON", 6],
    ["UNCOMMON", 6],
    ["RARE", 6],
    ["EPIC", 9],
    ["LEGENDARY", 12],
  ] as const) {
    const item = generateEquipmentItem({
      id: `capped_${rarity.toLowerCase()}`,
      slot: "main_hand",
      itemLevel: 80,
      rarity,
      seed: `capped-${rarity}`,
    });
    item.upgradeLevel = cap;

    const result = forgeUpgradeEquipment({
      item,
      resourceStock: grantCraftResources({}, { iron_ore: 999 }),
      wallet: grantCurrency(createDefaultWalletState(), "ECU", 999),
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "MAX_UPGRADE_LEVEL");
  }
});

test("Forge upgrade increments upgradeLevel, increases stats, and preserves item identity and ilvl", () => {
  let s = progressToChapter4AndBuildForge(createForgeTestState());
  s = {
    ...s,
    resources: grantCraftResources(s.resources, { iron_ore: 10 }),
    villagers: { list: [] },
  };

  const crafted = forgeCraft(s, "BASIC_SWORD", { seed: 106 });
  assert.equal(crafted.ok, true);
  const itemId = crafted.createdItemId!;
  const craftedItem = crafted.next.inventory.items[0];
  assert.ok(isEquipmentItem(craftedItem));
  const ilvlBefore = craftedItem.ilvl ?? craftedItem.itemLevel ?? 0;
  const goldBefore = getQty(crafted.next.resources, "GOLD");

  const funded = fundUpgradeCosts(crafted.next, itemId);
  const ecuBefore = getCurrencyBalance(funded.wallet, "ECU");

  const upgradedResult = forgeUpgrade(funded, itemId);
  assert.equal(upgradedResult.ok, true);

  const upgraded = upgradedResult.next.inventory.items.find((it) => it.id === itemId);
  assert.ok(upgraded && isEquipmentItem(upgraded));
  assert.equal(upgraded.id, craftedItem.id);
  assert.equal(upgraded.name, craftedItem.name);
  assert.equal(upgraded.slot, craftedItem.slot);
  assert.equal(upgraded.rarity, craftedItem.rarity);
  assert.equal(upgraded.ilvl ?? upgraded.itemLevel, ilvlBefore);
  assert.equal(upgraded.itemLevel, craftedItem.itemLevel);
  assert.equal(upgraded.baseItemId, craftedItem.baseItemId);
  assert.ok((upgraded.stats.attack ?? 0) > (craftedItem.stats.attack ?? 0));
  assert.ok((upgraded.stats.power ?? 0) > (craftedItem.stats.power ?? 0));
  assert.deepEqual(upgraded.baseStats, craftedItem.baseStats);
  assert.deepEqual(upgraded.affixes, craftedItem.affixes);
  assert.equal(upgraded.upgradeLevel, 1);
  assert.equal(upgradedResult.next.villagers.list.length, 0);
  assert.equal(getQty(upgradedResult.next.resources, "GOLD"), goldBefore);
  assert.equal(getCurrencyBalance(upgradedResult.next.wallet, "ECU"), ecuBefore - 1);
});

test("pure Forge upgrade consumes costs without changing ilvl, affixes, or base item id", () => {
  const item = generateEquipmentItem({
    id: "pure_upgrade",
    slot: "main_hand",
    itemLevel: 120,
    rarity: "LEGENDARY",
    seed: "pure-upgrade",
  });
  item.baseItemId = "weapon_sword_base";
  const cost = getForgeUpgradeCost(item);

  const result = forgeUpgradeEquipment({
    item,
    resourceStock: grantResourceCosts({}, cost.resources),
    wallet: grantCurrency(createDefaultWalletState(), "ECU", cost.currencies.ECU ?? 0),
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.upgradedItem.upgradeLevel, 1);
  assert.equal(result.upgradedItem.ilvl, item.ilvl);
  assert.equal(result.upgradedItem.itemLevel, item.itemLevel);
  assert.equal(result.upgradedItem.baseItemId, item.baseItemId);
  assert.deepEqual(result.upgradedItem.affixes, item.affixes);
  assert.deepEqual(result.upgradedItem.rolledStats, item.rolledStats);
  assert.equal(getCanonicalResourceQuantity(result.updatedResourceStock, "iron_ore"), 0);
  assert.equal(getCurrencyBalance(result.updatedWallet, "ECU"), 0);
});

test("Forge repeated upgrades scale deterministically from base stats", () => {
  let s = progressToChapter4AndBuildForge(createForgeTestState());
  const item = generateEquipmentItem({
    id: "deterministic_upgrade",
    slot: "main_hand",
    itemLevel: 80,
    rarity: "EPIC",
    seed: "deterministic",
  });
  s = { ...s, inventory: addItem(s.inventory, item) };

  s = fundUpgradeCosts(s, item.id);
  const first = forgeUpgrade(s, item.id);
  assert.equal(first.ok, true);

  let upgraded = getEquipmentOrFail(first.next, item.id);
  assert.deepEqual(
    upgraded.stats,
    getUpgradedEquipmentStats(item.rolledStats, "EPIC", item.itemLevel ?? item.ilvl ?? 1, 1),
  );

  s = fundUpgradeCosts(first.next, item.id);
  const second = forgeUpgrade(s, item.id);
  assert.equal(second.ok, true);

  upgraded = getEquipmentOrFail(second.next, item.id);
  assert.equal(upgraded.upgradeLevel, 2);
  assert.deepEqual(
    upgraded.stats,
    getUpgradedEquipmentStats(item.rolledStats, "EPIC", item.itemLevel ?? item.ilvl ?? 1, 2),
  );
});

test("Equipped upgraded item affects final character stats", () => {
  let s = progressToChapter4AndBuildForge(createForgeTestState());
  const item = generateEquipmentItem({
    id: "equipped_upgrade",
    slot: "main_hand",
    itemLevel: 60,
    rarity: "RARE",
    seed: "equipped",
  });
  s = { ...s, inventory: addItem(s.inventory, item) };

  const equipped = equipItem(s, item.id);
  assert.equal(equipped.ok, true);
  if (!equipped.ok) return;

  const before = calculateFinalCharacterStats(equipped.state);
  const funded = fundUpgradeCosts(equipped.state, item.id);
  const upgraded = forgeUpgrade(funded, item.id);
  assert.equal(upgraded.ok, true);
  const after = calculateFinalCharacterStats(upgraded.next);

  assert.ok(after.attack > before.attack);
  assert.ok(after.power > before.power);
  assert.equal(upgraded.next.equipment.equipped.main_hand, item.id);
});

test("Forge upgrade respects rarity max caps", () => {
  const capped = generateEquipmentItem({
    id: "capped_common",
    slot: "main_hand",
    itemLevel: 20,
    rarity: "COMMON",
    seed: "capped",
  });
  capped.upgradeLevel = getForgeUpgradeMaxLevel("COMMON");

  let s = progressToChapter4AndBuildForge(createForgeTestState());
  s = { ...s, inventory: addItem(s.inventory, capped) };
  s = fundUpgradeCosts(s, capped.id);

  const result = forgeUpgrade(s, capped.id);

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "MAX_UPGRADE_LEVEL");
});

test("Forge upgrade breakpoint helpers detect reached and next levels", () => {
  assert.deepEqual(getForgeUpgradeBreakpointsReached(2), []);
  assert.deepEqual(getForgeUpgradeBreakpointsReached(3), [3]);
  assert.deepEqual(getForgeUpgradeBreakpointsReached(21), [3, 6, 9, 12]);
  assert.equal(getNextForgeUpgradeBreakpoint(2, "COMMON"), 3);
  assert.equal(getNextForgeUpgradeBreakpoint(6, "COMMON"), null);
  assert.equal(getNextForgeUpgradeBreakpoint(12, "LEGENDARY"), null);
  assert.equal(didReachForgeUpgradeBreakpoint(2, 3), true);
  assert.equal(didReachForgeUpgradeBreakpoint(3, 4), false);
});

test("Forge recycle destroys item and grants ECU equal to 50% item value", () => {
  const item = generateEquipmentItem({
    id: "recycle_epic",
    slot: "ring",
    itemLevel: 80,
    rarity: "EPIC",
    seed: "recycle",
  });
  item.value = 120;

  let s = progressToChapter4AndBuildForge(createForgeTestState());
  s = { ...s, inventory: addItem(s.inventory, item) };

  const result = forgeRecycle(s, item.id, { preciousStoneRoll: 1 });

  assert.equal(result.ok, true);
  assert.equal(result.ecuRefund, getForgeRecycleEcuRefund(item));
  assert.equal(result.itemDestroyed, true);
  assert.deepEqual(result.recipeMaterials, []);
  assert.equal(result.next.inventory.items.some((entry) => entry.id === item.id), false);
  assert.equal(getCurrencyBalance(result.next.wallet, "ECU"), 60);
  assert.equal(getQty(result.next.resources, "COPPER"), 0);
});

test("Forge recycle can grant a matching-rarity precious stone with a seed", () => {
  const item = generateEquipmentItem({
    id: "recycle_legendary",
    slot: "helmet",
    itemLevel: 100,
    rarity: "LEGENDARY",
    seed: "recycle-stone",
  });

  let s = progressToChapter4AndBuildForge(createForgeTestState());
  s = { ...s, inventory: addItem(s.inventory, item) };

  const result = forgeRecycle(s, item.id, { seed: findSeedForPreciousStoneDrop() });

  assert.equal(result.ok, true);
  assert.equal(result.preciousStoneItemId, "precious_stone_legendary");
  const stone = result.next.inventory.items.find((entry) => entry.id === "precious_stone_legendary");
  assert.ok(stone && !isEquipmentItem(stone));
  assert.equal(stone.kind, "material");
  assert.equal(stone.quantity, 1);
});

test("pure Forge recycle returns only ECU and optional Precious Stone, then removes the item", () => {
  const item = generateEquipmentItem({
    id: "pure_recycle_rare",
    slot: "ring",
    itemLevel: 90,
    rarity: "RARE",
    seed: "pure-recycle",
  });
  item.value = 200;

  const result = forgeRecycleEquipment({
    item,
    inventory: addItem({ items: [] }, item),
    wallet: createDefaultWalletState(),
    rng: { nextFloat: () => 0 },
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.ecuGained, 100);
  assert.equal(result.itemDestroyed, true);
  assert.equal(result.preciousStone?.id, "precious_stone_rare");
  assert.deepEqual(result.recipeMaterials, []);
  assert.equal(result.updatedInventory?.items.some((entry) => entry.id === item.id), false);
  assert.equal(getCurrencyBalance(result.updatedWallet, "ECU"), 100);
});

test("Legacy save equipment items missing upgradeLevel migrate to 0", () => {
  const state = createForgeTestState();
  const legacyItem = {
    id: "legacy_weapon",
    kind: "equipment",
    name: "Legacy Sword",
    slot: "main_hand",
    itemLevel: 20,
    ilvl: 20,
    rarity: "RARE",
    stats: { attack: 5, power: 5 },
  };

  withLocalStorageSave(
    {
      schemaVersion: 1,
      savedAt: Date.now(),
      state: {
        ...state,
        inventory: { items: [legacyItem] },
      },
    },
    () => {
      const loaded = loadGame();
      assert.ok(loaded);
      assert.equal(loaded.inventory.items.length, 2);
      const item = loaded.inventory.items.find((entry) => entry.id === legacyItem.id);
      assert.ok(isEquipmentItem(item));
      assert.equal(item.id, legacyItem.id);
      assert.equal(item.rarity, "RARE");
      assert.equal(item.upgradeLevel, 0);
      assert.equal(item.ilvl, 20);
    },
  );
});
