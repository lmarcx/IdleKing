"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const BUILDING_IMAGE_SOURCES: Record<string, string> = {
  cornucopia: "/assets/kingdom/cornucopia.png",
  farm: "/assets/kingdom/farm.png",
  forge: "/assets/kingdom/forge.png",
  forum: "/assets/kingdom/forum.png",
  kitchen: "/assets/kingdom/kitchen.png",
  mine: "/assets/kingdom/mine.png",
  temple: "/assets/kingdom/temple.png",
};

type BuildingSpriteProps = {
  altLabel?: string;
  buildingId: string;
  className?: string;
};

export function BuildingSprite({ altLabel, buildingId, className }: BuildingSpriteProps) {
  const normalizedId = buildingId.toLowerCase();
  const imageSource = BUILDING_IMAGE_SOURCES[normalizedId];
  const label = altLabel ?? `${buildingId} building`;
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (!imageSource || failedSource === imageSource) {
    return (
      <div className={cn("ik-building-sprite", className)} role="img" aria-label={label}>
        <div className="ik-building-sprite-fallback" />
      </div>
    );
  }

  return (
    <div className={cn("ik-building-sprite", className)} role="img" aria-label={label}>
      <img
        alt=""
        aria-hidden="true"
        className="ik-building-sprite-img"
        draggable={false}
        onError={() => setFailedSource(imageSource)}
        src={imageSource}
      />
    </div>
  );
}
