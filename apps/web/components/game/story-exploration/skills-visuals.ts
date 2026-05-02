import * as PIXI from "pixi.js";

import { combat } from "@idleking/game-core";

type ActiveSkillEffect = combat.ActiveSkillEffect;
type SkillId = combat.SkillId;

type SkillVisual = {
  graphic: PIXI.Graphics;
  skillId: SkillId;
  startedAtMs: number;
};

type InstantSkillVisual = {
  graphic: PIXI.Graphics;
  skillId: "royal_strike";
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

function effectKey(effect: ActiveSkillEffect): string {
  return `${effect.skillId}:${effect.startedAtMs}`;
}

function createSkillVisual(effect: ActiveSkillEffect, player: PIXI.Container): SkillVisual {
  const graphic = new PIXI.Graphics();
  graphic.zIndex = effect.skillId === "king_aura" || effect.skillId === "war_cry" ? -1 : 1;
  player.addChild(graphic);
  player.sortableChildren = true;
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

function renderRoyalBeam(graphic: PIXI.Graphics, effect: ActiveSkillEffect, nowMs: number): void {
  const range = effect.range ?? 420;
  const width = effect.width ?? 72;
  const progress = Math.min(Math.max((nowMs - effect.startedAtMs) / Math.max(effect.endsAtMs - effect.startedAtMs, 1), 0), 1);
  const alpha = 0.34 + Math.sin(nowMs / 90) * 0.08;

  graphic.clear();
  graphic
    .roundRect(-width / 2, -range, width, range, 14)
    .fill({ color: 0xff6a2a, alpha: alpha * (1 - progress * 0.22) });
  graphic.roundRect(-width * 0.18, -range, width * 0.36, range, 10).fill({ color: 0xffd36a, alpha: 0.42 });
  graphic.moveTo(0, -24).lineTo(0, -range).stroke({ color: 0xfff1b8, alpha: 0.55, width: 3 });
}

function renderKingAura(graphic: PIXI.Graphics, effect: ActiveSkillEffect, nowMs: number): void {
  const radius = effect.radius ?? 180;
  const pulse = 1 + Math.sin((nowMs - effect.startedAtMs) / 180) * 0.06;

  graphic.clear();
  graphic.scale.set(pulse);
  graphic.circle(0, 0, radius).fill({ color: 0x7f45ff, alpha: 0.12 });
  graphic.circle(0, 0, radius * 0.82).stroke({ color: 0xf0c26a, alpha: 0.46, width: 4 });
  graphic.circle(0, 0, radius).stroke({ color: 0x9d72ff, alpha: 0.42, width: 2 });
}

function renderWarCry(graphic: PIXI.Graphics, effect: ActiveSkillEffect, nowMs: number): void {
  const pulse = 1 + Math.sin((nowMs - effect.startedAtMs) / 120) * 0.09;

  graphic.clear();
  graphic.scale.set(pulse);
  graphic.circle(0, 0, 78).fill({ color: 0xf0c26a, alpha: 0.16 });
  graphic.circle(0, 0, 58).stroke({ color: 0xfff1b8, alpha: 0.62, width: 5 });
  graphic.circle(0, 0, 92).stroke({ color: 0xffb84a, alpha: 0.28, width: 3 });
}

function renderActiveVisual(visual: SkillVisual, effect: ActiveSkillEffect, nowMs: number): void {
  visual.graphic.position.set(0, 0);
  visual.graphic.rotation = 0;

  if (effect.skillId === "royal_beam") {
    renderRoyalBeam(visual.graphic, effect, nowMs);
    return;
  }

  if (effect.skillId === "king_aura") {
    renderKingAura(visual.graphic, effect, nowMs);
    return;
  }

  if (effect.skillId === "war_cry") {
    renderWarCry(visual.graphic, effect, nowMs);
  }
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
    visual.graphic.position.set(0, 0);
    visual.graphic.rotation = -Math.PI / 2;
  }
}

export function spawnInstantSkillEffect(player: PIXI.Container, skillId: SkillId, startedAtMs: number): void {
  if (skillId !== "royal_strike") return;

  const graphic = new PIXI.Graphics();
  graphic.zIndex = 2;
  player.addChild(graphic);
  player.sortableChildren = true;

  getInstantVisuals(player).push({
    graphic,
    skillId,
    startedAtMs,
  });
}

export function renderSkillEffects(
  app: PIXI.Application,
  player: PIXI.Container,
  activeEffects: ActiveSkillEffect[],
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
