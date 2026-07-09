import {
  BLEED_BASE_WEAKEN,
  DEBUFF_POWER_SCALING_PER_POINT,
  SHOCK_BASE_VULNERABILITY,
} from "./constants.js";

export type StatusEffectId = "BURN" | "FREEZE" | "SHOCK" | "BLEED" | "STUN" | "SILENCE";

export type StatusEffectKind =
  | "DAMAGE_OVER_TIME"
  | "SLOW"
  | "VULNERABILITY"
  | "WEAKEN"
  | "CONTROL"
  | "CAST_LOCK";

export type StatusEffectDefinition = {
  id: StatusEffectId;
  kind: StatusEffectKind;
  incomingDamageModifier?: number;
  outgoingDamageModifier?: number;
  preventsActions?: boolean;
  preventsCasts?: boolean;
};

export type ActiveStatusEffect = {
  id: StatusEffectId;
  debuffPower?: number;
};

export type StatusDamageModifiersInput = {
  attackerStatuses?: readonly ActiveStatusEffect[];
  targetStatuses?: readonly ActiveStatusEffect[];
};

export type StatusDamageModifiers = {
  outgoingDamageMultiplier: number;
  incomingDamageMultiplier: number;
  multiplier: number;
};

export const STATUS_EFFECT_DEFINITIONS: Readonly<Record<StatusEffectId, StatusEffectDefinition>> = {
  BURN: {
    id: "BURN",
    kind: "DAMAGE_OVER_TIME",
  },
  FREEZE: {
    id: "FREEZE",
    kind: "SLOW",
  },
  SHOCK: {
    id: "SHOCK",
    kind: "VULNERABILITY",
    incomingDamageModifier: SHOCK_BASE_VULNERABILITY,
  },
  BLEED: {
    id: "BLEED",
    kind: "WEAKEN",
    outgoingDamageModifier: -BLEED_BASE_WEAKEN,
  },
  STUN: {
    id: "STUN",
    kind: "CONTROL",
    preventsActions: true,
  },
  SILENCE: {
    id: "SILENCE",
    kind: "CAST_LOCK",
    preventsCasts: true,
  },
};

function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

/**
 * Debuff Power scaling uses the balancing baseline. It only changes output when
 * an effect actually carries Debuff Power (no MVP source feeds it yet).
 */
export function scaleDebuffModifier(modifier: number, debuffPower = 0): number {
  const scale = 1 + clampNonNegative(debuffPower) * DEBUFF_POWER_SCALING_PER_POINT;
  return modifier * scale;
}

export function getStatusEffectDefinition(id: StatusEffectId): StatusEffectDefinition {
  return STATUS_EFFECT_DEFINITIONS[id];
}

export function isDamageOverTimeStatus(id: StatusEffectId): boolean {
  return getStatusEffectDefinition(id).kind === "DAMAGE_OVER_TIME";
}

export function isSlowStatus(id: StatusEffectId): boolean {
  return getStatusEffectDefinition(id).kind === "SLOW";
}

export function preventsActions(id: StatusEffectId): boolean {
  return getStatusEffectDefinition(id).preventsActions === true;
}

export function preventsCasts(id: StatusEffectId): boolean {
  return getStatusEffectDefinition(id).preventsCasts === true;
}

export function applyStatusDamageModifiers(
  input: StatusDamageModifiersInput
): StatusDamageModifiers {
  let outgoingDamageMultiplier = 1;
  let incomingDamageMultiplier = 1;

  for (const status of input.attackerStatuses ?? []) {
    const definition = getStatusEffectDefinition(status.id);
    if (definition.outgoingDamageModifier == null) continue;
    outgoingDamageMultiplier *= 1 + scaleDebuffModifier(
      definition.outgoingDamageModifier,
      status.debuffPower
    );
  }

  for (const status of input.targetStatuses ?? []) {
    const definition = getStatusEffectDefinition(status.id);
    if (definition.incomingDamageModifier == null) continue;
    incomingDamageMultiplier *= 1 + scaleDebuffModifier(
      definition.incomingDamageModifier,
      status.debuffPower
    );
  }

  return {
    outgoingDamageMultiplier,
    incomingDamageMultiplier,
    multiplier: outgoingDamageMultiplier * incomingDamageMultiplier,
  };
}
