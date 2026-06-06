"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";
import {
  CANONICAL_BUILDING_IDS,
  getBuildingState,
  getCurrencyBalance,
  type CanonicalBuildingId,
} from "@idleking/game-core";

const BUILDING_LABELS: Record<CanonicalBuildingId, string> = {
  BANK: "Bank",
  FARM: "Farm",
  FORGE: "Forge",
  FORUM: "Forum",
  KITCHEN: "Kitchen",
  MARKET: "Market",
  MINE: "Mine",
  TEMPLE: "Temple",
  TIME_GATE: "Time Gate",
};

function formatBuildingStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function ProgressionPanel() {
  const state = useGameStore((s) => s.state);
  const progression = state.progression;
  const ecuBalance = getCurrencyBalance(state.wallet, "ECU");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Progression</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Player Lvl</span>
          <span className="tabular-nums">{progression.playerLevel}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Player XP</span>
          <span className="tabular-nums">{progression.playerXp}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">World Lvl</span>
          <span className="tabular-nums">{progression.worldLevel}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">World WXP</span>
          <span className="tabular-nums">{progression.worldWxp}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">World Energy</span>
          <span className="tabular-nums">
            {Math.floor(state.world.energy.current)}/{Math.ceil(state.world.energy.max)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">World HP</span>
          <span className="tabular-nums">
            {Math.floor(state.world.hp.current)}/{Math.ceil(state.world.hp.max)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">ECU</span>
          <span className="tabular-nums">{ecuBalance}</span>
        </div>
        <div className="pt-2">
          <div className="mb-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">Buildings</div>
          <div className="grid gap-1">
            {CANONICAL_BUILDING_IDS.map((buildingId) => {
              const building = getBuildingState(state, buildingId);

              return (
                <div className="flex justify-between gap-3 text-xs" key={buildingId}>
                  <span className="text-muted-foreground">{BUILDING_LABELS[buildingId]}</span>
                  <span className="text-right tabular-nums">
                    {building.level}/{building.maxLevel} - {formatBuildingStatus(building.status)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
