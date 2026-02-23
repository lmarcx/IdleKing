"use client";

import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";

export function RightHud() {
  const state = useGameStore((s) => s.state);

  const topResources = useMemo(() => {
    return Object.entries(state.resources ?? {})
      .map(([id, qty]) => ({ id, qty: Number(qty ?? 0) }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [state.resources]);

  return (
    <aside className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Progression</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>Player Lvl: {state.progression.playerLevel}</div>
          <div>Player XP: {state.progression.playerXp}</div>
          <div>World Lvl: {state.progression.worldLevel}</div>
          <div>World WXP: {state.progression.worldWxp}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Villagers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>Total: {state.villagers.list.length}</div>
          <div>
            Avg stamina:{" "}
            {state.villagers.list.length > 0
              ? Math.round(
                  state.villagers.list.reduce((sum, v) => sum + v.stamina, 0) /
                    state.villagers.list.length
                )
              : 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[45vh] overflow-auto text-sm">
          {topResources.length === 0 ? (
            <p className="text-muted-foreground">No resources yet.</p>
          ) : (
            <ul className="space-y-1">
              {topResources.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{r.id}</span>
                  <span>{Math.floor(r.qty)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
