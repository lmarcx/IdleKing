import * as PIXI from "pixi.js";
import type { GeometricAsset, PrimitivePart } from "@idleking/game-core/level-editor";

export function colorFromHex(value: string): number {
  return Number.parseInt(value.replace("#", ""), 16);
}

export function drawPrimitive(g: PIXI.Graphics, part: PrimitivePart): void {
  const fill = { color: colorFromHex(part.fill), alpha: part.opacity };
  const stroke = { color: colorFromHex(part.stroke), alpha: part.opacity, width: part.strokeWidth };

  if (part.shape === "rect") {
    g.rect(0, 0, part.width ?? 24, part.height ?? 24).fill(fill).stroke(stroke);
  } else if (part.shape === "circle") {
    g.circle(0, 0, part.radius ?? Math.max(part.width ?? 24, part.height ?? 24) / 2).fill(fill).stroke(stroke);
  } else if (part.shape === "triangle") {
    const width = part.width ?? 32;
    const height = part.height ?? 32;
    g.poly([0, 0, -width / 2, height, width / 2, height]).fill(fill).stroke(stroke);
  } else if (part.shape === "line") {
    g.moveTo(0, 0).lineTo(part.width ?? 24, part.height ?? 0).stroke(stroke);
  } else {
    g.poly((part.points ?? []).flatMap((point) => [point.x, point.y])).fill(fill).stroke(stroke);
  }
}

/** Draws a GeometricAsset's parts (sorted by layer) into a fresh local-space container. */
export function createAssetGraphic(asset: GeometricAsset): PIXI.Container {
  const container = new PIXI.Container();
  for (const part of [...asset.parts].sort((a, b) => a.layer - b.layer)) {
    const partContainer = new PIXI.Container();
    const g = new PIXI.Graphics();
    drawPrimitive(g, part);
    partContainer.position.set(part.x, part.y);
    partContainer.rotation = (part.rotation * Math.PI) / 180;
    partContainer.addChild(g);
    container.addChild(partContainer);
  }
  return container;
}
