import type { SkillId } from "./types.js";

export type SkillBalancingPlaceholder = Readonly<{
  manaCost: number;
  cooldownSeconds: number;
  basePower: number;
}>;

/**
 * DEFERRED balancing: centralize MVP tuning placeholders until the balancing
 * pass freezes Mana costs, cooldowns, and ring-scaled base power coefficients.
 */
export const SKILL_BALANCING_PLACEHOLDERS: Readonly<
  Record<SkillId, SkillBalancingPlaceholder>
> = {
  "SK-001": { manaCost: 20, cooldownSeconds: 4, basePower: 1.1 },
  "SK-002": { manaCost: 35, cooldownSeconds: 6, basePower: 1.5 },
  "SK-003": { manaCost: 30, cooldownSeconds: 5, basePower: 1.35 },
  "SK-004": { manaCost: 15, cooldownSeconds: 3, basePower: 0.9 },
  "SK-005": { manaCost: 35, cooldownSeconds: 6, basePower: 1.3 },
  "SK-006": { manaCost: 30, cooldownSeconds: 8, basePower: 0 },
  "SK-007": { manaCost: 25, cooldownSeconds: 7, basePower: 0 },
  "SK-008": { manaCost: 25, cooldownSeconds: 7, basePower: 0.6 },
  "SK-009": { manaCost: 45, cooldownSeconds: 15, basePower: 1 },
  "SK-010": { manaCost: 50, cooldownSeconds: 18, basePower: 1 },
  "SK-011": { manaCost: 40, cooldownSeconds: 14, basePower: 0.8 },
  "SK-012": { manaCost: 35, cooldownSeconds: 20, basePower: 1 },
  "SK-013": { manaCost: 40, cooldownSeconds: 18, basePower: 1 },
  "SK-014": { manaCost: 30, cooldownSeconds: 12, basePower: 1 },
  "SK-015": { manaCost: 60, cooldownSeconds: 30, basePower: 1 },
  "SK-016": { manaCost: 55, cooldownSeconds: 25, basePower: 1 },
} as const;
