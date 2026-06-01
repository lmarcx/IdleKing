import type { EquipmentAffix, EquipmentInstance, EquipmentStats, ItemRarity } from "../items/types.js";

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

// DEFERRED balancing placeholders. Affix pools and value ranges are not frozen yet.
export const EQUIPMENT_AFFIX_PLACEHOLDERS: readonly EquipmentAffix[] = [
  { affixId: "placeholder_vitality", stat: "hp", value: 4 },
  { affixId: "placeholder_might", stat: "attack", value: 1 },
] as const;

export function getAffixCountForRarity(rarity: ItemRarity): number {
  return EQUIPMENT_AFFIX_COUNT_BY_RARITY[rarity];
}

export function validateAffixCount(instance: Pick<EquipmentInstance, "affixes" | "rarity">): boolean {
  return (
    instance.affixes.length <= MAX_EQUIPMENT_AFFIXES &&
    instance.affixes.length === getAffixCountForRarity(instance.rarity)
  );
}

export function generatePlaceholderAffixes(rarity: ItemRarity): EquipmentAffix[] {
  return EQUIPMENT_AFFIX_PLACEHOLDERS.slice(0, getAffixCountForRarity(rarity)).map((affix) => ({ ...affix }));
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
