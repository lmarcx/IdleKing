export type SkillId = "royal_beam" | "king_aura" | "royal_strike" | "war_cry";

export type SkillKind = "beam" | "aura" | "frontal_aoe" | "buff";

export type SkillSlot = 1 | 2 | 3 | 4;

export type SkillDef = {
  id: SkillId;
  name: string;
  description: string;
  kind: SkillKind;
  cooldownMs: number;
  durationMs?: number;
  range?: number;
  width?: number;
  radius?: number;
  tickIntervalMs?: number;
  damageMultiplier?: number;
  bonusDamageMultiplier?: number;
};

export type SkillCooldownState = Partial<Record<SkillId, number>>;

export type ActiveSkillEffect = {
  skillId: SkillId;
  kind: SkillKind;
  startedAtMs: number;
  endsAtMs: number;
  tickIntervalMs?: number;
  damageMultiplier?: number;
  bonusDamageMultiplier?: number;
  range?: number;
  width?: number;
  radius?: number;
};

export type SkillCastContext = {
  skillId: SkillId | string;
  nowMs: number;
  cooldowns?: SkillCooldownState;
};

export type SkillCastResult =
  | {
      ok: true;
      skillId: SkillId;
      startedAtMs: number;
      endsAtMs?: number;
      nextAvailableAtMs: number;
      activeEffect?: ActiveSkillEffect;
    }
  | {
      ok: false;
      skillId: string;
      reason: "UNKNOWN_SKILL" | "COOLDOWN";
      remainingCooldownMs?: number;
      nextAvailableAtMs?: number;
    };

export const SKILL_DEFS: Record<SkillId, SkillDef> = {
  royal_beam: {
    id: "royal_beam",
    name: "Rayon royal",
    description: "Rayon directionnel devant le joueur",
    kind: "beam",
    range: 420,
    width: 72,
    durationMs: 1500,
    tickIntervalMs: 250,
    damageMultiplier: 0.45,
    cooldownMs: 8000,
  },
  king_aura: {
    id: "king_aura",
    name: "Aura du roi",
    description: "AOE circulaire autour du joueur",
    kind: "aura",
    radius: 180,
    durationMs: 5000,
    tickIntervalMs: 1000,
    damageMultiplier: 0.6,
    cooldownMs: 12000,
  },
  royal_strike: {
    id: "royal_strike",
    name: "Frappe royale",
    description: "AOE instantanee devant le joueur",
    kind: "frontal_aoe",
    range: 160,
    width: 120,
    damageMultiplier: 1.8,
    cooldownMs: 5000,
  },
  war_cry: {
    id: "war_cry",
    name: "Cri de guerre",
    description: "Augmente temporairement les degats du joueur",
    kind: "buff",
    durationMs: 6000,
    bonusDamageMultiplier: 0.25,
    cooldownMs: 15000,
  },
} as const;

const DEFAULT_SKILL_LOADOUT: ReadonlyArray<{ slot: SkillSlot; skillId: SkillId }> = [
  { slot: 1, skillId: "royal_beam" },
  { slot: 2, skillId: "king_aura" },
  { slot: 3, skillId: "royal_strike" },
  { slot: 4, skillId: "war_cry" },
] as const;

export function getSkillDef(skillId: SkillId | string): SkillDef | undefined {
  return SKILL_DEFS[skillId as SkillId];
}

export function getSkillDefOrThrow(skillId: SkillId | string): SkillDef {
  const def = getSkillDef(skillId);
  if (!def) {
    throw new Error(`Unknown skill: ${skillId}`);
  }
  return def;
}

export function getDefaultSkillLoadout(): Array<{ slot: SkillSlot; skillId: SkillId }> {
  return DEFAULT_SKILL_LOADOUT.map((entry) => ({ ...entry }));
}

export function getSkillRemainingCooldownMs(
  skillId: SkillId,
  cooldowns: SkillCooldownState | undefined,
  nowMs: number,
): number {
  const nextAvailableAtMs = cooldowns?.[skillId] ?? 0;
  return Math.max(0, nextAvailableAtMs - nowMs);
}

export function isSkillOnCooldown(
  skillId: SkillId,
  cooldowns: SkillCooldownState | undefined,
  nowMs: number,
): boolean {
  return getSkillRemainingCooldownMs(skillId, cooldowns, nowMs) > 0;
}

export function canCastSkill(context: SkillCastContext): SkillCastResult {
  const def = getSkillDef(context.skillId);
  if (!def) {
    return {
      ok: false,
      skillId: context.skillId,
      reason: "UNKNOWN_SKILL",
    };
  }

  const remainingCooldownMs = getSkillRemainingCooldownMs(def.id, context.cooldowns, context.nowMs);
  if (remainingCooldownMs > 0) {
    return {
      ok: false,
      skillId: def.id,
      reason: "COOLDOWN",
      remainingCooldownMs,
      nextAvailableAtMs: context.nowMs + remainingCooldownMs,
    };
  }

  return buildCastSuccess(def, context.nowMs);
}

export function castSkill(context: SkillCastContext): SkillCastResult {
  return canCastSkill(context);
}

function buildCastSuccess(def: SkillDef, startedAtMs: number): Extract<SkillCastResult, { ok: true }> {
  const durationMs = def.durationMs ?? 0;
  const endsAtMs = durationMs > 0 ? startedAtMs + durationMs : undefined;
  const activeEffect = endsAtMs === undefined ? undefined : buildActiveEffect(def, startedAtMs, endsAtMs);

  return {
    ok: true,
    skillId: def.id,
    startedAtMs,
    endsAtMs,
    nextAvailableAtMs: startedAtMs + def.cooldownMs,
    activeEffect,
  };
}

function buildActiveEffect(def: SkillDef, startedAtMs: number, endsAtMs: number): ActiveSkillEffect {
  return {
    skillId: def.id,
    kind: def.kind,
    startedAtMs,
    endsAtMs,
    tickIntervalMs: def.tickIntervalMs,
    damageMultiplier: def.damageMultiplier,
    bonusDamageMultiplier: def.bonusDamageMultiplier,
    range: def.range,
    width: def.width,
    radius: def.radius,
  };
}
