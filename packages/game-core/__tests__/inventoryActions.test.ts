import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { removeInventoryItem } from "../game/inventoryActions.js";
import { addItem } from "../items/inventory.js";
import { generateEquipmentItem, equipItem, equipRingItem } from "../equipment/index.js";

test("removeInventoryItem removes a non-equipped item without touching equipment", () => {
  const state = createInitialGameState();
  const chest = generateEquipmentItem({ slot: "chest", rarity: "COMMON", itemLevel: 1 });
  const withItem = { ...state, inventory: addItem(state.inventory, chest) };

  const result = removeInventoryItem(withItem, chest.id);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.wasEquipped, false);
  assert.equal(result.removedItemId, chest.id);
  assert.equal(result.next.inventory.items.some((item) => item.id === chest.id), false);
  assert.deepEqual(result.next.equipment, withItem.equipment);
});

test("removeInventoryItem unequips a main-slot item before removing it", () => {
  const state = createInitialGameState();
  const chest = generateEquipmentItem({ slot: "chest", rarity: "RARE", itemLevel: 10 });
  const withItem = { ...state, inventory: addItem(state.inventory, chest) };
  const equipped = equipItem(withItem, chest.id);
  assert.equal(equipped.ok, true);
  if (!equipped.ok) return;

  const result = removeInventoryItem(equipped.state, chest.id);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.wasEquipped, true);
  assert.equal(result.next.equipment.equipped.chest, null);
  assert.equal(result.next.inventory.items.some((item) => item.id === chest.id), false);
});

test("removeInventoryItem unequips a ring before removing it", () => {
  const state = createInitialGameState();
  const ring = generateEquipmentItem({ slot: "ring", itemLevel: 5, skillId: "SK-002" });
  const withItem = { ...state, inventory: addItem(state.inventory, ring) };
  const equipped = equipRingItem(withItem, ring.id, 1);
  assert.equal(equipped.ok, true);
  if (!equipped.ok) return;
  assert.equal(equipped.state.equipment.equipped.rings[1], ring.id);

  const result = removeInventoryItem(equipped.state, ring.id);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.wasEquipped, true);
  assert.equal(result.next.equipment.equipped.rings[1], null);
  assert.equal(result.next.inventory.items.some((item) => item.id === ring.id), false);
});

test("removeInventoryItem fails cleanly for an unknown item id", () => {
  const state = createInitialGameState();
  const result = removeInventoryItem(state, "not-a-real-item-id");

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "ITEM_NOT_FOUND");
  assert.deepEqual(result.next, state);
});
