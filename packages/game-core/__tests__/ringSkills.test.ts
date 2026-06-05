import assert from "node:assert/strict";
import test from "node:test";

import { computeSkillDamage, createCombatRuntimeState } from "../combat/runtime/index.js";
import {
  MAX_EQUIPPED_RINGS,
  RINGS_SKILLS_MAP,
  RING_CONTRIBUTES_TO_RESONANCE,
  calculateRingSkillScaling,
  canEquipRing,
  equipRing,
  equipRingItem,
  generateEquipmentItem,
  getEquippedRingItems,
  getEquippedRingSkills,
  normalizePlayerEquipmentState,
  validateEquippedRings,
  validateRingsSkillsMap,
  type RingEquipmentInstance,
} from "../equipment/index.js";
import { createInitialGameState } from "../game/state.js";
import { normalizeEquipmentItem, type EquipmentAffix, type EquipmentItem } from "../items/types.js";
import { castRingSkill, SKILL_IDS } from "../skills/index.js";

function ring(
  skillId: (typeof SKILL_IDS)[number] | null,
  overrides: Partial<EquipmentItem> = {}
): RingEquipmentInstance & EquipmentItem {
  const affixes = overrides.affixes ?? [];
  return {
    affixes,
    baseItemId: overrides.baseItemId ?? `ring-${skillId ?? "legacy"}`,
    id: overrides.id ?? `ring-${skillId ?? "legacy"}`,
    ilvl: overrides.ilvl ?? 1,
    instanceId: overrides.instanceId ?? `ring-${skillId ?? "legacy"}`,
    kind: "equipment",
    name: overrides.name ?? `Ring ${skillId ?? "legacy"}`,
    rarity: overrides.rarity ?? "COMMON",
    rolledStats: overrides.rolledStats ?? {},
    skillId,
    slot: "ring",
    stats: overrides.stats ?? {},
    upgradeLevel: overrides.upgradeLevel ?? 0,
  };
}

function runtimeState() {
  return createCombatRuntimeState({
    player: {
      hpMax: 100,
      manaMax: 100,
      staminaMax: 100,
      manaRegenPerSecond: 5,
      staminaRegenPerSecond: 10,
      attack: 20,
    },
    enemy: { hpMax: 100 },
  });
}

test("named ring mapping references only canonical MVP skills", () => {
  assert.deepEqual(RINGS_SKILLS_MAP, {
    "Royal Beam Ring": "SK-004",
    "King Aura Ring": "SK-013",
    "War Cry Ring": "SK-012",
    "Frost Ritual Ring": "SK-003",
    "Spectral Ring": "SK-015",
  });
  assert.doesNotThrow(() => validateRingsSkillsMap());
  for (const skillId of Object.values(RINGS_SKILLS_MAP)) {
    assert.ok(SKILL_IDS.includes(skillId));
  }
  assert.throws(
    () => validateRingsSkillsMap({ "Broken Ring": "SK-999" }),
    /Unknown MVP skill id/
  );
});

test("generated named rings receive their mapped skill and random rings always receive a skill", () => {
  for (const [name, skillId] of Object.entries(RINGS_SKILLS_MAP)) {
    assert.equal(generateEquipmentItem({ slot: "ring", itemLevel: 1, name, seed: name }).skillId, skillId);
  }

  assert.ok(SKILL_IDS.includes(generateEquipmentItem({ slot: "ring", itemLevel: 1, seed: "random-ring" }).skillId!));
});

test("ring normalization accepts canonical skills, rejects unknown skills, and keeps explicit legacy null", () => {
  assert.equal(normalizeEquipmentItem(ring("SK-001"))?.skillId, "SK-001");
  assert.equal(normalizeEquipmentItem(ring(null))?.skillId, null);
  assert.equal(
    normalizeEquipmentItem({ ...ring("SK-001"), skillId: "SK-999" }),
    null
  );
  assert.throws(
    () => generateEquipmentItem({ slot: "ring", itemLevel: 1, skillId: "SK-999" }),
    /Unknown MVP ring skillId/
  );
});

test("five ring slots reject duplicate skills, a sixth ring, and invalid slot indexes", () => {
  const rings = SKILL_IDS.slice(0, MAX_EQUIPPED_RINGS).map((skillId) => ring(skillId));
  assert.equal(validateEquippedRings(rings), true);
  assert.equal(canEquipRing(rings.slice(0, 4), rings[4]), true);
  assert.equal(canEquipRing(rings, ring("SK-006")), false);
  assert.equal(validateEquippedRings([...rings, ring("SK-006")]), false);
  assert.equal(validateEquippedRings([ring("SK-001"), ring("SK-001")]), false);
  assert.equal(canEquipRing([ring("SK-001")], ring("SK-001")), false);
  assert.throws(() => equipRing([], ring("SK-001"), -1), /between 0 and 4/);
  assert.throws(() => equipRing([], ring("SK-001"), 5), /between 0 and 4/);
  assert.throws(() => equipRing([ring("SK-001")], ring("SK-001"), 1), /already equipped/);
  assert.throws(() => equipRing([], ring(null), 0), /known MVP skillId/);
});

test("getEquippedRingSkills returns the five expected skills", () => {
  const equipped = SKILL_IDS.slice(0, 5).reduce(
    (slots, skillId, slotIndex) => equipRing(slots, ring(skillId), slotIndex),
    [] as ReturnType<typeof equipRing>
  );

  assert.deepEqual(getEquippedRingSkills(equipped), SKILL_IDS.slice(0, 5));
});

test("player equipment stores five ring refs and blocks duplicate equipped skills", () => {
  const first = generateEquipmentItem({ slot: "ring", itemLevel: 10, id: "ring-1", skillId: "SK-001" });
  const duplicate = generateEquipmentItem({ slot: "ring", itemLevel: 20, id: "ring-2", skillId: "SK-001" });
  const state = {
    ...createInitialGameState(),
    inventory: { items: [first, duplicate] },
  };

  const equipped = equipRingItem(state, first.id, 0);
  assert.equal(equipped.ok, true);
  if (!equipped.ok) return;
  assert.deepEqual(equipped.state.equipment.equipped.rings, [first.id, null, null, null, null]);
  assert.deepEqual(getEquippedRingItems(equipped.state).map((item) => item?.instanceId ?? null), [first.id, null, null, null, null]);

  const rejected = equipRingItem(equipped.state, duplicate.id, 1);
  assert.equal(rejected.ok, false);
  if (rejected.ok) return;
  assert.equal(rejected.reason, "RING_SKILL_ALREADY_EQUIPPED");
});

test("legacy single ring slot migrates into the first five-ring slot", () => {
  const equipment = normalizePlayerEquipmentState({ equipped: { ring: "legacy-ring" } });

  assert.equal(equipment.equipped.ring, null);
  assert.deepEqual(equipment.equipped.rings, ["legacy-ring", null, null, null, null]);
});

test("ring skill scaling increases with rarity, ilvl, upgrade level, and placeholder affixes", () => {
  const base = ring("SK-001");
  const affix: EquipmentAffix = { affixId: "placeholder_might", stat: "attack", value: 3 };

  assert.ok(calculateRingSkillScaling({ ...base, rarity: "LEGENDARY" }) > calculateRingSkillScaling(base));
  assert.ok(calculateRingSkillScaling({ ...base, ilvl: 10 }) > calculateRingSkillScaling(base));
  assert.ok(calculateRingSkillScaling({ ...base, upgradeLevel: 2 }) > calculateRingSkillScaling(base));
  assert.ok(calculateRingSkillScaling({ ...base, affixes: [affix] }) > calculateRingSkillScaling(base));
});

test("ring skill scaling ignores player progression, POWER, artifacts, and retired skill progression fields", () => {
  const base = ring("SK-001", { ilvl: 20, rarity: "RARE", upgradeLevel: 3 });
  const expected = calculateRingSkillScaling(base);
  const withStrayFields = calculateRingSkillScaling({
    ...base,
    playerLevel: 50,
    skillLevel: 10,
    skillPoints: 999,
    power: 999_999,
    artifact: { power: 999_999 },
  } as unknown as Parameters<typeof calculateRingSkillScaling>[0]);

  assert.equal(withStrayFields, expected);
});

test("ring-aware cast supplies scaling to computeSkillDamage", () => {
  const equippedRing = ring("SK-001", { ilvl: 20, rarity: "RARE", upgradeLevel: 3 });
  const result = castRingSkill(runtimeState(), equippedRing, { nowMs: 1_000 });

  assert.equal(result.success, true);
  if (!result.success || !result.damageInput) return;
  assert.equal(result.damageInput.ringSkillScaling, calculateRingSkillScaling(equippedRing));

  const unscaled = computeSkillDamage({ attack: 20, skillDamageMultiplier: result.damageInput.skillDamageMultiplier });
  const scaled = computeSkillDamage({ attack: 20, ...result.damageInput });
  assert.ok(scaled.damage > unscaled.damage);
});

test("rings stay explicitly excluded from future Resonance", () => {
  assert.equal(RING_CONTRIBUTES_TO_RESONANCE, false);
});
