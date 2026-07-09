"use client";

import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { toast } from "sonner";

import {
  GROUND_TEXTURES,
  collectMapInteractables,
  createAssetRegistry,
  describeInteractionFeedback,
  findNearestInteractable,
  getGroundTexture,
  loadPlayableMap,
  type GeometricAsset,
  type PlayableMap,
  type PrimitivePart,
  type ResolvedInteractable,
} from "@idleking/game-core/level-editor";

type Vector2 = { x: number; y: number };

const PLAYER_RADIUS = 13;
const PLAYER_SPEED = 170;

function color(value: string): number {
  return Number.parseInt(value.replace("#", ""), 16);
}

function drawPrimitive(g: PIXI.Graphics, part: PrimitivePart): void {
  const fill = { color: color(part.fill), alpha: part.opacity };
  const stroke = { color: color(part.stroke), alpha: part.opacity, width: part.strokeWidth };

  if (part.shape === "rect") {
    g.rect(0, 0, part.width ?? 24, part.height ?? 24).fill(fill).stroke(stroke);
  } else if (part.shape === "circle") {
    g.circle(0, 0, part.radius ?? Math.max(part.width ?? 24, part.height ?? 24) / 2).fill(fill).stroke(stroke);
  } else if (part.shape === "triangle") {
    const width = part.width ?? 32;
    const height = part.height ?? 32;
    g.poly([0, 0, -width / 2, height, width / 2, height]).fill(fill).stroke(stroke);
  } else if (part.shape === "line") {
    g.moveTo(0, 0).lineTo(part.width ?? 24, part.height ?? 0).stroke(stroke);
  } else {
    g.poly((part.points ?? []).flatMap((point) => [point.x, point.y])).fill(fill).stroke(stroke);
  }
}

function createAssetGraphic(asset: GeometricAsset): PIXI.Container {
  const container = new PIXI.Container();
  for (const part of [...asset.parts].sort((a, b) => a.layer - b.layer)) {
    const partContainer = new PIXI.Container();
    const g = new PIXI.Graphics();
    drawPrimitive(g, part);
    partContainer.position.set(part.x, part.y);
    partContainer.rotation = (part.rotation * Math.PI) / 180;
    partContainer.addChild(g);
    container.addChild(partContainer);
  }
  return container;
}

function isInsideRect(point: Vector2, rect: { x: number; y: number; width: number; height: number }, radius: number): boolean {
  return (
    point.x + radius > rect.x &&
    point.x - radius < rect.x + rect.width &&
    point.y + radius > rect.y &&
    point.y - radius < rect.y + rect.height
  );
}

function getMapTile(map: PlayableMap, x: number, y: number) {
  for (let index = map.tiles.length - 1; index >= 0; index -= 1) {
    const tile = map.tiles[index];
    if (tile.x === x && tile.y === y) return tile;
  }
  return undefined;
}

function drawTileDetail(g: PIXI.Graphics, textureId: string, x: number, y: number, size: number): void {
  if (textureId === "water") {
    for (let offset = 8; offset < size; offset += 10) {
      g.moveTo(x + 5, y + offset).lineTo(x + size - 5, y + offset - 3).stroke({ color: 0xbddff0, alpha: 0.35, width: 1 });
    }
  } else if (textureId === "lava") {
    g.moveTo(x + 6, y + size - 8).lineTo(x + size / 2, y + 7).lineTo(x + size - 7, y + size - 10).stroke({ color: 0xf0b19d, alpha: 0.55, width: 2 });
  } else if (textureId === "ice") {
    g.moveTo(x + 6, y + size - 6).lineTo(x + size - 6, y + 6).stroke({ color: 0xe8fbff, alpha: 0.35, width: 1 });
  } else if (textureId === "stone" || textureId === "rock") {
    g.rect(x + 6, y + 6, size - 12, size - 12).stroke({ color: 0xf2f2f2, alpha: textureId === "rock" ? 0.22 : 0.16, width: 1 });
  } else if (textureId === "grass") {
    g.moveTo(x + 9, y + size - 7).lineTo(x + 12, y + size - 14).moveTo(x + 18, y + size - 7).lineTo(x + 18, y + size - 15).stroke({ color: 0xd8ead8, alpha: 0.25, width: 1 });
  } else if (textureId === "sand" || textureId === "dirt") {
    g.circle(x + 10, y + 12, 1.4).circle(x + size - 12, y + size - 10, 1.2).fill({ color: 0xf2f2f2, alpha: textureId === "sand" ? 0.3 : 0.18 });
  }
}

export function CustomMapPixiStage({ map }: { map: PlayableMap }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [nearbyPrompt, setNearbyPrompt] = useState<string | null>(null);

  useEffect(() => {
    const nullableHost = hostRef.current;
    if (!nullableHost) return;
    const hostElement: HTMLDivElement = nullableHost;

    const registry = createAssetRegistry();
    const loaded = loadPlayableMap(map);
    const interactables = collectMapInteractables(map);
    const app = new PIXI.Application();
    const world = new PIXI.Container();
    const labels = new PIXI.Container();
    const pressed = new Set<string>();
    const playerPosition = { ...(map.spawns.find((spawn) => spawn.id === "player_start") ?? map.spawns[0]) };
    const player = new PIXI.Graphics();
    let destroyed = false;
    let currentNearby: ResolvedInteractable | null = null;

    function drawTiles() {
      const g = new PIXI.Graphics();
      const defaultTexture = GROUND_TEXTURES[0];
      for (let y = 0; y < map.grid.height; y += 1) {
        for (let x = 0; x < map.grid.width; x += 1) {
          const tile = getMapTile(map, x, y);
          const texture = getGroundTexture(tile?.textureId ?? defaultTexture.id) ?? defaultTexture;
          const px = x * map.grid.cellSize;
          const py = y * map.grid.cellSize;
          g.rect(px, py, map.grid.cellSize, map.grid.cellSize)
            .fill({ color: color(texture.fill), alpha: 1 })
            .stroke({ color: color(texture.stroke), alpha: 0.34, width: 1 });
          drawTileDetail(g, texture.id, px, py, map.grid.cellSize);
        }
      }

      for (const cellKey of loaded.blockingCells) {
        const [x, y] = cellKey.split(":").map(Number);
        const px = x * map.grid.cellSize;
        const py = y * map.grid.cellSize;
        g.rect(px, py, map.grid.cellSize, map.grid.cellSize).fill({ color: 0x050505, alpha: 0.68 });
        g.moveTo(px + 5, py + 5).lineTo(px + map.grid.cellSize - 5, py + map.grid.cellSize - 5).moveTo(px + map.grid.cellSize - 5, py + 5).lineTo(px + 5, py + map.grid.cellSize - 5).stroke({ color: 0xf2f2f2, alpha: 0.42, width: 2 });
      }

      world.addChild(g);
    }

    function addText(text: string, x: number, y: number) {
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
    }

    function addAsset(assetId: string, x: number, y: number, label?: string) {
      const asset = registry.assets.find((item) => item.id === assetId);
      if (!asset) return;
      const graphic = createAssetGraphic(asset);
      graphic.position.set(x, y);
      graphic.zIndex = y;
      world.addChild(graphic);
      if (label) addText(label, x + 32, y - 8);
    }

    function addBadge(kind: string, x: number, y: number, colorValue: number) {
      const badge = new PIXI.Graphics();
      badge.circle(x, y, 12).fill({ color: 0x050505, alpha: 0.9 }).stroke({ color: colorValue, alpha: 0.95, width: 2 });
      world.addChild(badge);
      addText(kind, x, y + 1);
    }

    function drawEntities() {
      world.sortableChildren = true;
      for (const spawn of map.spawns) {
        const spawnMarker = new PIXI.Graphics();
        spawnMarker.circle(spawn.x, spawn.y, 18).stroke({ color: 0xffe4a0, alpha: 0.95, width: 3 });
        spawnMarker.moveTo(spawn.x - 22, spawn.y).lineTo(spawn.x + 22, spawn.y).moveTo(spawn.x, spawn.y - 22).lineTo(spawn.x, spawn.y + 22).stroke({ color: 0xffe4a0, alpha: 0.65, width: 1 });
        world.addChild(spawnMarker);
        addText("spawn", spawn.x + 34, spawn.y - 14);
      }
      for (const object of map.objects) {
        addAsset(object.assetId, object.x, object.y, object.interaction?.label ?? object.id);
        addBadge(object.kind === "nature" ? "N" : "O", object.x + 8, object.y + 8, object.kind === "nature" ? 0x9ce0a4 : 0xf2f2f2);
      }
      for (const building of map.buildings) {
        addAsset(building.assetId, building.x, building.y, building.interaction?.label ?? building.function);
        addBadge("B", building.x + 8, building.y + 8, 0xffffff);
      }
      for (const npc of map.npcs) {
        addAsset(npc.assetId, npc.x, npc.y, npc.name);
        addBadge("P", npc.x + 8, npc.y + 8, 0xa7dcff);
      }
      for (const enemy of map.enemies) {
        addAsset(enemy.assetId, enemy.x, enemy.y, enemy.name);
        addBadge("E", enemy.x + 8, enemy.y + 8, 0xffb0b0);
        const aggro = new PIXI.Graphics();
        aggro.circle(enemy.x + 24, enemy.y + 32, enemy.aggroRadius).stroke({ color: 0xf2f2f2, alpha: 0.14, width: 1 });
        world.addChild(aggro);
      }
      for (const collision of map.collisions) {
        const g = new PIXI.Graphics();
        g.rect(collision.x, collision.y, collision.width, collision.height).fill({ color: 0xffffff, alpha: 0.04 }).stroke({ color: 0xf2f2f2, alpha: 0.75, width: 2 });
        world.addChild(g);
      }
      for (const trigger of map.triggers) {
        const g = new PIXI.Graphics();
        g.rect(trigger.x, trigger.y, trigger.width, trigger.height).fill({ color: 0x9ad9ff, alpha: 0.07 }).stroke({ color: 0x9ad9ff, alpha: 0.85, width: 2 });
        world.addChild(g);
        addText("trigger", trigger.x + trigger.width / 2, trigger.y + trigger.height / 2);
      }
    }

    function drawPlayer() {
      player.clear();
      player.circle(0, 0, PLAYER_RADIUS).fill({ color: 0xf2f2f2, alpha: 1 }).stroke({ color: 0x0a0a0a, width: 3 });
      player.moveTo(-7, -3).lineTo(7, -3).stroke({ color: 0x0a0a0a, width: 2 });
      player.position.set(playerPosition.x, playerPosition.y);
      player.zIndex = playerPosition.y + 1000;
    }

    function canMoveTo(next: Vector2): boolean {
      const cellX = Math.floor(next.x / map.grid.cellSize);
      const cellY = Math.floor(next.y / map.grid.cellSize);
      if (loaded.blockingCells.has(`${cellX}:${cellY}`)) return false;
      if (next.x < PLAYER_RADIUS || next.y < PLAYER_RADIUS || next.x > loaded.widthPx - PLAYER_RADIUS || next.y > loaded.heightPx - PLAYER_RADIUS) return false;
      return !map.collisions.some((collision) => isInsideRect(next, collision, PLAYER_RADIUS));
    }

    function tick(ticker: PIXI.Ticker) {
      let dx = 0;
      let dy = 0;
      if (pressed.has("ArrowLeft") || pressed.has("KeyA") || pressed.has("KeyQ")) dx -= 1;
      if (pressed.has("ArrowRight") || pressed.has("KeyD")) dx += 1;
      if (pressed.has("ArrowUp") || pressed.has("KeyW") || pressed.has("KeyZ")) dy -= 1;
      if (pressed.has("ArrowDown") || pressed.has("KeyS")) dy += 1;

      if (dx !== 0 || dy !== 0) {
        const length = Math.hypot(dx, dy) || 1;
        const step = PLAYER_SPEED * (ticker.deltaMS / 1000);
        const nextX = { x: playerPosition.x + (dx / length) * step, y: playerPosition.y };
        const nextY = { x: playerPosition.x, y: playerPosition.y + (dy / length) * step };
        if (canMoveTo(nextX)) playerPosition.x = nextX.x;
        if (canMoveTo(nextY)) playerPosition.y = nextY.y;
        drawPlayer();
      }

      const screenWidth = app.renderer.width / app.renderer.resolution;
      const screenHeight = app.renderer.height / app.renderer.resolution;
      world.position.set(
        -Math.min(Math.max(playerPosition.x - screenWidth / 2, 0), Math.max(0, loaded.widthPx - screenWidth)),
        -Math.min(Math.max(playerPosition.y - screenHeight / 2, 0), Math.max(0, loaded.heightPx - screenHeight)),
      );
      labels.position.copyFrom(world.position);

      const nearest = findNearestInteractable(interactables, playerPosition);
      if (nearest?.id !== currentNearby?.id) {
        currentNearby = nearest;
        setNearbyPrompt(nearest ? nearest.interaction.promptLabel : null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      pressed.add(event.code);
      if (event.code === "KeyF" && !event.repeat) {
        if (currentNearby) {
          toast(describeInteractionFeedback(currentNearby.interaction));
        }
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      pressed.delete(event.code);
    }

    let ready = false;

    async function setup() {
      await app.init({
        antialias: true,
        autoDensity: true,
        background: 0x070707,
        resizeTo: hostElement,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });
      // app.init() is async — if the effect was already cleaned up (fast navigation,
      // React StrictMode double-invoke) by the time it resolves, the app is now fully
      // initialized (ResizePlugin etc. are set up) so it's safe — and necessary — to
      // destroy it here exactly once. The cleanup below never destroys before this point,
      // since destroying a not-yet-initialized PIXI.Application throws
      // "this._cancelResize is not a function" (ResizePlugin.destroy() runs before
      // ResizePlugin.init() ever set _cancelResize).
      if (destroyed) {
        app.destroy(true, { children: true });
        return;
      }
      ready = true;
      hostElement.appendChild(app.canvas);
      app.stage.addChild(world);
      app.stage.addChild(labels);
      drawTiles();
      drawEntities();
      drawPlayer();
      world.addChild(player);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      app.ticker.add(tick);
    }

    void setup();

    return () => {
      destroyed = true;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      app.ticker?.remove?.(tick);
      if (ready) {
        app.destroy(true, { children: true });
      }
    };
  }, [map]);

  return (
    <div className="relative h-full min-h-[620px] w-full">
      <div ref={hostRef} className="h-full min-h-[620px] w-full" />
      {nearbyPrompt ? (
        <div
          className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-md border border-zinc-700 bg-black/85 px-3 py-2 font-ik-menu text-xs text-zinc-100 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
          data-testid="interaction-prompt"
        >
          Press F — {nearbyPrompt}
        </div>
      ) : null}
      <div className="pointer-events-none absolute right-4 top-4 z-10 w-64 rounded-md border border-zinc-700 bg-black/82 p-3 font-ik-body text-xs text-zinc-100 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="font-ik-menu text-[0.65rem] text-zinc-400">Map Debug</div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
          <span className="text-zinc-500">id</span><span>{map.id}</span>
          <span className="text-zinc-500">grid</span><span>{map.grid.width}x{map.grid.height} / {map.grid.cellSize}</span>
          <span className="text-zinc-500">objects</span><span>{map.objects.length}</span>
          <span className="text-zinc-500">NPC</span><span>{map.npcs.length}</span>
          <span className="text-zinc-500">enemies</span><span>{map.enemies.length}</span>
          <span className="text-zinc-500">collisions</span><span>{map.collisions.length}</span>
          <span className="text-zinc-500">triggers</span><span>{map.triggers.length}</span>
        </div>
      </div>
    </div>
  );
}
