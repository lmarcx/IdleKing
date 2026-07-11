"use client";

import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { toast } from "sonner";

import {
  collectMapInteractables,
  createAssetRegistry,
  describeInteractionFeedback,
  findNearestInteractable,
  loadPlayableMap,
  type PlayableMap,
  type ResolvedInteractable,
} from "@idleking/game-core/level-editor";
import {
  addEntityBadge,
  addWorldLabel,
  cellKey,
  collidesWithAny,
  computeCameraOffset,
  computeMovementDirection,
  computeMovementStep,
  isWithinWorldBounds,
  placeAssetGraphic,
  renderBlockedCellOverlay,
  renderGroundTiles,
  renderMapBuilding,
  renderMapCollisionDebug,
  renderMapNpc,
  renderMapObject,
  worldToCell,
  type Vector2,
} from "@/components/game/map-runtime";

const PLAYER_RADIUS = 13;
const PLAYER_SPEED = 170;

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
      renderGroundTiles(g, map);
      renderBlockedCellOverlay(g, loaded.blockingCells, map.grid.cellSize);
      world.addChild(g);
    }

    function drawEntities() {
      world.sortableChildren = true;
      for (const spawn of map.spawns) {
        const spawnMarker = new PIXI.Graphics();
        spawnMarker.circle(spawn.x, spawn.y, 18).stroke({ color: 0xffe4a0, alpha: 0.95, width: 3 });
        spawnMarker.moveTo(spawn.x - 22, spawn.y).lineTo(spawn.x + 22, spawn.y).moveTo(spawn.x, spawn.y - 22).lineTo(spawn.x, spawn.y + 22).stroke({ color: 0xffe4a0, alpha: 0.65, width: 1 });
        world.addChild(spawnMarker);
        addWorldLabel(labels, "spawn", spawn.x + 34, spawn.y - 14);
      }
      for (const object of map.objects) {
        renderMapObject(world, labels, registry, object);
      }
      for (const building of map.buildings) {
        renderMapBuilding(world, labels, registry, building);
      }
      for (const npc of map.npcs) {
        renderMapNpc(world, labels, registry, npc);
      }
      for (const enemy of map.enemies) {
        placeAssetGraphic(world, labels, registry, enemy.assetId, enemy.x, enemy.y, enemy.name);
        addEntityBadge(world, labels, "E", enemy.x + 8, enemy.y + 8, 0xffb0b0);
        const aggro = new PIXI.Graphics();
        aggro.circle(enemy.x + 24, enemy.y + 32, enemy.aggroRadius).stroke({ color: 0xf2f2f2, alpha: 0.14, width: 1 });
        world.addChild(aggro);
      }
      for (const collision of map.collisions) {
        const g = new PIXI.Graphics();
        renderMapCollisionDebug(g, collision);
        world.addChild(g);
      }
      for (const trigger of map.triggers) {
        const g = new PIXI.Graphics();
        g.rect(trigger.x, trigger.y, trigger.width, trigger.height).fill({ color: 0x9ad9ff, alpha: 0.07 }).stroke({ color: 0x9ad9ff, alpha: 0.85, width: 2 });
        world.addChild(g);
        addWorldLabel(labels, "trigger", trigger.x + trigger.width / 2, trigger.y + trigger.height / 2);
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
      const cell = worldToCell(next, map.grid.cellSize);
      if (loaded.blockingCells.has(cellKey(cell.x, cell.y))) return false;
      if (!isWithinWorldBounds(next, PLAYER_RADIUS, { width: loaded.widthPx, height: loaded.heightPx })) return false;
      return !collidesWithAny(next, PLAYER_RADIUS, map.collisions);
    }

    function tick(ticker: PIXI.Ticker) {
      const direction = computeMovementDirection(pressed);
      if (direction.x !== 0 || direction.y !== 0) {
        const step = computeMovementStep(direction, PLAYER_SPEED, ticker.deltaMS);
        const nextX = { x: playerPosition.x + step.x, y: playerPosition.y };
        const nextY = { x: playerPosition.x, y: playerPosition.y + step.y };
        if (canMoveTo(nextX)) playerPosition.x = nextX.x;
        if (canMoveTo(nextY)) playerPosition.y = nextY.y;
        drawPlayer();
      }

      const screenWidth = app.renderer.width / app.renderer.resolution;
      const screenHeight = app.renderer.height / app.renderer.resolution;
      const cameraOffset = computeCameraOffset(
        playerPosition,
        { width: screenWidth, height: screenHeight },
        { width: loaded.widthPx, height: loaded.heightPx },
      );
      world.position.set(cameraOffset.x, cameraOffset.y);
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
