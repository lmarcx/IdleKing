import * as PIXI from "pixi.js";

/**
 * Shared player avatar used across every PixiJS game mode (Kingdom hub, Story
 * exploration, Duel arena…). It renders the king sprite with a code-driven
 * 4-direction feel — horizontal flip for left/right, a walk bob with lean,
 * idle breathing and a reactive contact shadow — instead of rotating a flat
 * sprite to face the aim vector (which looked wrong for a standing character).
 *
 * The sprite is loaded lazily via `setSprite` so the container can be created
 * before textures finish loading.
 */

export type PlayerFacing = { x: number; y: number };

export type PlayerVisualUpdate = {
  /** Seconds since an arbitrary epoch — drives the cyclic animations. */
  elapsedSeconds: number;
  /** Aim / movement facing. `x` sign flips the sprite, `y < 0` dims it (back). */
  facing: PlayerFacing;
  /** Whether the player is actively moving (enables the walk cycle). */
  moving: boolean;
  /** Optional tint override (e.g. red hit-flash). Falls back to facing tint. */
  flashTint?: number | null;
};

export type PlayerVisual = {
  container: PIXI.Container;
  setSprite: (texture: PIXI.Texture) => void;
  update: (opts: PlayerVisualUpdate) => void;
};

export type CreatePlayerVisualOptions = {
  /** On-screen height of the sprite in pixels. */
  displayHeight?: number;
  /** Vertical sprite anchor (1 = bottom). Tune so the feet sit on the ground. */
  anchorY?: number;
  /** Contact-shadow half-width / half-height. */
  shadowWidth?: number;
  shadowHeight?: number;
  shadowAlpha?: number;
  /** Vertical offset of the shadow from the container origin. */
  shadowOffsetY?: number;
};

function applyDisplayHeight(sprite: PIXI.Sprite, height: number): number {
  const textureHeight = Math.max(sprite.texture.height, 1);
  const scale = height / textureHeight;
  sprite.scale.set(scale);
  return scale;
}

export function createPlayerVisual(options: CreatePlayerVisualOptions = {}): PlayerVisual {
  const displayHeight = options.displayHeight ?? 104;
  const anchorY = options.anchorY ?? 0.86;
  const shadowWidth = options.shadowWidth ?? 26;
  const shadowHeight = options.shadowHeight ?? 9;
  const shadowAlpha = options.shadowAlpha ?? 0.44;
  const shadowOffsetY = options.shadowOffsetY ?? 24;

  const container = new PIXI.Container();
  const shadow = new PIXI.Graphics();
  const body = new PIXI.Container();

  shadow.ellipse(0, shadowOffsetY, shadowWidth, shadowHeight).fill({ color: 0x000000, alpha: shadowAlpha });

  // Placeholder shown until the king texture is loaded.
  const placeholder = new PIXI.Graphics();
  placeholder.roundRect(-16, -42, 32, 46, 9).fill(0x1a2330).stroke({ color: 0xf0c26a, width: 2 });
  body.addChild(placeholder);

  container.addChild(shadow, body);

  let sprite: PIXI.Sprite | null = null;
  let baseScale = 1;
  let facingX = 1;

  return {
    container,
    setSprite(texture: PIXI.Texture) {
      placeholder.destroy();
      sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5, anchorY);
      sprite.roundPixels = true;
      baseScale = applyDisplayHeight(sprite, displayHeight);
      body.addChildAt(sprite, 0);
    },
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

      if (sprite) {
        sprite.scale.set(baseScale * facingX, baseScale * breath);
        sprite.tint = flashTint != null ? flashTint : facing.y < -0.35 ? 0xb9c1d2 : 0xffffff;
      }

      // Shadow tightens and fades a touch as the feet lift on each step.
      shadow.scale.set(moving ? 1 + step * 0.08 : 1 + Math.sin(elapsedSeconds * 2.4 + Math.PI) * 0.04, moving ? 1 - step * 0.16 : 1);
      shadow.alpha = moving ? 1 - step * 0.18 : 1;
    },
  };
}
