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

export function ResourcePanel() {
  const resources = useGameStore((s) => s.state.resources);
  const orderedResources = useMemo(() => getOrderedResourceRows(resources), [resources]);

  return (
    <Card className="lg:min-h-[calc(100vh-180px)]">
      <CardHeader className="pb-2">
        <CardTitle>Resources</CardTitle>
      </CardHeader>
      <CardContent className="pb-3 text-sm">
        <ul className="space-y-0.5">
          {orderedResources.map((resource) => (
            <li key={resource.id} className="flex items-center justify-between gap-2 leading-6">
              <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <img
                  alt={`Icône ${resource.id}`}
                  className="h-4 w-4 shrink-0 object-contain opacity-90 drop-shadow-[0_0_6px_rgba(201,166,84,0.18)]"
                  onError={handleResourceIconError}
                  src={getResourceAssetPath(resource.id)}
                />
                <span className="min-w-0 truncate text-xs">{resource.id}</span>
              </span>
              <span className="shrink-0 text-xs tabular-nums">{resource.qty}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
