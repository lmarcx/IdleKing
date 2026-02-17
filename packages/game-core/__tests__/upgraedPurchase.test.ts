import test from "node:test";
import assert from "node:assert/strict";

import { generateItem } from "../loot/itemGenerator.js";
import { createWallet } from "../economy/kingamas.js";
import { tryUpgradeItem } from "../economy/upgradePurchase.js";

test("tryUpgradeItem fails if insufficient kingamas", () => {
  const item = generateItem({
    seed: 1,
    worldLevel: 45,
    biome: "VOLCANIC",
    ilvl: 900,
    biasSlot: "NECKLACE",
  });

  const out = tryUpgradeItem({
    item,
    worldLevel: 45,
    wallet: createWallet(0),
    materials: { [`mat_${item.element.toLowerCase()}_t5`]: 999 },
  });

  assert.equal(out.ok, false);
  assert.equal(out.reason, "INSUFFICIENT_KINGAMAS");
});

test("tryUpgradeItem succeeds when kingamas + materials are available", () => {
  const item0 = generateItem({
    seed: 2,
    worldLevel: 45,
    biome: "VOLCANIC",
    ilvl: 900,
    biasSlot: "NECKLACE",
  });

  const matKey = `mat_${item0.element.toLowerCase()}_t5`;

  const out = tryUpgradeItem({
    item: item0,
    worldLevel: 45,
    wallet: createWallet(999),
    materials: { [matKey]: 999 },
  });

  assert.equal(out.ok, true);
  if (!out.ok) return;

  assert.ok(out.item.itemPower >= item0.itemPower);
  assert.ok(out.wallet.balance < 999);
});
