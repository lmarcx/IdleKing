"use client";

import { type SyntheticEvent, useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getResourceAssetPath, RESOURCE_FALLBACK_ASSET } from "@/lib/resource-assets";
import { useGameStore } from "@/store/game-store";
import { ALL_RESOURCES, getQty, type ResourceStock } from "@idleking/game-core/resources/types.js";

function getOrderedResourceRows(resources: ResourceStock) {
  return ALL_RESOURCES.map((id) => ({
    id,
    qty: getQty(resources, id),
  }));
}

function handleResourceIconError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.src.endsWith(RESOURCE_FALLBACK_ASSET)) return;
  image.src = RESOURCE_FALLBACK_ASSET;
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
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <img
                    alt={`Icône ${resource.id}`}
                    className="h-5 w-5 shrink-0 object-contain opacity-90 drop-shadow-[0_0_6px_rgba(201,166,84,0.18)]"
                    onError={handleResourceIconError}
                    src={getResourceAssetPath(resource.id)}
                  />
                  <span className="min-w-0 truncate">{resource.id}</span>
                </span>
                <span className="shrink-0 tabular-nums">{resource.qty}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </aside>
  );
}
