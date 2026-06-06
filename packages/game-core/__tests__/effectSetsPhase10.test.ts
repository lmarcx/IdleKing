import assert from "node:assert/strict";
import test from "node:test";

import {
  EFFECT_SET_IDS,
  EFFECT_SET_REGISTRY,
  applyNarrativeEffectSetUnlock,
  calculateEffectSetModifiers,
  canSlotEffectSet,
  getEffectSetDefinition,
  hasUnlockedEffectSet,
  slotEffectSet,
  unlockEffectSet,
  validateEffectSetRegistry,
  type EffectSetDefinition,
  type EffectSetId,
  type SimpleEffect,
} from "../effectSets/index.js";
import {
  calculateResonanceFromEquipment,
  RESONANCE_ELIGIBLE_SLOTS,
} from "../resonance/index.js";
import { createDefaultPlayerEquipmentState } from "../equipment/index.js";
import { createInitialGameState } from "../game/state.js";
import { completeDungeon } from "../story/progressionMvp.js";
import type { EquipmentItem, EquipmentSlot, ItemRarity } from "../items/types.js";

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

function resonanceTotalForNineSlots(rarity: ItemRarity): number {
  const equipment = createDefaultPlayerEquipmentState();
  const items = RESONANCE_ELIGIBLE_SLOTS.map((slot) => equipmentItem(slot, rarity));
  for (const item of items) equipment.equipped[item.slot] = item.id;
  return calculateResonanceFromEquipment(equipment, items).totalResonance;
}

function unlockMany(ids: readonly EffectSetId[]) {
  return ids.reduce((state, effectSetId) => unlockEffectSet(state, effectSetId), createInitialGameState());
}

test("Effect Set registry contains exactly the five MVP sets and no future set", () => {
  assert.deepEqual(EFFECT_SET_REGISTRY.map((effectSet) => effectSet.id), [
    "shadow_veil",
    "lordflame",
    "motherstone",
    "kingfrost",
    "rainmaker",
  ]);
  assert.deepEqual(EFFECT_SET_IDS, [
    "shadow_veil",
    "lordflame",
    "motherstone",
    "kingfrost",
    "rainmaker",
  ]);
  assert.doesNotThrow(() => validateEffectSetRegistry());
  assert.equal(EFFECT_SET_REGISTRY.some((effectSet) => String(effectSet.id).includes("future")), false);
});

test("Effect Set narrative sources match the MVP story beats", () => {
  assert.equal(getEffectSetDefinition("shadow_veil")?.source.id, "dark_amalgam");
  assert.equal(getEffectSetDefinition("lordflame")?.source.id, "dragon_shadow");
  assert.equal(getEffectSetDefinition("motherstone")?.source.id, "frozen_river_cleared");
  assert.equal(getEffectSetDefinition("kingfrost")?.source.id, "corrupted_archmage");
  assert.equal(getEffectSetDefinition("rainmaker")?.source.id, "fallen_rain_lord");
});

test("unlockEffectSet adds an id once and does not mutate the input", () => {
  const state = createInitialGameState();
  const unlocked = unlockEffectSet(state, "shadow_veil");
  const unlockedAgain = unlockEffectSet(unlocked, "shadow_veil");

  assert.equal(state.effectSets.unlockedEffectSetIds.length, 0);
  assert.deepEqual(unlocked.effectSets.unlockedEffectSetIds, ["shadow_veil"]);
  assert.deepEqual(unlockedAgain.effectSets.unlockedEffectSetIds, ["shadow_veil"]);
});

test("slotting is impossible before narrative unlock", () => {
  const result = slotEffectSet(createInitialGameState(), "shadow_veil", 1, { totalResonance: 9 });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "EFFECT_SET_LOCKED");
});

test("slotting is possible when unlocked and enough Effect Slots are available", () => {
  const state = unlockEffectSet(createInitialGameState(), "shadow_veil");
  const result = slotEffectSet(state, "shadow_veil", 1, { totalResonance: resonanceTotalForNineSlots("UNCOMMON") });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.state.effectSets.slottedEffects, [{ effectSetId: "shadow_veil", tier: 1 }]);
});

test("slotting cannot exceed Effect Slots from Resonance", () => {
  let state = unlockMany(["shadow_veil", "lordflame"]);
  const first = slotEffectSet(state, "shadow_veil", 1, { totalResonance: resonanceTotalForNineSlots("UNCOMMON") });
  assert.equal(first.ok, true);
  if (!first.ok) return;
  state = first.state;

  assert.equal(canSlotEffectSet(state, "lordflame", 1, { totalResonance: 9 }), false);
  const second = slotEffectSet(state, "lordflame", 1, { totalResonance: 9 });
  assert.equal(second.ok, false);
  if (second.ok) return;
  assert.equal(second.reason, "NO_EFFECT_SLOT_AVAILABLE");
});

test("nine Uncommon grants one Effect Slot and nine Epic grants three", () => {
  assert.equal(resonanceTotalForNineSlots("UNCOMMON"), 9);
  assert.equal(resonanceTotalForNineSlots("EPIC"), 27);

  let state = unlockMany(["shadow_veil", "lordflame", "motherstone"]);
  for (const effectSetId of ["shadow_veil", "lordflame", "motherstone"] as const) {
    const result = slotEffectSet(state, effectSetId, 1, { totalResonance: resonanceTotalForNineSlots("EPIC") });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    state = result.state;
  }

  assert.equal(state.effectSets.slottedEffects.length, 3);
});

test("unknown Effect Set tiers are rejected", () => {
  const state = unlockEffectSet(createInitialGameState(), "shadow_veil");
  const result = slotEffectSet(state, "shadow_veil", 99, { totalResonance: 9 });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "TIER_NOT_FOUND");
});

test("calculateEffectSetModifiers returns simple stats, statuses, and tags only", () => {
  const modifiers = calculateEffectSetModifiers([
    { effectSetId: "shadow_veil", tier: 3 },
    { effectSetId: "lordflame", tier: 2 },
    { effectSetId: "motherstone", tier: 3 },
    { effectSetId: "kingfrost", tier: 2 },
    { effectSetId: "rainmaker", tier: 3 },
  ]);

  assert.ok(modifiers.statModifiers.critChance > 0);
  assert.ok(modifiers.statModifiers.defense > 0);
  assert.ok(modifiers.statModifiers.manaRegen > 0);
  assert.ok((modifiers.statusModifiers.burn?.applicationChance ?? 0) > 0);
  assert.ok((modifiers.statusModifiers.frozen?.damageBonus ?? 0) > 0);
  assert.ok((modifiers.statusModifiers.drench?.damageBonus ?? 0) > 0);
  assert.equal(Object.keys(modifiers).sort().join(","), "combatTags,statModifiers,statusModifiers");
});

test("Effect Set registry contains no forbidden proc-style effects", () => {
  const forbidden = /shadow_clone|ice_nova|tidal_wave|explosion|orbital|proc/i;
  for (const definition of EFFECT_SET_REGISTRY) {
    for (const tier of definition.tiers) {
      for (const effect of tier.effects) {
        assert.equal(forbidden.test(JSON.stringify(effect)), false);
        assert.ok(["stat", "status_application", "bonus_vs_status"].includes(effect.type));
      }
    }
  }

  assert.throws(
    () => validateEffectSetRegistry([
      ...EFFECT_SET_REGISTRY.slice(0, 4),
      {
        ...EFFECT_SET_REGISTRY[4],
        tiers: [{ tier: 1, effects: [{ type: "shadow_clone", stat: "critChance", value: 1 } as unknown as SimpleEffect] }],
      } as EffectSetDefinition,
    ]),
    /Forbidden Effect Set effect type/
  );
});

test("narrative unlock helper maps MVP boss and story events", () => {
  let state = createInitialGameState();
  state = applyNarrativeEffectSetUnlock(state, "dark_amalgam");
  state = applyNarrativeEffectSetUnlock(state, "dragon_shadow");
  state = applyNarrativeEffectSetUnlock(state, "frozen_river_cleared");
  state = applyNarrativeEffectSetUnlock(state, "corrupted_archmage");
  state = applyNarrativeEffectSetUnlock(state, "fallen_rain_lord");

  assert.deepEqual(state.effectSets.unlockedEffectSetIds, [
    "shadow_veil",
    "lordflame",
    "motherstone",
    "kingfrost",
    "rainmaker",
  ]);
});

test("story first clears unlock their narrative Effect Sets", () => {
  let state = createInitialGameState();
  const prologue = completeDungeon(state, "prologue_wastelands");
  assert.equal(prologue.ok, true);
  if (!prologue.ok) return;
  assert.equal(hasUnlockedEffectSet(prologue.next, "shadow_veil"), true);

  state = completeDungeon(prologue.next, "funeral_mausoleum").next;
  const dragon = completeDungeon(state, "ashen_peak");
  assert.equal(dragon.ok, true);
  if (!dragon.ok) return;
  assert.equal(hasUnlockedEffectSet(dragon.next, "lordflame"), true);
});

test("Resonance totals and Effect Slots are not stored in state", () => {
  const state = createInitialGameState() as unknown as Record<string, unknown>;
  const serialized = JSON.stringify(state);

  assert.equal(serialized.includes("totalResonance"), false);
  assert.equal(serialized.includes("effectSlots"), false);
  assert.equal("resonance" in state, false);
});
