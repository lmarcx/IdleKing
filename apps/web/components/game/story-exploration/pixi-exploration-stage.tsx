"use client";

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

type PixiExplorationStageProps = {
  mapHeight: number;
  mapWidth: number;
  onPlayerMove: (position: { x: number; y: number }) => void;
  pointsOfInterest: ExplorationStagePoi[];
};

const PLAYER_SIZE = 48;
const PLAYER_SPEED = 310;

export type ExplorationStagePoi = {
  color: number;
  id: string;
  x: number;
  y: number;
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

function drawWorld(container: PIXI.Container, mapWidth: number, mapHeight: number, pointsOfInterest: ExplorationStagePoi[]) {
  const background = new PIXI.Graphics();
  background.rect(0, 0, mapWidth, mapHeight).fill(0x07090d);

  for (let y = 0; y < mapHeight; y += 80) {
    for (let x = 0; x < mapWidth; x += 80) {
      const tone = (x / 80 + y / 80) % 2 === 0 ? 0x0d1417 : 0x0a1014;
      background.rect(x, y, 80, 80).fill({ color: tone, alpha: 0.42 });
    }
  }

  for (let x = 0; x <= mapWidth; x += 120) {
    background.moveTo(x, 0).lineTo(x, mapHeight).stroke({ color: 0x2f4b45, alpha: 0.16, width: 1 });
  }

  for (let y = 0; y <= mapHeight; y += 120) {
    background.moveTo(0, y).lineTo(mapWidth, y).stroke({ color: 0x2f4b45, alpha: 0.16, width: 1 });
  }

  container.addChild(background);

  for (const point of pointsOfInterest) {
    const marker = new PIXI.Graphics();
    marker.circle(0, 0, 34).fill({ color: point.color, alpha: 0.14 });
    marker.circle(0, 0, 10).fill({ color: point.color, alpha: 0.72 });
    marker.moveTo(-48, 0).lineTo(48, 0).stroke({ color: point.color, alpha: 0.35, width: 1 });
    marker.moveTo(0, -48).lineTo(0, 48).stroke({ color: point.color, alpha: 0.35, width: 1 });
    marker.position.set(point.x, point.y);
    container.addChild(marker);
  }
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

export function PixiExplorationStage({ mapHeight, mapWidth, onPlayerMove, pointsOfInterest }: PixiExplorationStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const onPlayerMoveRef = useRef(onPlayerMove);

  useEffect(() => {
    onPlayerMoveRef.current = onPlayerMove;
  }, [onPlayerMove]);

  useEffect(() => {
    const nullableHostElement = hostRef.current;
    if (!nullableHostElement) return;
    const hostElement: HTMLDivElement = nullableHostElement;

    let cancelled = false;
    let initialized = false;
    const pressedKeys = new Set<string>();
    const app = new PIXI.Application();
    const world = new PIXI.Container();
    const player = drawPlayer();
    const playerPosition = {
      x: mapWidth / 2,
      y: mapHeight / 2,
    };
    let hudElapsed = 0;

    function handleKeyDown(event: KeyboardEvent) {
      if (KEY_DIRECTIONS[event.code]) {
        pressedKeys.add(event.code);
        event.preventDefault();
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      pressedKeys.delete(event.code);
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

      hostElement.appendChild(app.canvas);
      app.stage.addChild(world);
      drawWorld(world, mapWidth, mapHeight, pointsOfInterest);
      world.addChild(player);
      player.position.set(playerPosition.x, playerPosition.y);
      onPlayerMoveRef.current(playerPosition);

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

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

        const screenWidth = app.renderer.width / app.renderer.resolution;
        const screenHeight = app.renderer.height / app.renderer.resolution;
        const cameraX = clamp(playerPosition.x - screenWidth / 2, 0, Math.max(0, mapWidth - screenWidth));
        const cameraY = clamp(playerPosition.y - screenHeight / 2, 0, Math.max(0, mapHeight - screenHeight));
        world.position.set(-cameraX, -cameraY);

        hudElapsed += ticker.deltaMS;
        if (hudElapsed >= 90) {
          hudElapsed = 0;
          onPlayerMoveRef.current({ ...playerPosition });
        }
      });
    }

    void setup();

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      pressedKeys.clear();
      if (initialized) app.destroy(true);
    };
  }, [mapHeight, mapWidth, pointsOfInterest]);

  return <div ref={hostRef} className="h-full w-full" />;
}
