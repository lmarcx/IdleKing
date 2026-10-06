import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import {
  claimCornucopiaCurrency,
  claimCornucopiaEffectSet,
  claimCornucopiaEquipment,
  claimCornucopiaEra,
  claimCornucopiaSpecialItem,
  claimCornucopiaUnlock,
  getCornucopiaCurrencyClaimables,
  getCornucopiaEffectSetClaimables,
  getCornucopiaEquipmentRarityOptions,
  getCornucopiaEquipmentSetOptions,
  getCornucopiaEquipmentSlotOptions,
  getCornucopiaEraClaimables,
  getCornucopiaRingSkillOptions,
  getCornucopiaSpecialItemClaimables,
  getCornucopiaUnlockClaimables,
} from "../building/cornucopiaDevActions.js";
import { CURRENCIES, getCurrencyBalance } from "../currencies/index.js";
import { EQUIPMENT_SETS } from "../equipment/sets.js";
import { EQUIPMENT_SLOTS, ITEM_RARITIES } from "../items/types.js";
import { SKILL_IDS } from "../skills/types.js";
import { ERA_REGISTRY } from "../specialItems/index.js";
import { EFFECT_SET_IDS } from "../effectSets/index.js";

// ---------------------------------------------------------------------------
// Currencies
// ---------------------------------------------------------------------------

test("cornucopia currency claimables match the MVP currency registry", () => {
  assert.deepEqual(getCornucopiaCurrencyClaimables(), CURRENCIES.map((c) => c.id));
});

test("cornucopia currency claim grants the requested amount to the wallet", () => {
  const state = createInitialGameState();
  const result = claimCornucopiaCurrency(state, { currencyId: "ECU", amount: 250 });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.amount, 250);
  assert.equal(getCurrencyBalance(result.next.wallet, "ECU"), 250);
});

test("cornucopia currency claim rejects invalid amount and unknown currency", () => {
  const state = createInitialGameState();

  const invalidAmount = claimCornucopiaCurrency(state, { currencyId: "ECU", amount: 0 });
  assert.equal(invalidAmount.ok, false);
  if (!invalidAmount.ok) assert.equal(invalidAmount.error, "INVALID_AMOUNT");

  const invalidCurrency = claimCornucopiaCurrency(state, { currencyId: "NOT_A_CURRENCY" as never, amount: 10 });
  assert.equal(invalidCurrency.ok, false);
  if (!invalidCurrency.ok) assert.equal(invalidCurrency.error, "INVALID_CURRENCY");
});

// ---------------------------------------------------------------------------
// Equipment / Rings
// ---------------------------------------------------------------------------

test("cornucopia equipment options are read from the real registries", () => {
  assert.deepEqual(getCornucopiaEquipmentSlotOptions(), [...EQUIPMENT_SLOTS]);
  assert.deepEqual(getCornucopiaEquipmentRarityOptions(), [...ITEM_RARITIES]);
  assert.deepEqual(getCornucopiaRingSkillOptions(), [...SKILL_IDS]);

  const setOptions = getCornucopiaEquipmentSetOptions();
  assert.ok(setOptions.length > 0);
  for (const setId of setOptions) {
    const definition = EQUIPMENT_SETS.find((set) => set.id === setId);
    assert.equal(definition?.status, "active");
  }
});

test("cornucopia equipment claim generates an item and adds it to inventory", () => {
  const state = createInitialGameState();
  const before = state.inventory.items.length;

  const result = claimCornucopiaEquipment(state, {
    slot: "chest",
    rarity: "EPIC",
    itemLevel: 50,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.next.inventory.items.length, before + 1);
  assert.equal(result.item.slot, "chest");
  assert.equal(result.item.rarity, "EPIC");
  assert.equal(result.item.ilvl, 50);
  assert.ok(result.next.inventory.items.some((item) => item.id === result.item.id));
});

test("cornucopia equipment claim for a ring honors the requested skill", () => {
  const state = createInitialGameState();
  const result = claimCornucopiaEquipment(state, { slot: "ring", skillId: "SK-004" });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.item.slot, "ring");
  assert.equal(result.item.skillId, "SK-004");
});

test("cornucopia equipment claim generates unique ids when the same request is repeated", () => {
  const state = createInitialGameState();
  const before = state.inventory.items.length;

  const first = claimCornucopiaEquipment(state, { slot: "chest", rarity: "COMMON", itemLevel: 1 });
  assert.equal(first.ok, true);
  if (!first.ok) return;

  const second = claimCornucopiaEquipment(first.next, { slot: "chest", rarity: "COMMON", itemLevel: 1 });
  assert.equal(second.ok, true);
  if (!second.ok) return;

  assert.notEqual(first.item.id, second.item.id);
  assert.notEqual(first.item.instanceId, second.item.instanceId);
  assert.equal(second.next.inventory.items.length, before + 2);
  const ids = second.next.inventory.items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("cornucopia equipment claim generates unique ids for two rings with the same ilvl/rarity but different skills", () => {
  const state = createInitialGameState();
  const before = state.inventory.items.length;

  const first = claimCornucopiaEquipment(state, { slot: "ring", rarity: "RARE", itemLevel: 10, skillId: "SK-001" });
  assert.equal(first.ok, true);
  if (!first.ok) return;

  const second = claimCornucopiaEquipment(first.next, { slot: "ring", rarity: "RARE", itemLevel: 10, skillId: "SK-002" });
  assert.equal(second.ok, true);
  if (!second.ok) return;

  assert.notEqual(first.item.id, second.item.id);
  assert.equal(first.item.skillId, "SK-001");
  assert.equal(second.item.skillId, "SK-002");
  assert.equal(second.next.inventory.items.length, before + 2);
  const ids = second.next.inventory.items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("cornucopia equipment claim rejects invalid slot, rarity, item level, skill, and set", () => {
  const state = createInitialGameState();

  const invalidSlot = claimCornucopiaEquipment(state, { slot: "not_a_slot" as never });
  assert.equal(invalidSlot.ok, false);
  if (!invalidSlot.ok) assert.equal(invalidSlot.error, "INVALID_SLOT");

  const invalidRarity = claimCornucopiaEquipment(state, { slot: "chest", rarity: "MYTHIC" as never });
  assert.equal(invalidRarity.ok, false);
  if (!invalidRarity.ok) assert.equal(invalidRarity.error, "INVALID_RARITY");

  const invalidItemLevel = claimCornucopiaEquipment(state, { slot: "chest", itemLevel: 0 });
  assert.equal(invalidItemLevel.ok, false);
  if (!invalidItemLevel.ok) assert.equal(invalidItemLevel.error, "INVALID_ITEM_LEVEL");

  const invalidSkill = claimCornucopiaEquipment(state, { slot: "ring", skillId: "SK-999" as never });
  assert.equal(invalidSkill.ok, false);
  if (!invalidSkill.ok) assert.equal(invalidSkill.error, "INVALID_SKILL");

  const invalidSet = claimCornucopiaEquipment(state, { slot: "chest", setId: "not_a_set" as never });
  assert.equal(invalidSet.ok, false);
  if (!invalidSet.ok) assert.equal(invalidSet.error, "INVALID_SET");
});

// ---------------------------------------------------------------------------
// Special Items
// ---------------------------------------------------------------------------

test("cornucopia special item claimables are the closed MVP set", () => {
  assert.deepEqual(getCornucopiaSpecialItemClaimables(), ["KALEIDOSCOPE", "DROP_OF_DARKNESS", "FRAGMENT_DU_TEMPS"]);
});

test("cornucopia special item claim grants kaleidoscope, drop of darkness, and fragment du temps", () => {
  const state = createInitialGameState();

  const kaleidoscope = claimCornucopiaSpecialItem(state, { specialItemId: "KALEIDOSCOPE" });
  assert.equal(kaleidoscope.ok, true);
  if (kaleidoscope.ok) assert.equal(kaleidoscope.next.specialItems.kaleidoscopeOwned, true);

  const dropOfDarkness = claimCornucopiaSpecialItem(state, { specialItemId: "DROP_OF_DARKNESS" });
  assert.equal(dropOfDarkness.ok, true);
  if (dropOfDarkness.ok) assert.equal(dropOfDarkness.next.specialItems.dropOfDarknessOwned, true);

  const fragment = claimCornucopiaSpecialItem(state, { specialItemId: "FRAGMENT_DU_TEMPS", amount: 3 });
  assert.equal(fragment.ok, true);
  if (fragment.ok) {
    assert.equal(fragment.amount, 3);
    assert.equal(fragment.next.specialItems.fragmentDuTemps, 3);
  }
});

test("cornucopia special item claim rejects unknown id and invalid fragment amount", () => {
  const state = createInitialGameState();

  const invalidId = claimCornucopiaSpecialItem(state, { specialItemId: "NOT_A_SPECIAL_ITEM" as never });
  assert.equal(invalidId.ok, false);
  if (!invalidId.ok) assert.equal(invalidId.error, "INVALID_SPECIAL_ITEM");

  const invalidAmount = claimCornucopiaSpecialItem(state, { specialItemId: "FRAGMENT_DU_TEMPS", amount: 0 });
  assert.equal(invalidAmount.ok, false);
  if (!invalidAmount.ok) assert.equal(invalidAmount.error, "INVALID_AMOUNT");
});

// ---------------------------------------------------------------------------
// Unlocks — building/story
// ---------------------------------------------------------------------------

test("cornucopia unlock claim adds the id to story.unlocked and flips canonical building state", () => {
  const state = createInitialGameState();
  assert.equal(state.buildings.forge.unlocked, false);

  const result = claimCornucopiaUnlock(state, { unlockId: "FORGE" });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.next.story.unlocked.has("FORGE"));
  assert.equal(result.next.buildings.forge.unlocked, true);
});

test("cornucopia unlock claim rejects an id outside the curated list", () => {
  const state = createInitialGameState();
  const result = claimCornucopiaUnlock(state, { unlockId: "NOT_A_REAL_UNLOCK" });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "INVALID_UNLOCK");
});

// ---------------------------------------------------------------------------
// Unlocks — Time Gate eras
// ---------------------------------------------------------------------------

test("cornucopia era claimables exclude non-playable teaser eras", () => {
  const claimables = getCornucopiaEraClaimables();
  const playableIds = ERA_REGISTRY.filter((era) => era.playable).map((era) => era.id);

  assert.deepEqual(claimables, playableIds);
  assert.equal(claimables.includes("era_deluge"), false);
});

test("cornucopia era claim delegates to the real Time Gate prerequisites", () => {
  const state = createInitialGameState();

  const result = claimCornucopiaEra(state, { eraId: "era_glaciaire" });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "TIME_GATE_NOT_BUILT");
});

// ---------------------------------------------------------------------------
// Unlocks — Effect Sets
// ---------------------------------------------------------------------------

test("cornucopia effect set claimables match the effect set registry", () => {
  assert.deepEqual(getCornucopiaEffectSetClaimables(), [...EFFECT_SET_IDS]);
});

test("cornucopia effect set claim unlocks the requested effect set", () => {
  const state = createInitialGameState();
  const result = claimCornucopiaEffectSet(state, { effectSetId: "shadow_veil" });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.next.effectSets.unlockedEffectSetIds.includes("shadow_veil"));
});

test("cornucopia effect set claim rejects an unknown id", () => {
  const state = createInitialGameState();
  const result = claimCornucopiaEffectSet(state, { effectSetId: "not_a_real_effect_set" as never });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "INVALID_EFFECT_SET");
});
