import * as PIXI from "pixi.js";

/**
 * Minimalist B&W geometry vocabulary shared by every PixiJS mode.
 *
 * All characters (player, companion, villagers, enemies) are the same
 * humanoid silhouette — circle head, trapezoid torso, rectangle limbs —
 * declined through proportions, fill vs outline and stroke weight rather
 * than through separate art assets.
 *
 * Figures are drawn in a 100-unit-tall local box (feet at y=0, top at
 * y=-100, x centered on 0) then uniformly scaled to the requested display
 * height, so callers reason in on-screen pixels exactly like they did with
 * sprite textures.
 */

/** Shared grayscale palette (PIXI hex mirrors of the CSS tokens). */
export const BW = {
  black: 0x0a0a0a,
  gray0: 0x1a1a1a,
  gray1: 0x3a3a3a,
  gray2: 0x6a6a6a,
  gray3: 0x9a9a9a,
  gray4: 0xc9c9c9,
  white: 0xf2f2f2,
} as const;

export type FigureVariant = "king" | "companion" | "villager" | "hostile";

function drawKing(g: PIXI.Graphics): void {
  // Legs — two solid pillars.
  g.rect(-9, -24, 7, 24).fill(BW.white);
  g.rect(2, -24, 7, 24).fill(BW.white);

  // Torso — trapezoid, broad shoulders.
  g.poly([-15, -60, 15, -60, 10, -22, -10, -22]).fill(BW.white);

  // Arms — thin side strokes.
  g.rect(-19, -58, 4, 26).fill(BW.gray4);
  g.rect(15, -58, 4, 26).fill(BW.gray4);

  // Head — filled circle with a shaded jaw line.
  g.circle(0, -74, 14).fill(BW.white);
  g.moveTo(-9, -66).lineTo(9, -66).stroke({ color: BW.gray3, width: 2 });

  // Eyes — offset toward +x so the horizontal flip reads as facing.
  g.rect(1, -78, 3, 4).fill(BW.black);
  g.rect(8, -78, 3, 4).fill(BW.black);

  // Crown — three-point zigzag block.
  g.poly([-12, -86, -12, -96, -6, -89, 0, -98, 6, -89, 12, -96, 12, -86]).fill(BW.white).stroke({ color: BW.gray2, width: 1.5 });

  // Belt — single dark separator between torso and legs.
  g.rect(-10, -26, 20, 4).fill(BW.gray1);
}

function drawCompanion(g: PIXI.Graphics): void {
  // Small and round: oversized head, stubby body. Light gray so it never
  // competes with the player's pure white.
  g.rect(-7, -12, 5, 12).fill(BW.gray4);
  g.rect(2, -12, 5, 12).fill(BW.gray4);

  g.poly([-11, -38, 11, -38, 8, -10, -8, -10]).fill(BW.gray4);

  g.circle(0, -58, 19).fill(BW.gray4);

  // Eyes — big and friendly, offset toward +x.
  g.circle(3, -60, 3).fill(BW.black);
  g.circle(12, -60, 3).fill(BW.black);

  // Antenna / tuft — one thin stroke + dot.
  g.moveTo(0, -77).lineTo(0, -86).stroke({ color: BW.gray4, width: 2 });
  g.circle(0, -89, 3).fill(BW.white);
}

function drawVillager(g: PIXI.Graphics): void {
  // Outline-only king without the crown: background cast.
  g.rect(-8, -22, 6, 22).stroke({ color: BW.gray3, width: 2 });
  g.rect(2, -22, 6, 22).stroke({ color: BW.gray3, width: 2 });

  g.poly([-13, -56, 13, -56, 9, -20, -9, -20]).fill(BW.gray0).stroke({ color: BW.gray3, width: 2 });

  g.circle(0, -70, 12).fill(BW.gray0).stroke({ color: BW.gray3, width: 2 });

  g.rect(2, -73, 2, 3).fill(BW.gray4);
  g.rect(7, -73, 2, 3).fill(BW.gray4);
}

function drawHostile(g: PIXI.Graphics): void {
  // Angular and hollow: diamond head, inverted-triangle torso, spike arms.
  // Thick white outline on black fill — reads as a "negative" of the player.
  g.poly([-6, -20, -12, 0, -4, 0]).fill(BW.black).stroke({ color: BW.white, width: 3 });
  g.poly([6, -20, 12, 0, 4, 0]).fill(BW.black).stroke({ color: BW.white, width: 3 });

  // Torso — inverted triangle.
  g.poly([-16, -62, 16, -62, 0, -18]).fill(BW.black).stroke({ color: BW.white, width: 3 });

  // Arms — outward spikes.
  g.poly([-16, -58, -30, -46, -14, -48]).fill(BW.black).stroke({ color: BW.white, width: 2.5 });
  g.poly([16, -58, 30, -46, 14, -48]).fill(BW.black).stroke({ color: BW.white, width: 2.5 });

  // Head — diamond.
  g.poly([0, -92, 13, -76, 0, -60, -13, -76]).fill(BW.black).stroke({ color: BW.white, width: 3 });

  // Eyes — X marks, offset toward +x.
  g.moveTo(1, -80).lineTo(5, -76).moveTo(5, -80).lineTo(1, -76).stroke({ color: BW.white, width: 1.5 });
  g.moveTo(7, -80).lineTo(11, -76).moveTo(11, -80).lineTo(7, -76).stroke({ color: BW.white, width: 1.5 });
}

const FIGURE_DRAWERS: Record<FigureVariant, (g: PIXI.Graphics) => void> = {
  king: drawKing,
  companion: drawCompanion,
  villager: drawVillager,
  hostile: drawHostile,
};

/** Local-space height of the drawing box (feet at 0, top at -100). */
export const FIGURE_UNIT_HEIGHT = 100;

/**
 * Draws the requested silhouette into a fresh Graphics, feet at (0, 0).
 * The returned graphics is unscaled (100 units tall) — use `scaleFigure`
 * or set `.scale` yourself to reach a display height.
 */
export function createFigureGraphics(variant: FigureVariant): PIXI.Graphics {
  const g = new PIXI.Graphics();
  FIGURE_DRAWERS[variant](g);
  return g;
}

/** Uniform scale factor so a figure renders `displayHeight` px tall. */
export function figureScaleFor(displayHeight: number): number {
  return displayHeight / FIGURE_UNIT_HEIGHT;
}
