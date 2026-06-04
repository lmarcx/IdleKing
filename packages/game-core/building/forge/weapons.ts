import type { EquipmentSlot, EquipmentStats } from "../../items/types.js";

export type WeaponFamily =
  | "sword"
  | "dagger"
  | "axe"
  | "greatsword"
  | "pistol"
  | "bow"
  | "shield"
  | "spear"
  | "grimoire"
  | "staff";

export type WeaponHandedness = "one_handed" | "two_handed";
export type WeaponSlotBehavior = EquipmentSlot | "two_handed";

export type WeaponFamilyDefinition = Readonly<{
  family: WeaponFamily;
  handedness: WeaponHandedness;
  forgeLevelUnlock: number;
  slotBehavior: WeaponSlotBehavior;
  allowedStats: readonly (keyof EquipmentStats)[];
}>;

export const WEAPON_FAMILY_REGISTRY: Readonly<Record<WeaponFamily, WeaponFamilyDefinition>> = {
  sword: {
    family: "sword",
    handedness: "one_handed",
    forgeLevelUnlock: 1,
    slotBehavior: "main_hand",
    allowedStats: ["attack", "power"],
  },
  dagger: {
    family: "dagger",
    handedness: "one_handed",
    forgeLevelUnlock: 2,
    slotBehavior: "main_hand",
    allowedStats: ["attack", "power"],
  },
  axe: {
    family: "axe",
    handedness: "one_handed",
    forgeLevelUnlock: 3,
    slotBehavior: "main_hand",
    allowedStats: ["attack", "power"],
  },
  greatsword: {
    family: "greatsword",
    handedness: "two_handed",
    forgeLevelUnlock: 4,
    slotBehavior: "two_handed",
    allowedStats: ["attack", "power"],
  },
  pistol: {
    family: "pistol",
    handedness: "one_handed",
    forgeLevelUnlock: 5,
    slotBehavior: "main_hand",
    allowedStats: ["attack", "power"],
  },
  bow: {
    family: "bow",
    handedness: "two_handed",
    forgeLevelUnlock: 6,
    slotBehavior: "two_handed",
    allowedStats: ["attack", "power"],
  },
  shield: {
    family: "shield",
    handedness: "one_handed",
    forgeLevelUnlock: 7,
    slotBehavior: "off_hand",
    allowedStats: ["defense", "hp", "power"],
  },
  spear: {
    family: "spear",
    handedness: "two_handed",
    forgeLevelUnlock: 8,
    slotBehavior: "two_handed",
    allowedStats: ["attack", "power"],
  },
  grimoire: {
    family: "grimoire",
    handedness: "one_handed",
    forgeLevelUnlock: 9,
    slotBehavior: "off_hand",
    allowedStats: ["attack", "power"],
  },
  staff: {
    family: "staff",
    handedness: "two_handed",
    forgeLevelUnlock: 10,
    slotBehavior: "two_handed",
    allowedStats: ["attack", "power"],
  },
};

export const WEAPON_FAMILY_UNLOCK_LADDER: readonly WeaponFamily[] = [
  "sword",
  "dagger",
  "axe",
  "greatsword",
  "pistol",
  "bow",
  "shield",
  "spear",
  "grimoire",
  "staff",
] as const;

export function getWeaponFamilyDefinition(family: string): WeaponFamilyDefinition | undefined {
  return WEAPON_FAMILY_REGISTRY[family as WeaponFamily];
}

export function getWeaponFamilyDefinitionOrThrow(family: string): WeaponFamilyDefinition {
  const definition = getWeaponFamilyDefinition(family);
  if (!definition) throw new Error(`Unknown Forge weapon family: ${family}`);
  return definition;
}

export function getWeaponFamilyUnlockLevel(family: string): number {
  return getWeaponFamilyDefinitionOrThrow(family).forgeLevelUnlock;
}

export function isWeaponFamilyUnlocked(family: string, forgeLevel: number): boolean {
  const safeForgeLevel = Math.max(0, Math.floor(Number.isFinite(forgeLevel) ? forgeLevel : 0));
  return safeForgeLevel >= getWeaponFamilyUnlockLevel(family);
}

export function assertWeaponFamilyUnlocked(family: string, forgeLevel: number): void {
  if (!isWeaponFamilyUnlocked(family, forgeLevel)) {
    throw new Error(`Weapon family ${family} requires Forge Level ${getWeaponFamilyUnlockLevel(family)}`);
  }
}

export function getEquipmentSlotForWeaponFamily(family: string): EquipmentSlot {
  const definition = getWeaponFamilyDefinitionOrThrow(family);
  return definition.slotBehavior === "two_handed" ? "main_hand" : definition.slotBehavior;
}
