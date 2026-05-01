"use client";

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

const PLAYER_SIZE = 48;
const PLAYER_SPEED = 310;
const MELEE_ATTACK_COOLDOWN_MS = 280;
const MELEE_DURATION_MS = 120;
const MELEE_RANGE = 86;
const RANGED_ATTACK_COOLDOWN_MS = 450;
const PROJECTILE_MAX_RANGE = 620;
const PROJECTILE_SPEED = 620;

type Vector2 = {
  x: number;
  y: number;
};

type ActiveMeleeAttack = {
  ageMs: number;
  direction: Vector2;
  durationMs: number;
  graphic: PIXI.Graphics;
  position: Vector2;
};

type ActiveProjectile = {
  direction: Vector2;
  distanceTravelled: number;
  graphic: PIXI.Graphics;
  maxRange: number;
  position: Vector2;
  speed: number;
};

type ActiveMouseAction = "melee" | "ranged" | null;

type DuelArenaStageProps = {
  mapHeight: number;
  mapWidth: number;
};

const KEY_DIRECTIONS: Record<string, { x: number; y: number }> = {
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
  KeyQ: { x: -1, y: 0 },
  KeyS: { x: 0, y: 1 },
  KeyW: { x: 0, y: -1 },
  KeyZ: { x: 0, y: -1 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeVector(vector: Vector2, fallback: Vector2 = { x: 0, y: -1 }): Vector2 {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= 0.0001) return fallback;
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

function drawArenaWorld(container: PIXI.Container, mapWidth: number, mapHeight: number) {
  const background = new PIXI.Graphics();
  background.rect(0, 0, mapWidth, mapHeight).fill(0x06080d);

  for (let y = 0; y < mapHeight; y += 80) {
    for (let x = 0; x < mapWidth; x += 80) {
      const tone = (x / 80 + y / 80) % 2 === 0 ? 0x10131c : 0x0b0e16;
      background.rect(x, y, 80, 80).fill({ color: tone, alpha: 0.46 });
    }
  }

  for (let x = 0; x <= mapWidth; x += 120) {
    background.moveTo(x, 0).lineTo(x, mapHeight).stroke({ color: 0x6b5b92, alpha: 0.14, width: 1 });
  }

  for (let y = 0; y <= mapHeight; y += 120) {
    background.moveTo(0, y).lineTo(mapWidth, y).stroke({ color: 0x6b5b92, alpha: 0.14, width: 1 });
  }

  const center = { x: mapWidth / 2, y: mapHeight / 2 };
  background.circle(center.x, center.y, 230).stroke({ color: 0xc9a654, alpha: 0.28, width: 2 });
  background.circle(center.x, center.y, 128).stroke({ color: 0x38bdf8, alpha: 0.22, width: 1 });
  background.moveTo(center.x - 320, center.y).lineTo(center.x + 320, center.y).stroke({ color: 0xc9a654, alpha: 0.18, width: 1 });
  background.moveTo(center.x, center.y - 320).lineTo(center.x, center.y + 320).stroke({ color: 0xc9a654, alpha: 0.18, width: 1 });

  container.addChild(background);
}

function drawPlayer() {
  const player = new PIXI.Graphics();
  player.roundRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE, 10).fill(0x1a2330);
  player.roundRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE, 10).stroke({
    color: 0xf0c26a,
    width: 2,
  });
  player.rect(-8, -18, 16, 12).fill(0xf0c26a);
  player.rect(-14, -4, 28, 24).fill(0x304457);
  player.circle(-8, -10, 3).fill(0x79f5d4);
  player.circle(8, -10, 3).fill(0x79f5d4);
  return player;
}

export function DuelArenaStage({ mapHeight, mapWidth }: DuelArenaStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nullableHostElement = hostRef.current;
    if (!nullableHostElement) return;
    const hostElement: HTMLDivElement = nullableHostElement;

    let cancelled = false;
    let initialized = false;
    const pressedKeys = new Set<string>();
    const app = new PIXI.Application();
    const world = new PIXI.Container();
    const attackLayer = new PIXI.Container();
    const player = drawPlayer();
    const playerPosition = {
      x: mapWidth / 2,
      y: mapHeight / 2,
    };
    const playerFacing: Vector2 = { x: 0, y: -1 };
    const mouseInput = {
      activeMouseAction: null as ActiveMouseAction,
      isMeleeHeld: false,
      isRangedHeld: false,
      pointerWorldPosition: { ...playerPosition },
    };
    const meleeAttacks: ActiveMeleeAttack[] = [];
    const projectiles: ActiveProjectile[] = [];
    let canvasElement: HTMLCanvasElement | null = null;
    let hasPointerWorldPosition = false;
    let lastMeleeAttackAt = -Infinity;
    let lastRangedAttackAt = -Infinity;

    function handleKeyDown(event: KeyboardEvent) {
      if (KEY_DIRECTIONS[event.code]) {
        pressedKeys.add(event.code);
        event.preventDefault();
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      pressedKeys.delete(event.code);
    }

    function updatePlayerFacing(direction: Vector2) {
      const normalized = normalizeVector(direction, playerFacing);
      playerFacing.x = normalized.x;
      playerFacing.y = normalized.y;
    }

    function updatePointerWorldPosition(event: PointerEvent) {
      const canvasBounds = app.canvas.getBoundingClientRect();
      if (canvasBounds.width <= 0 || canvasBounds.height <= 0) return;

      const rendererWidth = app.renderer.width / app.renderer.resolution;
      const rendererHeight = app.renderer.height / app.renderer.resolution;
      const scaleX = rendererWidth / canvasBounds.width;
      const scaleY = rendererHeight / canvasBounds.height;
      mouseInput.pointerWorldPosition.x = (event.clientX - canvasBounds.left) * scaleX - world.position.x;
      mouseInput.pointerWorldPosition.y = (event.clientY - canvasBounds.top) * scaleY - world.position.y;
      hasPointerWorldPosition = true;
      updatePlayerFacing({
        x: mouseInput.pointerWorldPosition.x - playerPosition.x,
        y: mouseInput.pointerWorldPosition.y - playerPosition.y,
      });
    }

    function syncHeldMouseButtons(buttons: number) {
      if (mouseInput.activeMouseAction === "melee") {
        mouseInput.isMeleeHeld = (buttons & 1) !== 0;
        mouseInput.isRangedHeld = false;
        if (!mouseInput.isMeleeHeld) {
          mouseInput.activeMouseAction = null;
        }
        return;
      }

      if (mouseInput.activeMouseAction === "ranged") {
        mouseInput.isRangedHeld = (buttons & 2) !== 0;
        mouseInput.isMeleeHeld = false;
        if (!mouseInput.isRangedHeld) {
          mouseInput.activeMouseAction = null;
        }
        return;
      }

      mouseInput.isMeleeHeld = false;
      mouseInput.isRangedHeld = false;
    }

    function resetHeldMouseButtons() {
      mouseInput.activeMouseAction = null;
      mouseInput.isMeleeHeld = false;
      mouseInput.isRangedHeld = false;
    }

    function createMeleeAttack(now: number) {
      if (now - lastMeleeAttackAt < MELEE_ATTACK_COOLDOWN_MS) return;
      lastMeleeAttackAt = now;

      const graphic = new PIXI.Graphics();
      const attack: ActiveMeleeAttack = {
        ageMs: 0,
        direction: { ...playerFacing },
        durationMs: MELEE_DURATION_MS,
        graphic,
        position: { ...playerPosition },
      };

      meleeAttacks.push(attack);
      attackLayer.addChild(graphic);
    }

    function createRangedAttack(now: number) {
      if (now - lastRangedAttackAt < RANGED_ATTACK_COOLDOWN_MS) return;
      lastRangedAttackAt = now;

      const direction = normalizeVector(
        {
          x: mouseInput.pointerWorldPosition.x - playerPosition.x,
          y: mouseInput.pointerWorldPosition.y - playerPosition.y,
        },
        playerFacing
      );
      const graphic = new PIXI.Graphics();
      graphic.circle(0, 0, 8).fill({ color: 0x7df7ff, alpha: 0.92 });
      graphic.circle(0, 0, 14).fill({ color: 0x62d8ff, alpha: 0.22 });

      const projectile: ActiveProjectile = {
        direction,
        distanceTravelled: 0,
        graphic,
        maxRange: PROJECTILE_MAX_RANGE,
        position: {
          x: playerPosition.x + direction.x * 28,
          y: playerPosition.y + direction.y * 28,
        },
        speed: PROJECTILE_SPEED,
      };

      projectiles.push(projectile);
      attackLayer.addChild(graphic);
      graphic.position.set(projectile.position.x, projectile.position.y);
    }

    function handlePointerMove(event: PointerEvent) {
      updatePointerWorldPosition(event);
      syncHeldMouseButtons(event.buttons);
    }

    function handlePointerDown(event: PointerEvent) {
      if ((event.buttons & 3) === 0) return;
      event.preventDefault();
      canvasElement?.setPointerCapture(event.pointerId);
      updatePointerWorldPosition(event);

      if (mouseInput.activeMouseAction === null) {
        if (event.button === 0) {
          mouseInput.activeMouseAction = "melee";
        } else if (event.button === 2) {
          mouseInput.activeMouseAction = "ranged";
        }
      }

      syncHeldMouseButtons(event.buttons);
    }

    function handlePointerUp(event: PointerEvent) {
      if (canvasElement?.hasPointerCapture(event.pointerId)) {
        canvasElement.releasePointerCapture(event.pointerId);
      }

      syncHeldMouseButtons(event.buttons);
    }

    function handlePointerLeave(event: PointerEvent) {
      syncHeldMouseButtons(event.buttons);
    }

    function handlePointerCancel() {
      resetHeldMouseButtons();
    }

    function handleWindowMouseUp(event: MouseEvent) {
      syncHeldMouseButtons(event.buttons);
    }

    function handleWindowBlur() {
      resetHeldMouseButtons();
    }

    function handleContextMenu(event: MouseEvent) {
      event.preventDefault();
      syncHeldMouseButtons(event.buttons);
    }

    function removeAttackGraphic(graphic: PIXI.Graphics) {
      graphic.removeFromParent();
      graphic.destroy();
    }

    function removeProjectileAt(index: number) {
      const projectile = projectiles[index];
      removeAttackGraphic(projectile.graphic);
      projectiles.splice(index, 1);
    }

    function updateAttacks(deltaMs: number, now: number) {
      const hasHeldActiveAction =
        (mouseInput.activeMouseAction === "melee" && mouseInput.isMeleeHeld) ||
        (mouseInput.activeMouseAction === "ranged" && mouseInput.isRangedHeld);

      if (hasPointerWorldPosition && hasHeldActiveAction) {
        updatePlayerFacing({
          x: mouseInput.pointerWorldPosition.x - playerPosition.x,
          y: mouseInput.pointerWorldPosition.y - playerPosition.y,
        });
      }

      if (mouseInput.activeMouseAction === "melee" && mouseInput.isMeleeHeld) {
        createMeleeAttack(now);
      }

      if (mouseInput.activeMouseAction === "ranged" && mouseInput.isRangedHeld) {
        createRangedAttack(now);
      }

      for (let index = meleeAttacks.length - 1; index >= 0; index -= 1) {
        const attack = meleeAttacks[index];
        attack.ageMs += deltaMs;
        if (attack.ageMs >= attack.durationMs) {
          removeAttackGraphic(attack.graphic);
          meleeAttacks.splice(index, 1);
        }
      }

      const deltaSeconds = deltaMs / 1000;
      for (let index = projectiles.length - 1; index >= 0; index -= 1) {
        const projectile = projectiles[index];
        const step = projectile.speed * deltaSeconds;
        projectile.position.x += projectile.direction.x * step;
        projectile.position.y += projectile.direction.y * step;
        projectile.distanceTravelled += step;

        const isOutOfBounds =
          projectile.position.x < 0 ||
          projectile.position.x > mapWidth ||
          projectile.position.y < 0 ||
          projectile.position.y > mapHeight;

        if (projectile.distanceTravelled >= projectile.maxRange || isOutOfBounds) {
          removeProjectileAt(index);
        }
      }
    }

    function renderAttacks() {
      for (const attack of meleeAttacks) {
        const progress = clamp(attack.ageMs / attack.durationMs, 0, 1);
        const angle = Math.atan2(attack.direction.y, attack.direction.x);
        const alpha = 0.62 * (1 - progress);

        attack.graphic.clear();
        attack.graphic
          .moveTo(0, 0)
          .arc(0, 0, MELEE_RANGE, -0.72, 0.72)
          .lineTo(0, 0)
          .fill({ color: 0xf0c26a, alpha: alpha * 0.42 });
        attack.graphic.arc(0, 0, MELEE_RANGE, -0.62, 0.62).stroke({ color: 0xfff1b8, alpha, width: 5 });
        attack.graphic.position.set(attack.position.x, attack.position.y);
        attack.graphic.rotation = angle;
      }

      for (const projectile of projectiles) {
        projectile.graphic.position.set(projectile.position.x, projectile.position.y);
      }
    }

    function cleanupAttacks() {
      for (const attack of meleeAttacks) {
        removeAttackGraphic(attack.graphic);
      }
      meleeAttacks.length = 0;

      for (const projectile of projectiles) {
        removeAttackGraphic(projectile.graphic);
      }
      projectiles.length = 0;
    }

    async function setup() {
      await app.init({
        antialias: true,
        autoDensity: true,
        backgroundAlpha: 0,
        resizeTo: hostElement,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });
      initialized = true;

      if (cancelled) {
        app.destroy(true);
        return;
      }

      canvasElement = app.canvas;
      hostElement.appendChild(canvasElement);
      canvasElement.addEventListener("contextmenu", handleContextMenu);
      canvasElement.addEventListener("pointerdown", handlePointerDown);
      canvasElement.addEventListener("pointerup", handlePointerUp);
      canvasElement.addEventListener("pointercancel", handlePointerCancel);
      canvasElement.addEventListener("pointerleave", handlePointerLeave);
      canvasElement.addEventListener("pointermove", handlePointerMove);
      app.stage.addChild(world);
      drawArenaWorld(world, mapWidth, mapHeight);
      world.addChild(attackLayer);
      world.addChild(player);
      player.position.set(playerPosition.x, playerPosition.y);

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      window.addEventListener("blur", handleWindowBlur);
      window.addEventListener("mouseup", handleWindowMouseUp);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerCancel);

      app.ticker.add((ticker) => {
        const deltaSeconds = ticker.deltaMS / 1000;
        let directionX = 0;
        let directionY = 0;

        for (const key of pressedKeys) {
          const direction = KEY_DIRECTIONS[key];
          if (!direction) continue;
          directionX += direction.x;
          directionY += direction.y;
        }

        if (directionX !== 0 || directionY !== 0) {
          const length = Math.hypot(directionX, directionY) || 1;
          if (!hasPointerWorldPosition) {
            updatePlayerFacing({ x: directionX / length, y: directionY / length });
          }
          playerPosition.x = clamp(
            playerPosition.x + (directionX / length) * PLAYER_SPEED * deltaSeconds,
            PLAYER_SIZE / 2,
            mapWidth - PLAYER_SIZE / 2
          );
          playerPosition.y = clamp(
            playerPosition.y + (directionY / length) * PLAYER_SPEED * deltaSeconds,
            PLAYER_SIZE / 2,
            mapHeight - PLAYER_SIZE / 2
          );
          player.position.set(playerPosition.x, playerPosition.y);
        }

        updateAttacks(ticker.deltaMS, performance.now());
        renderAttacks();
        player.rotation = Math.atan2(playerFacing.y, playerFacing.x) + Math.PI / 2;

        const screenWidth = app.renderer.width / app.renderer.resolution;
        const screenHeight = app.renderer.height / app.renderer.resolution;
        const cameraX = clamp(playerPosition.x - screenWidth / 2, 0, Math.max(0, mapWidth - screenWidth));
        const cameraY = clamp(playerPosition.y - screenHeight / 2, 0, Math.max(0, mapHeight - screenHeight));
        world.position.set(-cameraX, -cameraY);
      });
    }

    void setup();

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      canvasElement?.removeEventListener("contextmenu", handleContextMenu);
      canvasElement?.removeEventListener("pointerdown", handlePointerDown);
      canvasElement?.removeEventListener("pointerup", handlePointerUp);
      canvasElement?.removeEventListener("pointercancel", handlePointerCancel);
      canvasElement?.removeEventListener("pointerleave", handlePointerLeave);
      canvasElement?.removeEventListener("pointermove", handlePointerMove);
      resetHeldMouseButtons();
      pressedKeys.clear();
      cleanupAttacks();
      if (initialized) app.destroy(true);
    };
  }, [mapHeight, mapWidth]);

  return <div ref={hostRef} className="h-full w-full" />;
}
