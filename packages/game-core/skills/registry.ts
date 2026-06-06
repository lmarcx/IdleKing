import { SKILL_BALANCING_PLACEHOLDERS } from "./balancing.js";
import {
  SKILL_CATEGORIES,
  SKILL_ELEMENTS,
  SKILL_IDS,
  SKILL_TARGETING_MODES,
  type SkillDefinition,
  type SkillId,
} from "./types.js";

export const SKILL_REGISTRY: Readonly<Record<SkillId, SkillDefinition>> = {
  "SK-001": {
    id: "SK-001",
    name: "Shadow Slash",
    category: "attack",
    element: "dark",
    targeting: "cone",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-001"],
    description: "Quick shadow-infused melee arc in front of the player.",
  },
  "SK-002": {
    id: "SK-002",
    name: "Flame Burst",
    category: "attack",
    element: "fire",
    targeting: "aoe",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-002"],
    description: "Explosive burst of fire at the target area.",
  },
  "SK-003": {
    id: "SK-003",
    name: "Frost Lance",
    category: "attack",
    element: "ice",
    targeting: "line",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-003"],
    description: "Launches a piercing ice projectile.",
  },
  "SK-004": {
    id: "SK-004",
    name: "Arcane Bolt",
    category: "attack",
    element: "neutral",
    targeting: "auto_target",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-004"],
    description: "Fast magical bolt that snaps to the nearest target.",
  },
  "SK-005": {
    id: "SK-005",
    name: "Water Surge",
    category: "attack",
    element: "water",
    targeting: "enemy_cast",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-005"],
    description: "Water erupts beneath a selected enemy.",
  },
  "SK-006": {
    id: "SK-006",
    name: "Shadow Step",
    category: "movement",
    element: "dark",
    targeting: "free_aim",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-006"],
    description: "Short-range teleport toward target direction.",
  },
  "SK-007": {
    id: "SK-007",
    name: "Wind Leap",
    category: "movement",
    element: "wind",
    targeting: "free_aim",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-007"],
    description: "Quick leap toward target direction.",
  },
  "SK-008": {
    id: "SK-008",
    name: "Frost Dash",
    category: "movement",
    element: "ice",
    targeting: "free_aim",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-008"],
    description: "Magical dash leaving frozen traces behind.",
  },
  "SK-009": {
    id: "SK-009",
    name: "Ice Barrier",
    category: "defense",
    element: "ice",
    targeting: "self_cast",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-009"],
    description: "Creates a temporary protective ice shield.",
  },
  "SK-010": {
    id: "SK-010",
    name: "Light Ward",
    category: "defense",
    element: "light",
    targeting: "self_cast",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-010"],
    description: "Protective aura reducing incoming damage.",
  },
  "SK-011": {
    id: "SK-011",
    name: "Guard Pulse",
    category: "defense",
    element: "ground",
    targeting: "aoe",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-011"],
    description: "Creates a defensive shockwave around the player.",
  },
  "SK-012": {
    id: "SK-012",
    name: "War Cry",
    category: "utility",
    element: "neutral",
    targeting: "self_cast",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-012"],
    description: "Temporarily increases offensive power.",
  },
  "SK-013": {
    id: "SK-013",
    name: "Focus Field",
    category: "utility",
    element: "light",
    targeting: "aoe",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-013"],
    description: "Creates a field improving Mana regeneration.",
  },
  "SK-014": {
    id: "SK-014",
    name: "Soul Mark",
    category: "utility",
    element: "dark",
    targeting: "enemy_cast",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-014"],
    description: "Marks a target, increasing damage taken.",
  },
  "SK-015": {
    id: "SK-015",
    name: "Spectral Hound",
    category: "summon",
    element: "dark",
    targeting: "self_cast",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-015"],
    description: "Summons a temporary spectral hound.",
  },
  "SK-016": {
    id: "SK-016",
    name: "Frozen Wisp",
    category: "summon",
    element: "ice",
    targeting: "self_cast",
    ...SKILL_BALANCING_PLACEHOLDERS["SK-016"],
    description: "Summons a temporary frost spirit.",
  },
} as const;

export function getSkillDefinition(
  skillId: SkillId | string
): SkillDefinition | undefined {
  return SKILL_REGISTRY[skillId as SkillId];
}

export function getSkillDefinitionOrThrow(
  skillId: SkillId | string
): SkillDefinition {
  const skillDefinition = getSkillDefinition(skillId);
  if (!skillDefinition) {
    throw new Error(`Unknown MVP skill: ${skillId}`);
  }
  return skillDefinition;
}

export function validateSkillRegistry(
  definitions: readonly SkillDefinition[] = Object.values(SKILL_REGISTRY)
): void {
  const seenIds = new Set<string>();
  const canonicalIds = new Set<string>(SKILL_IDS);
  const validCategories = new Set<string>(SKILL_CATEGORIES);
  const validElements = new Set<string>(SKILL_ELEMENTS);
  const validTargetingModes = new Set<string>(SKILL_TARGETING_MODES);

  for (const skillDefinition of definitions) {
    if (!/^SK-0\d{2}$/.test(skillDefinition.id)) {
      throw new Error(`Invalid MVP skill id format: ${skillDefinition.id}`);
    }
    if (!canonicalIds.has(skillDefinition.id)) {
      throw new Error(`Unknown MVP skill id: ${skillDefinition.id}`);
    }
    if (seenIds.has(skillDefinition.id)) {
      throw new Error(`Duplicate MVP skill id: ${skillDefinition.id}`);
    }
    if (!validCategories.has(skillDefinition.category)) {
      throw new Error(`Invalid category for ${skillDefinition.id}: ${skillDefinition.category}`);
    }
    if (!validElements.has(skillDefinition.element)) {
      throw new Error(`Invalid element for ${skillDefinition.id}: ${skillDefinition.element}`);
    }
    if (!validTargetingModes.has(skillDefinition.targeting)) {
      throw new Error(`Invalid targeting for ${skillDefinition.id}: ${skillDefinition.targeting}`);
    }
    if (!Number.isFinite(skillDefinition.manaCost) || skillDefinition.manaCost <= 0) {
      throw new Error(`Invalid Mana cost for ${skillDefinition.id}`);
    }
    if (
      !Number.isFinite(skillDefinition.cooldownSeconds) ||
      skillDefinition.cooldownSeconds < 0
    ) {
      throw new Error(`Invalid cooldown for ${skillDefinition.id}`);
    }
    seenIds.add(skillDefinition.id);
  }

  if (definitions.length !== SKILL_IDS.length) {
    throw new Error(
      `Invalid MVP skill registry size: expected ${SKILL_IDS.length}, received ${definitions.length}`
    );
  }
}

validateSkillRegistry();
