import type { EquipmentItem, EquipmentSlot } from "../items/types.js";
import type {
  AdvancedStats,
  BaseStats,
  StatsModifiers,
} from "../power/statsModel.js";

export type EquipmentSetId =
  | "vagabond"
  | "pleureur"
  | "maraudeur"
  | "docteur"
  | "flageleur"
  | "gardien_des_cendres"
  | "voltigeur"
  | "reine_blanche";

export type EquipmentSetStatus = "active" | "placeholder";

export type EquipmentSetAvailability =
  | "PROLOGUE"
  | "CHAPTER_1_START"
  | "CHAPTER_2_START"
  | "CHAPTER_2"
  | "DEFERRED";

export type EquipmentSetDefinition = {
  advancedStatBias?: Partial<AdvancedStats>;
  availability: EquipmentSetAvailability;
  baseStatBias: Partial<BaseStats>;
  id: EquipmentSetId;
  name: string;
  resourceStatBias?: Pick<StatsModifiers, "maxMana" | "maxStamina">;
  role: string;
  status: EquipmentSetStatus;
};

// DEFERRED balancing: per-piece stat-bias values are intentionally simple MVP placeholders.
export const EQUIPMENT_SET_BIAS_PLACEHOLDERS = {
  vagabond: {
    advancedStatBias: { staminaRegen: 1 },
    baseStatBias: { speed: 2 },
    resourceStatBias: { maxStamina: 8 },
  },
  pleureur: {
    baseStatBias: { def: 2, hp: 12 },
  },
  maraudeur: {
    advancedStatBias: { critChance: 0.01 },
    baseStatBias: { atk: 2, speed: 1 },
  },
  docteur: {
    advancedStatBias: { manaRegen: 1 },
    baseStatBias: { hp: 6 },
    resourceStatBias: { maxMana: 10 },
  },
} as const;

export const EQUIPMENT_SETS: readonly EquipmentSetDefinition[] = [
  {
    id: "vagabond",
    name: "Vagabond",
    status: "active",
    availability: "PROLOGUE",
    role: "mobility / exploration",
    ...EQUIPMENT_SET_BIAS_PLACEHOLDERS.vagabond,
  },
  {
    id: "pleureur",
    name: "Pleureur",
    status: "active",
    availability: "CHAPTER_1_START",
    role: "tank / mitigation",
    ...EQUIPMENT_SET_BIAS_PLACEHOLDERS.pleureur,
  },
  {
    id: "maraudeur",
    name: "Maraudeur",
    status: "active",
    availability: "CHAPTER_2_START",
    role: "burst / crit",
    ...EQUIPMENT_SET_BIAS_PLACEHOLDERS.maraudeur,
  },
  {
    id: "docteur",
    name: "Docteur",
    status: "active",
    availability: "CHAPTER_2",
    role: "support / heal / mana",
    ...EQUIPMENT_SET_BIAS_PLACEHOLDERS.docteur,
  },
  // DEFERRED balancing: placeholder sets are registered for references only and stay inert.
  {
    id: "flageleur",
    name: "Flageleur",
    status: "placeholder",
    availability: "DEFERRED",
    role: "placeholder",
    baseStatBias: {},
  },
  {
    id: "gardien_des_cendres",
    name: "Gardien des Cendres",
    status: "placeholder",
    availability: "DEFERRED",
    role: "placeholder",
    baseStatBias: {},
  },
  {
    id: "voltigeur",
    name: "Voltigeur",
    status: "placeholder",
    availability: "DEFERRED",
    role: "placeholder",
    baseStatBias: {},
  },
  {
    id: "reine_blanche",
    name: "Reine Blanche",
    status: "placeholder",
    availability: "DEFERRED",
    role: "placeholder",
    baseStatBias: {},
  },
];

const EQUIPMENT_SET_BY_ID = new Map(
  EQUIPMENT_SETS.map((setDefinition) => [setDefinition.id, setDefinition]),
);

// Rings are excluded until their dedicated scaling phase. Artifact remains present but inert.
const SET_BIAS_ELIGIBLE_SLOTS = new Set<EquipmentSlot>([
  "main_hand",
  "off_hand",
  "helmet",
  "chest",
  "cape",
  "gloves",
  "belt",
  "boots",
  "necklace",
]);

export function getEquipmentSetDefinition(
  setId: string,
): EquipmentSetDefinition | undefined {
  return EQUIPMENT_SET_BY_ID.get(setId as EquipmentSetId);
}

export function getEquipmentSetDefinitionOrThrow(
  setId: string,
): EquipmentSetDefinition {
  const setDefinition = getEquipmentSetDefinition(setId);
  if (!setDefinition) {
    throw new Error(`Unknown equipment set id: ${setId}`);
  }
  return setDefinition;
}

export function calculateEquipmentSetModifiersFromItems(
  items: readonly Pick<EquipmentItem, "setId" | "slot">[],
): StatsModifiers {
  const modifiers: StatsModifiers = {
    advanced: {},
    base: {},
    maxMana: 0,
    maxStamina: 0,
  };

  for (const item of items) {
    if (!item.setId) {
      continue;
    }

    const setDefinition = getEquipmentSetDefinitionOrThrow(item.setId);
    if (
      setDefinition.status !== "active" ||
      !SET_BIAS_ELIGIBLE_SLOTS.has(item.slot)
    ) {
      continue;
    }

    addBaseStatBias(modifiers.base!, setDefinition.baseStatBias);
    addAdvancedStatBias(modifiers.advanced!, setDefinition.advancedStatBias);
    modifiers.maxMana! += setDefinition.resourceStatBias?.maxMana ?? 0;
    modifiers.maxStamina! += setDefinition.resourceStatBias?.maxStamina ?? 0;
  }

  return modifiers;
}

function addBaseStatBias(
  target: Partial<BaseStats>,
  source: Partial<BaseStats>,
): void {
  target.atk = (target.atk ?? 0) + (source.atk ?? 0);
  target.def = (target.def ?? 0) + (source.def ?? 0);
  target.hp = (target.hp ?? 0) + (source.hp ?? 0);
  target.speed = (target.speed ?? 0) + (source.speed ?? 0);
}

function addAdvancedStatBias(
  target: Partial<AdvancedStats>,
  source: Partial<AdvancedStats> | undefined,
): void {
  target.cooldownReduction =
    (target.cooldownReduction ?? 0) + (source?.cooldownReduction ?? 0);
  target.critChance = (target.critChance ?? 0) + (source?.critChance ?? 0);
  target.critDamage = (target.critDamage ?? 0) + (source?.critDamage ?? 0);
  target.manaRegen = (target.manaRegen ?? 0) + (source?.manaRegen ?? 0);
  target.staminaRegen =
    (target.staminaRegen ?? 0) + (source?.staminaRegen ?? 0);
}
