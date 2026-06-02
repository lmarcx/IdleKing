import { spendMana } from "../combat/runtime/resources.js";
import type { CombatRuntimeState } from "../combat/runtime/types.js";
import { getSkillDefinition } from "./registry.js";
import type {
  SkillCastDamageInput,
  SkillCastFailureReason,
  SkillCastOptions,
  SkillCooldownState,
  SkillDefinition,
  SkillId,
} from "./types.js";

export type SkillCastSuccess = Readonly<{
  success: true;
  updatedState: CombatRuntimeState;
  skillDef: SkillDefinition;
  nextAvailableAtMs: number;
  remainingCooldownSeconds: 0;
  damageInput?: SkillCastDamageInput;
}>;

export type SkillCastFailure = Readonly<{
  success: false;
  reason: SkillCastFailureReason;
  updatedState: CombatRuntimeState;
  skillDef: SkillDefinition | null;
  remainingCooldownSeconds: number;
}>;

export type SkillCastResult = SkillCastSuccess | SkillCastFailure;

export function getSkillRemainingCooldownSeconds(
  skillId: SkillId | string,
  cooldowns: SkillCooldownState | undefined,
  nowMs: number
): number {
  const skillDef = getSkillDefinition(skillId);
  if (!skillDef) return 0;
  const nextAvailableAtMs = cooldowns?.[skillDef.id] ?? 0;
  return Math.max(0, (nextAvailableAtMs - nowMs) / 1_000);
}

export function isSkillOnCooldown(
  skillId: SkillId | string,
  cooldowns: SkillCooldownState | undefined,
  nowMs: number
): boolean {
  return getSkillRemainingCooldownSeconds(skillId, cooldowns, nowMs) > 0;
}

export function canCastSkill(
  runtimeState: CombatRuntimeState,
  skillId: SkillId | string,
  options: SkillCastOptions
): SkillCastResult {
  const skillDef = getSkillDefinition(skillId);
  if (!skillDef) {
    return buildFailure(runtimeState, null, "unknown_skill");
  }

  const remainingCooldownSeconds = getSkillRemainingCooldownSeconds(
    skillDef.id,
    runtimeState.timers.skillCooldowns,
    options.nowMs
  );
  if (remainingCooldownSeconds > 0) {
    return buildFailure(runtimeState, skillDef, "cooldown", remainingCooldownSeconds);
  }

  if (runtimeState.player.manaCurrent < skillDef.manaCost) {
    return buildFailure(runtimeState, skillDef, "not_enough_mana");
  }

  return buildSuccess(runtimeState, skillDef, options.nowMs);
}

export function castSkill(
  runtimeState: CombatRuntimeState,
  skillId: SkillId | string,
  options: SkillCastOptions
): SkillCastResult {
  const result = canCastSkill(runtimeState, skillId, options);
  if (!result.success) return result;

  return {
    ...result,
    updatedState: {
      ...spendMana(runtimeState, result.skillDef.manaCost),
      timers: {
        ...runtimeState.timers,
        skillCooldowns: {
          ...runtimeState.timers.skillCooldowns,
          [result.skillDef.id]: result.nextAvailableAtMs,
        },
      },
    },
  };
}

function buildSuccess(
  runtimeState: CombatRuntimeState,
  skillDef: SkillDefinition,
  nowMs: number
): SkillCastSuccess {
  return {
    success: true,
    updatedState: runtimeState,
    skillDef,
    nextAvailableAtMs: nowMs + skillDef.cooldownSeconds * 1_000,
    remainingCooldownSeconds: 0,
    damageInput:
      skillDef.category === "attack"
        ? { skillDamageMultiplier: skillDef.basePower }
        : undefined,
  };
}

function buildFailure(
  runtimeState: CombatRuntimeState,
  skillDef: SkillDefinition | null,
  reason: SkillCastFailureReason,
  remainingCooldownSeconds = 0
): SkillCastFailure {
  return {
    success: false,
    reason,
    updatedState: runtimeState,
    skillDef,
    remainingCooldownSeconds: Math.max(0, remainingCooldownSeconds),
  };
}
