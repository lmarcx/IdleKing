import test from "node:test";
import assert from "node:assert/strict";

import {
  BANK_STACK_MAX,
  depositAllToBank,
  depositItemToBank,
  withdrawAllFromBank,
  withdrawItemFromBank,
} from "../bank/index.js";
import { generateEquipmentItem } from "../equipment/index.js";
import { createInitialGameState, type GameState } from "../game/state.js";
import { loadGameWithReport } from "../game/save.js";
import type { NonEquipmentItem } from "../items/types.js";
import { addQty, getQty } from "../resources/types.js";

function withInventoryItems(state: GameState, items: GameState["inventory"]["items"]): GameState {
  return {
    ...state,
    inventory: { items },
  };
}

test("save migration initializes missing BankState", () => {
  const savedAt = 1_000;
  const oldState: any = createInitialGameState({ nowMs: savedAt });
  delete oldState.bank;

  const store = new Map<string, string>();
  const previousLocalStorage = globalThis.localStorage;
  globalThis.localStorage = {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };

  const previousDateNow = Date.now;
  Date.now = () => savedAt;

  try {
    localStorage.setItem(
      "idle_king_save_v1",
      JSON.stringify({
        schemaVersion: 1,
        savedAt,
        state: oldState,
      }),
    );

    const loaded = loadGameWithReport();
    assert.ok(loaded);
    if (!loaded) return;
    assert.deepEqual(loaded.state.bank, { stacks: [] });
  } finally {
    Date.now = previousDateNow;
    globalThis.localStorage = previousLocalStorage;
  }
});

test("deposit resource reduces ResourceStock and increases bank", () => {
  const state = {
    ...createInitialGameState(),
    resources: addQty({}, "WOOD", 10),
  };

  const result = depositItemToBank(state, "WOOD", 4);

  assert.equal(result.ok, true);
  assert.equal(getQty(result.next.resources, "WOOD"), 6);
  assert.equal(result.next.bank.stacks.find((stack) => stack.id === "WOOD")?.quantity, 4);
});

test("withdraw resource reduces bank and increases ResourceStock", () => {
  const deposited = depositItemToBank(
    {
      ...createInitialGameState(),
      resources: addQty({}, "STONE", 9),
    },
    "STONE",
    7,
  );
  assert.equal(deposited.ok, true);

  const result = withdrawItemFromBank(deposited.next, "STONE", 3);

  assert.equal(result.ok, true);
  assert.equal(getQty(result.next.resources, "STONE"), 5);
  assert.equal(result.next.bank.stacks.find((stack) => stack.id === "STONE")?.quantity, 4);
});

test("deposit cannot exceed available quantity", () => {
  const state = {
    ...createInitialGameState(),
    resources: addQty({}, "COPPER", 2),
  };

  const result = depositItemToBank(state, "COPPER", 3);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "NOT_ENOUGH_INVENTORY");
  assert.equal(getQty(result.next.resources, "COPPER"), 2);
  assert.equal(result.next.bank.stacks.length, 0);
});

test("withdraw cannot exceed bank quantity", () => {
  const state = {
    ...createInitialGameState(),
    bank: { stacks: [{ id: "IRON", name: "Iron", category: "resources", kind: "resource", quantity: 2 }] },
  } satisfies GameState;

  const result = withdrawItemFromBank(state, "IRON", 3);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "NOT_ENOUGH_BANK");
  assert.equal(getQty(result.next.resources, "IRON"), 0);
  assert.equal(result.next.bank.stacks[0]?.quantity, 2);
});

test("equipment deposit is rejected", () => {
  const equipment = generateEquipmentItem({
    id: "test_sword",
    slot: "weapon",
    itemLevel: 1,
  });
  const state = withInventoryItems(createInitialGameState(), [equipment]);

  const result = depositItemToBank(state, equipment.id, 1);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "EQUIPMENT_NOT_SUPPORTED");
  assert.equal(result.next.inventory.items.length, 1);
  assert.equal(result.next.bank.stacks.length, 0);
});

test("currency deposit is rejected", () => {
  const result = depositItemToBank(createInitialGameState(), "ECU", 1);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "CURRENCY_NOT_SUPPORTED");
});

test("quest item deposit is rejected", () => {
  const questItem: NonEquipmentItem = {
    id: "quest-seal",
    kind: "quest",
    name: "Quest Seal",
    quantity: 1,
  };
  const state = withInventoryItems(createInitialGameState(), [questItem]);

  const result = depositItemToBank(state, questItem.id, 1);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "QUEST_ITEM_NOT_SUPPORTED");
  assert.equal(result.next.inventory.items.length, 1);
  assert.equal(result.next.bank.stacks.length, 0);
});

test("depositAll and withdrawAll work for resources", () => {
  const state = {
    ...createInitialGameState(),
    resources: {
      WOOD: 5,
      STONE: 3,
    },
  } satisfies GameState;

  const deposited = depositAllToBank(state, "resources");
  assert.equal(deposited.ok, true);
  assert.equal(deposited.quantity, 8);
  assert.equal(getQty(deposited.next.resources, "WOOD"), 0);
  assert.equal(getQty(deposited.next.resources, "STONE"), 0);
  assert.equal(deposited.next.bank.stacks.reduce((sum, stack) => sum + stack.quantity, 0), 8);

  const withdrawn = withdrawAllFromBank(deposited.next, "resources");
  assert.equal(withdrawn.ok, true);
  assert.equal(withdrawn.quantity, 8);
  assert.equal(getQty(withdrawn.next.resources, "WOOD"), 5);
  assert.equal(getQty(withdrawn.next.resources, "STONE"), 3);
  assert.equal(withdrawn.next.bank.stacks.length, 0);
});

test("bank stack max 999 is respected", () => {
  const shard: NonEquipmentItem = {
    id: "smoke_shard",
    kind: "special",
    name: "Smoke Shard",
    quantity: BANK_STACK_MAX + 201,
  };
  const state = withInventoryItems(createInitialGameState(), [shard]);

  const result = depositItemToBank(state, shard.id, BANK_STACK_MAX + 201);

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.next.bank.stacks.filter((stack) => stack.id === shard.id).map((stack) => stack.quantity),
    [BANK_STACK_MAX, 201],
  );
  assert.equal(result.next.inventory.items.length, 0);
});
