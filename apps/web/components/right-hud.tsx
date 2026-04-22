"use client";

import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";
import { ALL_RESOURCES, getQty, type ResourceStock } from "@idleking/game-core/resources/types.js";

function getOrderedResourceRows(resources: ResourceStock) {
  return ALL_RESOURCES.map((id) => ({
    id,
    qty: getQty(resources, id),
  }));
}

export function RightHud() {
  const state = useGameStore((s) => s.state);

  const orderedResources = useMemo(() => getOrderedResourceRows(state.resources), [state.resources]);

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
          <ul className="space-y-1">
            {orderedResources.map((resource) => (
              <li key={resource.id} className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{resource.id}</span>
                <span>{resource.qty}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </aside>
  );
}
