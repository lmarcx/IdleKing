import { CombatStats, PowerBreakdown } from "./types";
export declare function computePowerFromStats(stats: CombatStats, tier: number): PowerBreakdown;
export declare function computeTotalPower(worldStats: CombatStats, loadoutStats: CombatStats, tier: number): {
    worldPower: number;
    loadoutPower: number;
    totalPower: number;
};
//# sourceMappingURL=powerEngine.d.ts.map