import test from "node:test";
import assert from "node:assert/strict";

import { buildCharacterCombatLoadout } from "../character/index.js";
import {
  calculateEquipmentStats,
  calculateFinalCharacterStats,
  createDefaultPlayerEquipmentState,
  equipItem,
  generateEquipmentItem,
  generateEquipmentLootDrop,
  type EquipItemResult,
  getEquippedItemIds,
  getEquippedItems,
  unequipItem,
} from "../equipment/index.js";
import { createInitialGameState, type GameState } from "../game/state.js";
import { loadGame } from "../game/save.js";
import { EQUIPMENT_SLOTS, isEquipmentItem, type EquipmentItem, type NonEquipmentItem } from "../items/types.js";

function equipmentItem(overrides: Partial<EquipmentItem> & Pick<EquipmentItem, "id" | "name" | "slot">): EquipmentItem {
  const stats = overrides.stats ?? {};
  return {
    ...overrides,
    affixes: overrides.affixes ?? [],
    baseItemId: overrides.baseItemId ?? overrides.id,
    ilvl: overrides.ilvl ?? 1,
    instanceId: overrides.instanceId ?? overrides.id,
    kind: "equipment",
    rarity: overrides.rarity ?? "COMMON",
    rolledStats: overrides.rolledStats ?? stats,
    stats,
    upgradeLevel: overrides.upgradeLevel ?? 0,
  };
}

function stateWithItems(items: GameState["inventory"]["items"]): GameState {
  return {
    ...createInitialGameState(),
    inventory: { items },
  };
}

function assertEquipOk(result: EquipItemResult): asserts result is Extract<EquipItemResult, { ok: true }> {
  if (!result.ok) assert.fail(result.reason);
}

function totalStats(item: EquipmentItem): number {
  return (item.stats.hp ?? 0) + (item.stats.attack ?? 0) + (item.stats.defense ?? 0) + (item.stats.power ?? 0);
}

function baseStats(stats: { hp: number; attack: number; defense: number; power: number }) {
  return {
    hp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    power: stats.power,
  };
}

test("default player equipment state initializes active slots and five ring slots", () => {
  const equipment = createDefaultPlayerEquipmentState();

  assert.deepEqual(Object.keys(equipment.equipped), [...EQUIPMENT_SLOTS, "rings"]);
  for (const slot of EQUIPMENT_SLOTS) {
    assert.equal(equipment.equipped[slot], null);
  }
  assert.deepEqual(equipment.equipped.rings, [null, null, null, null, null]);
  assert.deepEqual(getEquippedItemIds(equipment), []);
});

test("generateEquipmentItem produces valid equipment for every active slot", () => {
  for (const slot of EQUIPMENT_SLOTS) {
    const item = generateEquipmentItem({ slot, itemLevel: 12, seed: `test-${slot}` });

    assert.ok(isEquipmentItem(item));
    assert.equal(item.kind, "equipment");
    assert.equal(item.slot, slot);
    assert.equal(totalStats(item) > 0, slot !== "artifact");
  }
});

test("generateEquipmentItem stats scale with itemLevel", () => {
  const low = generateEquipmentItem({ slot: "main_hand", itemLevel: 5, seed: "weapon-low" });
  const high = generateEquipmentItem({ slot: "main_hand", itemLevel: 50, seed: "weapon-high" });

  assert.ok((high.stats.attack ?? 0) > (low.stats.attack ?? 0));
  assert.ok((high.stats.power ?? 0) > (low.stats.power ?? 0));
});

test("generateEquipmentLootDrop can produce a valid equipment item", () => {
  const item = generateEquipmentLootDrop({ seed: 12345, worldLevel: 3, chance: 1 });

  assert.ok(item);
  assert.ok(isEquipmentItem(item));
  assert.ok(totalStats(item) > 0);
});

test("generated equipment can live in inventory, equip, and affect final stats", () => {
  const weapon = generateEquipmentItem({ slot: "main_hand", itemLevel: 20, seed: "generated-weapon" });
  const equipped = equipItem(stateWithItems([weapon]), weapon.id);
  assertEquipOk(equipped);

  assert.equal(equipped.state.equipment.equipped.main_hand, weapon.id);
  assert.deepEqual(equipped.state.inventory.items, [weapon]);

  const finalStats = calculateFinalCharacterStats(equipped.state);
  assert.equal(finalStats.attack, 25 + (weapon.stats.attack ?? 0));
  assert.equal(finalStats.power, 25 + (weapon.stats.power ?? 0));
});

test("old save without equipment revives with default equipment state", () => {
  const stateWithoutEquipment = createInitialGameState() as unknown as Omit<GameState, "equipment"> & { equipment?: never };
  delete stateWithoutEquipment.equipment;

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
    store.set(
      "idle_king_save_v1",
      JSON.stringify({
        schemaVersion: 1,
        savedAt: Date.now(),
        state: stateWithoutEquipment,
      }),
    );

    const loaded = loadGame();
    assert.ok(loaded);
    assert.deepEqual(loaded.equipment, createDefaultPlayerEquipmentState());
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: previousLocalStorage,
    });
  }
});

test("equipItem equips weapon and chest items from inventory", () => {
  const weapon = equipmentItem({ id: "weapon-1", name: "Training Sword", slot: "main_hand", stats: { attack: 3 } });
  const chest = equipmentItem({ id: "chest-1", name: "Training Plate", slot: "chest", stats: { hp: 20, defense: 2 } });
  let state = stateWithItems([weapon, chest]);

  const weaponResult = equipItem(state, weapon.id);
  assertEquipOk(weaponResult);
  state = weaponResult.state;

  const chestResult = equipItem(state, chest.id);
  assertEquipOk(chestResult);

  assert.equal(chestResult.state.equipment.equipped.main_hand, weapon.id);
  assert.equal(chestResult.state.equipment.equipped.chest, chest.id);
  assert.deepEqual(
    getEquippedItems(chestResult.state).map((item) => item.id),
    [weapon.id, chest.id],
  );
});

test("equipping another item in the same slot replaces the previous item", () => {
  const oldWeapon = equipmentItem({ id: "weapon-old", name: "Old Sword", slot: "main_hand", stats: { attack: 1 } });
  const newWeapon = equipmentItem({ id: "weapon-new", name: "New Sword", slot: "main_hand", stats: { attack: 5 } });
  let state = stateWithItems([oldWeapon, newWeapon]);

  const first = equipItem(state, oldWeapon.id);
  assertEquipOk(first);
  state = first.state;

  const second = equipItem(state, newWeapon.id);
  assertEquipOk(second);

  assert.equal(second.replacedItemId, oldWeapon.id);
  assert.equal(second.state.equipment.equipped.main_hand, newWeapon.id);
});

test("unequipItem clears an equipped slot and empty slots succeed neutrally", () => {
  const weapon = equipmentItem({ id: "weapon-1", name: "Training Sword", slot: "main_hand", stats: { attack: 3 } });
  const equipped = equipItem(stateWithItems([weapon]), weapon.id);
  assertEquipOk(equipped);

  const unequipped = unequipItem(equipped.state, "main_hand");
  assert.equal(unequipped.removedItemId, weapon.id);
  assert.equal(unequipped.state.equipment.equipped.main_hand, null);

  const emptyUnequip = unequipItem(unequipped.state, "main_hand");
  assert.equal(emptyUnequip.removedItemId, null);
  assert.equal(emptyUnequip.state.equipment.equipped.main_hand, null);
});

test("equipItem rejects missing and non-equipment items", () => {
  const miscItem: NonEquipmentItem = { id: "misc-1", kind: "misc", name: "Bent Nail", value: 1 };
  const state = stateWithItems([miscItem]);

  const missing = equipItem(state, "missing");
  assert.equal(missing.ok, false);
  if (missing.ok) assert.fail("missing item should not equip");
  assert.equal(missing.reason, "ITEM_NOT_FOUND");

  const nonEquipment = equipItem(state, miscItem.id);
  assert.equal(nonEquipment.ok, false);
  if (nonEquipment.ok) assert.fail("non-equipment item should not equip");
  assert.equal(nonEquipment.reason, "ITEM_NOT_EQUIPMENT");
});

test("calculateEquipmentStats sums hp attack defense and power", () => {
  const weapon = equipmentItem({ id: "weapon-1", name: "Training Sword", slot: "main_hand", stats: { attack: 4, power: 7 } });
  const cape = equipmentItem({ id: "cape-1", name: "Training Cape", slot: "cape", stats: { hp: 15, defense: 3 } });
  let state = stateWithItems([weapon, cape]);

  const weaponResult = equipItem(state, weapon.id);
  assertEquipOk(weaponResult);
  state = weaponResult.state;

  const capeResult = equipItem(state, cape.id);
  assertEquipOk(capeResult);

  assert.deepEqual(calculateEquipmentStats(capeResult.state), {
    hp: 15,
    attack: 4,
    defense: 3,
    power: 7,
  });
});

test("calculateFinalCharacterStats combines base stats and equipment stats", () => {
  const weapon = equipmentItem({ id: "weapon-1", name: "Training Sword", slot: "main_hand", stats: { attack: 4, power: 7 } });
  const equipped = equipItem(stateWithItems([weapon]), weapon.id);
  assertEquipOk(equipped);

  assert.deepEqual(baseStats(calculateFinalCharacterStats(equipped.state)), {
    hp: 100,
    attack: 29,
    defense: 0,
    power: 32,
  });
});

test("buildCharacterCombatLoadout uses final character stats", () => {
  const chest = equipmentItem({ id: "chest-1", name: "Training Plate", slot: "chest", stats: { hp: 30, defense: 6 } });
  const equipped = equipItem(stateWithItems([chest]), chest.id);
  assertEquipOk(equipped);

  const loadout = buildCharacterCombatLoadout(equipped.state);

  assert.deepEqual(baseStats(loadout.stats), {
    hp: 130,
    attack: 25,
    defense: 6,
    power: 25,
  });
});

test("buildCharacterCombatLoadout includes equipped weapon attack", () => {
  const weapon = equipmentItem({ id: "weapon-attack-10", name: "Sharp Sword", slot: "main_hand", stats: { attack: 10 } });
  const equipped = equipItem(stateWithItems([weapon]), weapon.id);
  assertEquipOk(equipped);

  const loadout = buildCharacterCombatLoadout(equipped.state);

  assert.equal(loadout.stats.attack, 35);
});
