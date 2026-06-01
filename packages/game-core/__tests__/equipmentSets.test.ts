import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateEquipmentSetModifiers,
  calculateEquipmentStats,
  equipItem,
  EQUIPMENT_SETS,
  generateEquipmentItem,
} from "../equipment/index.js";
import { createInitialGameState } from "../game/state.js";
import type { EquipmentSlot } from "../items/types.js";

const ACTIVE_SET_IDS = ["vagabond", "pleureur", "maraudeur", "docteur"];
const PLACEHOLDER_SET_IDS = [
  "flageleur",
  "gardien_des_cendres",
  "voltigeur",
  "reine_blanche",
];

function createEquippedSetState(setId: string, slot: EquipmentSlot = "chest") {
  const item = generateEquipmentItem({
    itemLevel: 50,
    rarity: "RARE",
    seed: `${setId}-${slot}`,
    setId,
    slot,
  });
  const state = {
    ...createInitialGameState(),
    inventory: { items: [item] },
  };
  const equipped = equipItem(state, item.id);
  assert.equal(equipped.ok, true);
  if (!equipped.ok) throw new Error(`Failed to equip ${item.id}`);
  return equipped.state;
}

test("equipment set registry exposes four active sets and four inert placeholders", () => {
  assert.deepEqual(
    EQUIPMENT_SETS.filter((setDefinition) => setDefinition.status === "active").map(
      (setDefinition) => setDefinition.id,
    ),
    ACTIVE_SET_IDS,
  );
  assert.deepEqual(
    EQUIPMENT_SETS.filter(
      (setDefinition) => setDefinition.status === "placeholder",
    ).map((setDefinition) => setDefinition.id),
    PLACEHOLDER_SET_IDS,
  );
});

test("Vagabond stat-bias increases speed, stamina and stamina regen", () => {
  const modifiers = calculateEquipmentSetModifiers(
    createEquippedSetState("vagabond"),
  );

  assert.ok((modifiers.base?.speed ?? 0) > 0);
  assert.ok((modifiers.maxStamina ?? 0) > 0);
  assert.ok((modifiers.advanced?.staminaRegen ?? 0) > 0);
});

test("Pleureur stat-bias increases HP and DEF through equipment aggregation", () => {
  const state = createEquippedSetState("pleureur");
  const itemWithoutSetState = createEquippedSetState("flageleur");
  const stats = calculateEquipmentStats(state);
  const statsWithoutActiveSet = calculateEquipmentStats(itemWithoutSetState);

  assert.ok(stats.hp > statsWithoutActiveSet.hp);
  assert.ok(stats.defense > statsWithoutActiveSet.defense);
});

test("Maraudeur stat-bias increases ATK, SPEED and crit chance", () => {
  const modifiers = calculateEquipmentSetModifiers(
    createEquippedSetState("maraudeur"),
  );

  assert.ok((modifiers.base?.atk ?? 0) > 0);
  assert.ok((modifiers.base?.speed ?? 0) > 0);
  assert.ok((modifiers.advanced?.critChance ?? 0) > 0);
});

test("Docteur stat-bias increases HP, Mana and mana regen", () => {
  const modifiers = calculateEquipmentSetModifiers(
    createEquippedSetState("docteur"),
  );

  assert.ok((modifiers.base?.hp ?? 0) > 0);
  assert.ok((modifiers.maxMana ?? 0) > 0);
  assert.ok((modifiers.advanced?.manaRegen ?? 0) > 0);
});

test("placeholder equipment sets are registered but stay inert", () => {
  for (const setId of PLACEHOLDER_SET_IDS) {
    assert.deepEqual(calculateEquipmentSetModifiers(createEquippedSetState(setId)), {
      advanced: {},
      base: {},
      maxMana: 0,
      maxStamina: 0,
    });
  }
});

test("unknown equipment set ids fail loudly during generation", () => {
  assert.throws(
    () =>
      generateEquipmentItem({
        itemLevel: 50,
        setId: "unknown_set",
        slot: "chest",
      }),
    /Unknown equipment set id: unknown_set/,
  );
});

test("unknown persisted equipment set ids fail loudly during aggregation", () => {
  const item = {
    ...generateEquipmentItem({
      itemLevel: 50,
      slot: "chest",
    }),
    setId: "unknown_set",
  };
  const state = {
    ...createInitialGameState(),
    inventory: { items: [item] },
  };
  const equipped = equipItem(state, item.id);
  assert.equal(equipped.ok, true);
  if (!equipped.ok) return;

  assert.throws(
    () => calculateEquipmentSetModifiers(equipped.state),
    /Unknown equipment set id: unknown_set/,
  );
});

test("artifact and ring equipment stay excluded from set stat-bias", () => {
  for (const slot of ["artifact", "ring"] as const) {
    const state = createEquippedSetState("pleureur", slot);
    assert.deepEqual(calculateEquipmentSetModifiers(state), {
      advanced: {},
      base: {},
      maxMana: 0,
      maxStamina: 0,
    });
  }

  assert.deepEqual(calculateEquipmentStats(createEquippedSetState("pleureur", "artifact")), {
    attack: 0,
    defense: 0,
    hp: 0,
    power: 0,
  });
});

test("equipment set modifier aggregation does not mutate its input", () => {
  const state = createEquippedSetState("vagabond");
  const snapshot = structuredClone(state);

  calculateEquipmentSetModifiers(state);

  assert.deepEqual(state, snapshot);
});
