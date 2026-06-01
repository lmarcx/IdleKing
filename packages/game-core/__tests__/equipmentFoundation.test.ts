import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateEquipmentStats,
  canUpgradeEquipment,
  equipItem,
  generateEquipmentItem,
  getAffixCountForRarity,
  getUpgradeCapForRarity,
  upgradeEquipment,
  validateAffixCount,
} from "../equipment/index.js";
import { createInitialGameState } from "../game/state.js";
import {
  EQUIPMENT_SLOTS,
  ITEM_RARITIES,
  isItemRarity,
  normalizeEquipmentItem,
  type EquipmentItem,
  type ItemRarity,
} from "../items/types.js";

const EXPECTED_AFFIX_COUNTS: Readonly<Record<ItemRarity, number>> = {
  COMMON: 0,
  UNCOMMON: 0,
  RARE: 1,
  EPIC: 1,
  LEGENDARY: 2,
};

const EXPECTED_UPGRADE_CAPS: Readonly<Record<ItemRarity, number>> = {
  COMMON: 6,
  UNCOMMON: 6,
  RARE: 6,
  EPIC: 9,
  LEGENDARY: 12,
};

test("equipment foundation exposes the locked MVP slots and rarities only", () => {
  assert.deepEqual(EQUIPMENT_SLOTS, [
    "main_hand",
    "off_hand",
    "helmet",
    "chest",
    "gloves",
    "belt",
    "boots",
    "necklace",
    "ring",
    "cape",
    "artifact",
  ]);
  assert.deepEqual(ITEM_RARITIES, ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"]);

  for (const rarity of ITEM_RARITIES) assert.equal(isItemRarity(rarity), true);
  for (const futureRarity of ["MYTHIC", "DIVINE", "ANCIENT"]) {
    assert.equal(isItemRarity(futureRarity), false);
  }
});

test("equipment normalization keeps legacy slot aliases but rejects out-of-MVP rarities", () => {
  const legacyWeapon = normalizeEquipmentItem({
    id: "legacy-sword",
    name: "Legacy Sword",
    slot: "weapon",
    stats: { attack: 3 },
  });
  assert.equal(legacyWeapon?.slot, "main_hand");

  assert.equal(
    normalizeEquipmentItem({
      id: "future-item",
      name: "Future Item",
      rarity: "MYTHIC",
      slot: "main_hand",
      stats: {},
    }),
    null,
  );
});

test("generated equipment follows affix counts 0/0/1/1/2 with an absolute cap of 2", () => {
  for (const rarity of ITEM_RARITIES) {
    const item = generateEquipmentItem({
      itemLevel: 50,
      rarity,
      seed: `affix-${rarity}`,
      slot: "chest",
    });

    assert.equal(getAffixCountForRarity(rarity), EXPECTED_AFFIX_COUNTS[rarity]);
    assert.equal(item.affixes.length, EXPECTED_AFFIX_COUNTS[rarity]);
    assert.equal(validateAffixCount(item), true);
    assert.ok(item.affixes.length <= 2);
  }

  const legendary = generateEquipmentItem({ itemLevel: 50, rarity: "LEGENDARY", slot: "chest" });
  const invalidLegendary = { ...legendary, affixes: [...legendary.affixes, legendary.affixes[0]] };
  assert.equal(validateAffixCount(invalidLegendary), false);
});

test("equipment upgrades use locked rarity caps including Rare at +6", () => {
  for (const rarity of ITEM_RARITIES) {
    assert.equal(getUpgradeCapForRarity(rarity), EXPECTED_UPGRADE_CAPS[rarity]);
  }

  const rare = generateEquipmentItem({ itemLevel: 50, rarity: "RARE", slot: "main_hand" });
  const cappedRare: EquipmentItem = { ...rare, upgradeLevel: 6 };

  assert.equal(canUpgradeEquipment({ ...rare, upgradeLevel: 5 }), true);
  assert.equal(canUpgradeEquipment(cappedRare), false);
  assert.throws(() => upgradeEquipment(cappedRare), /already reached the RARE upgrade cap/);
});

test("artifact is accepted but contributes no derived equipment stats", () => {
  const artifact = {
    ...generateEquipmentItem({ itemLevel: 50, rarity: "LEGENDARY", slot: "artifact" }),
    rolledStats: { attack: 999, hp: 999, power: 999 },
    stats: { attack: 999, hp: 999, power: 999 },
  };
  const state = {
    ...createInitialGameState(),
    inventory: { items: [artifact] },
  };
  const equipped = equipItem(state, artifact.id);
  assert.equal(equipped.ok, true);
  if (!equipped.ok) return;

  assert.deepEqual(calculateEquipmentStats(equipped.state), {
    attack: 0,
    defense: 0,
    hp: 0,
    power: 0,
  });
});

test("equipment aggregation does not mutate its input state", () => {
  const chest = generateEquipmentItem({ itemLevel: 50, rarity: "EPIC", slot: "chest" });
  const state = {
    ...createInitialGameState(),
    inventory: { items: [chest] },
  };
  const equipped = equipItem(state, chest.id);
  assert.equal(equipped.ok, true);
  if (!equipped.ok) return;
  const snapshot = structuredClone(equipped.state);

  calculateEquipmentStats(equipped.state);

  assert.deepEqual(equipped.state, snapshot);
});
