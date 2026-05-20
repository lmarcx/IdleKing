import test from "node:test";
import assert from "node:assert/strict";

import { getCurrencyBalance, grantCurrency } from "../currencies/index.js";
import { generateEquipmentItem } from "../equipment/index.js";
import { createInitialGameState } from "../game/state.js";
import { addItem } from "../items/inventory.js";
import type { NonEquipmentItem } from "../items/types.js";
import { MARKET_EQUIPMENT_ENTRIES, marketBuy, marketSell } from "../market/index.js";
import { addQty, getQty } from "../resources/types.js";

test("buy resource spends ECU and grants ResourceStock", () => {
  const state = {
    ...createInitialGameState(),
    wallet: grantCurrency(createInitialGameState().wallet, "ECU", 20),
  };

  const result = marketBuy(state, "resource_wood", 3);

  assert.equal(result.ok, true);
  assert.equal(result.ecuAmount, 6);
  assert.equal(getCurrencyBalance(result.next.wallet, "ECU"), 14);
  assert.equal(getQty(result.next.resources, "WOOD"), 3);
});

test("buy consumable spends ECU and grants inventory item", () => {
  const state = {
    ...createInitialGameState(),
    wallet: grantCurrency(createInitialGameState().wallet, "ECU", 20),
  };

  const result = marketBuy(state, "consumable_healing_potion", 2);

  assert.equal(result.ok, true);
  assert.equal(result.ecuAmount, 20);
  assert.equal(getCurrencyBalance(result.next.wallet, "ECU"), 0);
  assert.deepEqual(result.next.inventory.items, [
    {
      id: "healing_potion",
      kind: "consumable",
      name: "Healing Potion",
      quantity: 2,
      value: 10,
    },
  ]);
});

test("buy equipment spends ECU and grants inventory equipment", () => {
  const state = {
    ...createInitialGameState(),
    wallet: grantCurrency(createInitialGameState().wallet, "ECU", 30),
  };

  const result = marketBuy(state, "equipment_basic_sword");

  assert.equal(result.ok, true);
  assert.equal(result.ecuAmount, 24);
  assert.equal(getCurrencyBalance(result.next.wallet, "ECU"), 6);
  const item = result.next.inventory.items[0];
  assert.ok(item && "slot" in item);
  assert.equal(item?.id, "market_basic_sword_1");
  assert.equal(item?.name, "Basic Sword");
});

test("buy fails with insufficient ECU", () => {
  const state = {
    ...createInitialGameState(),
    wallet: grantCurrency(createInitialGameState().wallet, "ECU", 1),
  };

  const result = marketBuy(state, "resource_iron", 1);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "INSUFFICIENT_ECU");
  assert.equal(getCurrencyBalance(result.next.wallet, "ECU"), 1);
  assert.equal(getQty(result.next.resources, "IRON"), 0);
});

test("sell resource removes ResourceStock and grants ECU", () => {
  const state = {
    ...createInitialGameState(),
    resources: addQty({}, "WOOD", 5),
  };

  const result = marketSell(state, "WOOD", 2);

  assert.equal(result.ok, true);
  assert.equal(result.ecuAmount, 2);
  assert.equal(getQty(result.next.resources, "WOOD"), 3);
  assert.equal(getCurrencyBalance(result.next.wallet, "ECU"), 2);
});

test("sell consumable removes inventory item and grants ECU", () => {
  const potion: NonEquipmentItem = {
    id: "healing_potion",
    kind: "consumable",
    name: "Healing Potion",
    quantity: 3,
    value: 10,
  };
  const state = {
    ...createInitialGameState(),
    inventory: addItem(createInitialGameState().inventory, potion),
  };

  const result = marketSell(state, potion.id, 2);

  assert.equal(result.ok, true);
  assert.equal(result.ecuAmount, 10);
  assert.equal(getCurrencyBalance(result.next.wallet, "ECU"), 10);
  assert.deepEqual(result.next.inventory.items, [{ ...potion, quantity: 1 }]);
});

test("sell sellable equipment grants ECU", () => {
  const entry = MARKET_EQUIPMENT_ENTRIES[0];
  assert.ok(entry);
  const equipment = {
    ...generateEquipmentItem({
      id: `${entry.equipment.idPrefix}_1`,
      name: entry.equipment.name,
      slot: entry.equipment.slot,
      itemLevel: entry.equipment.itemLevel,
      rarity: entry.equipment.rarity,
    }),
    value: entry.equipment.value,
  };
  const state = {
    ...createInitialGameState(),
    inventory: addItem(createInitialGameState().inventory, equipment),
  };

  const result = marketSell(state, equipment.id);

  assert.equal(result.ok, true);
  assert.equal(result.ecuAmount, entry.sellPrice.amount);
  assert.equal(getCurrencyBalance(result.next.wallet, "ECU"), entry.sellPrice.amount);
  assert.equal(result.next.inventory.items.length, 0);
});

test("sell rejects currencies", () => {
  const result = marketSell(createInitialGameState(), "ECU", 1);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "CURRENCY_NOT_SUPPORTED");
});

test("sell rejects quest items", () => {
  const questItem: NonEquipmentItem = {
    id: "quest-token",
    kind: "quest",
    name: "Quest Token",
    quantity: 1,
  };
  const state = {
    ...createInitialGameState(),
    inventory: addItem(createInitialGameState().inventory, questItem),
  };

  const result = marketSell(state, questItem.id);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "QUEST_ITEM_NOT_SUPPORTED");
  assert.equal(result.next.inventory.items.length, 1);
});

test("sell rejects unsellable equipment", () => {
  const equipment = generateEquipmentItem({
    id: "expedition_unique_sword",
    slot: "weapon",
    itemLevel: 10,
    rarity: "RARE",
  });
  const state = {
    ...createInitialGameState(),
    inventory: addItem(createInitialGameState().inventory, equipment),
  };

  const result = marketSell(state, equipment.id);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "UNSELLABLE_ITEM");
  assert.equal(result.next.inventory.items.length, 1);
});
