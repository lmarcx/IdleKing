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

  // damage model
  baseDamageMultiplier: number; // multiplies attacker.attack
  flatBonus?: number;

  // optional: utility hooks
  pierceBonus?: number; // additive pierceRating for this hit
};

export type SkillCooldowns = Partial<Record<SkillId, number>>; // remaining sec

export type BossPhase = {
  id: number;
  hpThresholdPct: number; // phase triggers when boss hp% <= threshold
  pattern: BossActionPattern;
};

export type BossActionPattern = {
  // simple MVP: boss attacks every X seconds and occasionally uses a special
  basicIntervalSec: number;
  specialIntervalSec: number;

  special: {
    name: string;
    element?: Element;
    multiplier: number; // multiplies boss.attack
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
  dt: number; // seconds
  useSkill?: SkillId | null; // player action this tick (at most one)
};

export type CombatLogEvent =
  | { t: number; type: "HIT"; source: "PLAYER" | "BOSS"; amount: number; crit: boolean; element?: Element }
  | { t: number; type: "SKILL"; id: SkillId; ok: boolean; reason?: "COOLDOWN" | "STAMINA" }
  | { t: number; type: "PHASE"; phaseId: number };

export type CombatResult = {
  winner: "PLAYER" | "BOSS";
  durationSec: number;
  playerDamageTotal: number;
  bossDamageTotal: number;
  log: CombatLogEvent[];
};
