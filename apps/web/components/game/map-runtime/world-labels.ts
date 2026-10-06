import * as PIXI from "pixi.js";

/**
 * A small monospace world-space label, added to a caller-provided labels layer. Returns the
 * created Text so callers that need to mutate it later (e.g. a live HP readout) can keep a
 * reference; callers that don't need one can simply ignore the return value.
 */
export function addWorldLabel(labels: PIXI.Container, text: string, x: number, y: number): PIXI.Text {
  const label = new PIXI.Text({
    text,
    style: {
      fill: 0xf2f2f2,
      fontFamily: "monospace",
      fontSize: 11,
      stroke: { color: 0x000000, width: 3 },
    },
  });
  label.anchor.set(0.5, 0.5);
  label.position.set(x, y);
  labels.addChild(label);
  return label;
}

/** A small outlined circle "kind" badge (e.g. "N"/"O"/"B"/"P"/"E") plus its label text. */
export function addEntityBadge(world: PIXI.Container, labels: PIXI.Container, kind: string, x: number, y: number, colorValue: number): void {
  const badge = new PIXI.Graphics();
  badge.circle(x, y, 12).fill({ color: 0x050505, alpha: 0.9 }).stroke({ color: colorValue, alpha: 0.95, width: 2 });
  world.addChild(badge);
  addWorldLabel(labels, kind, x, y + 1);
}
