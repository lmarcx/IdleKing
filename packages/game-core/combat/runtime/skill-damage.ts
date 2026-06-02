import type { SeededRng } from "../../random/rng.js";
import type { ActiveStatusEffect } from "../core/statuses.js";
import { calculateDamage, type DamageResult } from "../core/damage.js";
import { SKILL_ATTACK_BASE_DAMAGE } from "./constants.js";

export type SkillDamageInput = {
  /**
   * Player ATK. POWER is intentionally NOT part of this signature:
   * POWER stays a progression / recommendation score, never a damage source.
   */
  attack: number;
  /** SkillDef.damageMultiplier — used as the skill coefficient in the locked damage formula. */
  skillDamageMultiplier: number;
  /** Ring-only scaling multiplier from rarity, ilvl, upgrades, and affixes. */
  ringSkillScaling?: number;
  /** Optional offensive buff multiplier (e.g. War Cry). */
  buffMultiplier?: number;
  targetDef?: number;
  critChance?: number;
  critDamage?: number;
  attackerStatuses?: readonly ActiveStatusEffect[];
  targetStatuses?: readonly ActiveStatusEffect[];
};

/**
 * Single source of truth for skill hit damage.
 *
 * Reuses combat-core `calculateDamage()` with the skill coefficient so skills and
 * basic attacks share the exact same locked MVP formula:
 * BaseDamage x WeaponCoefficient x SkillCoefficient x OffensiveModifiers x Crit
 * x TargetMitigation x StatusModifiers.
 *
 * Crit defaults to disabled (critChance 0) so callers that apply one value to many
 * targets per tick stay deterministic; pass critChance + an RNG to enable crit.
 */
export function computeSkillDamage(
  input: SkillDamageInput,
  rng?: Pick<SeededRng, "nextFloat">
): DamageResult {
  return calculateDamage(
    {
      baseDamage: SKILL_ATTACK_BASE_DAMAGE,
      attack: input.attack,
      skillCoefficient: Math.max(0, input.skillDamageMultiplier) * Math.max(0, input.ringSkillScaling ?? 1),
      offensiveModifiers: input.buffMultiplier != null ? [input.buffMultiplier] : undefined,
      targetDef: input.targetDef,
      critChance: input.critChance ?? 0,
      critDamage: input.critDamage,
      attackerStatuses: input.attackerStatuses,
      targetStatuses: input.targetStatuses,
    },
    rng
  );
}
