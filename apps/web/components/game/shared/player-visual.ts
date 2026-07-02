import * as PIXI from "pixi.js";

import {
  BW,
  createFigureGraphics,
  figureScaleFor,
  type FigureVariant,
} from "./geometric-figure";

/**
 * Shared character avatar used across every PixiJS game mode (Kingdom hub,
 * Story exploration, Duel arena…). It renders a geometric B&W silhouette with
 * a code-driven 4-direction feel — horizontal flip for left/right, a walk bob
 * with lean, idle breathing and a reactive contact shadow.
 *
 * The silhouette is drawn procedurally (see geometric-figure.ts); there is no
 * texture loading involved anymore.
 */

export type PlayerFacing = { x: number; y: number };

export type PlayerVisualUpdate = {
  /** Seconds since an arbitrary epoch — drives the cyclic animations. */
  elapsedSeconds: number;
  /** Aim / movement facing. `x` sign flips the figure, `y < 0` dims it (back). */
  facing: PlayerFacing;
  /** Whether the player is actively moving (enables the walk cycle). */
  moving: boolean;
  /** Optional tint override (e.g. hit-flash). Falls back to facing tint. */
  flashTint?: number | null;
};

export type PlayerVisual = {
  container: PIXI.Container;
  update: (opts: PlayerVisualUpdate) => void;
};

export type CreatePlayerVisualOptions = {
  /** Which silhouette to draw (defaults to the king / player). */
  variant?: FigureVariant;
  /** On-screen height of the figure in pixels. */
  displayHeight?: number;
  /** Contact-shadow half-width / half-height. */
  shadowWidth?: number;
  shadowHeight?: number;
  shadowAlpha?: number;
  /** Vertical offset of the shadow from the container origin. */
  shadowOffsetY?: number;
  /**
   * Combat modes only: render a 360° directional aim arrow orbiting the player.
   * The standing figure cannot point up/down (single front pose), so this
   * arrow is what communicates the full aim direction to the player.
   */
  aimIndicator?: boolean;
  /** Orbit radius of the aim arrow around the player torso. */
  aimRadius?: number;
  /** Vertical center the aim arrow orbits around (negative = up toward torso). */
  aimCenterY?: number;
  /** Aim arrow fill color. */
  aimColor?: number;
};

export function createPlayerVisual(options: CreatePlayerVisualOptions = {}): PlayerVisual {
  const variant = options.variant ?? "king";
  const displayHeight = options.displayHeight ?? 104;
  const shadowWidth = options.shadowWidth ?? 26;
  const shadowHeight = options.shadowHeight ?? 9;
  const shadowAlpha = options.shadowAlpha ?? 0.5;
  const shadowOffsetY = options.shadowOffsetY ?? 4;
  const aimRadius = options.aimRadius ?? 40;
  const aimCenterY = options.aimCenterY ?? -30;
  const aimColor = options.aimColor ?? BW.white;

  const container = new PIXI.Container();
  const shadow = new PIXI.Graphics();
  const body = new PIXI.Container();

  // Hard-edged contact shadow — flat gray ellipse, no blur.
  shadow.ellipse(0, shadowOffsetY, shadowWidth, shadowHeight).fill({ color: BW.gray1, alpha: shadowAlpha });

  // 360° aim arrow (combat modes). Drawn pointing toward +x at rotation 0 and
  // re-oriented every frame from the facing vector — kept out of `body` so it
  // never inherits the walk bob / horizontal flip.
  const aim = options.aimIndicator ? new PIXI.Graphics() : null;
  if (aim) {
    aim
      .moveTo(12, 0)
      .lineTo(-5, -7)
      .lineTo(-1, 0)
      .lineTo(-5, 7)
      .closePath()
      .fill({ color: aimColor })
      .stroke({ color: BW.black, width: 1.5, join: "round" });
  }

  const figure = createFigureGraphics(variant);
  const baseScale = figureScaleFor(displayHeight);
  figure.scale.set(baseScale);
  body.addChild(figure);

  container.addChild(shadow, body);
  if (aim) container.addChild(aim);

  let facingX = 1;

  return {
    container,
    update({ elapsedSeconds, facing, moving, flashTint }: PlayerVisualUpdate) {
      if (Math.abs(facing.x) > 0.2) {
        facingX = facing.x > 0 ? 1 : -1;
      }
      const walkPhase = elapsedSeconds * 9.2;
      const step = Math.abs(Math.sin(walkPhase));
      const bob = moving ? step * 5 : Math.sin(elapsedSeconds * 2.4) * 1.4;
      const lean = moving ? Math.sin(walkPhase) * 0.05 : 0;
      const breath = moving ? 1 : 1 + Math.sin(elapsedSeconds * 2.4) * 0.02;

      body.position.y = -bob;
      body.rotation = lean;

      figure.scale.set(baseScale * facingX, baseScale * breath);
      figure.tint = flashTint != null ? flashTint : facing.y < -0.35 ? 0xbdbdbd : 0xffffff;

      // Shadow tightens and fades a touch as the feet lift on each step.
      shadow.scale.set(moving ? 1 + step * 0.08 : 1 + Math.sin(elapsedSeconds * 2.4 + Math.PI) * 0.04, moving ? 1 - step * 0.16 : 1);
      shadow.alpha = moving ? 1 - step * 0.18 : 1;

      if (aim) {
        const angle = Math.atan2(facing.y, facing.x);
        // Orbit the arrow around the torso so it reads as a 360° aim direction,
        // and give it a subtle in/out pulse for liveliness.
        const pulse = 1 + Math.sin(elapsedSeconds * 6) * 0.06;
        aim.rotation = angle;
        aim.position.set(facing.x * aimRadius * pulse, aimCenterY + facing.y * aimRadius * pulse);
      }
    },
  };
}
