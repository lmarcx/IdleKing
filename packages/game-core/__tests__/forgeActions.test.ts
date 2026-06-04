import test from "node:test";
import assert from "node:assert/strict";

import * as gameCore from "../index.js";
import {
  FORGE_RECIPES,
  getAvailableForgeRecipes,
  getForgeRecipe,
  getForgeRecipeLockReason,
} from "../building/forge/recipes.js";
import {
  didReachForgeUpgradeBreakpoint,
  FORGE_CRAFT_RARITIES,
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
  validateForgeRecipeRegistry,
  type ForgeRecipe,
} from "../building/forge/recipes.js";
import { getBuildCost } from "../building/buildCosts.js";
import { getCurrencyBalance, grantCurrency } from "../currencies/index.js";
import { calculateFinalCharacterStats, equipItem, generateEquipmentItem } from "../equipment/index.js";
import { completeChapterAction } from "../game/actions.js";
import { buildBuilding } from "../game/buildingBuildActions.js";
import { forgeCraft, forgeRecycle, forgeUpgrade } from "../game/forgeActions.js";
import { loadGame } from "../game/save.js";
import { createInitialGameState, type GameState } from "../game/state.js";
import { addItem } from "../items/inventory.js";
import { isEquipmentItem } from "../items/types.js";
import { expectedIlvl } from "../progression/expectedIlvl.js";
import { createSeededRng } from "../random/index.js";
import { addResourceToStock, getCanonicalResourceQuantity } from "../resources/index.js";
import { addQty, getQty, type ResourceStock } from "../resources/types.js";

function grantCraftResources(stock: ResourceStock, resources: Record<string, number>): ResourceStock {
  return Object.entries(resources).reduce(
    (next, [resourceId, amount]) => addResourceToStock(next, resourceId, amount),
    stock,
  );
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

function fundUpgradeCosts(state: GameState, itemId: string): GameState {
  const item = state.inventory.items.find((entry) => entry.id === itemId);
  assert.ok(item && isEquipmentItem(item));
  const cost = getForgeUpgradeCost(item);
  return {
    ...state,
    resources: addQty(state.resources, "GOLD", cost.resources.GOLD ?? 0),
    wallet: grantCurrency(state.wallet, "ECU", cost.currencies.ECU ?? 0),
  };
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
    /Invalid requiredForgeLevel/,
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

test("Forge craft no longer needs a villager and spends recipe resources", () => {
  let s = progressToChapter4AndBuildForge(createInitialGameState());
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

  let s = progressToChapter4AndBuildForge(createInitialGameState());
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
  let s = createInitialGameState();
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
  let s = createInitialGameState();
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
  let s = progressToChapter4AndBuildForge(createInitialGameState());
  s = { ...s, resources: grantCraftResources(s.resources, { quartz: 2 }) };

  const result = forgeCraft(s, "copper_ring");

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "NOT_ENOUGH_RESOURCES");
  assert.equal(result.next.inventory.items.length, 0);
});

test("Forge crafted itemLevel depends on worldLevel", () => {
  let s = progressToChapter4AndBuildForge(createInitialGameState());
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

  let s = withForgeLevel(progressToChapter4AndBuildForge(createInitialGameState()), 1);
  assert.equal(getForgeRecipeLockReason(s, recipe), "FORGE_LEVEL_TOO_LOW");

  s = withForgeLevel(s, 2);
  assert.equal(getForgeRecipeLockReason(s, recipe), null);
});

test("forgeCraft refuses recipes locked by Forge level", () => {
  let s = withForgeLevel(progressToChapter4AndBuildForge(createInitialGameState()), 1);
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
  const level1 = withForgeLevel(progressToChapter4AndBuildForge(createInitialGameState()), 1);
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
    ...progressToChapter4AndBuildForge(createInitialGameState()),
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
  let s = withForgeLevel(progressToChapter4AndBuildForge(createInitialGameState()), 2);
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

test("Forge upgrade increments upgradeLevel, increases stats, and preserves item identity and ilvl", () => {
  let s = progressToChapter4AndBuildForge(createInitialGameState());
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
  assert.ok((upgraded.stats.attack ?? 0) > (craftedItem.stats.attack ?? 0));
  assert.ok((upgraded.stats.power ?? 0) > (craftedItem.stats.power ?? 0));
  assert.deepEqual(upgraded.baseStats, craftedItem.baseStats);
  assert.equal(upgraded.upgradeLevel, 1);
  assert.equal(upgradedResult.next.villagers.list.length, 0);
  assert.equal(getQty(upgradedResult.next.resources, "GOLD"), goldBefore);
  assert.equal(getCurrencyBalance(upgradedResult.next.wallet, "ECU"), ecuBefore - 1);
});

test("Forge repeated upgrades scale deterministically from base stats", () => {
  let s = progressToChapter4AndBuildForge(createInitialGameState());
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
  let s = progressToChapter4AndBuildForge(createInitialGameState());
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

  let s = progressToChapter4AndBuildForge(createInitialGameState());
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

  let s = progressToChapter4AndBuildForge(createInitialGameState());
  s = { ...s, inventory: addItem(s.inventory, item) };

  const result = forgeRecycle(s, item.id, { preciousStoneRoll: 1 });

  assert.equal(result.ok, true);
  assert.equal(result.ecuRefund, getForgeRecycleEcuRefund(item));
  assert.equal(result.next.inventory.items.some((entry) => entry.id === item.id), false);
  assert.equal(getCurrencyBalance(result.next.wallet, "ECU"), 60);
  assert.equal(getQty(result.next.resources, "COPPER"), 0);
});

test("Forge recycle can grant a matching-rarity precious stone deterministically", () => {
  const item = generateEquipmentItem({
    id: "recycle_legendary",
    slot: "helmet",
    itemLevel: 100,
    rarity: "LEGENDARY",
    seed: "recycle-stone",
  });

  let s = progressToChapter4AndBuildForge(createInitialGameState());
  s = { ...s, inventory: addItem(s.inventory, item) };

  const result = forgeRecycle(s, item.id, { preciousStoneRoll: 0 });

  assert.equal(result.ok, true);
  assert.equal(result.preciousStoneItemId, "precious_stone_legendary");
  const stone = result.next.inventory.items.find((entry) => entry.id === "precious_stone_legendary");
  assert.ok(stone && !isEquipmentItem(stone));
  assert.equal(stone.kind, "material");
  assert.equal(stone.quantity, 1);
});

test("Legacy save equipment items missing upgradeLevel migrate to 0", () => {
  const state = createInitialGameState();
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
      assert.equal(loaded.inventory.items.length, 1);
      const item = loaded.inventory.items[0];
      assert.ok(isEquipmentItem(item));
      assert.equal(item.id, legacyItem.id);
      assert.equal(item.rarity, "RARE");
      assert.equal(item.upgradeLevel, 0);
      assert.equal(item.ilvl, 20);
    },
  );
});
