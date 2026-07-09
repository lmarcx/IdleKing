import type { EquipmentAffix, EquipmentInstance, EquipmentSlot, EquipmentStats, ItemRarity } from "../items/types.js";

export const MAX_EQUIPMENT_AFFIXES = 2;

export const EQUIPMENT_AFFIX_COUNT_BY_RARITY: Readonly<Record<ItemRarity, number>> = {
  COMMON: 0,
  UNCOMMON: 0,
  RARE: 1,
  EPIC: 1,
  LEGENDARY: 2,
};

export const EQUIPMENT_UPGRADE_CAP_BY_RARITY: Readonly<Record<ItemRarity, number>> = {
  COMMON: 6,
  UNCOMMON: 6,
  RARE: 6,
  EPIC: 9,
  LEGENDARY: 12,
};

/**
 * Balancing baseline (§21 — "plages de valeurs des affixes · pools d'affixes par slot").
 * Affixes only roll on the combat stats EquipmentStats can carry (hp/attack/defense);
 * `power` stays derived and is never rolled as an affix.
 */
export type AffixStat = Exclude<keyof EquipmentStats, "power">;

export type AffixPoolEntry = Readonly<{
  affixId: string;
  stat: AffixStat;
  /** Relative weight inside the slot pool when picking distinct affixes. */
  weight: number;
  /** Value contribution per item level before the rarity potency multiplier. */
  valuePerIlvl: number;
  /** Floor so low-ilvl items still roll a meaningful affix. */
  minValue: number;
}>;

// Reusable affix archetypes. HP rolls bigger raw numbers because HP is the cheapest stat.
const MIGHT: AffixPoolEntry = { affixId: "might", stat: "attack", weight: 5, valuePerIlvl: 0.14, minValue: 2 };
const BLOODLUST: AffixPoolEntry = { affixId: "bloodlust", stat: "attack", weight: 3, valuePerIlvl: 0.1, minValue: 2 };
const VITALITY: AffixPoolEntry = { affixId: "vitality", stat: "hp", weight: 5, valuePerIlvl: 0.7, minValue: 6 };
const FORTITUDE: AffixPoolEntry = { affixId: "fortitude", stat: "hp", weight: 3, valuePerIlvl: 0.5, minValue: 5 };
const GUARD: AffixPoolEntry = { affixId: "guard", stat: "defense", weight: 5, valuePerIlvl: 0.14, minValue: 2 };
const BULWARK: AffixPoolEntry = { affixId: "bulwark", stat: "defense", weight: 3, valuePerIlvl: 0.1, minValue: 2 };

/**
 * Per-slot affix pools. Each pool exposes at least two distinct entries so a
 * Legendary (2 affixes) can always roll two different affixIds. The artifact
 * slot stays inert (D-11) and rolls nothing.
 */
export const EQUIPMENT_AFFIX_POOLS: Readonly<Record<EquipmentSlot, readonly AffixPoolEntry[]>> = {
  main_hand: [MIGHT, BLOODLUST, VITALITY],
  off_hand: [GUARD, BULWARK, VITALITY],
  helmet: [VITALITY, FORTITUDE, GUARD],
  chest: [VITALITY, FORTITUDE, GUARD],
  gloves: [MIGHT, VITALITY, GUARD],
  belt: [VITALITY, FORTITUDE, GUARD],
  boots: [VITALITY, FORTITUDE, GUARD],
  necklace: [MIGHT, VITALITY, GUARD],
  ring: [MIGHT, GUARD, VITALITY],
  cape: [VITALITY, FORTITUDE, GUARD],
  artifact: [],
} as const;

/** Affix potency grows with rarity (only Rare+ ever roll affixes). */
export const AFFIX_RARITY_VALUE_MULTIPLIER: Readonly<Record<ItemRarity, number>> = {
  COMMON: 1,
  UNCOMMON: 1,
  RARE: 1,
  EPIC: 1.25,
  LEGENDARY: 1.6,
};

const AFFIX_VALUE_JITTER_MIN = 0.85;
const AFFIX_VALUE_JITTER_MAX = 1.15;

function rollUnit(rng: () => number): number {
  const value = rng();
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0;
}

function rollAffixValue(entry: AffixPoolEntry, rarity: ItemRarity, ilvl: number, rng: () => number): number {
  const safeIlvl = Math.max(1, Math.floor(Number.isFinite(ilvl) ? ilvl : 1));
  const jitter = AFFIX_VALUE_JITTER_MIN + rollUnit(rng) * (AFFIX_VALUE_JITTER_MAX - AFFIX_VALUE_JITTER_MIN);
  const raw = safeIlvl * entry.valuePerIlvl * AFFIX_RARITY_VALUE_MULTIPLIER[rarity] * jitter;
  return Math.max(entry.minValue, Math.round(raw));
}

function pickDistinctWeighted(pool: readonly AffixPoolEntry[], count: number, rng: () => number): AffixPoolEntry[] {
  const remaining = [...pool];
  const picked: AffixPoolEntry[] = [];

  while (picked.length < count && remaining.length > 0) {
    const totalWeight = remaining.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
    if (totalWeight <= 0) break;

    let threshold = rollUnit(rng) * totalWeight;
    let index = remaining.length - 1;
    for (let i = 0; i < remaining.length; i += 1) {
      threshold -= Math.max(0, remaining[i].weight);
      if (threshold < 0) {
        index = i;
        break;
      }
    }

    picked.push(remaining[index]);
    remaining.splice(index, 1);
  }

  return picked;
}

export function getAffixCountForRarity(rarity: ItemRarity): number {
  return EQUIPMENT_AFFIX_COUNT_BY_RARITY[rarity];
}

/**
 * Roll the affixes for a generated item: slot-aware pool, distinct affixIds,
 * values scaled by rarity and ilvl. Fully deterministic for a given `rng`.
 */
export function rollEquipmentAffixes(params: {
  slot: EquipmentSlot;
  rarity: ItemRarity;
  ilvl: number;
  rng: () => number;
}): EquipmentAffix[] {
  const count = getAffixCountForRarity(params.rarity);
  if (count <= 0) return [];

  const pool = EQUIPMENT_AFFIX_POOLS[params.slot] ?? [];
  if (pool.length === 0) return [];

  return pickDistinctWeighted(pool, count, params.rng).map((entry) => ({
    affixId: entry.affixId,
    stat: entry.stat,
    value: rollAffixValue(entry, params.rarity, params.ilvl, params.rng),
  }));
}

export function validateAffixCount(instance: Pick<EquipmentInstance, "affixes" | "rarity">): boolean {
  return (
    instance.affixes.length <= MAX_EQUIPMENT_AFFIXES &&
    instance.affixes.length === getAffixCountForRarity(instance.rarity)
  );
}

/**
 * @deprecated Kept for backward compatibility. Prefer {@link rollEquipmentAffixes},
 * which is slot-aware and seedable. Delegates to a `chest` pool at ilvl 1 with a
 * deterministic roll so existing callers keep stable output.
 */
export function generatePlaceholderAffixes(rarity: ItemRarity, ilvl = 1): EquipmentAffix[] {
  let seed = 0;
  return rollEquipmentAffixes({
    slot: "chest",
    rarity,
    ilvl,
    rng: () => {
      seed += 1;
      return (seed % 3) / 3;
    },
  });
}

export function applyEquipmentAffixes(stats: EquipmentStats, affixes: readonly EquipmentAffix[]): EquipmentStats {
  return affixes.reduce<EquipmentStats>(
    (next, affix) => ({
      ...next,
      [affix.stat]: (next[affix.stat] ?? 0) + affix.value,
    }),
    { ...stats },
  );
}

export function getUpgradeCapForRarity(rarity: ItemRarity): number {
  return EQUIPMENT_UPGRADE_CAP_BY_RARITY[rarity];
}

export function canUpgradeEquipment(instance: Pick<EquipmentInstance, "rarity" | "upgradeLevel">): boolean {
  return instance.upgradeLevel < getUpgradeCapForRarity(instance.rarity);
}

export function upgradeEquipment<T extends EquipmentInstance>(instance: T): T {
  if (!canUpgradeEquipment(instance)) {
    throw new RangeError(`Equipment ${instance.instanceId} already reached the ${instance.rarity} upgrade cap`);
  }

  return {
    ...instance,
    upgradeLevel: instance.upgradeLevel + 1,
  };
}
