"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";
import { ResourcePanel } from "@/components/game/resource-panel";

export function RightSidebar() {
  const villagers = useGameStore((s) => s.state.villagers.list);
  const averageStamina =
    villagers.length > 0 ? Math.round(villagers.reduce((sum, villager) => sum + villager.stamina, 0) / villagers.length) : 0;

  return (
    <aside className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Villagers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Total</span>
            <span className="tabular-nums">{villagers.length}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Avg stamina</span>
            <span className="tabular-nums">{averageStamina}</span>
          </div>
        </CardContent>
      </Card>

      <ResourcePanel />
    </aside>
  );
}
