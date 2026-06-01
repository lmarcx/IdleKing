import {
  BASE_MANA_REGEN,
  BASE_MAX_MANA,
  BASE_MAX_STAMINA,
  BASE_STAMINA_REGEN,
  COOLDOWN_REDUCTION_CAP,
  CRIT_CHANCE_CAP,
  CRIT_DAMAGE_DEFAULT,
  DEF_MITIGATION_K,
} from "./constants.js";

export type BaseStats = {
  hp: number;
  atk: number;
  def: number;
  speed: number;
};

export type AdvancedStats = {
  critChance: number;
  critDamage: number;
  cooldownReduction: number;
  manaRegen: number;
  staminaRegen: number;
};

export type StatsModifiers = {
  base?: Partial<BaseStats>;
  advanced?: Partial<AdvancedStats>;
  maxMana?: number;
  maxStamina?: number;
};

export type DerivedStats = {
  base: BaseStats;
  resources: {
    maxHp: number;
    maxMana: number;
    maxStamina: number;
  };
  advanced: AdvancedStats;
  defenseMitigation: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function nonNegative(value: number): number {
  return Math.max(0, value);
}

export function capCritChance(critChance: number): number {
  return clamp(critChance, 0, CRIT_CHANCE_CAP);
}

export function capCooldownReduction(cooldownReduction: number): number {
  return clamp(cooldownReduction, 0, COOLDOWN_REDUCTION_CAP);
}

export function getCritDamage(critDamage = CRIT_DAMAGE_DEFAULT): number {
  return nonNegative(critDamage);
}

/**
 * DEF mitigation has diminishing returns and never removes a flat damage amount.
 * DEF_MITIGATION_K is a DEFERRED balancing placeholder.
 */
export function computeDefenseMitigation(def: number): number {
  const normalizedDef = nonNegative(def);
  return normalizedDef / (normalizedDef + DEF_MITIGATION_K);
}

/**
 * Derived combat stats are calculated from persisted base stats and transient modifiers.
 * Neither input object is mutated.
 */
export function deriveStats(baseStats: BaseStats, modifiers: StatsModifiers = {}): DerivedStats {
  const baseModifiers = modifiers.base ?? {};
  const advancedModifiers = modifiers.advanced ?? {};

  const base: BaseStats = {
    hp: nonNegative(baseStats.hp + (baseModifiers.hp ?? 0)),
    atk: nonNegative(baseStats.atk + (baseModifiers.atk ?? 0)),
    def: nonNegative(baseStats.def + (baseModifiers.def ?? 0)),
    speed: nonNegative(baseStats.speed + (baseModifiers.speed ?? 0)),
  };

  const advanced: AdvancedStats = {
    critChance: capCritChance(advancedModifiers.critChance ?? 0),
    critDamage: getCritDamage(CRIT_DAMAGE_DEFAULT + (advancedModifiers.critDamage ?? 0)),
    cooldownReduction: capCooldownReduction(advancedModifiers.cooldownReduction ?? 0),
    manaRegen: nonNegative(BASE_MANA_REGEN + (advancedModifiers.manaRegen ?? 0)),
    staminaRegen: nonNegative(BASE_STAMINA_REGEN + (advancedModifiers.staminaRegen ?? 0)),
  };

  return {
    base,
    resources: {
      maxHp: base.hp,
      maxMana: nonNegative(BASE_MAX_MANA + (modifiers.maxMana ?? 0)),
      maxStamina: nonNegative(BASE_MAX_STAMINA + (modifiers.maxStamina ?? 0)),
    },
    advanced,
    defenseMitigation: computeDefenseMitigation(base.def),
  };
}
