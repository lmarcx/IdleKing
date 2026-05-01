import type { LegacyCombatSkillDef } from "./types.js";

export const SKILLS: Record<string, LegacyCombatSkillDef> = {
  STRIKE: {
    id: "STRIKE",
    name: "Frappe Royale",
    cooldownSec: 2.5,
    staminaCost: 12,
    baseDamageMultiplier: 1.8,
  },
  VOID_SPIKE: {
    id: "VOID_SPIKE",
    name: "Pique du Vide",
    element: "VOID",
    cooldownSec: 6.0,
    staminaCost: 26,
    baseDamageMultiplier: 3.0,
    flatBonus: 15,
  },
  GUARD_BREAK: {
    id: "GUARD_BREAK",
    name: "Brise-Garde",
    cooldownSec: 10.0,
    staminaCost: 34,
    baseDamageMultiplier: 2.2,
    pierceBonus: 120,
  },
} as const;
