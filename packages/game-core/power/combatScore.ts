import {
  K_RESIST_REF,
  K_ELEMENTAL_REF,
  BASE_ATTACK_INTERVAL,
  MIN_ATTACK_INTERVAL,
  COMBAT_SCORE_DPS_EXPONENT,
  COMBAT_SCORE_EHP_EXPONENT,
  PIERCE_POWER_WEIGHT,
  PIERCE_RATING_REF,
} from "./constants.js";
import { CombatStats } from "./types.js";
import { computeCritMultiplier } from "./crit.js";
import { computeDefenseMitigation } from "./statsModel.js";

function computeAttackInterval(speedRating: number) {
  const interval =
    BASE_ATTACK_INTERVAL / (1 + speedRating / 100);

  return Math.max(interval, MIN_ATTACK_INTERVAL);
}

function computePierce(pierceRating: number) {
  return pierceRating / (pierceRating + PIERCE_RATING_REF);
}

function computeElementalTotal(stats: CombatStats) {
  return Object.values(stats.elemental).reduce((a, b) => a + b, 0);
}

function computeResistFactor(stats: CombatStats) {
  const values = Object.values(stats.resists);
  if (values.length === 0) return 1;

  const avg =
    values.reduce((a, b) => a + b, 0) / values.length;

  return 1 + avg / (avg + K_RESIST_REF);
}

export function computeCombatScore(stats: CombatStats) {
  const attackInterval = computeAttackInterval(stats.speedRating);
  const speedFactor = 1 / attackInterval;

  const pierce = computePierce(stats.pierceRating);
  const pierceFactor = 1 + PIERCE_POWER_WEIGHT * pierce;

  const critFactor = computeCritMultiplier(
    stats.critChance,
    stats.critDmg
  );

  const elementalTotal = computeElementalTotal(stats);
  const elemFactor = 1 + elementalTotal / K_ELEMENTAL_REF;

  const resistFactor = computeResistFactor(stats);

  const ehp =
    stats.hp *
    (1 + computeDefenseMitigation(stats.armor)) *
    resistFactor;

  const dps =
    stats.attack *
    elemFactor *
    speedFactor *
    critFactor *
    pierceFactor;

  return Math.pow(ehp, COMBAT_SCORE_EHP_EXPONENT) * Math.pow(dps, COMBAT_SCORE_DPS_EXPONENT);
}
