import type { EquipmentInstance, ItemRarity } from "../items/types.js";
import { getSkillDefinition } from "../skills/registry.js";
import { isSkillId, SKILL_IDS, type SkillId } from "../skills/types.js";

export const MAX_EQUIPPED_RINGS = 5;

export type RingEquipmentInstance = EquipmentInstance & {
  slot: "ring";
  /**
   * Legacy saves may contain rings without a skill. They remain loadable, but
   * the MVP ring equipment path rejects them until they are replaced.
   */
  skillId: SkillId | null;
};

export type SkillBearingRingEquipmentInstance = RingEquipmentInstance & {
  skillId: SkillId;
};

export type EquippedRings = readonly (RingEquipmentInstance | null)[];

export type EquippedRingIds = [
  string | null,
  string | null,
  string | null,
  string | null,
  string | null,
];

export const RINGS_SKILLS_MAP = {
  "Royal Beam Ring": "SK-004",
  "King Aura Ring": "SK-013",
  "War Cry Ring": "SK-012",
  "Frost Ritual Ring": "SK-003",
  "Spectral Ring": "SK-015",
} as const satisfies Readonly<Record<string, SkillId>>;

/**
 * Phase 9 Resonance is not implemented yet. Keep this locked exclusion visible
 * beside the ring model so the future Resonance implementation cannot count rings.
 */
export const RING_CONTRIBUTES_TO_RESONANCE = false;

export const RING_SKILL_SCALING_PLACEHOLDERS = {
  rarityMultiplier: {
    COMMON: 1,
    UNCOMMON: 1.08,
    RARE: 1.2,
    EPIC: 1.38,
    LEGENDARY: 1.65,
  } satisfies Readonly<Record<ItemRarity, number>>,
  ilvlMultiplierPerLevel: 0.01,
  upgradeMultiplierPerLevel: 0.05,
  affixMultiplierPerPoint: 0.01,
} as const;

export function createEmptyEquippedRingIds(): EquippedRingIds {
  return [null, null, null, null, null];
}

export function validateRingsSkillsMap(
  map: Readonly<Record<string, string>> = RINGS_SKILLS_MAP
): void {
  for (const [ringName, skillId] of Object.entries(map)) {
    if (!isSkillId(skillId) || !getSkillDefinition(skillId)) {
      throw new Error(`Unknown MVP skill id for ${ringName}: ${skillId}`);
    }
  }
}

export function isSkillBearingRing(
  ring: Pick<EquipmentInstance, "skillId" | "slot">
): ring is SkillBearingRingEquipmentInstance {
  return ring.slot === "ring" && isSkillId(ring.skillId) && Boolean(getSkillDefinition(ring.skillId));
}

export function getEquippedRingSkills(equipped: EquippedRings): SkillId[] {
  if (!validateEquippedRings(equipped)) {
    throw new Error("Invalid equipped rings");
  }

  return equipped.flatMap((ring) => (ring && isSkillBearingRing(ring) ? [ring.skillId] : []));
}

export function validateEquippedRings(equipped: EquippedRings): boolean {
  if (equipped.length > MAX_EQUIPPED_RINGS) return false;

  const skillIds = new Set<SkillId>();
  for (const ring of equipped) {
    if (!ring) continue;
    if (!isSkillBearingRing(ring)) return false;
    if (skillIds.has(ring.skillId)) return false;
    skillIds.add(ring.skillId);
  }

  return true;
}

export function canEquipRing(equipped: EquippedRings, ring: EquipmentInstance): boolean {
  if (!isSkillBearingRing(ring) || !validateEquippedRings(equipped)) return false;
  if (equipped.filter(Boolean).length >= MAX_EQUIPPED_RINGS) return false;
  return !getEquippedRingSkills(equipped).includes(ring.skillId);
}

export function equipRing(
  equipped: EquippedRings,
  ring: EquipmentInstance,
  slotIndex: number
): EquippedRings {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= MAX_EQUIPPED_RINGS) {
    throw new RangeError(`Ring slot index must be between 0 and ${MAX_EQUIPPED_RINGS - 1}`);
  }
  if (!isSkillBearingRing(ring)) {
    throw new Error("Ring must carry a known MVP skillId");
  }
  if (!validateEquippedRings(equipped)) {
    throw new Error("Invalid equipped rings");
  }

  const slots = normalizeEquippedRingSlots(equipped);
  const duplicate = slots.some(
    (equippedRing, index) => index !== slotIndex && equippedRing?.skillId === ring.skillId
  );
  if (duplicate) {
    throw new Error(`Skill already equipped by another ring: ${ring.skillId}`);
  }

  slots[slotIndex] = ring;
  return slots;
}

export function calculateRingSkillScaling(
  ring: Pick<EquipmentInstance, "affixes" | "ilvl" | "rarity" | "slot" | "upgradeLevel">
): number {
  if (ring.slot !== "ring") {
    throw new Error("Ring skill scaling requires a ring");
  }

  const ilvl = normalizePositiveInteger(ring.ilvl, 1);
  const upgradeLevel = normalizePositiveInteger(ring.upgradeLevel, 0);
  const affixTotal = ring.affixes.reduce(
    (total, affix) => total + normalizePositiveNumber(affix.value),
    0
  );
  const qualityMultiplier =
    1 +
    (ilvl - 1) * RING_SKILL_SCALING_PLACEHOLDERS.ilvlMultiplierPerLevel +
    upgradeLevel * RING_SKILL_SCALING_PLACEHOLDERS.upgradeMultiplierPerLevel +
    affixTotal * RING_SKILL_SCALING_PLACEHOLDERS.affixMultiplierPerPoint;

  return RING_SKILL_SCALING_PLACEHOLDERS.rarityMultiplier[ring.rarity] * qualityMultiplier;
}

export function resolveGeneratedRingSkillId(params: {
  name: string;
  seed: string | number;
  skillId?: string | null;
}): SkillId {
  if (params.skillId != null) {
    if (!isSkillId(params.skillId) || !getSkillDefinition(params.skillId)) {
      throw new Error(`Unknown MVP ring skillId: ${params.skillId}`);
    }
    return params.skillId;
  }

  const namedSkillId = RINGS_SKILLS_MAP[params.name as keyof typeof RINGS_SKILLS_MAP];
  if (namedSkillId) return namedSkillId;

  const hash = hashString(String(params.seed));
  return SKILL_IDS[hash % SKILL_IDS.length];
}

function normalizeEquippedRingSlots(equipped: EquippedRings): Array<RingEquipmentInstance | null> {
  const slots = [...equipped];
  while (slots.length < MAX_EQUIPPED_RINGS) slots.push(null);
  return slots.slice(0, MAX_EQUIPPED_RINGS);
}

function normalizePositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(fallback, Math.floor(value));
}

function normalizePositiveNumber(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

validateRingsSkillsMap();
