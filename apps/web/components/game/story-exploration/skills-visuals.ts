import * as PIXI from "pixi.js";

import { BW } from "@/components/game/shared/geometric-figure";
import type { SkillCategory, SkillDefinition, SkillId, StorySkillAttackProfile } from "@idleking/game-core/skills";

/**
 * Skill FX — same minimalist grayscale geometry as the rest of the combat
 * slice. Every effect is redrawn per frame from elapsed time only, so the
 * visuals stay deterministic and allocation-free.
 */

type DirectionalSkillSnapshot = {
  angle: number;
  directionX: number;
  directionY: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
};

type VisualActiveSkillEffect = Partial<DirectionalSkillSnapshot> & {
  category: SkillCategory;
  endsAtMs: number;
  skillDef: SkillDefinition;
  skillId: SkillId;
  startedAtMs: number;
  targetX?: number;
  targetY?: number;
};

type SkillVisual = {
  graphic: PIXI.Graphics;
  skillId: SkillId;
  startedAtMs: number;
};

type InstantSkillVisual = {
  /** Real hit-detection shape (range/angle/width/radius) — drives the FX so it never lies about the hitbox. */
  attack: StorySkillAttackProfile | undefined;
  durationMs: number;
  graphic: PIXI.Graphics;
  snapshot: DirectionalSkillSnapshot;
  skillDef: SkillDefinition;
  skillId: SkillId;
  startedAtMs: number;
};

const ACTIVE_VISUALS = new WeakMap<PIXI.Container, Map<string, SkillVisual>>();
const INSTANT_VISUALS = new WeakMap<PIXI.Container, InstantSkillVisual[]>();

const INSTANT_DURATIONS_MS: Partial<Record<SkillDefinition["targeting"], number>> = {
  aoe: 420,
  auto_target: 260,
  cone: 280,
  enemy_cast: 380,
  line: 340,
};
const DEFAULT_INSTANT_DURATION_MS = 240;

function getActiveVisuals(player: PIXI.Container): Map<string, SkillVisual> {
  let visuals = ACTIVE_VISUALS.get(player);
  if (!visuals) {
    visuals = new Map();
    ACTIVE_VISUALS.set(player, visuals);
  }
  return visuals;
}

function getInstantVisuals(player: PIXI.Container): InstantSkillVisual[] {
  let visuals = INSTANT_VISUALS.get(player);
  if (!visuals) {
    visuals = [];
    INSTANT_VISUALS.set(player, visuals);
  }
  return visuals;
}

function effectKey(effect: VisualActiveSkillEffect): string {
  return `${effect.skillId}:${effect.startedAtMs}`;
}

function getWorldLayer(player: PIXI.Container): PIXI.Container {
  return player.parent ?? player;
}

function createSkillVisual(effect: VisualActiveSkillEffect, player: PIXI.Container): SkillVisual {
  const graphic = new PIXI.Graphics();
  graphic.zIndex = -1;
  const layer = player;
  layer.addChild(graphic);
  layer.sortableChildren = true;
  return {
    graphic,
    skillId: effect.skillId,
    startedAtMs: effect.startedAtMs,
  };
}

function removeGraphic(graphic: PIXI.Graphics): void {
  graphic.removeFromParent();
  graphic.destroy();
}

/** Cheap deterministic hash → [0, 1), stable per particle index. */
function hash01(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function drawDashedRing(
  graphic: PIXI.Graphics,
  radius: number,
  rotation: number,
  segments: number,
  stroke: { alpha: number; color: number; width: number }
): void {
  const step = (Math.PI * 2) / segments;
  const arcSpan = step * 0.55;
  for (let index = 0; index < segments; index += 1) {
    const start = rotation + index * step;
    graphic.arc(0, 0, radius, start, start + arcSpan).stroke(stroke);
    graphic.moveTo(0, 0);
  }
  graphic.moveTo(0, 0);
}

/* =========================
   ACTIVE (duration) EFFECTS
   ========================= */

function renderMovementEffect(graphic: PIXI.Graphics, effect: VisualActiveSkillEffect, elapsedMs: number, progress: number): void {
  const fade = 1 - progress;
  const hasDirection = effect.directionX !== undefined && effect.directionY !== undefined;
  const angle = hasDirection ? Math.atan2(effect.directionY ?? 0, effect.directionX ?? 1) : 0;

  graphic.rotation = angle;

  // Speed lines streaking backwards from the player.
  for (let index = 0; index < 5; index += 1) {
    const lane = (index - 2) * 13;
    const jitter = hash01(index, effect.startedAtMs) * 24;
    const startX = -18 - jitter - progress * 46;
    const length = 26 + hash01(index + 5, effect.startedAtMs) * 22;
    graphic
      .moveTo(startX, lane)
      .lineTo(startX - length, lane)
      .stroke({ alpha: (0.6 - index * 0.07) * fade, color: index % 2 === 0 ? BW.white : BW.gray4, width: index % 2 === 0 ? 3 : 2 });
  }

  // Split ring snapping open at the start.
  if (progress < 0.4) {
    const open = progress / 0.4;
    const ringRadius = 30 + open * 26;
    graphic.arc(0, 0, ringRadius, Math.PI * 0.7, Math.PI * 1.3).stroke({ alpha: 0.7 * (1 - open), color: BW.gray4, width: 3 });
    graphic.moveTo(0, 0);
    graphic.arc(0, 0, ringRadius, -Math.PI * 0.3, Math.PI * 0.3).stroke({ alpha: 0.7 * (1 - open), color: BW.gray4, width: 3 });
    graphic.moveTo(0, 0);
  }
  void elapsedMs;
}

function renderDefenseEffect(graphic: PIXI.Graphics, elapsedMs: number, progress: number): void {
  const fade = progress > 0.8 ? (1 - progress) / 0.2 : 1;

  // Cast flash — a ring that locks into place.
  if (progress < 0.14) {
    const lock = progress / 0.14;
    graphic.circle(0, -34, 96 * (1.5 - lock * 0.5)).stroke({ alpha: 0.5 * lock, color: BW.white, width: 2 });
  }

  // Two counter-rotating dashed rings — the shield.
  drawDashedRing(graphic, 62, elapsedMs * 0.0016, 6, { alpha: 0.62 * fade, color: BW.gray4, width: 3 });
  drawDashedRing(graphic, 74, -elapsedMs * 0.001, 10, { alpha: 0.34 * fade, color: BW.gray3, width: 2 });

  // Orbiting guard segment — brightest element, marks the shield as live.
  const orbit = elapsedMs * 0.0024;
  graphic.arc(0, 0, 68, orbit, orbit + 0.7).stroke({ alpha: 0.85 * fade, color: BW.white, width: 4 });
  graphic.moveTo(0, 0);
}

function renderSummonEffect(graphic: PIXI.Graphics, elapsedMs: number, progress: number): void {
  const fade = progress > 0.85 ? (1 - progress) / 0.15 : 1;
  const anchorX = 44;
  const anchorY = -10;

  // Summon circle — rotating square inscribed in a ring.
  const spin = elapsedMs * 0.0018;
  graphic.circle(anchorX, anchorY, 26).stroke({ alpha: 0.6 * fade, color: BW.gray4, width: 2 });
  const half = 17;
  const corners: number[] = [];
  for (let index = 0; index < 4; index += 1) {
    const cornerAngle = spin + (index * Math.PI) / 2;
    corners.push(anchorX + Math.cos(cornerAngle) * half, anchorY + Math.sin(cornerAngle) * half);
  }
  graphic.poly(corners).stroke({ alpha: 0.75 * fade, color: BW.white, width: 2 });

  // Satellite dot orbiting the circle.
  const satAngle = -elapsedMs * 0.003;
  graphic
    .circle(anchorX + Math.cos(satAngle) * 33, anchorY + Math.sin(satAngle) * 33, 3.4)
    .fill({ alpha: 0.9 * fade, color: BW.white });

  // Materialization pulse at the start.
  if (progress < 0.25) {
    const pulse = progress / 0.25;
    graphic.circle(anchorX, anchorY, 26 + pulse * 22).stroke({ alpha: 0.55 * (1 - pulse), color: BW.gray3, width: 2 });
  }
}

function renderAuraEffect(graphic: PIXI.Graphics, effect: VisualActiveSkillEffect, elapsedMs: number, progress: number): void {
  const fade = progress > 0.82 ? (1 - progress) / 0.18 : 1;
  const isDefBoost = effect.category === "defense";
  const baseColor = isDefBoost ? BW.gray3 : BW.gray4;

  // Base ring under the player, gently breathing.
  const breath = 1 + Math.sin(elapsedMs * 0.005) * 0.05;
  graphic.ellipse(0, 4, 40 * breath, 14 * breath).stroke({ alpha: 0.55 * fade, color: baseColor, width: 2 });

  // Rising ticks — power flowing upward around the figure.
  for (let index = 0; index < 6; index += 1) {
    const cycle = 900 + hash01(index, effect.startedAtMs) * 500;
    const local = ((elapsedMs + hash01(index + 9, effect.startedAtMs) * cycle) % cycle) / cycle;
    const x = (hash01(index + 3, effect.startedAtMs) - 0.5) * 76;
    const y = 2 - local * 92;
    const tickFade = Math.sin(local * Math.PI);
    graphic
      .moveTo(x, y)
      .lineTo(x, y - 9)
      .stroke({ alpha: 0.7 * tickFade * fade, color: index % 3 === 0 ? BW.white : baseColor, width: 2 });
  }
}

function renderActiveVisual(visual: SkillVisual, effect: VisualActiveSkillEffect, nowMs: number): void {
  const durationMs = Math.max(effect.endsAtMs - effect.startedAtMs, 1);
  const elapsedMs = nowMs - effect.startedAtMs;
  const progress = Math.min(Math.max(elapsedMs / durationMs, 0), 1);
  const graphic = visual.graphic;

  graphic.clear();
  graphic.position.set(0, -34);
  graphic.rotation = 0;
  graphic.scale.set(1);

  if (effect.category === "movement") {
    graphic.position.set(0, -30);
    renderMovementEffect(graphic, effect, elapsedMs, progress);
    return;
  }

  if (effect.category === "defense") {
    graphic.position.set(0, -34);
    renderDefenseEffect(graphic, elapsedMs, progress);
    return;
  }

  if (effect.category === "summon") {
    graphic.position.set(0, -20);
    renderSummonEffect(graphic, elapsedMs, progress);
    return;
  }

  graphic.position.set(0, 0);
  renderAuraEffect(graphic, effect, elapsedMs, progress);
}

/* =========================
   INSTANT (cast) EFFECTS
   ========================= */

function renderConeCast(graphic: PIXI.Graphics, visual: InstantSkillVisual, progress: number): void {
  const fade = 1 - progress;
  const halfAngle = visual.attack?.halfAngleRadians ?? 0.7;
  const range = visual.attack?.range ?? 170;
  const sweep = Math.min(1, progress / 0.55);
  const edgeAngle = -halfAngle + sweep * halfAngle * 2;

  graphic
    .moveTo(0, 0)
    .arc(0, 0, range, -halfAngle, edgeAngle)
    .lineTo(0, 0)
    .fill({ alpha: 0.28 * fade, color: BW.gray4 });
  graphic.arc(0, 0, range, -halfAngle, edgeAngle).stroke({ alpha: 0.5 * fade, color: BW.gray4, width: 4 });
  graphic.moveTo(0, 0);

  // Leading edge ray.
  graphic
    .moveTo(Math.cos(edgeAngle) * range * 0.16, Math.sin(edgeAngle) * range * 0.16)
    .lineTo(Math.cos(edgeAngle) * range, Math.sin(edgeAngle) * range)
    .stroke({ alpha: 0.95 * fade, color: BW.white, width: 5 });

  // Rim flash once the sweep completes.
  if (sweep >= 1) {
    graphic.arc(0, 0, range * (1 + (progress - 0.55) * 0.14), -halfAngle, halfAngle).stroke({
      alpha: 0.6 * fade,
      color: BW.white,
      width: 2,
    });
    graphic.moveTo(0, 0);
  }

  graphic.position.set(visual.snapshot.originX, visual.snapshot.originY);
  graphic.rotation = visual.snapshot.angle;
}

function renderLineCast(graphic: PIXI.Graphics, visual: InstantSkillVisual, progress: number): void {
  const fade = 1 - progress;
  const range = visual.attack?.range ?? 360;
  const hitWidth = visual.attack?.width ?? 64;
  const reach = Math.min(1, progress / 0.3);
  const width = hitWidth * (1 - progress * 0.65);

  // Outer channel collapsing inward — its full width IS the real hit width.
  graphic.rect(0, -hitWidth / 2, range * reach, hitWidth).stroke({ alpha: 0.28 * fade, color: BW.gray3, width: 2 });
  graphic.rect(0, -width / 2, range * reach, width).stroke({ alpha: 0.4 * fade, color: BW.gray3, width: 2 });

  // Bright core beam.
  graphic
    .moveTo(0, 0)
    .lineTo(range * reach, 0)
    .stroke({ alpha: 0.9 * fade, color: BW.white, width: Math.max(2, 9 * fade) });

  // Flowing dashes along the beam.
  const dashOffset = (progress * 340) % 56;
  for (let x = dashOffset; x < range * reach; x += 56) {
    graphic
      .moveTo(x, 0)
      .lineTo(Math.min(x + 20, range * reach), 0)
      .stroke({ alpha: 0.6 * fade, color: BW.gray4, width: 13 * fade });
  }

  // Muzzle flash at the origin.
  if (progress < 0.25) {
    const muzzle = 1 - progress / 0.25;
    graphic.circle(0, 0, 14 * muzzle + 4).stroke({ alpha: 0.8 * muzzle, color: BW.white, width: 3 });
  }

  graphic.position.set(visual.snapshot.originX, visual.snapshot.originY);
  graphic.rotation = visual.snapshot.angle;
}

function renderAoeCast(graphic: PIXI.Graphics, visual: InstantSkillVisual, progress: number, ageMs: number): void {
  const radius = visual.attack?.radius ?? 80;

  if (progress < 0.38) {
    // Converge — dashed ring contracts onto the target point.
    const converge = progress / 0.38;
    drawDashedRing(graphic, radius * (1.7 - converge * 0.7), ageMs * 0.005, 8, {
      alpha: 0.35 + converge * 0.45,
      color: BW.gray4,
      width: 2,
    });
    // Crosshair.
    const arm = 10;
    graphic
      .moveTo(-arm, 0)
      .lineTo(arm, 0)
      .moveTo(0, -arm)
      .lineTo(0, arm)
      .stroke({ alpha: 0.4 + converge * 0.5, color: BW.white, width: 2 });
  } else {
    // Detonate — flash fill, expanding ring, radial ticks.
    const burst = (progress - 0.38) / 0.62;
    const fade = 1 - burst;
    graphic.circle(0, 0, radius).fill({ alpha: 0.22 * fade, color: BW.gray3 });
    graphic.circle(0, 0, radius * (0.55 + burst * 0.6)).stroke({ alpha: 0.85 * fade, color: BW.white, width: Math.max(1, 5 * fade) });
    for (let index = 0; index < 8; index += 1) {
      const angle = (index * Math.PI) / 4 + 0.2;
      const inner = radius * (0.62 + burst * 0.5);
      const outer = inner + 14 * fade;
      graphic
        .moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
        .lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
        .stroke({ alpha: 0.7 * fade, color: BW.gray4, width: 2 });
    }
  }

  graphic.position.set(visual.snapshot.targetX, visual.snapshot.targetY);
  graphic.rotation = 0;
}

/**
 * Thin magic-lightning bolt for auto_target skills (e.g. Arcane Bolt) — a
 * jagged line from the cast origin straight to the actually-resolved target,
 * not a beam along the facing direction. Reads as instantaneous: it snaps in
 * at full length and flickers/fades rather than growing or travelling.
 */
function renderLightningBolt(graphic: PIXI.Graphics, visual: InstantSkillVisual, progress: number): void {
  const dx = visual.snapshot.targetX - visual.snapshot.originX;
  const dy = visual.snapshot.targetY - visual.snapshot.originY;
  const distance = Math.hypot(dx, dy) || 1;
  const perpX = -dy / distance;
  const perpY = dx / distance;

  const flicker = progress < 0.5 ? (Math.sin(progress * 70) > 0 ? 1 : 0.3) : 1;
  const fade = progress < 0.55 ? 1 : 1 - (progress - 0.55) / 0.45;
  const alpha = flicker * fade;

  const segments = 6;
  const points: number[] = [0, 0];
  for (let index = 1; index < segments; index += 1) {
    const t = index / segments;
    const taper = 1 - Math.abs(t - 0.5) * 1.3;
    const jitter = (hash01(index, visual.startedAtMs) - 0.5) * Math.min(24, distance * 0.12) * taper;
    points.push(dx * t + perpX * jitter, dy * t + perpY * jitter);
  }
  points.push(dx, dy);

  // Faint glow pass, then the crisp bright core — same jagged path twice.
  for (const [color, width, coreAlpha] of [
    [BW.gray4, 6, 0.32],
    [BW.white, 2, 0.95],
  ] as const) {
    graphic.moveTo(points[0], points[1]);
    for (let index = 2; index < points.length; index += 2) {
      graphic.lineTo(points[index], points[index + 1]);
    }
    graphic.stroke({ alpha: coreAlpha * alpha, color, width });
  }

  // Spark at the cast point and a small flash on the struck target.
  graphic.circle(0, 0, 4).fill({ alpha: 0.8 * alpha, color: BW.white });
  graphic.circle(dx, dy, 5).fill({ alpha: 0.85 * alpha, color: BW.white });
  graphic.circle(dx, dy, 10).stroke({ alpha: 0.5 * alpha, color: BW.gray4, width: 1.5 });

  graphic.position.set(visual.snapshot.originX, visual.snapshot.originY);
  graphic.rotation = 0;
}

function renderStrikeCast(graphic: PIXI.Graphics, visual: InstantSkillVisual, progress: number): void {
  const fade = 1 - progress;

  // Strike bolt dropping from above during the first third.
  if (progress < 0.34) {
    const drop = progress / 0.34;
    const topY = -96 * (1 - drop);
    graphic
      .moveTo(0, topY - 26)
      .lineTo(0, topY)
      .stroke({ alpha: 0.9, color: BW.white, width: 4 });
  }

  graphic.circle(0, 0, 34).fill({ alpha: 0.25 * fade, color: BW.gray4 });
  graphic.circle(0, 0, 30 + progress * 26).stroke({ alpha: 0.8 * fade, color: BW.white, width: Math.max(1, 4 * fade) });

  graphic.position.set(visual.snapshot.targetX, visual.snapshot.targetY);
  graphic.rotation = 0;
}

function renderInstantVisuals(player: PIXI.Container, nowMs: number): void {
  const visuals = getInstantVisuals(player);

  for (let index = visuals.length - 1; index >= 0; index -= 1) {
    const visual = visuals[index];
    const ageMs = nowMs - visual.startedAtMs;
    const progress = Math.min(Math.max(ageMs / visual.durationMs, 0), 1);

    if (progress >= 1) {
      removeGraphic(visual.graphic);
      visuals.splice(index, 1);
      continue;
    }

    visual.graphic.clear();
    visual.graphic.scale.set(1);

    if (visual.skillDef.targeting === "cone") {
      renderConeCast(visual.graphic, visual, progress);
      continue;
    }

    if (visual.skillDef.targeting === "line") {
      renderLineCast(visual.graphic, visual, progress);
      continue;
    }

    if (visual.skillDef.targeting === "aoe" || visual.skillDef.targeting === "enemy_cast") {
      renderAoeCast(visual.graphic, visual, progress, ageMs);
      continue;
    }

    if (visual.skillDef.targeting === "auto_target") {
      renderLightningBolt(visual.graphic, visual, progress);
      continue;
    }

    renderStrikeCast(visual.graphic, visual, progress);
  }
}

export function spawnInstantSkillEffect(
  player: PIXI.Container,
  skillDef: SkillDefinition,
  startedAtMs: number,
  snapshot: DirectionalSkillSnapshot,
  attack: StorySkillAttackProfile | undefined,
): void {
  const graphic = new PIXI.Graphics();
  graphic.zIndex = 2;
  const layer = getWorldLayer(player);
  layer.addChild(graphic);
  layer.sortableChildren = true;

  getInstantVisuals(player).push({
    attack,
    durationMs: INSTANT_DURATIONS_MS[skillDef.targeting] ?? DEFAULT_INSTANT_DURATION_MS,
    graphic,
    snapshot,
    skillDef,
    skillId: skillDef.id,
    startedAtMs,
  });
}

export function renderSkillEffects(
  app: PIXI.Application,
  player: PIXI.Container,
  activeEffects: VisualActiveSkillEffect[],
): void {
  void app;
  const nowMs = performance.now();
  const visuals = getActiveVisuals(player);
  const activeKeys = new Set(activeEffects.map(effectKey));

  for (const effect of activeEffects) {
    const key = effectKey(effect);
    const visual = visuals.get(key) ?? createSkillVisual(effect, player);
    visuals.set(key, visual);
    renderActiveVisual(visual, effect, nowMs);
  }

  for (const [key, visual] of visuals) {
    if (activeKeys.has(key)) continue;
    removeGraphic(visual.graphic);
    visuals.delete(key);
  }

  renderInstantVisuals(player, nowMs);
}

export function cleanupSkillEffects(player: PIXI.Container): void {
  const activeVisuals = ACTIVE_VISUALS.get(player);
  if (activeVisuals) {
    for (const visual of activeVisuals.values()) {
      removeGraphic(visual.graphic);
    }
    activeVisuals.clear();
    ACTIVE_VISUALS.delete(player);
  }

  const instantVisuals = INSTANT_VISUALS.get(player);
  if (instantVisuals) {
    for (const visual of instantVisuals) {
      removeGraphic(visual.graphic);
    }
    instantVisuals.length = 0;
    INSTANT_VISUALS.delete(player);
  }
}
