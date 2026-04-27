import test from "node:test";
import assert from "node:assert/strict";

import {
  filterAndSortInventoryItems,
  getInventoryDisplayItems,
  type InventoryDisplayItem,
} from "../items/display.js";
import { createInitialGameState } from "../game/state.js";
import { addQty } from "../resources/types.js";

function fixtureItems(): InventoryDisplayItem[] {
  return [
    { id: "z_sword", name: "Zeta Sword", category: "equipment", quantity: 1, value: 30 },
    { id: "apple", name: "Apple", category: "resources", quantity: 4, value: 2 },
    { id: "ore", name: "Ore", category: "materials", quantity: 10, value: 8 },
  ];
}

test("inventory display filters by search", () => {
  const out = filterAndSortInventoryItems(fixtureItems(), { search: "sword" });
  assert.deepEqual(out.map((item) => item.id), ["z_sword"]);
});

test("inventory display filters by category", () => {
  const out = filterAndSortInventoryItems(fixtureItems(), { category: "materials" });
  assert.deepEqual(out.map((item) => item.id), ["ore"]);
});

test("inventory display sorts quantity asc and desc", () => {
  const asc = filterAndSortInventoryItems(fixtureItems(), { sort: "quantity-asc" });
  const desc = filterAndSortInventoryItems(fixtureItems(), { sort: "quantity-desc" });

  assert.deepEqual(asc.map((item) => item.quantity), [1, 4, 10]);
  assert.deepEqual(desc.map((item) => item.quantity), [10, 4, 1]);
});

test("inventory display sorts value asc and desc", () => {
  const asc = filterAndSortInventoryItems(fixtureItems(), { sort: "value-asc" });
  const desc = filterAndSortInventoryItems(fixtureItems(), { sort: "value-desc" });

  assert.deepEqual(asc.map((item) => item.value), [2, 8, 30]);
  assert.deepEqual(desc.map((item) => item.value), [30, 8, 2]);
});

test("inventory display sorts names A-Z and Z-A", () => {
  const asc = filterAndSortInventoryItems(fixtureItems(), { sort: "name-asc" });
  const desc = filterAndSortInventoryItems(fixtureItems(), { sort: "name-desc" });

  assert.deepEqual(asc.map((item) => item.name), ["Apple", "Ore", "Zeta Sword"]);
  assert.deepEqual(desc.map((item) => item.name), ["Zeta Sword", "Ore", "Apple"]);
});

test("inventory display includes resources from game state", () => {
  const state = createInitialGameState();
  const withWood = { ...state, resources: addQty(state.resources, "WOOD", 3) };
  const items = getInventoryDisplayItems(withWood);

  assert.equal(items.find((item) => item.id === "WOOD")?.quantity, 3);
});
