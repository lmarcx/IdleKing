export const SKILL_IDS = [
  "SK-001",
  "SK-002",
  "SK-003",
  "SK-004",
  "SK-005",
  "SK-006",
  "SK-007",
  "SK-008",
  "SK-009",
  "SK-010",
  "SK-011",
  "SK-012",
  "SK-013",
  "SK-014",
  "SK-015",
  "SK-016",
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export function isSkillId(skillId: unknown): skillId is SkillId {
  return typeof skillId === "string" && (SKILL_IDS as readonly string[]).includes(skillId);
}

export const SKILL_CATEGORIES = [
  "attack",
  "movement",
  "defense",
  "utility",
  "summon",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const SKILL_ELEMENTS = [
  "neutral",
  "fire",
  "water",
  "ice",
  "wind",
  "electricity",
  "ground",
  "light",
  "dark",
] as const;

export type SkillElement = (typeof SKILL_ELEMENTS)[number];

export const SKILL_TARGETING_MODES = [
  "free_aim",
  "ground_target",
  "cone",
  "line",
  "aoe",
  "self_cast",
  "enemy_cast",
  "auto_target",
] as const;

export type SkillTargeting = (typeof SKILL_TARGETING_MODES)[number];

export type SkillDefinition = Readonly<{
  id: SkillId;
  name: string;
  category: SkillCategory;
  element: SkillElement;
  targeting: SkillTargeting;
  manaCost: number;
  cooldownSeconds: number;
  basePower: number;
  description: string;
}>;

export type SkillCooldownState = Partial<Record<SkillId, number>>;

export type SkillCastOptions = Readonly<{
  nowMs: number;
  ringSkillScaling?: number;
}>;

export type SkillCastDamageInput = Readonly<{
  skillDamageMultiplier: number;
  ringSkillScaling?: number;
}>;

export type SkillCastFailureReason =
  | "unknown_skill"
  | "invalid_ring"
  | "not_enough_mana"
  | "cooldown";
