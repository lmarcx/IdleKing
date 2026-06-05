import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultWalletState, getCurrencyBalance } from "../currencies/index.js";
import {
  FARM_RESOURCE_TABLE,
  MINE_RESOURCE_TABLE,
  generateFarmSpawns,
  generateMineBoard,
  validateFarmResourceTable,
  validateMineResourceTable,
} from "../minigames/index.js";
import {
  calculateResourceRewardBundleValue,
  grantCurrencyReward,
  grantResourceReward,
  grantRewardBundle,
} from "../rewards/index.js";
import { calculateResourceValue, getResourceDefinitionOrThrow } from "../resources/index.js";

test("Mine outputs are registered canonical resources and validate at boot", () => {
  assert.deepEqual(
    MINE_RESOURCE_TABLE.map(({ id }) => id),
    ["iron_ore", "quartz", "silver_ore", "cold_iron", "sapphire", "pale_diamond"],
  );
  assert.doesNotThrow(() => validateMineResourceTable());
  for (const output of MINE_RESOURCE_TABLE) {
    assert.equal(getResourceDefinitionOrThrow(output.id).id, output.id);
  }
});

test("Farm outputs are registered canonical resources and validate at boot", () => {
  assert.deepEqual(
    FARM_RESOURCE_TABLE.map(({ id }) => id),
    ["tomato", "carrot", "tough_meat"],
  );
  assert.doesNotThrow(() => validateFarmResourceTable());
  for (const output of FARM_RESOURCE_TABLE) {
    assert.equal(getResourceDefinitionOrThrow(output.id).id, output.id);
  }
});

test("Mine and Farm output rolls are deterministic for the same seed", () => {
  assert.deepEqual(
    generateMineBoard({ seed: 2026, floor: 100, size: 12 }),
    generateMineBoard({ seed: 2026, floor: 100, size: 12 }),
  );
  assert.deepEqual(
    generateFarmSpawns({ seed: 2026, wave: 4, count: 32 }),
    generateFarmSpawns({ seed: 2026, wave: 4, count: 32 }),
  );
});

test("resource rewards clamp at 999 and do not mutate their input", () => {
  const stock = { iron_ore: 998 };
  const rewarded = grantResourceReward(stock, { resourceId: "iron_ore", amount: 4 });

  assert.deepEqual(stock, { iron_ore: 998 });
  assert.deepEqual(rewarded, { iron_ore: 999 });
});

test("reward bundles keep resources and MVP currencies separated", () => {
  const state = {
    resources: { iron_ore: 2 },
    wallet: createDefaultWalletState(),
  };
  const rewarded = grantRewardBundle(state, {
    resources: [{ resourceId: "iron_ore", amount: 3 }],
    currencies: [
      { currencyId: "ECU", amount: 7 },
      { currencyId: "BOSS_TOKEN", amount: 2 },
    ],
  });

  assert.deepEqual(state.resources, { iron_ore: 2 });
  assert.deepEqual(rewarded.resources, { iron_ore: 5 });
  assert.equal(getCurrencyBalance(rewarded.wallet, "ECU"), 7);
  assert.equal(getCurrencyBalance(rewarded.wallet, "BOSS_TOKEN"), 2);
  assert.equal("ECU" in rewarded.resources, false);
  assert.equal("BOSS_TOKEN" in rewarded.resources, false);
});

test("reward helpers reject unknown resources, currencies, and special items", () => {
  assert.throws(
    () => grantResourceReward({}, { resourceId: "missing_resource", amount: 1 }),
    /Unknown MVP resource id/,
  );
  assert.throws(
    () => grantResourceReward({}, { resourceId: "fragment_du_temps", amount: 1 }),
    /Unknown MVP resource id/,
  );
  assert.throws(
    () => grantResourceReward({}, { resourceId: "kaleidoscope", amount: 1 }),
    /Unknown MVP resource id/,
  );
  assert.throws(
    () => grantCurrencyReward(createDefaultWalletState(), { currencyId: "DUEL_TOKEN", amount: 1 }),
    /Unknown MVP currency id/,
  );
  assert.throws(
    () => grantRewardBundle(
      { resources: {}, wallet: createDefaultWalletState() },
      { currencies: [{ currencyId: "ARENA_COIN", amount: 1 }] },
    ),
    /Unknown MVP currency id/,
  );
});

test("resource reward item_value uses Resource Registry values", () => {
  const rewards = [
    { resourceId: "iron_ore", amount: 2 },
    { resourceId: "sapphire", amount: 3 },
  ];
  assert.equal(
    calculateResourceRewardBundleValue(rewards),
    calculateResourceValue("iron_ore", 2) + calculateResourceValue("sapphire", 3),
  );
});
