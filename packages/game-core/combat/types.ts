import type { Element, CombatStats } from "../power/types.js";

export type CombatEntity = {
  name: string;
  stats: CombatStats;

  hpMax: number;
  hp: number;
};

export type StaminaState = {
  max: number;
  value: number;
  regenPerSec: number;
};

export type SkillId = "STRIKE" | "VOID_SPIKE" | "GUARD_BREAK";

export type SkillDef = {
  id: SkillId;
  name: string;

  element?: Element;
  cooldownSec: number;
  staminaCost: number;

  baseDamageMultiplier: number;
  flatBonus?: number;

  pierceBonus?: number;
};

export type SkillCooldowns = Partial<Record<SkillId, number>>;

export type BossPhase = {
  id: number;
  hpThresholdPct: number;
  pattern: BossActionPattern;
};

export type BossActionPattern = {
  basicIntervalSec: number;
  specialIntervalSec: number;

  special: {
    name: string;
    element?: Element;
    multiplier: number;
  };
};

export type BossDef = {
  id: string;
  name: string;
  element?: Element;
  baseStats: CombatStats;
  phases: BossPhase[];
};

export type CombatTickInput = {
  dt: number;
  useSkill?: SkillId | null;
};

export type CombatLogEvent =
  | { t: number; type: "HIT"; source: "PLAYER" | "BOSS"; amount: number; crit: boolean; element?: Element }
  | { t: number; type: "SKILL"; id: SkillId; ok: boolean; reason?: "COOLDOWN" | "STAMINA" }
  | { t: number; type: "PHASE"; phaseId: number }
  | { t: number; type: "TIME_UP" };

export type CombatMode = "NORMAL" | "CHRONO";

export type CombatResult = {
  mode: CombatMode;
  winner: "PLAYER" | "BOSS"; // in CHRONO, winner is determined by hp if someone dies, otherwise "PLAYER" (survived)
  timeUp: boolean;

  durationSec: number;
  playerDamageTotal: number;
  bossDamageTotal: number;
  log: CombatLogEvent[];
};
