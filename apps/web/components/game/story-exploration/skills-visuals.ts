import * as PIXI from "pixi.js";

import type { SkillCategory, SkillDefinition, SkillId } from "@idleking/game-core/skills";

type DirectionalSkillSnapshot = {
  angle: number;
  directionX: number;
  directionY: number;
  originX: number;
  originY: number;
};

type VisualActiveSkillEffect = Partial<DirectionalSkillSnapshot> & {
  category: SkillCategory;
  endsAtMs: number;
  skillDef: SkillDefinition;
  skillId: SkillId;
  startedAtMs: number;
};

type SkillVisual = {
  graphic: PIXI.Graphics;
  skillId: SkillId;
  startedAtMs: number;
};

type InstantSkillVisual = {
  graphic: PIXI.Graphics;
  snapshot: DirectionalSkillSnapshot;
  skillId: SkillId;
  startedAtMs: number;
};

const ACTIVE_VISUALS = new WeakMap<PIXI.Container, Map<string, SkillVisual>>();
const INSTANT_VISUALS = new WeakMap<PIXI.Container, InstantSkillVisual[]>();

const ROYAL_STRIKE_VISUAL_DURATION_MS = 200;

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

function renderDeferredSkillStub(graphic: PIXI.Graphics, effect: VisualActiveSkillEffect, nowMs: number): void {
  const progress = Math.min(Math.max((nowMs - effect.startedAtMs) / Math.max(effect.endsAtMs - effect.startedAtMs, 1), 0), 1);
  const pulse = 1 + Math.sin((nowMs - effect.startedAtMs) / 120) * 0.08;
  const color = effect.category === "movement"
    ? 0x7dd3fc
    : effect.category === "defense"
      ? 0xa7f3d0
      : effect.category === "summon"
        ? 0xc084fc
        : 0xf0c26a;

  graphic.clear();
  graphic.scale.set(pulse);
  graphic.circle(0, 0, 74).fill({ color, alpha: 0.14 * (1 - progress * 0.4) });
  graphic.circle(0, 0, 52).stroke({ color, alpha: 0.55 * (1 - progress * 0.25), width: 4 });
}

function renderActiveVisual(visual: SkillVisual, effect: VisualActiveSkillEffect, nowMs: number, player: PIXI.Container): void {
  visual.graphic.position.set(0, 0);
  visual.graphic.rotation = 0;
  visual.graphic.scale.set(1);

  void player;
  renderDeferredSkillStub(visual.graphic, effect, nowMs);
}

function renderInstantVisuals(player: PIXI.Container, nowMs: number): void {
  const visuals = getInstantVisuals(player);

  for (let index = visuals.length - 1; index >= 0; index -= 1) {
    const visual = visuals[index];
    const progress = Math.min(Math.max((nowMs - visual.startedAtMs) / ROYAL_STRIKE_VISUAL_DURATION_MS, 0), 1);

    if (progress >= 1) {
      removeGraphic(visual.graphic);
      visuals.splice(index, 1);
      continue;
    }

    const alpha = 0.66 * (1 - progress);
    visual.graphic.clear();
    visual.graphic.scale.set(1 + progress * 0.18);
    visual.graphic
      .moveTo(0, 0)
      .arc(0, 0, 160, -0.54, 0.54)
      .lineTo(0, 0)
      .fill({ color: 0xf0c26a, alpha: alpha * 0.34 });
    visual.graphic.arc(0, 0, 160, -0.5, 0.5).stroke({ color: 0xfff1b8, alpha, width: 7 });
    visual.graphic.position.set(visual.snapshot.originX, visual.snapshot.originY);
    visual.graphic.rotation = visual.snapshot.angle;
  }
}

export function spawnInstantSkillEffect(
  player: PIXI.Container,
  skillId: SkillId,
  startedAtMs: number,
  snapshot: DirectionalSkillSnapshot,
): void {
  const graphic = new PIXI.Graphics();
  graphic.zIndex = 2;
  const layer = getWorldLayer(player);
  layer.addChild(graphic);
  layer.sortableChildren = true;

  getInstantVisuals(player).push({
    graphic,
    snapshot,
    skillId,
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
    renderActiveVisual(visual, effect, nowMs, player);
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
