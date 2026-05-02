export type SkillId = "royal_beam" | "king_aura" | "royal_strike" | "war_cry";

export type SkillKind = "beam" | "aura" | "frontal_aoe" | "buff";

export type SkillSlot = 1 | 2 | 3 | 4;

export type SkillLevel = 0 | 1 | 2 | 3 | 4 | 5;

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

export type PlayerSkillProgress = {
  skillId: SkillId;
  level: SkillLevel;
  unlocked: boolean;
};

export type PlayerSkillsState = {
  skillPoints: number;
  skills: Record<SkillId, PlayerSkillProgress>;
  loadout: Record<SkillSlot, SkillId | null>;
};

export type SkillUpgradeStat =
  | "cooldownMs"
  | "durationMs"
  | "range"
  | "width"
  | "radius"
  | "tickIntervalMs"
  | "damageMultiplier"
  | "bonusDamageMultiplier";

export type SkillUpgradeEffect =
  | {
      stat: SkillUpgradeStat;
      op: "add";
      value: number;
    }
  | {
      stat: SkillUpgradeStat;
      op: "multiply";
      value: number;
    };

export type SkillUpgradeDef = {
  skillId: SkillId;
  level: Exclude<SkillLevel, 0 | 1>;
  effects: SkillUpgradeEffect[];
};

export type SkillUpgradeResult =
  | {
      ok: true;
      state: PlayerSkillsState;
      skillId: SkillId;
      previousLevel: SkillLevel;
      level: Exclude<SkillLevel, 0>;
      cost: number;
      skillPoints: number;
    }
  | {
      ok: false;
      state: PlayerSkillsState;
      skillId: SkillId | string;
      reason: "UNKNOWN_SKILL" | "MAX_LEVEL" | "INSUFFICIENT_SKILL_POINTS";
      currentLevel?: SkillLevel;
      requiredSkillPoints?: number;
      skillPoints?: number;
    };

export type SkillEquipResult =
  | {
      ok: true;
      state: PlayerSkillsState;
      skillId?: SkillId;
      slot: SkillSlot;
    }
  | {
      ok: false;
      state: PlayerSkillsState;
      skillId?: SkillId | string;
      slot: SkillSlot | number;
      reason: "UNKNOWN_SKILL" | "INVALID_SLOT" | "LOCKED_SKILL" | "ALREADY_EQUIPPED";
    };

export type SkillRespecResult = {
  ok: true;
  state: PlayerSkillsState;
  refundedSkillPoints: number;
  skillPoints: number;
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

export const SKILL_UPGRADE_COST_BY_LEVEL: Record<Exclude<SkillLevel, 0>, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 3,
  5: 5,
} as const;

export const SKILL_UPGRADE_DEFS: Record<SkillId, readonly SkillUpgradeDef[]> = {
  royal_beam: [
    { skillId: "royal_beam", level: 2, effects: [{ stat: "damageMultiplier", op: "multiply", value: 1.1 }] },
    { skillId: "royal_beam", level: 3, effects: [{ stat: "range", op: "add", value: 60 }] },
    { skillId: "royal_beam", level: 4, effects: [{ stat: "width", op: "add", value: 24 }] },
    { skillId: "royal_beam", level: 5, effects: [{ stat: "tickIntervalMs", op: "add", value: -50 }] },
  ],
  king_aura: [
    { skillId: "king_aura", level: 2, effects: [{ stat: "damageMultiplier", op: "multiply", value: 1.1 }] },
    { skillId: "king_aura", level: 3, effects: [{ stat: "radius", op: "add", value: 40 }] },
    { skillId: "king_aura", level: 4, effects: [{ stat: "durationMs", op: "add", value: 1000 }] },
    { skillId: "king_aura", level: 5, effects: [{ stat: "tickIntervalMs", op: "add", value: -200 }] },
  ],
  royal_strike: [
    { skillId: "royal_strike", level: 2, effects: [{ stat: "damageMultiplier", op: "multiply", value: 1.15 }] },
    { skillId: "royal_strike", level: 3, effects: [{ stat: "range", op: "add", value: 40 }] },
    { skillId: "royal_strike", level: 4, effects: [{ stat: "width", op: "add", value: 40 }] },
    { skillId: "royal_strike", level: 5, effects: [{ stat: "damageMultiplier", op: "multiply", value: 1.25 }] },
  ],
  war_cry: [
    { skillId: "war_cry", level: 2, effects: [{ stat: "bonusDamageMultiplier", op: "add", value: 0.05 }] },
    { skillId: "war_cry", level: 3, effects: [{ stat: "durationMs", op: "add", value: 1000 }] },
    { skillId: "war_cry", level: 4, effects: [{ stat: "cooldownMs", op: "add", value: -2000 }] },
    { skillId: "war_cry", level: 5, effects: [{ stat: "bonusDamageMultiplier", op: "add", value: 0.05 }] },
  ],
} as const;

const DEFAULT_SKILL_LOADOUT: ReadonlyArray<{ slot: SkillSlot; skillId: SkillId }> = [
  { slot: 1, skillId: "royal_beam" },
  { slot: 2, skillId: "king_aura" },
  { slot: 3, skillId: "royal_strike" },
  { slot: 4, skillId: "war_cry" },
] as const;

const PLAYER_SKILL_IDS: readonly SkillId[] = ["royal_beam", "king_aura", "royal_strike", "war_cry"] as const;

const DEFAULT_PLAYER_SKILL_LEVELS: Record<SkillId, SkillLevel> = {
  royal_beam: 0,
  king_aura: 0,
  royal_strike: 1,
  war_cry: 0,
} as const;

const DEFAULT_PLAYER_SKILL_LOADOUT: Record<SkillSlot, SkillId | null> = {
  1: "royal_strike",
  2: null,
  3: null,
  4: null,
} as const;

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

export function createDefaultPlayerSkillsState(): PlayerSkillsState {
  return {
    skillPoints: 0,
    skills: createDefaultPlayerSkillProgress(),
    loadout: clonePlayerSkillLoadout(DEFAULT_PLAYER_SKILL_LOADOUT),
  };
}

export function getSkillProgress(state: PlayerSkillsState, skillId: SkillId | string): PlayerSkillProgress | undefined {
  const progress = state.skills[skillId as SkillId];
  return progress ? { ...progress } : undefined;
}

export function isSkillUnlocked(state: PlayerSkillsState, skillId: SkillId | string): boolean {
  const progress = state.skills[skillId as SkillId];
  return Boolean(progress?.unlocked && progress.level > 0);
}

export function canUnlockOrUpgradeSkill(state: PlayerSkillsState, skillId: SkillId | string): SkillUpgradeResult {
  return getSkillUpgradePlan(state, skillId);
}

export function unlockOrUpgradeSkill(state: PlayerSkillsState, skillId: SkillId | string): SkillUpgradeResult {
  const plan = getSkillUpgradePlan(state, skillId);
  if (!plan.ok) return plan;

  const nextProgress: PlayerSkillProgress = {
    skillId: plan.skillId,
    level: plan.level,
    unlocked: true,
  };
  const nextState: PlayerSkillsState = {
    skillPoints: state.skillPoints - plan.cost,
    skills: {
      ...clonePlayerSkillProgress(state.skills),
      [plan.skillId]: nextProgress,
    },
    loadout: clonePlayerSkillLoadout(state.loadout),
  };

  return {
    ...plan,
    state: nextState,
    skillPoints: nextState.skillPoints,
  };
}

export function equipSkill(
  state: PlayerSkillsState,
  skillId: SkillId | string,
  slot: SkillSlot | number,
): SkillEquipResult {
  if (!isValidSkillSlot(slot)) {
    return { ok: false, state, skillId, slot, reason: "INVALID_SLOT" };
  }

  const def = getSkillDef(skillId);
  if (!def) {
    return { ok: false, state, skillId, slot, reason: "UNKNOWN_SKILL" };
  }

  if (!isSkillUnlocked(state, def.id)) {
    return { ok: false, state, skillId: def.id, slot, reason: "LOCKED_SKILL" };
  }

  const currentSlot = findEquippedSkillSlot(state, def.id);
  if (currentSlot !== undefined && currentSlot !== slot) {
    return { ok: false, state, skillId: def.id, slot, reason: "ALREADY_EQUIPPED" };
  }

  return {
    ok: true,
    state: {
      ...state,
      skills: clonePlayerSkillProgress(state.skills),
      loadout: {
        ...clonePlayerSkillLoadout(state.loadout),
        [slot]: def.id,
      },
    },
    skillId: def.id,
    slot,
  };
}

export function unequipSkill(state: PlayerSkillsState, slot: SkillSlot | number): SkillEquipResult {
  if (!isValidSkillSlot(slot)) {
    return { ok: false, state, slot, reason: "INVALID_SLOT" };
  }

  return {
    ok: true,
    state: {
      ...state,
      skills: clonePlayerSkillProgress(state.skills),
      loadout: {
        ...clonePlayerSkillLoadout(state.loadout),
        [slot]: null,
      },
    },
    slot,
  };
}

export function respecSkills(state: PlayerSkillsState): SkillRespecResult {
  const refundedSkillPoints = getSpentSkillPoints(state);
  const nextState = createDefaultPlayerSkillsState();
  nextState.skillPoints = state.skillPoints + refundedSkillPoints;

  return {
    ok: true,
    state: nextState,
    refundedSkillPoints,
    skillPoints: nextState.skillPoints,
  };
}

export function getEffectiveSkillDef(skillId: SkillId, state: PlayerSkillsState): SkillDef {
  const baseDef = { ...getSkillDefOrThrow(skillId) };
  const level = state.skills[skillId]?.level ?? DEFAULT_PLAYER_SKILL_LEVELS[skillId];
  if (level <= 0) return baseDef;

  return SKILL_UPGRADE_DEFS[skillId]
    .filter((upgrade) => upgrade.level <= level)
    .reduce((def, upgrade) => applySkillUpgradeDef(def, upgrade), baseDef);
}

export function getEffectiveSkillDefs(state: PlayerSkillsState): Record<SkillId, SkillDef> {
  return {
    royal_beam: getEffectiveSkillDef("royal_beam", state),
    king_aura: getEffectiveSkillDef("king_aura", state),
    royal_strike: getEffectiveSkillDef("royal_strike", state),
    war_cry: getEffectiveSkillDef("war_cry", state),
  };
}

export function getEquippedSkillLoadout(state: PlayerSkillsState): Record<SkillSlot, SkillId | null> {
  return {
    1: getEquippedUnlockedSkill(state, 1),
    2: getEquippedUnlockedSkill(state, 2),
    3: getEquippedUnlockedSkill(state, 3),
    4: getEquippedUnlockedSkill(state, 4),
  };
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

function createDefaultPlayerSkillProgress(): Record<SkillId, PlayerSkillProgress> {
  return PLAYER_SKILL_IDS.reduce(
    (acc, skillId) => {
      const level = DEFAULT_PLAYER_SKILL_LEVELS[skillId];
      acc[skillId] = {
        skillId,
        level,
        unlocked: level > 0,
      };
      return acc;
    },
    {} as Record<SkillId, PlayerSkillProgress>,
  );
}

function clonePlayerSkillProgress(
  skills: Record<SkillId, PlayerSkillProgress>,
): Record<SkillId, PlayerSkillProgress> {
  return {
    royal_beam: { ...skills.royal_beam },
    king_aura: { ...skills.king_aura },
    royal_strike: { ...skills.royal_strike },
    war_cry: { ...skills.war_cry },
  };
}

function clonePlayerSkillLoadout(loadout: Record<SkillSlot, SkillId | null>): Record<SkillSlot, SkillId | null> {
  return {
    1: loadout[1],
    2: loadout[2],
    3: loadout[3],
    4: loadout[4],
  };
}

function getSkillUpgradePlan(state: PlayerSkillsState, skillId: SkillId | string): SkillUpgradeResult {
  const def = getSkillDef(skillId);
  if (!def) {
    return { ok: false, state, skillId, reason: "UNKNOWN_SKILL" };
  }

  const currentLevel = state.skills[def.id]?.level ?? 0;
  if (currentLevel >= 5) {
    return { ok: false, state, skillId: def.id, reason: "MAX_LEVEL", currentLevel };
  }

  const nextLevel = (currentLevel + 1) as Exclude<SkillLevel, 0>;
  const cost = SKILL_UPGRADE_COST_BY_LEVEL[nextLevel];
  if (state.skillPoints < cost) {
    return {
      ok: false,
      state,
      skillId: def.id,
      reason: "INSUFFICIENT_SKILL_POINTS",
      currentLevel,
      requiredSkillPoints: cost,
      skillPoints: state.skillPoints,
    };
  }

  return {
    ok: true,
    state,
    skillId: def.id,
    previousLevel: currentLevel,
    level: nextLevel,
    cost,
    skillPoints: state.skillPoints,
  };
}

function isValidSkillSlot(slot: SkillSlot | number): slot is SkillSlot {
  return slot === 1 || slot === 2 || slot === 3 || slot === 4;
}

function findEquippedSkillSlot(state: PlayerSkillsState, skillId: SkillId): SkillSlot | undefined {
  if (state.loadout[1] === skillId) return 1;
  if (state.loadout[2] === skillId) return 2;
  if (state.loadout[3] === skillId) return 3;
  if (state.loadout[4] === skillId) return 4;
  return undefined;
}

function getSpentSkillPoints(state: PlayerSkillsState): number {
  return PLAYER_SKILL_IDS.reduce((total, skillId) => {
    const defaultLevel = DEFAULT_PLAYER_SKILL_LEVELS[skillId];
    const currentLevel = state.skills[skillId]?.level ?? defaultLevel;
    let spent = 0;

    for (let level = defaultLevel + 1; level <= currentLevel; level += 1) {
      spent += SKILL_UPGRADE_COST_BY_LEVEL[level as Exclude<SkillLevel, 0>] ?? 0;
    }

    return total + spent;
  }, 0);
}

function getEquippedUnlockedSkill(state: PlayerSkillsState, slot: SkillSlot): SkillId | null {
  const skillId = state.loadout[slot];
  if (!skillId) return null;
  return isSkillUnlocked(state, skillId) ? skillId : null;
}

function applySkillUpgradeDef(def: SkillDef, upgrade: SkillUpgradeDef): SkillDef {
  return upgrade.effects.reduce((nextDef, effect) => applySkillUpgradeEffect(nextDef, effect), def);
}

function applySkillUpgradeEffect(def: SkillDef, effect: SkillUpgradeEffect): SkillDef {
  const currentValue = def[effect.stat] ?? 0;
  const nextValue =
    effect.op === "add" ? currentValue + effect.value : currentValue * effect.value;

  return {
    ...def,
    [effect.stat]: normalizeSkillNumber(Math.max(0, nextValue)),
  };
}

function normalizeSkillNumber(value: number): number {
  return Number(value.toFixed(6));
}
