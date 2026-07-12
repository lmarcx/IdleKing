"use client";

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

import {
  attackStoryMapRuntimeEnemy,
  createAssetRegistry,
  createStoryMapRuntimeEnemy,
  loadPlayableMap,
  type PlayableMap,
  type StoryMapRuntimeEnemy,
} from "@idleking/game-core/level-editor";
import {
  addWorldLabel,
  cellKey,
  collidesWithAny,
  computeCameraOffset,
  computeMovementDirection,
  computeMovementStep,
  createAssetGraphic,
  isWithinWorldBounds,
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

// Basic melee range/attacker stats for the combat technical proof (G4). Not derived from any
// real player save/equipment -- deliberately isolated from real progression, matching
// StoryMapAttackerStats' own doc comment in game-core.
const MELEE_RANGE = 60;
const PLACEHOLDER_ATTACKER = { attack: 20, critChance: 0 } as const;

/**
 * Result of a Story map stage detecting its win condition. Deliberately minimal in G4 -- no
 * objectives/rewards exist yet. Shape reserved for G5 (objectives/boss/checkpoint).
 */
export type StoryStageResult = {
  status: "completed";
};

export type StoryMapStageProps = {
  map: PlayableMap;
  /**
   * Called when the stage detects its win condition. Never invoked by StoryMapStage in G4 (no
   * objectives implemented yet, so there is no win condition to detect) -- accepted now so the
   * prop shape is stable for G5. Architecture decision: the Stage only detects victory. It never
   * decides consequences (completeDungeon, save mutation, reward grants, etc) -- that is
   * strictly the caller's job.
   */
  onStageCompleted?: (result: StoryStageResult) => void;
  /**
   * Reserved for the eventual editor Play/Test preview: a true caller must never apply real
   * consequences even once onStageCompleted starts firing. Not consumed yet in G4.
   */
  dryRun?: boolean;
  /** Shows the on-canvas debug panel (map id/grid/entity counts). Off by default. */
  debug?: boolean;
};

/**
 * Technical skeleton for the future data-driven Story runtime. Reuses the same
 * apps/web/components/game/map-runtime primitives as CustomMapPixiStage (tiles, static
 * entities, collisions, camera, movement, labels/badges) rather than copying its logic. Enemies
 * are now mutable combat entities (game-core's createStoryMapRuntimeEnemy/
 * attackStoryMapRuntimeEnemy) -- HP, damage, and death only, no objectives/rewards/completion,
 * no dungeon_exit interpretation. See the Story migration plan (Phase G) for what later phases
 * add. The map itself is never mutated; runtime enemy state is rebuilt fresh on every mount.
 */
export function StoryMapStage({ map, debug }: StoryMapStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nullableHost = hostRef.current;
    if (!nullableHost) return;
    const hostElement: HTMLDivElement = nullableHost;

    const registry = createAssetRegistry();
    const loaded = loadPlayableMap(map);
    const app = new PIXI.Application();
    const world = new PIXI.Container();
    const labels = new PIXI.Container();
    const pressed = new Set<string>();
    const playerPosition = { ...(map.spawns.find((spawn) => spawn.id === "player_start") ?? map.spawns[0]) };
    const player = new PIXI.Graphics();
    let destroyed = false;

    type EnemyVisual = {
      runtime: StoryMapRuntimeEnemy;
      displayObjects: PIXI.Container[];
      hpLabel: PIXI.Text;
    };
    const enemyVisuals = new Map<string, EnemyVisual>();

    function createEnemyVisual(runtime: StoryMapRuntimeEnemy): EnemyVisual {
      const displayObjects: PIXI.Container[] = [];

      const asset = registry.assets.find((item) => item.id === runtime.assetId);
      if (asset) {
        const graphic = createAssetGraphic(asset);
        graphic.position.set(runtime.x, runtime.y);
        graphic.zIndex = runtime.y;
        world.addChild(graphic);
        displayObjects.push(graphic);
      }

      const badge = new PIXI.Graphics();
      badge.circle(runtime.x + 8, runtime.y + 8, 12).fill({ color: 0x050505, alpha: 0.9 }).stroke({ color: 0xffb0b0, alpha: 0.95, width: 2 });
      world.addChild(badge);
      displayObjects.push(badge);

      const badgeLabel = addWorldLabel(labels, "E", runtime.x + 8, runtime.y + 9);
      displayObjects.push(badgeLabel);

      const aggro = new PIXI.Graphics();
      aggro.circle(runtime.x + 24, runtime.y + 32, runtime.aggroRadius).stroke({ color: 0xf2f2f2, alpha: 0.14, width: 1 });
      world.addChild(aggro);
      displayObjects.push(aggro);

      const hpLabel = addWorldLabel(labels, `${Math.round(runtime.hpCurrent)}/${Math.round(runtime.hpMax)}`, runtime.x + 8, runtime.y - 22);
      hpLabel.style.fill = 0xffe08a;
      displayObjects.push(hpLabel);

      return { runtime, displayObjects, hpLabel };
    }

    function removeEnemyVisual(visual: EnemyVisual) {
      for (const displayObject of visual.displayObjects) {
        displayObject.parent?.removeChild(displayObject);
      }
    }

    function findMeleeTarget(): EnemyVisual | null {
      let nearest: EnemyVisual | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const visual of enemyVisuals.values()) {
        if (visual.runtime.isDead) continue;
        const distance = Math.hypot(visual.runtime.x - playerPosition.x, visual.runtime.y - playerPosition.y);
        if (distance <= MELEE_RANGE && distance < nearestDistance) {
          nearest = visual;
          nearestDistance = distance;
        }
      }
      return nearest;
    }

    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      const target = findMeleeTarget();
      if (!target) return;

      const updated = attackStoryMapRuntimeEnemy(target.runtime, PLACEHOLDER_ATTACKER);
      target.runtime = updated;
      target.hpLabel.text = `${Math.round(updated.hpCurrent)}/${Math.round(updated.hpMax)}`;
      if (updated.isDead) {
        removeEnemyVisual(target);
        enemyVisuals.delete(updated.id);
      }
    }

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
      // Enemies are mutable combat entities now (see createEnemyVisual/onPointerDown above) --
      // still no pathfinding/boss-phases/loot/status-effects/objectives/checkpoint (G4 scope).
      for (const enemy of map.enemies) {
        const runtime = createStoryMapRuntimeEnemy(enemy);
        enemyVisuals.set(runtime.id, createEnemyVisual(runtime));
      }
      for (const collision of map.collisions) {
        const g = new PIXI.Graphics();
        renderMapCollisionDebug(g, collision);
        world.addChild(g);
      }
      // Triggers are rendered generically -- no dungeon_exit (or any other) convention is
      // interpreted yet; that starts once objectives are implemented (G5+).
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
    }

    function onKeyDown(event: KeyboardEvent) {
      pressed.add(event.code);
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
      // Same defensive ordering as CustomMapPixiStage: app.init() is async -- if this effect was
      // already cleaned up (fast navigation, React StrictMode double-invoke) by the time it
      // resolves, the app is now fully initialized (ResizePlugin etc. are set up) so it's safe --
      // and necessary -- to destroy it here exactly once. The cleanup below never destroys
      // before this point, since destroying a not-yet-initialized PIXI.Application throws
      // "this._cancelResize is not a function".
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
      app.canvas.addEventListener("pointerdown", onPointerDown);
      app.ticker.add(tick);
    }

    void setup();

    return () => {
      destroyed = true;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      app.canvas?.removeEventListener?.("pointerdown", onPointerDown);
      app.ticker?.remove?.(tick);
      if (ready) {
        app.destroy(true, { children: true });
      }
    };
  }, [map]);

  return (
    <div className="relative h-full min-h-[620px] w-full">
      <div ref={hostRef} className="h-full min-h-[620px] w-full" />
      {debug ? (
        <div className="pointer-events-none absolute right-4 top-4 z-10 w-64 rounded-md border border-zinc-700 bg-black/82 p-3 font-ik-body text-xs text-zinc-100 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <div className="font-ik-menu text-[0.65rem] text-zinc-400">Story Map Debug</div>
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
      ) : null}
    </div>
  );
}
