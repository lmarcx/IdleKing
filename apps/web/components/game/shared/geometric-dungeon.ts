import * as PIXI from "pixi.js";

import { BW } from "@/components/game/shared/geometric-figure";
import type { LayoutObstacleKind, LayoutRect } from "@idleking/game-core";

/**
 * B&W geometric dungeon dressing (no textures): one silhouette per obstacle kind, drawn in the
 * obstacle's world rect. Purely cosmetic — collisions use the rect itself.
 */
export function createObstacleGraphics(kind: LayoutObstacleKind, area: LayoutRect): PIXI.Graphics {
  const g = new PIXI.Graphics();
  const { x, y, width: w, height: h } = area;
  const cx = x + w / 2;
  const cy = y + h / 2;

  switch (kind) {
    case "barrier":
      // Solid but invisible: the floor tile or decor asset underneath is what the player sees.
      break;
    case "wall": {
      g.rect(x, y, w, h).fill({ color: BW.gray0 }).stroke({ color: BW.gray2, width: 2 });
      // Brick courses so long walls read as masonry, not as UI panels.
      const horizontal = w >= h;
      const length = horizontal ? w : h;
      for (let offset = 40; offset < length; offset += 40) {
        if (horizontal) g.moveTo(x + offset, y + 4).lineTo(x + offset, y + h - 4);
        else g.moveTo(x + 4, y + offset).lineTo(x + w - 4, y + offset);
      }
      g.stroke({ color: BW.gray1, width: 1 });
      break;
    }
    case "pillar":
      g.rect(x, y, w, h).fill({ color: BW.gray1 }).stroke({ color: BW.gray3, width: 2 });
      g.circle(cx, cy, Math.min(w, h) * 0.28).stroke({ color: BW.gray3, width: 2 });
      break;
    case "ruin":
      g.poly([x, y + h * 0.3, x + w * 0.4, y, x + w, y + h * 0.15, x + w * 0.85, y + h, x + w * 0.1, y + h]).fill({ color: BW.gray1 }).stroke({ color: BW.gray3, width: 2 });
      g.moveTo(x + w * 0.4, y + h * 0.1).lineTo(x + w * 0.55, y + h * 0.55).lineTo(x + w * 0.45, y + h * 0.9).stroke({ color: BW.gray0, width: 2 });
      break;
    case "rock":
      g.poly([x + w * 0.1, y + h * 0.55, x + w * 0.35, y + h * 0.05, x + w * 0.8, y + h * 0.15, x + w, y + h * 0.65, x + w * 0.6, y + h, x + w * 0.2, y + h * 0.9]).fill({ color: BW.gray1 }).stroke({ color: BW.gray3, width: 2 });
      break;
    case "tomb":
      g.roundRect(x, y, w, h, Math.min(w, h) * 0.3).fill({ color: BW.gray1 }).stroke({ color: BW.gray3, width: 2 });
      g.moveTo(cx, y + h * 0.2).lineTo(cx, y + h * 0.75).moveTo(cx - w * 0.18, y + h * 0.38).lineTo(cx + w * 0.18, y + h * 0.38).stroke({ color: BW.gray4, width: 2 });
      break;
    case "crystal":
      g.poly([cx, y, x + w, cy, cx, y + h, x, cy]).fill({ color: BW.gray1 }).stroke({ color: BW.white, width: 2 });
      g.moveTo(cx, y).lineTo(cx, y + h).stroke({ color: BW.gray3, width: 1 });
      break;
    case "shelf":
      g.rect(x, y, w, h).fill({ color: BW.gray0 }).stroke({ color: BW.gray3, width: 2 });
      for (let row = 1; row < 4; row += 1) g.moveTo(x + 4, y + (h * row) / 4).lineTo(x + w - 4, y + (h * row) / 4);
      g.stroke({ color: BW.gray2, width: 2 });
      break;
    case "coral":
      for (const [dx, dy, r] of [[0.3, 0.6, 0.3], [0.6, 0.35, 0.28], [0.7, 0.75, 0.22]] as const) {
        g.circle(x + w * dx, y + h * dy, Math.min(w, h) * r).fill({ color: BW.gray1 }).stroke({ color: BW.gray3, width: 2 });
      }
      break;
  }
  return g;
}

/** A closed gate: bars across the doorway. Fades out when opened (see the stage). */
export function createGateGraphics(area: LayoutRect): PIXI.Graphics {
  const g = new PIXI.Graphics();
  const { x, y, width: w, height: h } = area;
  g.rect(x, y, w, h).fill({ color: BW.black, alpha: 0.85 }).stroke({ color: BW.white, width: 2 });
  const vertical = h >= w;
  const length = vertical ? h : w;
  for (let offset = 18; offset < length; offset += 22) {
    if (vertical) g.moveTo(x + 6, y + offset).lineTo(x + w - 6, y + offset);
    else g.moveTo(x + offset, y + 6).lineTo(x + offset, y + h - 6);
  }
  g.stroke({ color: BW.gray4, width: 3 });
  return g;
}
