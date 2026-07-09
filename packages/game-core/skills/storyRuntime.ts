import type { SkillId, SkillTargeting } from "./types.js";

export type StorySkillAttackShape = "cone" | "line" | "aoe" | "auto_target" | "enemy_cast";
export type StorySkillMovementMode = "step" | "leap" | "dash";
export type StorySkillDefenseKind = "shield" | "barrier";
export type StorySkillUtilityKind = "damage_buff" | "mana_regen_buff" | "enemy_vulnerability_debuff";

export type StorySkillAttackProfile = Readonly<{
  shape: StorySkillAttackShape;
  range: number;
  radius?: number;
  width?: number;
  halfAngleRadians?: number;
  maxTargets?: number;
}>;

export type StorySkillMovementProfile = Readonly<{
  mode: StorySkillMovementMode;
  distance: number;
  durationMs: number;
}>;

export type StorySkillDefenseProfile = Readonly<{
  kind: StorySkillDefenseKind;
  durationMs: number;
  incomingDamageMultiplier: number;
}>;

export type StorySkillUtilityProfile = Readonly<{
  kind: StorySkillUtilityKind;
  durationMs: number;
  damageMultiplier?: number;
  incomingDamageMultiplier?: number;
  manaRegenPerSecond?: number;
  range?: number;
}>;

export type StorySkillSummonProfile = Readonly<{
  stubId: "spectral_hound" | "frozen_wisp";
  durationMs: number;
}>;

export type StorySkillRuntimeProfile = Readonly<{
  skillId: SkillId;
  targeting: SkillTargeting;
  attack?: StorySkillAttackProfile;
  movement?: StorySkillMovementProfile;
  defense?: StorySkillDefenseProfile;
  utility?: StorySkillUtilityProfile;
  summon?: StorySkillSummonProfile;
}>;

/**
 * Story runtime MVP behavior only. Values are intentionally small, readable
 * placeholders until the balancing pass replaces them.
 */
export const STORY_SKILL_RUNTIME_PROFILES: Readonly<Record<SkillId, StorySkillRuntimeProfile>> = {
  "SK-001": {
    skillId: "SK-001",
    targeting: "cone",
    attack: { shape: "cone", range: 170, halfAngleRadians: 0.7 },
  },
  "SK-002": {
    skillId: "SK-002",
    targeting: "aoe",
    attack: { shape: "aoe", range: 280, radius: 92 },
  },
  "SK-003": {
    skillId: "SK-003",
    targeting: "line",
    attack: { shape: "line", range: 360, width: 64 },
  },
  "SK-004": {
    skillId: "SK-004",
    targeting: "auto_target",
    attack: { shape: "auto_target", range: 420, maxTargets: 1 },
  },
  "SK-005": {
    skillId: "SK-005",
    targeting: "enemy_cast",
    attack: { shape: "enemy_cast", range: 360, radius: 76, maxTargets: 1 },
  },
  "SK-006": {
    skillId: "SK-006",
    targeting: "free_aim",
    movement: { mode: "step", distance: 118, durationMs: 360 },
  },
  "SK-007": {
    skillId: "SK-007",
    targeting: "free_aim",
    movement: { mode: "leap", distance: 178, durationMs: 520 },
  },
  "SK-008": {
    skillId: "SK-008",
    targeting: "free_aim",
    movement: { mode: "dash", distance: 150, durationMs: 420 },
  },
  "SK-009": {
    skillId: "SK-009",
    targeting: "self_cast",
    defense: { kind: "shield", durationMs: 5_000, incomingDamageMultiplier: 0.62 },
  },
  "SK-010": {
    skillId: "SK-010",
    targeting: "self_cast",
    defense: { kind: "barrier", durationMs: 6_000, incomingDamageMultiplier: 0.72 },
  },
  "SK-011": {
    skillId: "SK-011",
    targeting: "aoe",
    defense: { kind: "barrier", durationMs: 4_500, incomingDamageMultiplier: 0.8 },
  },
  "SK-012": {
    skillId: "SK-012",
    targeting: "self_cast",
    utility: { kind: "damage_buff", durationMs: 6_000, damageMultiplier: 1.25 },
  },
  "SK-013": {
    skillId: "SK-013",
    targeting: "aoe",
    utility: { kind: "mana_regen_buff", durationMs: 7_000, manaRegenPerSecond: 8 },
  },
  "SK-014": {
    skillId: "SK-014",
    targeting: "enemy_cast",
    utility: {
      kind: "enemy_vulnerability_debuff",
      durationMs: 6_000,
      incomingDamageMultiplier: 1.22,
      range: 360,
    },
  },
  "SK-015": {
    skillId: "SK-015",
    targeting: "self_cast",
    summon: { stubId: "spectral_hound", durationMs: 8_000 },
  },
  "SK-016": {
    skillId: "SK-016",
    targeting: "self_cast",
    summon: { stubId: "frozen_wisp", durationMs: 8_000 },
  },
} as const;

export function getStorySkillRuntimeProfile(skillId: SkillId): StorySkillRuntimeProfile {
  return STORY_SKILL_RUNTIME_PROFILES[skillId];
}
