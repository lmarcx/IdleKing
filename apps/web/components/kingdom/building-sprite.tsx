"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

const SHEET_WIDTH = 1643;
const SHEET_HEIGHT = 957;

type SpriteFrame = {
  height: number;
  width: number;
  x: number;
  y: number;
};

const SPRITE_FRAMES: Record<string, SpriteFrame> = {
  forum: { x: 14, y: 16, width: 391, height: 423 },
  farm: { x: 421, y: 16, width: 391, height: 423 },
  mine: { x: 828, y: 16, width: 391, height: 423 },
  temple: { x: 1234, y: 16, width: 392, height: 423 },
  kitchen: { x: 134, y: 499, width: 405, height: 436 },
  forge: { x: 575, y: 499, width: 421, height: 436 },
  cornucopia: { x: 1033, y: 499, width: 420, height: 436 },
};

type BuildingSpriteProps = {
  altLabel?: string;
  buildingId: string;
  className?: string;
};

type SpriteStyle = CSSProperties & {
  "--ik-sprite-position-x": string;
  "--ik-sprite-position-y": string;
  "--ik-sprite-size-x": string;
  "--ik-sprite-size-y": string;
};

function getSpriteStyle(frame: SpriteFrame): SpriteStyle {
  return {
    "--ik-sprite-position-x": `${(frame.x / (SHEET_WIDTH - frame.width)) * 100}%`,
    "--ik-sprite-position-y": `${(frame.y / (SHEET_HEIGHT - frame.height)) * 100}%`,
    "--ik-sprite-size-x": `${(SHEET_WIDTH / frame.width) * 100}%`,
    "--ik-sprite-size-y": `${(SHEET_HEIGHT / frame.height) * 100}%`,
  };
}

export function BuildingSprite({ altLabel, buildingId, className }: BuildingSpriteProps) {
  const normalizedId = buildingId.toLowerCase();
  const frame = SPRITE_FRAMES[normalizedId];
  const label = altLabel ?? `${buildingId} building`;

  if (!frame) {
    return (
      <div className={cn("ik-building-sprite", className)} role="img" aria-label={label}>
        <div className="ik-building-sprite-fallback" />
      </div>
    );
  }

  return (
    <div className={cn("ik-building-sprite", className)} role="img" aria-label={label}>
      <div
        className="ik-building-sprite-art"
        style={getSpriteStyle(frame)}
      />
    </div>
  );
}
