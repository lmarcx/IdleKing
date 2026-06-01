import type { CombatStats, Element } from "./types.js";
import {
  K_RESIST_REF,
  K_ELEMENTAL_REF,
  BASE_ATTACK_INTERVAL,
  MIN_ATTACK_INTERVAL,
  CRIT_DAMAGE_DEFAULT,
  ITEM_POWER_EXPONENT,
  ITEM_SCORE_DEFENSE_EXPONENT,
  ITEM_SCORE_DEFENSE_WEIGHT,
  ITEM_SCORE_OFFENSE_EXPONENT,
  ITEM_SCORE_OFFENSE_WEIGHT,
  PIERCE_POWER_WEIGHT,
  PIERCE_RATING_REF,
} from "./constants.js";
import { computeCritMultiplier } from "./crit.js";
import { TIER_MULTIPLIERS } from "./constants.js";
import { computeDefenseMitigation } from "./statsModel.js";

export type ItemScoreBreakdown = {
  offense: number;
  defense: number;
  total: number;
};

/**
 * ItemPower is a UI/meta score for comparing items.
 * Unlike player CombatScore, it must NOT become zero just because an item lacks HP or ATTACK.
 *
 * Design:
 * - offense score uses DPS-like factors (attack, elemental, speed, crit, pierce)
 * - defense score uses EHP-like factors (hp, armor, resists)
 * - total = weighted sum of powered components (so either side can contribute)
 */

function computeAttackInterval(speedRating: number) {
  const interval = BASE_ATTACK_INTERVAL / (1 + speedRating / 100);
  return Math.max(interval, MIN_ATTACK_INTERVAL);
}

function computePierce(pierceRating: number) {
  return pierceRating / (pierceRating + PIERCE_RATING_REF);
}

function elementalTotal(stats: CombatStats) {
  return Object.values(stats.elemental).reduce((a, b) => a + b, 0);
}

function resistFactorAvg(stats: CombatStats) {
  const values = Object.values(stats.resists);
  if (values.length === 0) return 1;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return 1 + avg / (avg + K_RESIST_REF);
}

export function computeItemScore(stats: CombatStats): ItemScoreBreakdown {
  // OFFENSE
  const attackInterval = computeAttackInterval(stats.speedRating);
  const speedFactor = 1 / attackInterval;

  const pierce = computePierce(stats.pierceRating);
  const pierceFactor = 1 + PIERCE_POWER_WEIGHT * pierce;

  const critFactor = computeCritMultiplier(stats.critChance, stats.critDmg);

  const elem = elementalTotal(stats);
  const elemFactor = 1 + elem / K_ELEMENTAL_REF;

  const offense =
    Math.max(0, stats.attack) *
    elemFactor *
    speedFactor *
    critFactor *
    pierceFactor;

  // DEFENSE
  const defense =
    Math.max(0, stats.hp) *
    (1 + computeDefenseMitigation(stats.armor)) *
    resistFactorAvg(stats);

  // Weighted sum (so one side can be 0 without killing the total)
  // Defaults: offense 70%, defense 30%
  const total =
    Math.pow(offense, ITEM_SCORE_OFFENSE_EXPONENT) * ITEM_SCORE_OFFENSE_WEIGHT +
    Math.pow(defense, ITEM_SCORE_DEFENSE_EXPONENT) * ITEM_SCORE_DEFENSE_WEIGHT;

  return { offense, defense, total };
}

export function computeItemPowerFromStats(stats: CombatStats, tier: number) {
  const { total } = computeItemScore(stats);

  const tierMultiplier = TIER_MULTIPLIERS[Math.max(0, tier - 1)] ?? 1;

  // Slightly gentler exponent than player power
  const power = Math.round(Math.pow(total * tierMultiplier, ITEM_POWER_EXPONENT));

  return power;
}

/**
 * Convenience helper: create a CombatStats skeleton with 0 values (useful when mapping itemStats).
 */
export function emptyCombatStats(): CombatStats {
  const resists: Record<Element, number> = {
    FIRE: 0,
    ICE: 0,
    LIGHTNING: 0,
    VOID: 0,
  };
  const elemental: Record<Element, number> = {
    FIRE: 0,
    ICE: 0,
    LIGHTNING: 0,
    VOID: 0,
  };

  return {
    hp: 0,
    attack: 0,
    armor: 0,
    resists,
    elemental,
    critChance: 0,
    critDmg: CRIT_DAMAGE_DEFAULT,
    speedRating: 0,
    pierceRating: 0,
  };
}
