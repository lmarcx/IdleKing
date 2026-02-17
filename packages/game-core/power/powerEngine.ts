import { computeCombatScore } from "./combatScore.js";
import { TIER_MULTIPLIERS } from "./constants.js";
import { CombatStats, PowerBreakdown } from "./types.js";

export function computePowerFromStats(
  stats: CombatStats,
  tier: number
): PowerBreakdown {
  const combatScore = computeCombatScore(stats);

  const tierMultiplier =
    TIER_MULTIPLIERS[Math.max(0, tier - 1)] ?? 1;

  const totalScore = combatScore * tierMultiplier;

  const power = Math.round(Math.pow(totalScore, 1.08));

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

  const power = Math.round(Math.pow(totalScore, 1.08));

  return {
    worldPower: Math.round(Math.pow(worldScore * tierMultiplier, 1.08)),
    loadoutPower: Math.round(
      Math.pow(loadoutScore * tierMultiplier, 1.08)
    ),
    totalPower: power,
  };
}
