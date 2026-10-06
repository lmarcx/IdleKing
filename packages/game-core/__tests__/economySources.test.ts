import test from "node:test";
import assert from "node:assert/strict";

import { KITCHEN_RECIPES as KITCHEN_BUILDING_RECIPES } from "../building/kitchen/recipes.js";
import { MARKET_RESOURCE_ENTRIES } from "../market/catalog.js";
import { FARM_RESOURCE_TABLE } from "../minigames/farm/spawns.js";
import { KITCHEN_RECIPES as KITCHEN_MINIGAME_RECIPES } from "../minigames/kitchen/recipes.js";
import { RESOURCE_DEFINITIONS } from "../resources/registry.js";

const farmProduced = new Set<string>(FARM_RESOURCE_TABLE.map((entry) => entry.id));
const canonical = new Set<string>(RESOURCE_DEFINITIONS.map((definition) => definition.id));

test("every Kitchen ingredient is produced by the Farm", () => {
  const ingredients = [
    ...KITCHEN_BUILDING_RECIPES.flatMap((recipe) => Object.keys(recipe.cost)),
    ...KITCHEN_MINIGAME_RECIPES.flatMap((recipe) => Object.keys(recipe.ingredientCosts)),
  ];
  for (const resourceId of ingredients) {
    assert.ok(farmProduced.has(resourceId), `${resourceId} has no Farm source`);
  }
});

test("the Market only trades canonical resources", () => {
  for (const entry of MARKET_RESOURCE_ENTRIES) {
    assert.ok(canonical.has(entry.resourceId), `${entry.resourceId} is not a canonical resource`);
  }
});
