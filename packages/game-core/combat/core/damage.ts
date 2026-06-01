import { capCritChance, computeDefenseMitigation, getCritDamage } from "../../power/statsModel.js";
import { CRIT_DAMAGE_DEFAULT } from "../../power/constants.js";
import type { SeededRng } from "../../random/rng.js";
import { ATTACK_DAMAGE_PER_POINT } from "./constants.js";
import {
  applyStatusDamageModifiers,
  type StatusDamageModifiersInput,
} from "./statuses.js";

export type TargetMitigation = {
  mitigation: number;
  multiplier: number;
};

export type CritMultiplierInput = {
  critChance?: number;
  critDamage?: number;
};

export type CritMultiplierResult = {
  didCrit: boolean;
  chance: number;
  damage: number;
  multiplier: number;
};

export type CalculateDamageInput = StatusDamageModifiersInput & {
  baseDamage: number;
  attack: number;
  weaponCoefficient?: number;
  skillCoefficient?: number;
  offensiveModifiers?: readonly number[];
  targetDef?: number;
  critChance?: number;
  critDamage?: number;
};

export type DamageBreakdown = {
  baseDamage: number;
  attackMultiplier: number;
  weaponCoefficient: number;
  skillCoefficient: number;
  offensiveModifiersMultiplier: number;
  critMultiplier: number;
  targetMitigationMultiplier: number;
  statusModifiersMultiplier: number;
};

export type DamageResult = {
  damage: number;
  didCrit: boolean;
  breakdown: DamageBreakdown;
};

function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

function multiplyModifiers(modifiers: readonly number[] | undefined): number {
  return (modifiers ?? []).reduce(
    (total, modifier) => total * clampNonNegative(modifier),
    1
  );
}

/**
 * DEF mitigation is a diminishing-returns multiplier, never a flat reduction.
 */
export function calculateTargetMitigation(def: number): TargetMitigation {
  const mitigation = computeDefenseMitigation(def);
  return {
    mitigation,
    multiplier: 1 - mitigation,
  };
}

/**
 * Fractional crit rolls require an injected seeded RNG. No implicit Math.random fallback.
 */
export function calculateCritMultiplier(
  input: CritMultiplierInput,
  rng?: Pick<SeededRng, "nextFloat">
): CritMultiplierResult {
  const chance = capCritChance(input.critChance ?? 0);
  const damage = getCritDamage(input.critDamage ?? CRIT_DAMAGE_DEFAULT);

  if (chance <= 0) {
    return { didCrit: false, chance, damage, multiplier: 1 };
  }

  if (chance >= 1) {
    return { didCrit: true, chance, damage, multiplier: damage };
  }

  if (!rng) {
    throw new Error("calculateCritMultiplier requires a seeded RNG for fractional crit chance");
  }

  const didCrit = rng.nextFloat() < chance;
  return {
    didCrit,
    chance,
    damage,
    multiplier: didCrit ? damage : 1,
  };
}

/**
 * Locked MVP structure:
 * BaseDamage x WeaponCoefficient x SkillCoefficient x OffensiveModifiers
 * x Crit x TargetMitigation x StatusModifiers
 */
export function calculateDamage(
  input: CalculateDamageInput,
  rng?: Pick<SeededRng, "nextFloat">
): DamageResult {
  const baseDamage = clampNonNegative(input.baseDamage);
  const attackMultiplier = 1 + clampNonNegative(input.attack) * ATTACK_DAMAGE_PER_POINT;
  const weaponCoefficient = clampNonNegative(input.weaponCoefficient ?? 1);
  const skillCoefficient = clampNonNegative(input.skillCoefficient ?? 1);
  const offensiveModifiersMultiplier = multiplyModifiers(input.offensiveModifiers);
  const crit = calculateCritMultiplier(input, rng);
  const targetMitigation = calculateTargetMitigation(input.targetDef ?? 0);
  const statusModifiers = applyStatusDamageModifiers(input);

  const damage =
    baseDamage *
    weaponCoefficient *
    skillCoefficient *
    attackMultiplier *
    offensiveModifiersMultiplier *
    crit.multiplier *
    targetMitigation.multiplier *
    statusModifiers.multiplier;

  return {
    damage,
    didCrit: crit.didCrit,
    breakdown: {
      baseDamage,
      attackMultiplier,
      weaponCoefficient,
      skillCoefficient,
      offensiveModifiersMultiplier,
      critMultiplier: crit.multiplier,
      targetMitigationMultiplier: targetMitigation.multiplier,
      statusModifiersMultiplier: statusModifiers.multiplier,
    },
  };
}
