import test from "node:test";
import assert from "node:assert/strict";

import { generateItem } from "../loot/itemGenerator.js";
import { getUpgradeCost, applyUpgrade } from "../loot/upgradeEngine.js";

test("generateItem is deterministic for same seed/params", () => {
  const a = generateItem({
    seed: 12345,
    worldLevel: 12,
    biome: "COSMIC_WRECK",
    ilvl: 240,
  });

  const b = generateItem({
    seed: 12345,
    worldLevel: 12,
    biome: "COSMIC_WRECK",
    ilvl: 240,
  });

  assert.deepEqual(a, b);
});

test("generateItem changes when seed changes", () => {
  const a = generateItem({
    seed: 111,
    worldLevel: 12,
    biome: "COSMIC_WRECK",
    ilvl: 240,
  });

  const b = generateItem({
    seed: 112,
    worldLevel: 12,
    biome: "COSMIC_WRECK",
    ilvl: 240,
  });

  // Not guaranteed every field differs, but id should.
  assert.notEqual(a.id, b.id);
});

test("upgrade increases itemPower and costs increase", () => {
  // Force a JEWELRY slot so the upgrade has a strong, reliable effect on power
  const item0 = generateItem({
    seed: 999,
    worldLevel: 45,
    biome: "VOLCANIC",
    ilvl: 900,
    biasSlot: "NECKLACE", // ✅ makes this test robust
  });

  const cost1 = getUpgradeCost(item0, 45);
  const item1 = applyUpgrade(item0, 45);
  const cost2 = getUpgradeCost(item1, 45);

  assert.equal(item1.upgradeLevel, item0.upgradeLevel + 1, "upgradeLevel should increment");

  // Safety: itemPower should usually increase. If rounding causes equality, that's a signal to tweak exponent/rounding later.
  assert.ok(
    item1.itemPower > item0.itemPower,
    `ItemPower should increase after upgrade (before=${item0.itemPower}, after=${item1.itemPower})`
  );

  assert.ok(cost2.kingamas > cost1.kingamas, "Upgrade kingamas cost should grow");
});
