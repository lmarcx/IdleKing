import { computeCombatScore } from "./combatScore.js";
import { POWER_EXPONENT, TIER_MULTIPLIERS } from "./constants.js";
import { CombatStats, PowerBreakdown } from "./types.js";

// POWER is a display/recommendation score only. Never use it as a strict gameplay gate.
export function computePowerFromStats(
  stats: CombatStats,
  tier: number
): PowerBreakdown {
  const combatScore = computeCombatScore(stats);

  const tierMultiplier =
    TIER_MULTIPLIERS[Math.max(0, tier - 1)] ?? 1;

  const totalScore = combatScore * tierMultiplier;

  const power = Math.round(Math.pow(totalScore, POWER_EXPONENT));

  return {
    combatScore,
    tierMultiplier,
    power,
  };
}

export function computeTotalPower(
  worldStats: CombatStats,
  loadoutStats: CombatStats,
  tier: number
) {
  const worldScore = computeCombatScore(worldStats);
  const loadoutScore = computeCombatScore(loadoutStats);

  const tierMultiplier =
    TIER_MULTIPLIERS[Math.max(0, tier - 1)] ?? 1;

  const totalScore =
    (worldScore + loadoutScore) * tierMultiplier;

  const power = Math.round(Math.pow(totalScore, POWER_EXPONENT));

  return {
    worldPower: Math.round(Math.pow(worldScore * tierMultiplier, POWER_EXPONENT)),
    loadoutPower: Math.round(
      Math.pow(loadoutScore * tierMultiplier, POWER_EXPONENT)
    ),
    totalPower: power,
  };
}
