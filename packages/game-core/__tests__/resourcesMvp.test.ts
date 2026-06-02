import assert from "node:assert/strict";
import test from "node:test";

import {
  BOSS_TOKEN,
  CURRENCIES,
  ECU,
  createDefaultWalletState,
  getCurrencyBalance,
  grantCurrency,
  normalizeWalletState,
} from "../currencies/index.js";
import { createPreciousStoneItem } from "../building/forge/rules.js";
import { validateEnemyLootTables } from "../loot/index.js";
import {
  RESOURCE_ALIASES,
  RESOURCE_DEFINITIONS,
  RESOURCE_MAX_STACK,
  addResourceToStock,
  calculateItemValueFromRecipeResources,
  calculateResourceBundleValue,
  calculateResourceValue,
  canSpendResources,
  clampResourceStack,
  getCanonicalResourceQuantity,
  getResourceDefinitionOrThrow,
  normalizeResourceId,
  removeResourceFromStock,
  spendResources,
  validateResourceRegistry,
  type CanonicalResourceId,
} from "../resources/index.js";

const REQUIRED_RESOURCE_IDS = [
  "iron_ore",
  "cold_iron",
  "silver_ore",
  "quartz",
  "sapphire",
  "pale_diamond",
  "tomato",
  "carrot",
  "tough_meat",
  "old_wood",
  "ashwood",
  "frostpine",
  "frostroot",
  "shadow_residue",
  "spectral_dust",
  "frozen_echo",
  "dark_amalgam_core",
  "dragon_ash_core",
  "frost_amalgam_core",
  "archmage_sigil",
  "frozen_queen_tear",
  "pearlescent_scale",
] as const satisfies readonly CanonicalResourceId[];

test("MVP resource registry contains the locked minimum and validates at boot", () => {
  assert.doesNotThrow(() => validateResourceRegistry());
  for (const resourceId of REQUIRED_RESOURCE_IDS) {
    assert.equal(getResourceDefinitionOrThrow(resourceId).id, resourceId);
  }
});

test("resource definitions use snake_case ids, fixed rarity, stack 999, and market-compatible uses", () => {
  for (const definition of RESOURCE_DEFINITIONS) {
    assert.match(definition.id, /^[a-z0-9]+(?:_[a-z0-9]+)*$/);
    assert.equal(definition.maxStack, RESOURCE_MAX_STACK);
    assert.equal(definition.maxStack, 999);
    assert.equal(definition.tradable, true);
    assert.ok(definition.value >= 0);
    assert.ok(definition.uses.length > 0 || (definition.tradable && definition.value >= 0));
    assert.equal("quality" in definition, false);
  }
});

test("legacy aliases resolve to canonical resources only", () => {
  assert.equal(normalizeResourceId("iron_scrap"), "iron_ore");
  assert.equal(normalizeResourceId("Iron Scrap"), "iron_ore");
  assert.equal(normalizeResourceId("sapphire_fragment"), "sapphire");
  assert.equal(normalizeResourceId("Fallen Rain Pearl"), "pearlescent_scale");
  assert.equal(RESOURCE_ALIASES.iron_scrap, "iron_ore");
  assert.throws(
    () => validateResourceRegistry(RESOURCE_DEFINITIONS, { broken_alias: "missing_resource" }),
    /references unknown MVP resource id/
  );
});

test("strict resource stack helpers clamp additions to 999 and remain immutable", () => {
  const stock = { iron_scrap: 995 };
  const added = addResourceToStock(stock, "iron_ore", 10);

  assert.deepEqual(stock, { iron_scrap: 995 });
  assert.deepEqual(added, { iron_ore: 999 });
  assert.equal(clampResourceStack(1_500), 999);
  assert.equal(getCanonicalResourceQuantity(added, "iron_scrap"), 999);
});

test("strict resource stack helpers reject insufficient, negative, and unknown mutations", () => {
  assert.throws(() => removeResourceFromStock({ iron_ore: 2 }, "iron_ore", 3), /Not enough resource iron_ore/);
  assert.throws(() => addResourceToStock({}, "iron_ore", -1), /non-negative/);
  assert.throws(() => addResourceToStock({}, "unknown_resource", 1), /Unknown MVP resource id/);
  assert.throws(() => removeResourceFromStock({}, "unknown_resource", 1), /Unknown MVP resource id/);
});

test("resource spending helpers use canonical aliases and reject insufficient costs", () => {
  const stock = { iron_scrap: 5, sapphire: 2 };
  const costs = { iron_ore: 3, sapphire_fragment: 1 };

  assert.equal(canSpendResources(stock, costs), true);
  assert.deepEqual(spendResources(stock, costs), { iron_ore: 2, sapphire: 1 });
  assert.equal(canSpendResources(stock, { iron_ore: 6 }), false);
  assert.throws(() => spendResources(stock, { iron_ore: 6 }), /Not enough resources/);
});

test("resource bundle and recipe item values are deterministic registry calculations", () => {
  const costs = { iron_scrap: 2, sapphire: 1 };
  const expected = calculateResourceValue("iron_ore", 2) + calculateResourceValue("sapphire", 1);

  assert.equal(calculateResourceBundleValue(costs), expected);
  assert.equal(calculateResourceBundleValue(costs), expected);
  assert.equal(calculateItemValueFromRecipeResources(costs), expected);
});

test("special world items and recycle Precious Stones are not resources", () => {
  const resourceIds = new Set<string>(RESOURCE_DEFINITIONS.map(({ id }) => id));
  assert.equal(resourceIds.has("kaleidoscope"), false);
  assert.equal(resourceIds.has("fragment_du_temps"), false);

  for (const rarity of ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"] as const) {
    const stone = createPreciousStoneItem(rarity);
    assert.equal(resourceIds.has(stone.id), false);
    assert.equal(stone.kind, "material");
  }
});

test("Phase 3 enemy loot tables reference registered canonical resources", () => {
  assert.doesNotThrow(() => validateEnemyLootTables());
});

test("MVP currencies contain ECU and BOSS_TOKEN only", () => {
  assert.deepEqual(CURRENCIES, [ECU, BOSS_TOKEN]);
  assert.deepEqual(CURRENCIES.map(({ id }) => id), ["ECU", "BOSS_TOKEN"]);
  assert.deepEqual(createDefaultWalletState(), { balances: { ECU: 0, BOSS_TOKEN: 0 } });

  const wallet = grantCurrency(createDefaultWalletState(), "BOSS_TOKEN", 3);
  assert.equal(getCurrencyBalance(wallet, "BOSS_TOKEN"), 3);
  assert.deepEqual(
    normalizeWalletState({ balances: { ECU: 2, BOSS_TOKEN: 1, DUEL_TOKEN: 999 } } as any),
    { balances: { ECU: 2, BOSS_TOKEN: 1 } }
  );
  assert.throws(
    () => grantCurrency(wallet, "DUEL_TOKEN" as any, 1),
    /Unknown MVP currency id/
  );
});
