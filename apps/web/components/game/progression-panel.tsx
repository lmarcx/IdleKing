"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";

export function ProgressionPanel() {
  const progression = useGameStore((s) => s.state.progression);

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
      </CardContent>
    </Card>
  );
}
