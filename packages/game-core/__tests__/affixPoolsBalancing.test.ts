import test from "node:test";
import assert from "node:assert/strict";

import {
  AFFIX_RARITY_VALUE_MULTIPLIER,
  EQUIPMENT_AFFIX_POOLS,
  generateEquipmentItem,
  getAffixCountForRarity,
  rollEquipmentAffixes,
} from "../equipment/index.js";
import {
  EQUIPMENT_SLOTS,
  ITEM_RARITIES,
  type EquipmentSlot,
  type ItemRarity,
} from "../items/types.js";

function constantRng(value: number): () => number {
  return () => value;
}

test("every non-artifact slot pool can supply two distinct affixes for a Legendary", () => {
  for (const slot of EQUIPMENT_SLOTS) {
    const pool = EQUIPMENT_AFFIX_POOLS[slot];
    if (slot === "artifact") {
      assert.equal(pool.length, 0, "artifact slot must stay inert (D-11)");
      continue;
    }
    const distinctIds = new Set(pool.map((entry) => entry.affixId));
    assert.ok(distinctIds.size >= 2, `${slot} pool needs >= 2 distinct affixes for Legendary rolls`);
  }
});

test("rollEquipmentAffixes respects the 0/0/1/1/2 affix counts", () => {
  for (const slot of EQUIPMENT_SLOTS) {
    for (const rarity of ITEM_RARITIES) {
      const affixes = rollEquipmentAffixes({ slot, rarity, ilvl: 100, rng: constantRng(0.5) });
      const expected = slot === "artifact" ? 0 : getAffixCountForRarity(rarity);
      assert.equal(affixes.length, expected, `${slot}/${rarity} affix count`);
    }
  }
});

test("rolled affixes are distinct and slot-appropriate", () => {
  for (const slot of EQUIPMENT_SLOTS) {
    if (slot === "artifact") continue;
    const poolIds = new Set<string>(EQUIPMENT_AFFIX_POOLS[slot].map((entry) => entry.affixId));
    const poolStats = new Set<string>(EQUIPMENT_AFFIX_POOLS[slot].map((entry) => entry.stat));

    const affixes = rollEquipmentAffixes({ slot, rarity: "LEGENDARY", ilvl: 200, rng: constantRng(0.9) });
    const ids = affixes.map((affix) => affix.affixId);
    assert.equal(new Set(ids).size, ids.length, `${slot} affixes must be distinct`);

    for (const affix of affixes) {
      assert.ok(poolIds.has(affix.affixId), `${affix.affixId} must belong to the ${slot} pool`);
      assert.ok(poolStats.has(affix.stat), `${affix.stat} must be a ${slot} pool stat`);
      assert.notEqual(affix.stat, "power", "power is derived and never rolled");
      assert.ok(affix.value > 0, "affix value must be positive");
    }
  }
});

test("affix value scales with rarity and item level", () => {
  const slot: EquipmentSlot = "chest";
  const rng = () => 0.5; // mid jitter

  const lowIlvl = rollEquipmentAffixes({ slot, rarity: "LEGENDARY", ilvl: 10, rng });
  const highIlvl = rollEquipmentAffixes({ slot, rarity: "LEGENDARY", ilvl: 500, rng });
  assert.ok(
    highIlvl[0].value > lowIlvl[0].value,
    "higher ilvl should produce a larger affix value",
  );

  // Same archetype, Epic vs Legendary, identical ilvl -> Legendary potency is higher.
  assert.ok(AFFIX_RARITY_VALUE_MULTIPLIER.LEGENDARY > AFFIX_RARITY_VALUE_MULTIPLIER.EPIC);
  assert.ok(AFFIX_RARITY_VALUE_MULTIPLIER.EPIC > AFFIX_RARITY_VALUE_MULTIPLIER.RARE);
});

test("generation is deterministic and seed-sensitive for affixes", () => {
  const params = { slot: "chest" as const, itemLevel: 120, rarity: "LEGENDARY" as const, seed: "seed-A" };
  const a1 = generateEquipmentItem(params);
  const a2 = generateEquipmentItem(params);
  assert.deepEqual(a1.affixes, a2.affixes, "same seed must yield identical affixes");

  const b = generateEquipmentItem({ ...params, seed: "seed-B" });
  const differs =
    b.affixes.length !== a1.affixes.length ||
    b.affixes.some((affix, index) => {
      const other = a1.affixes[index];
      return !other || other.affixId !== affix.affixId || other.value !== affix.value;
    });
  assert.ok(differs, "different seeds should generally produce different affixes");
});

test("rolled affixes feed into item stats", () => {
  const item = generateEquipmentItem({ slot: "chest", itemLevel: 100, rarity: "LEGENDARY", seed: "stat-check" });
  assert.equal(item.affixes.length, 2);
  for (const affix of item.affixes) {
    const base = item.baseStats?.[affix.stat] ?? 0;
    const rolled = item.rolledStats[affix.stat] ?? 0;
    assert.ok(rolled >= base, `${affix.stat} rolled stat must include the affix contribution`);
  }
});
