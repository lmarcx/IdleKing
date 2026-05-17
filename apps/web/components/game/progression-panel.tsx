"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";
import { getCurrencyBalance } from "@idleking/game-core";

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
      </CardContent>
    </Card>
  );
}
