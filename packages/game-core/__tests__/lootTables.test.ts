import test from "node:test";
import assert from "node:assert/strict";

import { generateExpeditionLoot } from "../loot/lootTables.js";

test("WIN gives at least 1 item and resources", () => {
  const out = generateExpeditionLoot({
    seed: 1,
    worldLevel: 12,
    biome: "COSMIC_WRECK",
    result: "WIN",
    secondItemChance: 0, // deterministic: only 1
  });

  assert.equal(out.items.length, 1);
  assert.ok(out.resources.length > 0);
});

test("LOSE gives no items but resources consolation", () => {
  const out = generateExpeditionLoot({
    seed: 1,
    worldLevel: 12,
    biome: "COSMIC_WRECK",
    result: "LOSE",
  });

  assert.equal(out.items.length, 0);
  assert.ok(out.resources.length > 0);
});

test("legacy lost slot bias is accepted but ignored by random MVP loot", () => {
  const a = generateExpeditionLoot({
    seed: 999,
    worldLevel: 20,
    biome: "VOLCANIC",
    result: "WIN",
    lostSlotBias: "STONE",
    secondItemChance: 0,
  });

  const b = generateExpeditionLoot({
    seed: 999,
    worldLevel: 20,
    biome: "VOLCANIC",
    result: "WIN",
    lostSlotBias: "NECKLACE",
    secondItemChance: 0,
  });

  assert.deepEqual(a, b);
});
