"use client";

import { cn } from "@/lib/utils";

type BuildingSpriteProps = {
  altLabel?: string;
  buildingId: string;
  className?: string;
};

/**
 * Minimalist B&W building glyphs drawn inline as SVG (32x32 pictograms),
 * matching the geometric vocabulary of the Pixi hub buildings.
 */
function BuildingGlyph({ buildingId }: { buildingId: string }) {
  const shared = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
  } as const;

  switch (buildingId) {
    case "farm":
      return (
        <g {...shared}>
          <rect height="12" width="18" x="5" y="15" />
          <path d="M3 15 L14 6 L25 15" />
          <path d="M10 27 V20 H18 V27 M10 20 L18 27 M18 20 L10 27" />
          <circle cx="26" cy="14" r="3" />
        </g>
      );
    case "forge":
      return (
        <g {...shared}>
          <rect height="12" width="18" x="4" y="15" />
          <path d="M4 15 L22 9 V15" />
          <rect height="7" width="4" x="20" y="6" />
          <path d="M8 27 V21 H14 V27" />
          <path d="M22 22 H28 M24 22 V26" />
        </g>
      );
    case "forum":
      return (
        <g {...shared}>
          <rect height="13" width="20" x="6" y="14" />
          <path d="M4 14 L16 5 L28 14" />
          <path d="M10 14 V27 M16 14 V27 M22 14 V27" />
        </g>
      );
    case "kitchen":
      return (
        <g {...shared}>
          <rect height="11" width="18" x="5" y="16" />
          <path d="M3 16 L14 8 L25 16" />
          <rect height="5" width="4" x="19" y="6" />
          <circle cx="11" cy="21" r="3" />
        </g>
      );
    case "mine":
      return (
        <g {...shared}>
          <path d="M4 27 L11 8 H21 L28 27 Z" />
          <path d="M12 27 L14 19 H18 L20 27" />
          <path d="M13 13 L19 16 M19 13 L13 16" />
        </g>
      );
    case "temple":
      return (
        <g {...shared}>
          <rect height="10" width="18" x="7" y="17" />
          <path d="M4 17 L16 8 L28 17" />
          <path d="M11 17 V27 M16 17 V27 M21 17 V27" />
          <path d="M16 2 L18 4.5 L16 7 L14 4.5 Z" />
        </g>
      );
    case "cornucopia":
      return (
        <g {...shared}>
          <path d="M6 22 Q4 10 16 9 Q26 8 26 16 Q26 22 16 23 Q10 23.5 6 22 Z" />
          <circle cx="24" cy="12" r="2.5" />
          <circle cx="27" cy="17" r="2" />
        </g>
      );
    default:
      return (
        <g {...shared}>
          <rect height="14" width="16" x="8" y="13" />
          <path d="M6 13 L16 5 L26 13" />
        </g>
      );
  }
}

export function BuildingSprite({ altLabel, buildingId, className }: BuildingSpriteProps) {
  const normalizedId = buildingId.toLowerCase();
  const label = altLabel ?? `${buildingId} building`;

  return (
    <div className={cn("ik-building-sprite grid place-items-center", className)} role="img" aria-label={label}>
      <svg aria-hidden="true" className="h-3/4 w-3/4 text-foreground" viewBox="0 0 32 32">
        <BuildingGlyph buildingId={normalizedId} />
      </svg>
    </div>
  );
}
