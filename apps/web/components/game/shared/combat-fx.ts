import * as PIXI from "pixi.js";

import { BW } from "./geometric-figure";

/**
 * Shared grayscale combat FX vocabulary (impacts, deaths, telegraphs,
 * shockwaves, trails) for every PixiJS combat mode. Same language as the
 * geometric figures: strokes, wedges and shards — no textures, no color.
 *
 * Every effect is a single PIXI.Graphics redrawn from a time-based render
 * closure, so the manager stays allocation-free per frame.
 */

type Vector2 = {
  x: number;
  y: number;
};

type FxRender = (graphic: PIXI.Graphics, progress: number, ageMs: number) => void;

type FxInstance = {
  ageMs: number;
  durationMs: number;
  follow?: () => Vector2;
  graphic: PIXI.Graphics;
  render: FxRender;
};

type Shard = {
  angle: number;
  length: number;
  speed: number;
  tone: number;
  width: number;
};

export type ImpactBurstOptions = {
  /** Crit hits get a cross flash and a wider ring. */
  crit?: boolean;
  /** Lethal hits read brightest (white ring). */
  lethal?: boolean;
  /** Base radius of the burst, defaults to 26. */
  radius?: number;
};

export type WindupRingOptions = {
  color?: number;
  /** Track a moving source (e.g. an enemy) instead of a fixed point. */
  follow?: () => Vector2;
  lethal?: boolean;
};

export type CombatFxManager = {
  cleanup: () => void;
  spawnDeathBurst: (position: Vector2, radius?: number) => void;
  spawnImpactBurst: (position: Vector2, options?: ImpactBurstOptions) => void;
  spawnShockwave: (position: Vector2, radius: number, color?: number) => void;
  spawnTrailDot: (position: Vector2, size: number, color?: number) => void;
  spawnWindupRing: (position: Vector2, radius: number, durationMs: number, options?: WindupRingOptions) => void;
  update: (deltaMs: number) => void;
};

const IMPACT_DURATION_MS = 300;
const DEATH_DURATION_MS = 480;
const SHOCKWAVE_DURATION_MS = 340;
const TRAIL_DURATION_MS = 240;

function makeShards(count: number, baseSpeed: number): Shard[] {
  const shards: Shard[] = [];
  for (let index = 0; index < count; index += 1) {
    shards.push({
      angle: Math.random() * Math.PI * 2,
      length: 7 + Math.random() * 9,
      speed: baseSpeed * (0.6 + Math.random() * 0.8),
      tone: index % 3 === 0 ? BW.gray3 : BW.white,
      width: index % 2 === 0 ? 2 : 3,
    });
  }
  return shards;
}

function drawShards(graphic: PIXI.Graphics, shards: Shard[], travel: number, fade: number, shrink: number): void {
  for (const shard of shards) {
    const distance = shard.speed * travel;
    const length = shard.length * (1 - shrink);
    if (length <= 0.5) continue;
    const cos = Math.cos(shard.angle);
    const sin = Math.sin(shard.angle);
    graphic
      .moveTo(cos * distance, sin * distance)
      .lineTo(cos * (distance + length), sin * (distance + length))
      .stroke({ alpha: fade, color: shard.tone, width: shard.width });
  }
}

export function drawDashedRing(
  graphic: PIXI.Graphics,
  radius: number,
  rotation: number,
  segments: number,
  stroke: { alpha: number; color: number; width: number }
): void {
  const gapRatio = 0.42;
  const step = (Math.PI * 2) / segments;
  const arcSpan = step * (1 - gapRatio);
  for (let index = 0; index < segments; index += 1) {
    const start = rotation + index * step;
    graphic.arc(0, 0, radius, start, start + arcSpan).stroke(stroke);
    graphic.moveTo(0, 0);
  }
  // arc() keeps a running path; clear the dangling moveTo so later shapes
  // don't connect back to the ring center.
  graphic.moveTo(0, 0);
}

export function createCombatFxManager(layer: PIXI.Container): CombatFxManager {
  const instances: FxInstance[] = [];

  function spawn(position: Vector2, durationMs: number, render: FxRender, follow?: () => Vector2): void {
    const graphic = new PIXI.Graphics();
    graphic.position.set(position.x, position.y);
    layer.addChild(graphic);
    instances.push({ ageMs: 0, durationMs, follow, graphic, render });
  }

  function spawnImpactBurst(position: Vector2, options: ImpactBurstOptions = {}): void {
    const { crit = false, lethal = false, radius = 26 } = options;
    const shards = makeShards(crit ? 9 : 6, crit ? 210 : 150);
    const ringColor = lethal ? BW.white : crit ? BW.gray4 : BW.gray3;
    const maxRadius = radius * (crit ? 2.1 : 1.6);

    spawn(position, IMPACT_DURATION_MS * (crit ? 1.25 : 1), (graphic, progress) => {
      const fade = 1 - progress;
      graphic.clear();

      // Shockwave ring — expands fast, thins out.
      const ringRadius = radius * 0.4 + (maxRadius - radius * 0.4) * Math.min(1, progress * 1.5);
      graphic.circle(0, 0, ringRadius).stroke({
        alpha: 0.7 * fade,
        color: ringColor,
        width: Math.max(1, 4 * fade),
      });

      // Flash core for the first third.
      if (progress < 0.32) {
        const coreFade = 1 - progress / 0.32;
        graphic.circle(0, 0, radius * 0.34 * coreFade + 2).fill({ alpha: 0.85 * coreFade, color: BW.white });
      }

      // Crit cross — four long rays.
      if (crit && progress < 0.5) {
        const rayFade = 1 - progress / 0.5;
        const rayLength = radius * 1.9 * (0.6 + progress);
        for (let index = 0; index < 4; index += 1) {
          const angle = Math.PI / 4 + (index * Math.PI) / 2;
          graphic
            .moveTo(Math.cos(angle) * radius * 0.3, Math.sin(angle) * radius * 0.3)
            .lineTo(Math.cos(angle) * rayLength, Math.sin(angle) * rayLength)
            .stroke({ alpha: 0.8 * rayFade, color: BW.white, width: 2 });
        }
      }

      drawShards(graphic, shards, progress * 0.34, 0.9 * fade, progress * 0.55);
    });
  }

  function spawnDeathBurst(position: Vector2, radius = 30): void {
    const shards = makeShards(10, 190);

    spawn(position, DEATH_DURATION_MS, (graphic, progress) => {
      graphic.clear();

      // Ground mark — flattened ellipse that lingers then fades.
      graphic.ellipse(0, radius * 0.42, radius * (0.9 + progress * 0.4), radius * 0.26).stroke({
        alpha: 0.34 * (1 - progress),
        color: BW.gray2,
        width: 2,
      });

      if (progress < 0.3) {
        // Implosion — ring contracts to the core.
        const implode = 1 - progress / 0.3;
        graphic.circle(0, 0, radius * 1.5 * implode + 4).stroke({
          alpha: 0.75 * (0.4 + implode * 0.6),
          color: BW.white,
          width: 3,
        });
        return;
      }

      // Burst — thin expanding ring + shards.
      const burstProgress = (progress - 0.3) / 0.7;
      const fade = 1 - burstProgress;
      graphic.circle(0, 0, radius * (0.4 + burstProgress * 2.1)).stroke({
        alpha: 0.6 * fade,
        color: BW.gray4,
        width: Math.max(1, 3 * fade),
      });
      drawShards(graphic, shards, burstProgress * 0.5, 0.92 * fade, burstProgress * 0.4);
    });
  }

  function spawnShockwave(position: Vector2, radius: number, color: number = BW.gray4): void {
    spawn(position, SHOCKWAVE_DURATION_MS, (graphic, progress) => {
      const fade = 1 - progress;
      const eased = 1 - (1 - progress) * (1 - progress);
      graphic.clear();
      graphic.circle(0, 0, radius * (0.3 + eased * 0.85)).stroke({
        alpha: 0.72 * fade,
        color,
        width: Math.max(1, 5 * fade),
      });
      graphic.circle(0, 0, radius * (0.16 + eased * 0.6)).stroke({
        alpha: 0.4 * fade,
        color: BW.white,
        width: 2,
      });
    });
  }

  function spawnWindupRing(position: Vector2, radius: number, durationMs: number, options: WindupRingOptions = {}): void {
    const { color = BW.gray3, follow, lethal = false } = options;
    const ringColor = lethal ? BW.white : color;

    spawn(
      position,
      durationMs,
      (graphic, progress, ageMs) => {
        graphic.clear();

        // Danger reads as convergence: dashed ring contracts onto the target.
        const currentRadius = radius * (1.65 - progress * 0.65);
        drawDashedRing(graphic, currentRadius, ageMs * 0.004, 8, {
          alpha: 0.32 + progress * 0.5,
          color: ringColor,
          width: 2,
        });

        // Inner fixed edge — the actual danger area.
        graphic.circle(0, 0, radius).stroke({ alpha: 0.2 + progress * 0.3, color: ringColor, width: 1.5 });

        // Center cross sharpens right before impact.
        if (progress > 0.55) {
          const crossFade = (progress - 0.55) / 0.45;
          const arm = 7 + crossFade * 4;
          graphic
            .moveTo(-arm, 0)
            .lineTo(arm, 0)
            .moveTo(0, -arm)
            .lineTo(0, arm)
            .stroke({ alpha: 0.75 * crossFade, color: ringColor, width: 2 });
        }
      },
      follow
    );
  }

  function spawnTrailDot(position: Vector2, size: number, color: number = BW.gray3): void {
    spawn(position, TRAIL_DURATION_MS, (graphic, progress) => {
      const fade = (1 - progress) * 0.55;
      const half = (size * (1 - progress * 0.7)) / 2;
      graphic.clear();
      graphic
        .poly([0, -half, half, 0, 0, half, -half, 0])
        .fill({ alpha: fade, color });
    });
  }

  function update(deltaMs: number): void {
    for (let index = instances.length - 1; index >= 0; index -= 1) {
      const instance = instances[index];
      instance.ageMs += deltaMs;

      if (instance.ageMs >= instance.durationMs) {
        instance.graphic.removeFromParent();
        instance.graphic.destroy();
        instances.splice(index, 1);
        continue;
      }

      if (instance.follow) {
        const target = instance.follow();
        instance.graphic.position.set(target.x, target.y);
      }

      const progress = instance.ageMs / instance.durationMs;
      instance.render(instance.graphic, progress, instance.ageMs);
    }
  }

  function cleanup(): void {
    for (const instance of instances) {
      instance.graphic.removeFromParent();
      instance.graphic.destroy();
    }
    instances.length = 0;
  }

  return {
    cleanup,
    spawnDeathBurst,
    spawnImpactBurst,
    spawnShockwave,
    spawnTrailDot,
    spawnWindupRing,
    update,
  };
}

/**
 * Animated melee sweep shared by the exploration and duel stages.
 * The blade edge sweeps across the cone during the first 60% of the swing,
 * leaving a fading wedge behind it — reads as motion instead of a static arc.
 */
export function renderMeleeSweep(
  graphic: PIXI.Graphics,
  progress: number,
  options: { halfAngle?: number; range?: number } = {}
): void {
  const { halfAngle = 0.72, range = 86 } = options;
  const fade = 1 - progress;
  const sweep = Math.min(1, progress / 0.6);
  const edgeAngle = -halfAngle + sweep * halfAngle * 2;

  graphic.clear();

  // Trailing wedge — from the cone start up to the current blade edge.
  graphic
    .moveTo(0, 0)
    .arc(0, 0, range, -halfAngle, edgeAngle)
    .lineTo(0, 0)
    .fill({ alpha: 0.3 * fade, color: BW.gray4 });

  // Swept rim.
  graphic.arc(0, 0, range, -halfAngle, edgeAngle).stroke({ alpha: 0.55 * fade, color: BW.gray4, width: 3 });

  // Leading blade edge — brightest line of the effect.
  graphic
    .moveTo(Math.cos(edgeAngle) * range * 0.2, Math.sin(edgeAngle) * range * 0.2)
    .lineTo(Math.cos(edgeAngle) * range, Math.sin(edgeAngle) * range)
    .stroke({ alpha: 0.95 * fade, color: BW.white, width: 4 });

  // Speed ticks trailing the edge.
  for (let index = 1; index <= 2; index += 1) {
    const tickAngle = edgeAngle - index * 0.16;
    if (tickAngle < -halfAngle) break;
    graphic
      .moveTo(Math.cos(tickAngle) * range * 0.55, Math.sin(tickAngle) * range * 0.55)
      .lineTo(Math.cos(tickAngle) * range * 0.9, Math.sin(tickAngle) * range * 0.9)
      .stroke({ alpha: 0.4 * fade, color: BW.white, width: 2 });
  }
}
