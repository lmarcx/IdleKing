import * as PIXI from "pixi.js";

import { BW } from "./geometric-figure";

/**
 * World-building side of the B&W geometry vocabulary: ground plane, drawn
 * points of interest and spark particles. Shared by the Kingdom hub and the
 * Story exploration stages so every mode walks on the same visual floor.
 */

export type GroundGridOptions = {
  /** Grid cell size in px. */
  cellSize?: number;
  /** Draw a cross marker every N intersections (0 = none). */
  markerEvery?: number;
};

/**
 * Fills `width`×`height` with the standard ground: near-black plane, thin
 * dark grid lines, sparse "+" markers at intersections for parallax feel.
 */
export function drawGroundGrid(g: PIXI.Graphics, width: number, height: number, options: GroundGridOptions = {}): PIXI.Graphics {
  const cellSize = options.cellSize ?? 96;
  const markerEvery = options.markerEvery ?? 4;

  g.rect(0, 0, width, height).fill(BW.black);

  for (let x = 0; x <= width; x += cellSize) {
    g.moveTo(x, 0).lineTo(x, height).stroke({ color: BW.gray0, alpha: 0.9, width: 1 });
  }
  for (let y = 0; y <= height; y += cellSize) {
    g.moveTo(0, y).lineTo(width, y).stroke({ color: BW.gray0, alpha: 0.9, width: 1 });
  }

  if (markerEvery > 0) {
    const step = cellSize * markerEvery;
    for (let y = step; y < height; y += step) {
      for (let x = step; x < width; x += step) {
        g.moveTo(x - 4, y).lineTo(x + 4, y).moveTo(x, y - 4).lineTo(x, y + 4).stroke({ color: BW.gray1, alpha: 0.9, width: 1 });
      }
    }
  }

  return g;
}

export type PoiIconKind = "chest" | "rune" | "shrine";

/**
 * Drawn replacement for the POI sprites (chest / rune / shrine). Icons sit
 * on their base line at y=0, ~56px tall, white strokes on dark fills.
 */
export function createPoiIconGraphics(kind: PoiIconKind): PIXI.Graphics {
  const g = new PIXI.Graphics();

  if (kind === "chest") {
    // Square body + lid line + keyhole dot.
    g.rect(-22, -36, 44, 36).fill(BW.gray0).stroke({ color: BW.white, width: 3 });
    g.moveTo(-22, -24).lineTo(22, -24).stroke({ color: BW.white, width: 2 });
    g.circle(0, -14, 4).fill(BW.white);
    return g;
  }

  if (kind === "rune") {
    // Standing diamond with an inner cross.
    g.poly([0, -52, 20, -26, 0, 0, -20, -26]).fill(BW.gray0).stroke({ color: BW.white, width: 3 });
    g.moveTo(0, -40).lineTo(0, -12).moveTo(-10, -26).lineTo(10, -26).stroke({ color: BW.gray4, width: 2 });
    return g;
  }

  // Shrine: base slab + column + floating circle.
  g.rect(-24, -8, 48, 8).fill(BW.gray1).stroke({ color: BW.white, width: 2 });
  g.rect(-8, -34, 16, 26).fill(BW.gray0).stroke({ color: BW.white, width: 2.5 });
  g.circle(0, -46, 9).stroke({ color: BW.white, width: 3 });
  return g;
}

/** Ring highlight drawn under/around POIs, replaces the soft glow sprite. */
export function createPoiRingGraphics(radius = 34): PIXI.Graphics {
  const g = new PIXI.Graphics();
  g.circle(0, 0, radius).stroke({ color: BW.gray2, alpha: 0.8, width: 2 });
  g.circle(0, 0, radius * 0.72).stroke({ color: BW.gray1, alpha: 0.8, width: 1 });
  return g;
}

/** Small 4-point star used for pickup/discovery bursts (replaces sparkle PNG). */
export function createSparkGraphics(size = 5): PIXI.Graphics {
  const g = new PIXI.Graphics();
  g.poly([0, -size, size * 0.35, -size * 0.35, size, 0, size * 0.35, size * 0.35, 0, size, -size * 0.35, size * 0.35, -size, 0, -size * 0.35, -size * 0.35]).fill(
    BW.white
  );
  return g;
}
