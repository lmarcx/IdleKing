import * as PIXI from "pixi.js";

import { BW, createFigureGraphics, figureScaleFor } from "@/components/game/shared/geometric-figure";
import { createToboGraphics } from "@/components/game/shared/geometric-enemies";

type Vector2 = { x: number; y: number };

export type BillyCompanion = {
  container: PIXI.Container;
  /** Lying, dimmed pose: the dying dog of the Prologue before the blood offering. */
  setResting: (resting: boolean) => void;
  /** Places Billy instantly (e.g. next to the king when he joins at the end of a fight). */
  teleport: (position: Vector2) => void;
  update: (deltaSeconds: number, elapsedSeconds: number, target: Vector2) => void;
};

const BILLY_FOLLOW_GAP = 74;
const BILLY_CATCHUP_SPEED = 360;
const BILLY_DISPLAY_HEIGHT = 66;

function createGroundShadow(width: number, height: number, alpha: number): PIXI.Graphics {
  const shadow = new PIXI.Graphics();
  shadow.ellipse(0, 0, width, height).fill({ color: BW.black, alpha });
  return shadow;
}

/**
 * Billy, the king's first companion (Prologue). Follows the player in the Kingdom hub and in
 * Story dungeons; never fights. Drawn as the "companion" geometric silhouette.
 */
export function createBillyCompanion(start: Vector2): BillyCompanion {
  const container = new PIXI.Container();
  const shadow = createGroundShadow(22, 7, 0.4);
  shadow.position.set(0, 8);

  const body = new PIXI.Container();
  const sprite = createFigureGraphics("companion");
  const baseScale = figureScaleFor(BILLY_DISPLAY_HEIGHT);
  sprite.scale.set(baseScale);
  body.addChild(sprite);

  container.addChild(shadow, body);
  container.position.set(start.x, start.y);
  container.zIndex = start.y;

  const pos: Vector2 = { ...start };
  let facingX = 1;
  let resting = false;

  return {
    container,
    setResting: (next: boolean) => {
      resting = next;
      body.rotation = next ? -Math.PI / 2 : 0;
      body.position.x = next ? -BILLY_DISPLAY_HEIGHT * 0.45 : 0;
      container.alpha = next ? 0.55 : 1;
    },
    teleport: (position: Vector2) => {
      pos.x = position.x;
      pos.y = position.y;
      container.position.set(pos.x, pos.y);
      container.zIndex = pos.y;
    },
    update: (deltaSeconds: number, elapsedSeconds: number, target: Vector2) => {
      if (resting) {
        // Shallow, slow breathing only.
        body.scale.set(1, 1 + Math.sin(elapsedSeconds * 1.6) * 0.03);
        return;
      }
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.hypot(dx, dy);
      let moving = false;

      if (dist > BILLY_FOLLOW_GAP) {
        const step = Math.min(dist - BILLY_FOLLOW_GAP, BILLY_CATCHUP_SPEED * deltaSeconds);
        pos.x += (dx / dist) * step;
        pos.y += (dy / dist) * step;
        moving = step > 0.5;
        if (Math.abs(dx) > 2) facingX = dx > 0 ? 1 : -1;
      }

      const bob = moving ? Math.abs(Math.sin(elapsedSeconds * 11)) * 3 : Math.sin(elapsedSeconds * 2.4) * 1;
      body.position.y = -bob;
      sprite.scale.set(baseScale * facingX, baseScale);
      container.position.set(pos.x, pos.y);
      container.zIndex = pos.y;
    },
  };
}

export type ToboCompanion = {
  container: PIXI.Container;
  update: (elapsedSeconds: number) => void;
};

/** Tobo hovers calmly around an anchor (Kingdom), rings slowly orbiting — never aggressive. */
export function createToboCompanion(anchor: Vector2): ToboCompanion {
  const { container, rings } = createToboGraphics();
  container.position.set(anchor.x, anchor.y);
  container.zIndex = anchor.y;
  const core = container.children[1];
  return {
    container,
    update: (elapsedSeconds: number) => {
      const hover = Math.sin(elapsedSeconds * 1.3) * 6;
      core.position.y = hover;
      rings.position.y = -60 + hover;
      rings.rotation = elapsedSeconds * 0.6;
      container.position.x = anchor.x + Math.sin(elapsedSeconds * 0.4) * 14;
    },
  };
}
