import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateEffectSlotCount,
  calculateResonanceFromEquipment,
  getResonanceEligibleSlots,
  getResonanceValueForRarity,
  RESONANCE_ELIGIBLE_SLOTS,
  type ResonanceSlot,
} from "../resonance/index.js";
import {
  createDefaultPlayerEquipmentState,
  type PlayerEquipmentState,
} from "../equipment/index.js";
import { createInitialGameState } from "../game/state.js";
import type { EquipmentItem, EquipmentSlot, Item, ItemRarity } from "../items/types.js";

function equipmentItem(slot: EquipmentSlot, rarity: ItemRarity, id = `${slot}-${rarity}`): EquipmentItem {
  return {
    affixes: [],
    baseItemId: id,
    id,
    ilvl: 1,
    instanceId: id,
    kind: "equipment",
    name: id,
    rarity,
    rolledStats: {},
    slot,
    stats: {},
    upgradeLevel: 0,
  };
}

function equippedState(items: readonly EquipmentItem[]): PlayerEquipmentState {
  const equipment = createDefaultPlayerEquipmentState();
  for (const item of items) {
    if (item.slot === "ring") {
      equipment.equipped.rings[0] = item.id;
    } else {
      equipment.equipped[item.slot] = item.id;
    }
  }
  return equipment;
}

function itemsForEligibleSlots(rarity: ItemRarity): EquipmentItem[] {
  return RESONANCE_ELIGIBLE_SLOTS.map((slot) => equipmentItem(slot, rarity));
}

test("Resonance rarity values use the MVP Common to Legendary scale", () => {
  assert.equal(getResonanceValueForRarity("COMMON"), 0);
  assert.equal(getResonanceValueForRarity("UNCOMMON"), 1);
  assert.equal(getResonanceValueForRarity("RARE"), 2);
  assert.equal(getResonanceValueForRarity("EPIC"), 3);
  assert.equal(getResonanceValueForRarity("LEGENDARY"), 4);
});

test("eligible Resonance slots are locked to the nine Freeze V1 slots", () => {
  assert.deepEqual(getResonanceEligibleSlots(), [
    "helmet",
    "chest",
    "cape",
    "gloves",
    "belt",
    "boots",
    "main_hand",
    "off_hand",
    "necklace",
  ]);
  assert.equal(getResonanceEligibleSlots().includes("ring" as ResonanceSlot), false);
  assert.equal(getResonanceEligibleSlots().includes("artifact" as ResonanceSlot), false);
});

test("nine Uncommon equipped items give total Resonance 9 and one Effect Slot", () => {
  const items = itemsForEligibleSlots("UNCOMMON");
  const result = calculateResonanceFromEquipment({
    equipped: equippedState(items),
    items,
  });

  assert.equal(result.totalResonance, 9);
  assert.equal(result.effectSlots, 1);
});

test("nine Epic equipped items give total Resonance 27 and three Effect Slots", () => {
  const items = itemsForEligibleSlots("EPIC");
  const result = calculateResonanceFromEquipment(equippedState(items), items);

  assert.equal(result.totalResonance, 27);
  assert.equal(result.effectSlots, 3);
});

test("rings and artifact never contribute to Resonance", () => {
  const ring = equipmentItem("ring", "LEGENDARY", "legendary-ring");
  const artifact = equipmentItem("artifact", "LEGENDARY", "legendary-artifact");
  const equipment = equippedState([ring, artifact]);
  const result = calculateResonanceFromEquipment(equipment, [ring, artifact]);

  assert.equal(result.totalResonance, 0);
  assert.equal(result.effectSlots, 0);
});

test("empty eligible slots count as zero", () => {
  const helmet = equipmentItem("helmet", "LEGENDARY", "helmet-legendary");
  const result = calculateResonanceFromEquipment(equippedState([helmet]), [helmet]);
  const emptyCape = result.slots.find((slot) => slot.slot === "cape");

  assert.equal(result.totalResonance, 4);
  assert.equal(emptyCape?.itemId, null);
  assert.equal(emptyCape?.value, 0);
});

test("off_hand contributes when an item is present", () => {
  const offhand = equipmentItem("off_hand", "LEGENDARY", "shield-legendary");
  const result = calculateResonanceFromEquipment(equippedState([offhand]), [offhand]);
  const offhandBreakdown = result.slots.find((slot) => slot.slot === "off_hand");

  assert.equal(result.totalResonance, 4);
  assert.equal(offhandBreakdown?.itemId, offhand.id);
  assert.equal(offhandBreakdown?.value, 4);
});

test("Effect Slots are floor(totalResonance / 9)", () => {
  assert.equal(calculateEffectSlotCount(0), 0);
  assert.equal(calculateEffectSlotCount(8), 0);
  assert.equal(calculateEffectSlotCount(9), 1);
  assert.equal(calculateEffectSlotCount(17), 1);
  assert.equal(calculateEffectSlotCount(18), 2);
  assert.equal(calculateEffectSlotCount(27), 3);
});

test("non-MVP rarities are rejected for Resonance", () => {
  for (const rarity of ["MYTHIC", "DIVINE", "ANCIENT"]) {
    const item = {
      ...equipmentItem("helmet", "COMMON", `bad-${rarity}`),
      rarity,
    } as unknown as Item;

    assert.throws(
      () => calculateResonanceFromEquipment(equippedState([item as EquipmentItem]), [item]),
      /Unknown MVP item rarity for Resonance/
    );
  }
});

test("Resonance is derived and not stored in the default game state", () => {
  const state = createInitialGameState() as unknown as Record<string, unknown>;
  const serialized = JSON.stringify(state);

  assert.equal("resonance" in state, false);
  assert.equal("totalResonance" in state, false);
  assert.equal("effectSlots" in state, false);
  assert.equal(serialized.includes("totalResonance"), false);
  assert.equal(serialized.includes("effectSlots"), false);
});

test("Resonance calculation ignores POWER, Player Level, and World Level fields", () => {
  const item = equipmentItem("helmet", "RARE", "rare-helmet");
  const equipment = equippedState([item]);
  const baseline = calculateResonanceFromEquipment(equipment, [item]);
  const withProgressionNoise = calculateResonanceFromEquipment(
    {
      ...equipment,
      playerLevel: 99,
      worldLevel: 99,
      power: 999_999,
    } as unknown as PlayerEquipmentState,
    [{ ...item, power: 999_999 } as unknown as Item]
  );

  assert.deepEqual(withProgressionNoise, baseline);
});
