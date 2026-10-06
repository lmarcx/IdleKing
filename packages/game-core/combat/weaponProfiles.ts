import type { GameState } from "../game/state.js";
import { isEquipmentItem, type EquipmentItem } from "../items/types.js";
import { getForgeOutputBase } from "../building/forge/recipes.js";
import { getWeaponFamilyDefinition, type WeaponFamily } from "../building/forge/weapons.js";

/**
 * Weapon attack profiles (Freeze §5: weapons define left/right click). Each weapon family gets a
 * distinct primary (left click) and secondary (right click) action; one-handed weapons take their
 * secondary from the off-hand (shield bash, grimoire bolts) when one is equipped.
 *
 * `damageCoefficient` feeds the Damage Formula's WeaponCoefficient through performBasicAttack —
 * no damage math lives in the renderer. DEFERRED balancing: all numbers.
 */
export type WeaponAttackShape =
  /** Cone in front of the player. */
  | "arc"
  /** Long, narrow cone (spear tip, greatsword lunge). */
  | "thrust"
  /** Full circle around the player (axe whirl, shield bash, staff nova). */
  | "burst"
  /** One projectile toward the cursor. */
  | "projectile"
  /** Fan of projectiles toward the cursor. */
  | "spread";

export type WeaponAttackProfile = Readonly<{
  shape: WeaponAttackShape;
  label: string;
  damageCoefficient: number;
  cooldownMs: number;
  /** Melee reach, or projectile max range. */
  range: number;
  /** Half cone angle for arc/thrust. */
  halfAngleRadians?: number;
  projectileSpeed?: number;
  projectileCount?: number;
  /** Total fan angle for spread. */
  spreadRadians?: number;
}>;

export type WeaponProfileKey = WeaponFamily | "unarmed";

export type WeaponLoadoutProfile = Readonly<{
  mainFamily: WeaponProfileKey;
  offhandFamily?: WeaponFamily;
  primary: WeaponAttackProfile;
  secondary: WeaponAttackProfile;
}>;

const arc = (label: string, damageCoefficient: number, cooldownMs: number, range: number, halfAngleRadians: number): WeaponAttackProfile => ({
  shape: "arc", label, damageCoefficient, cooldownMs, range, halfAngleRadians,
});
const thrust = (label: string, damageCoefficient: number, cooldownMs: number, range: number): WeaponAttackProfile => ({
  shape: "thrust", label, damageCoefficient, cooldownMs, range, halfAngleRadians: 0.26,
});
const burst = (label: string, damageCoefficient: number, cooldownMs: number, range: number): WeaponAttackProfile => ({
  shape: "burst", label, damageCoefficient, cooldownMs, range,
});
const projectile = (label: string, damageCoefficient: number, cooldownMs: number, range: number, projectileSpeed: number): WeaponAttackProfile => ({
  shape: "projectile", label, damageCoefficient, cooldownMs, range, projectileSpeed, projectileCount: 1,
});
const spread = (label: string, damageCoefficient: number, cooldownMs: number, range: number, projectileSpeed: number, projectileCount: number, spreadRadians: number): WeaponAttackProfile => ({
  shape: "spread", label, damageCoefficient, cooldownMs, range, projectileSpeed, projectileCount, spreadRadians,
});

export const WEAPON_ATTACK_PROFILES: Readonly<Record<WeaponProfileKey, Readonly<{ primary: WeaponAttackProfile; secondary: WeaponAttackProfile }>>> = {
  unarmed: { primary: arc("Poing", 0.8, 300, 72, 0.7), secondary: projectile("Éclat", 0.6, 600, 520, 560) },
  sword: { primary: arc("Taille", 1, 280, 86, 0.72), secondary: thrust("Estoc", 1.4, 650, 130) },
  dagger: { primary: arc("Entaille", 0.7, 170, 70, 0.6), secondary: projectile("Lancer", 0.9, 480, 560, 760) },
  axe: { primary: arc("Fendoir", 1.35, 420, 94, 1.05), secondary: burst("Tourbillon", 1.2, 1100, 118) },
  greatsword: { primary: arc("Fauche", 1.9, 560, 122, 1), secondary: thrust("Percée", 2.2, 950, 175) },
  pistol: { primary: projectile("Tir", 1, 380, 700, 950), secondary: spread("Salve", 0.8, 950, 520, 900, 3, 0.36) },
  bow: { primary: projectile("Flèche", 1.15, 520, 780, 780), secondary: spread("Volée", 0.9, 1150, 700, 740, 3, 0.3) },
  spear: { primary: thrust("Pique", 1.15, 380, 150), secondary: arc("Balayage", 1, 800, 140, 1.2) },
  staff: { primary: projectile("Orbe", 1.2, 480, 640, 540), secondary: burst("Onde", 1, 1000, 145) },
  shield: { primary: arc("Coup de bouclier", 0.8, 360, 70, 0.8), secondary: burst("Charge", 0.9, 700, 84) },
  grimoire: { primary: projectile("Glyphe", 1, 450, 620, 600), secondary: spread("Glyphes", 0.75, 900, 600, 620, 2, 0.24) },
};

/** Weapon family of an equipment item (crafted bases carry it; legacy/market swords fall back). */
export function getWeaponFamilyForItem(item: Pick<EquipmentItem, "baseItemId" | "slot" | "name">): WeaponFamily | undefined {
  const base = item.baseItemId ? getForgeOutputBase(item.baseItemId) : undefined;
  if (base?.weaponFamily) return base.weaponFamily;
  if (item.slot !== "main_hand" && item.slot !== "off_hand") return undefined;
  const name = (item.name ?? "").toLowerCase();
  const byName = (["greatsword", "dagger", "axe", "pistol", "bow", "spear", "staff", "shield", "grimoire", "sword"] as const)
    .find((family) => name.includes(family));
  return byName ?? (item.slot === "main_hand" ? "sword" : undefined);
}

function findEquipped(state: GameState, itemId: string | null | undefined): EquipmentItem | undefined {
  if (!itemId) return undefined;
  const item = state.inventory.items.find((candidate) => candidate.id === itemId);
  return item && isEquipmentItem(item) ? item : undefined;
}

export function resolveWeaponLoadoutProfile(state: GameState): WeaponLoadoutProfile {
  const main = findEquipped(state, state.equipment.equipped.main_hand);
  const off = findEquipped(state, state.equipment.equipped.off_hand);
  const mainFamily: WeaponProfileKey = (main && getWeaponFamilyForItem(main)) ?? "unarmed";
  const offhandFamily = off ? getWeaponFamilyForItem(off) : undefined;
  const mainProfiles = WEAPON_ATTACK_PROFILES[mainFamily];

  const mainIsTwoHanded = mainFamily !== "unarmed" && getWeaponFamilyDefinition(mainFamily)?.handedness === "two_handed";
  const offhandOverridesSecondary =
    !mainIsTwoHanded && offhandFamily !== undefined && (offhandFamily === "shield" || offhandFamily === "grimoire");

  return {
    mainFamily,
    offhandFamily,
    primary: mainProfiles.primary,
    secondary: offhandOverridesSecondary ? WEAPON_ATTACK_PROFILES[offhandFamily].secondary : mainProfiles.secondary,
  };
}
