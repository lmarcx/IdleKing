import * as PIXI from "pixi.js";

import { BW } from "@/components/game/shared/geometric-figure";

/**
 * Kingdom hub buildings drawn as pure B&W geometry (replaces the generated
 * PNG sprites). Every building is composed from the same vocabulary — body
 * rect, triangle/trapezoid roof, door, window and one distinctive marker —
 * with two gray values suggesting the lit / shaded faces and white outlines.
 *
 * Buildings are drawn in local space with their ground anchor at (0, 0):
 * the footprint sits slightly below 0 (like the old 0.78 sprite anchor) and
 * the structure rises into negative y. Sizes are returned so colliders can
 * be derived without textures.
 */

export type HubBuildingKind = "farm" | "forge" | "forum" | "kitchen" | "mine" | "temple" | "cornucopia";

export type BuildingSize = { height: number; width: number };

export const BUILDING_SIZES: Record<HubBuildingKind, BuildingSize> = {
  cornucopia: { height: 134, width: 120 },
  farm: { height: 200, width: 240 },
  forge: { height: 210, width: 190 },
  forum: { height: 270, width: 250 },
  kitchen: { height: 190, width: 180 },
  mine: { height: 200, width: 210 },
  temple: { height: 240, width: 220 },
};

const STROKE = { color: BW.white, width: 3 } as const;
const STROKE_THIN = { color: BW.gray4, width: 2 } as const;

/** Body rect with a lit left face and shaded right face. */
function drawBody(g: PIXI.Graphics, x: number, y: number, w: number, h: number): void {
  g.rect(x, y, w, h).fill(BW.gray0).stroke(STROKE);
  g.rect(x + w * 0.55, y, w * 0.45, h).fill({ color: BW.black, alpha: 0.55 });
}

/** Gable (triangle) roof over [x, x+w] with apex above the middle. */
function drawGableRoof(g: PIXI.Graphics, x: number, y: number, w: number, rise: number): void {
  g.poly([x - 8, y, x + w / 2, y - rise, x + w + 8, y]).fill(BW.gray1).stroke(STROKE);
  g.poly([x + w / 2, y - rise, x + w + 8, y, x + w / 2, y]).fill({ color: BW.black, alpha: 0.45 });
}

function drawDoor(g: PIXI.Graphics, cx: number, groundY: number, w: number, h: number): void {
  g.rect(cx - w / 2, groundY - h, w, h).fill(BW.black).stroke(STROKE_THIN);
}

function drawWindow(g: PIXI.Graphics, cx: number, cy: number, size = 16): void {
  g.rect(cx - size / 2, cy - size / 2, size, size).fill(BW.black).stroke(STROKE_THIN);
  g.moveTo(cx, cy - size / 2).lineTo(cx, cy + size / 2).stroke({ color: BW.gray2, width: 1 });
  g.moveTo(cx - size / 2, cy).lineTo(cx + size / 2, cy).stroke({ color: BW.gray2, width: 1 });
}

function drawFarm(g: PIXI.Graphics): void {
  const { width } = BUILDING_SIZES.farm;
  const bodyW = width * 0.78;
  const bodyH = 96;
  const groundY = 26;
  const bodyX = -bodyW / 2;
  const bodyY = groundY - bodyH;

  drawBody(g, bodyX, bodyY, bodyW, bodyH);
  drawGableRoof(g, bodyX, bodyY, bodyW, 62);
  // Barn door with X brace.
  drawDoor(g, 0, groundY, 46, 56);
  g.moveTo(-23, groundY - 56).lineTo(23, groundY).moveTo(23, groundY - 56).lineTo(-23, groundY).stroke(STROKE_THIN);
  // Small silo on the side.
  g.rect(bodyX + bodyW - 4, bodyY + 18, 30, bodyH - 18 + (groundY - groundY)).fill(BW.gray1).stroke(STROKE_THIN);
  g.circle(bodyX + bodyW + 11, bodyY + 10, 15).fill(BW.gray1).stroke(STROKE_THIN);
}

function drawForge(g: PIXI.Graphics): void {
  const { width } = BUILDING_SIZES.forge;
  const bodyW = width * 0.82;
  const bodyH = 104;
  const groundY = 26;
  const bodyX = -bodyW / 2;
  const bodyY = groundY - bodyH;

  drawBody(g, bodyX, bodyY, bodyW, bodyH);
  // Flat slanted roof.
  g.poly([bodyX - 8, bodyY, bodyX + bodyW + 8, bodyY - 34, bodyX + bodyW + 8, bodyY]).fill(BW.gray1).stroke(STROKE);
  // Chimney with smoke squares.
  g.rect(bodyX + bodyW * 0.62, bodyY - 66, 22, 44).fill(BW.gray0).stroke(STROKE);
  g.rect(bodyX + bodyW * 0.62 + 4, bodyY - 84, 10, 10).stroke(STROKE_THIN);
  g.rect(bodyX + bodyW * 0.62 + 12, bodyY - 100, 7, 7).stroke({ color: BW.gray3, width: 1.5 });
  // Wide furnace mouth.
  drawDoor(g, -bodyW * 0.12, groundY, 54, 46);
  g.circle(-bodyW * 0.12, groundY - 23, 10).stroke(STROKE_THIN);
  // Anvil silhouette beside the door.
  g.rect(bodyW * 0.24, groundY - 18, 30, 8).fill(BW.gray4);
  g.rect(bodyW * 0.24 + 9, groundY - 10, 12, 10).fill(BW.gray4);
}

function drawForum(g: PIXI.Graphics): void {
  const { width } = BUILDING_SIZES.forum;
  const bodyW = width * 0.84;
  const bodyH = 140;
  const groundY = 30;
  const bodyX = -bodyW / 2;
  const bodyY = groundY - bodyH;

  // Stepped base.
  g.rect(bodyX - 12, groundY - 12, bodyW + 24, 12).fill(BW.gray1).stroke(STROKE);
  drawBody(g, bodyX, bodyY, bodyW, bodyH - 12);
  // Columns.
  for (let index = 0; index < 4; index += 1) {
    const cx = bodyX + bodyW * (0.16 + index * 0.226);
    g.rect(cx - 6, bodyY + 18, 12, bodyH - 42).fill(BW.gray1).stroke(STROKE_THIN);
  }
  // Pediment.
  g.poly([bodyX - 14, bodyY, 0, bodyY - 58, bodyX + bodyW + 14, bodyY]).fill(BW.gray1).stroke(STROKE);
  g.circle(0, bodyY - 22, 10).stroke(STROKE_THIN);
  drawDoor(g, 0, groundY - 12, 40, 52);
}

function drawKitchen(g: PIXI.Graphics): void {
  const { width } = BUILDING_SIZES.kitchen;
  const bodyW = width * 0.8;
  const bodyH = 92;
  const groundY = 24;
  const bodyX = -bodyW / 2;
  const bodyY = groundY - bodyH;

  drawBody(g, bodyX, bodyY, bodyW, bodyH);
  drawGableRoof(g, bodyX, bodyY, bodyW, 48);
  // Chimney + steam.
  g.rect(bodyX + bodyW * 0.68, bodyY - 34, 18, 26).fill(BW.gray0).stroke(STROKE_THIN);
  g.circle(bodyX + bodyW * 0.68 + 9, bodyY - 46, 6).stroke({ color: BW.gray3, width: 1.5 });
  drawDoor(g, -bodyW * 0.16, groundY, 36, 48);
  drawWindow(g, bodyW * 0.2, bodyY + bodyH * 0.42, 20);
  // Hanging pot: circle under a bracket.
  g.moveTo(bodyX + 14, bodyY + 20).lineTo(bodyX + 34, bodyY + 20).stroke(STROKE_THIN);
  g.circle(bodyX + 24, bodyY + 32, 9).stroke(STROKE_THIN);
}

function drawMine(g: PIXI.Graphics): void {
  const { width } = BUILDING_SIZES.mine;
  const groundY = 26;
  const w = width * 0.88;

  // Rock mound — big trapezoid.
  g.poly([-w / 2, groundY, -w * 0.3, groundY - 122, w * 0.3, groundY - 122, w / 2, groundY]).fill(BW.gray0).stroke(STROKE);
  g.poly([w * 0.06, groundY - 122, w * 0.3, groundY - 122, w / 2, groundY, w * 0.16, groundY]).fill({ color: BW.black, alpha: 0.5 });
  // Tunnel entrance with support beams.
  g.poly([-34, groundY, -26, groundY - 52, 26, groundY - 52, 34, groundY]).fill(BW.black).stroke(STROKE);
  g.moveTo(-30, groundY - 52).lineTo(30, groundY - 52).stroke({ color: BW.gray4, width: 4 });
  g.moveTo(-30, groundY).lineTo(-26, groundY - 52).moveTo(30, groundY).lineTo(26, groundY - 52).stroke(STROKE_THIN);
  // Pickaxe marker: crossed lines above entrance.
  g.moveTo(-14, groundY - 78).lineTo(14, groundY - 62).moveTo(14, groundY - 78).lineTo(-14, groundY - 62).stroke(STROKE_THIN);
}

function drawTemple(g: PIXI.Graphics): void {
  const { width } = BUILDING_SIZES.temple;
  const bodyW = width * 0.78;
  const groundY = 28;
  const bodyX = -bodyW / 2;

  // Three stepped tiers.
  g.rect(bodyX - 18, groundY - 14, bodyW + 36, 14).fill(BW.gray1).stroke(STROKE);
  g.rect(bodyX - 8, groundY - 28, bodyW + 16, 14).fill(BW.gray0).stroke(STROKE);
  // Main hall.
  g.rect(bodyX, groundY - 118, bodyW, 90).fill(BW.gray0).stroke(STROKE);
  g.rect(bodyX + bodyW * 0.55, groundY - 118, bodyW * 0.45, 90).fill({ color: BW.black, alpha: 0.5 });
  // Columns.
  for (let index = 0; index < 3; index += 1) {
    const cx = bodyX + bodyW * (0.22 + index * 0.28);
    g.rect(cx - 5, groundY - 108, 10, 80).fill(BW.gray1).stroke({ color: BW.gray4, width: 1.5 });
  }
  // Spire: triangle + floating diamond.
  g.poly([bodyX - 10, groundY - 118, 0, groundY - 176, bodyX + bodyW + 10, groundY - 118]).fill(BW.gray1).stroke(STROKE);
  g.poly([0, groundY - 200, 8, groundY - 190, 0, groundY - 180, -8, groundY - 190]).fill(BW.white);
}

function drawCornucopia(g: PIXI.Graphics): void {
  const groundY = 16;

  // Horn: nested arcs suggesting a spiral cone lying down.
  g.moveTo(-44, groundY - 10)
    .quadraticCurveTo(-58, groundY - 66, -6, groundY - 74)
    .quadraticCurveTo(38, groundY - 78, 44, groundY - 44)
    .quadraticCurveTo(46, groundY - 20, 20, groundY - 14)
    .quadraticCurveTo(-10, groundY - 8, -44, groundY - 10)
    .fill(BW.gray0)
    .stroke(STROKE);
  g.circle(-40, groundY - 12, 7).fill(BW.gray1).stroke(STROKE_THIN);
  // Overflowing produce: cluster of circles at the mouth.
  g.circle(34, groundY - 34, 12).fill(BW.gray1).stroke(STROKE_THIN);
  g.circle(48, groundY - 22, 9).fill(BW.gray0).stroke(STROKE_THIN);
  g.circle(44, groundY - 44, 8).fill(BW.gray4);
  g.circle(56, groundY - 34, 6).fill(BW.white);
}

const BUILDING_DRAWERS: Record<HubBuildingKind, (g: PIXI.Graphics) => void> = {
  cornucopia: drawCornucopia,
  farm: drawFarm,
  forge: drawForge,
  forum: drawForum,
  kitchen: drawKitchen,
  mine: drawMine,
  temple: drawTemple,
};

/** Draws the building at its natural size, ground anchor at (0, 0). */
export function createBuildingGraphics(kind: HubBuildingKind): PIXI.Graphics {
  const g = new PIXI.Graphics();
  BUILDING_DRAWERS[kind](g);
  return g;
}
