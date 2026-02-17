import { computeCombatScore } from "./combatScore";
import { TIER_MULTIPLIERS } from "./constants";
export function computePowerFromStats(stats, tier) {
    const combatScore = computeCombatScore(stats);
    const tierMultiplier = TIER_MULTIPLIERS[Math.max(0, tier - 1)] ?? 1;
    const totalScore = combatScore * tierMultiplier;
    const power = Math.round(Math.pow(totalScore, 1.08));
    return {
        combatScore,
        tierMultiplier,
        power,
    };
}
export function computeTotalPower(worldStats, loadoutStats, tier) {
    const worldScore = computeCombatScore(worldStats);
    const loadoutScore = computeCombatScore(loadoutStats);
    const tierMultiplier = TIER_MULTIPLIERS[Math.max(0, tier - 1)] ?? 1;
    const totalScore = (worldScore + loadoutScore) * tierMultiplier;
    const power = Math.round(Math.pow(totalScore, 1.08));
    return {
        worldPower: Math.round(Math.pow(worldScore * tierMultiplier, 1.08)),
        loadoutPower: Math.round(Math.pow(loadoutScore * tierMultiplier, 1.08)),
        totalPower: power,
    };
}
//# sourceMappingURL=powerEngine.js.map