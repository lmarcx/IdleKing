"use client";

import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";

import {
  attackStoryMapRuntimeEnemy,
  createAssetRegistry,
  createEnemyAiConfig,
  createEnemyAiRuntime,
  createStoryMapRuntimeEnemy,
  deriveStoryMapObjective,
  isStoryMapObjectiveSatisfied,
  loadPlayableMap,
  stepEnemyAi,
  type EnemyAiConfig,
  type EnemyAiRuntime,
  type EnemyAiState,
  type PlayableMap,
  type StoryMapObjective,
  type StoryMapRuntimeEnemy,
  type StoryMapStageResult,
} from "@idleking/game-core/level-editor";
import {
  addWorldLabel,
  cellKey,
  collidesWithAny,
  computeCameraOffset,
  computeMovementDirection,
  computeMovementStep,
  createAssetGraphic,
  isInsideRect,
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
// No per-enemy hitbox radius exists on MapEnemy yet -- a single placeholder radius is used for
// every enemy's collision against static map geometry, matching the technical-proof spirit of
// MELEE_RANGE/PLACEHOLDER_ATTACKER below.
const ENEMY_RADIUS = 14;

// Basic melee range/attacker stats for the combat technical proof (G4). Not derived from any
// real player save/equipment -- deliberately isolated from real progression, matching
// StoryMapAttackerStats' own doc comment in game-core.
const MELEE_RANGE = 60;
const PLACEHOLDER_ATTACKER = { attack: 20, critChance: 0 } as const;

// Minimal, visible player HP so enemy contact damage (G10) is observable. Not the real player
// combat runtime -- no death/checkpoint handling here, that is a separate, later phase. HP just
// clamps at 0 and stays there.
const PLACEHOLDER_PLAYER_HP_MAX = 100;

const ENEMY_BADGE_OFFSET = { x: 8, y: 8 };
const ENEMY_BADGE_LABEL_OFFSET = { x: 8, y: 9 };
const ENEMY_AGGRO_OFFSET = { x: 24, y: 32 };
const ENEMY_HP_LABEL_OFFSET = { x: 8, y: -22 };

function enemyStateTint(state: EnemyAiState): number {
  switch (state) {
    case "idle":
      return 0xbfbfbf;
    case "chasing":
      return 0xffb347;
    case "attacking":
      return 0xff4d4d;
    case "leashed":
      return 0x5ec8ff;
    case "dead":
      return 0x3a3a3a;
    default:
      return 0xffb0b0;
  }
}

type ProgressDisplay = {
  objectiveType: StoryMapObjective["type"];
  bossAlive?: boolean;
  defeatedCount: number;
  totalCount: number;
  exitReached: boolean;
};

export type StoryMapStageProps = {
  map: PlayableMap;
  /**
   * Called exactly once per attempt, when the stage detects its win condition -- never at mere
   * mount, and never again until resetStage() runs. Architecture decision: the Stage only
   * detects victory. It never decides consequences (completeDungeon, save mutation, reward
   * grants, etc) -- that is strictly the caller's job:
   * - the canonical Story route wrapper applies completeDungeon(dungeonId)
   * - the editor preview route shows the result and applies nothing
   * - tests can inspect the result with no side effects at all
   */
  onStageCompleted?: (result: StoryMapStageResult) => void;
  /**
   * Reserved for the eventual editor Play/Test preview to flag "this attempt must never touch
   * the real save" to its own onStageCompleted handler. StoryMapStage itself never mutates
   * GameState or calls completeDungeon regardless of this flag -- there is nothing here for it
   * to gate. Not consumed internally; passed through for the caller's own bookkeeping.
   */
  dryRun?: boolean;
  /** Shows the on-canvas debug panel (map id/grid/entity counts). Off by default. */
  debug?: boolean;
  /**
   * Whether the "Reset stage" control is shown/usable. Defaults to true. The dry-run previews
   * (editor Play/Test, the standalone test_map_01 technical preview) always want this on. A
   * future canonical live wrapper will pass allowReset={false} once a real dungeon is wired
   * (Phase G9+), so a player cannot instantly heal-reset a real combat attempt for free -- not
   * wired to any real canonical map yet in this phase.
   */
  allowReset?: boolean;
};

/**
 * Technical skeleton for the future data-driven Story runtime. Reuses the same
 * apps/web/components/game/map-runtime primitives as CustomMapPixiStage (tiles, static
 * entities, collisions, camera, movement, labels/badges) rather than copying its logic. Enemies
 * are mutable combat entities (game-core's createStoryMapRuntimeEnemy/attackStoryMapRuntimeEnemy)
 * and the stage now derives and tracks a completion objective (game-core's
 * deriveStoryMapObjective/isStoryMapObjectiveSatisfied) -- still no pathfinding, boss phases,
 * loot, or status effects. The map itself is never mutated; runtime enemy state, objective
 * progress, and player position are all rebuilt fresh on every mount (and by the Reset stage
 * button). See the Story migration plan (Phase G) for what later phases add.
 */
export function StoryMapStage({ map, onStageCompleted, debug, allowReset = true }: StoryMapStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const onStageCompletedRef = useRef(onStageCompleted);
  onStageCompletedRef.current = onStageCompleted;

  const [progress, setProgress] = useState<ProgressDisplay | null>(null);
  const [completionResult, setCompletionResult] = useState<StoryMapStageResult | null>(null);
  const [playerHp, setPlayerHp] = useState({ current: PLACEHOLDER_PLAYER_HP_MAX, max: PLACEHOLDER_PLAYER_HP_MAX });

  useEffect(() => {
    const nullableHost = hostRef.current;
    if (!nullableHost) return;
    const hostElement: HTMLDivElement = nullableHost;

    const objective = deriveStoryMapObjective(map);
    const registry = createAssetRegistry();
    const loaded = loadPlayableMap(map);
    const app = new PIXI.Application();
    const world = new PIXI.Container();
    const labels = new PIXI.Container();
    const pressed = new Set<string>();
    const initialPlayerPosition = { ...(map.spawns.find((spawn) => spawn.id === "player_start") ?? map.spawns[0]) };
    const playerPosition = { ...initialPlayerPosition };
    const player = new PIXI.Graphics();
    let destroyed = false;
    let exitReached = false;
    let stageCompleted = false;
    let restartCount = 0;
    let playerHpCurrent = PLACEHOLDER_PLAYER_HP_MAX;

    type EnemyVisual = {
      runtime: StoryMapRuntimeEnemy;
      ai: EnemyAiRuntime;
      config: EnemyAiConfig;
      lastRenderedState: EnemyAiState;
      assetGraphic: PIXI.Container | null;
      badge: PIXI.Graphics;
      badgeLabel: PIXI.Text;
      aggro: PIXI.Graphics;
      hpLabel: PIXI.Text;
    };
    const enemyVisuals = new Map<string, EnemyVisual>();

    function drawEnemyBadge(badge: PIXI.Graphics, state: EnemyAiState) {
      badge.clear();
      badge.circle(0, 0, 12).fill({ color: 0x050505, alpha: 0.9 }).stroke({ color: enemyStateTint(state), alpha: 0.95, width: 2 });
    }

    function createEnemyVisual(runtime: StoryMapRuntimeEnemy, ai: EnemyAiRuntime, config: EnemyAiConfig): EnemyVisual {
      let assetGraphic: PIXI.Container | null = null;
      const asset = registry.assets.find((item) => item.id === runtime.assetId);
      if (asset) {
        assetGraphic = createAssetGraphic(asset);
        assetGraphic.position.set(ai.x, ai.y);
        assetGraphic.zIndex = ai.y;
        world.addChild(assetGraphic);
      }

      const badge = new PIXI.Graphics();
      drawEnemyBadge(badge, ai.state);
      badge.position.set(ai.x + ENEMY_BADGE_OFFSET.x, ai.y + ENEMY_BADGE_OFFSET.y);
      world.addChild(badge);

      const badgeLabel = addWorldLabel(labels, runtime.isBoss ? "BOSS" : "E", ai.x + ENEMY_BADGE_LABEL_OFFSET.x, ai.y + ENEMY_BADGE_LABEL_OFFSET.y);

      const aggro = new PIXI.Graphics();
      aggro.circle(0, 0, runtime.aggroRadius).stroke({ color: 0xf2f2f2, alpha: 0.14, width: 1 });
      aggro.position.set(ai.x + ENEMY_AGGRO_OFFSET.x, ai.y + ENEMY_AGGRO_OFFSET.y);
      world.addChild(aggro);

      const hpLabel = addWorldLabel(
        labels,
        `${Math.round(runtime.hpCurrent)}/${Math.round(runtime.hpMax)}`,
        ai.x + ENEMY_HP_LABEL_OFFSET.x,
        ai.y + ENEMY_HP_LABEL_OFFSET.y,
      );
      hpLabel.style.fill = 0xffe08a;

      return { runtime, ai, config, lastRenderedState: ai.state, assetGraphic, badge, badgeLabel, aggro, hpLabel };
    }

    function repositionEnemyVisual(visual: EnemyVisual) {
      const { x, y } = visual.ai;
      if (visual.assetGraphic) {
        visual.assetGraphic.position.set(x, y);
        visual.assetGraphic.zIndex = y;
      }
      if (visual.ai.state !== visual.lastRenderedState) {
        drawEnemyBadge(visual.badge, visual.ai.state);
        visual.lastRenderedState = visual.ai.state;
      }
      visual.badge.position.set(x + ENEMY_BADGE_OFFSET.x, y + ENEMY_BADGE_OFFSET.y);
      visual.badgeLabel.position.set(x + ENEMY_BADGE_LABEL_OFFSET.x, y + ENEMY_BADGE_LABEL_OFFSET.y);
      visual.aggro.position.set(x + ENEMY_AGGRO_OFFSET.x, y + ENEMY_AGGRO_OFFSET.y);
      visual.hpLabel.position.set(x + ENEMY_HP_LABEL_OFFSET.x, y + ENEMY_HP_LABEL_OFFSET.y);
    }

    function removeEnemyVisual(visual: EnemyVisual) {
      visual.assetGraphic?.parent?.removeChild(visual.assetGraphic);
      visual.badge.parent?.removeChild(visual.badge);
      visual.badgeLabel.parent?.removeChild(visual.badgeLabel);
      visual.aggro.parent?.removeChild(visual.aggro);
      visual.hpLabel.parent?.removeChild(visual.hpLabel);
      visual.assetGraphic = null;
    }

    function spawnEnemies() {
      for (const enemy of map.enemies) {
        const runtime = createStoryMapRuntimeEnemy(enemy);
        const ai = createEnemyAiRuntime(enemy);
        const config = createEnemyAiConfig(enemy);
        enemyVisuals.set(runtime.id, createEnemyVisual(runtime, ai, config));
      }
    }

    function canEntityMoveTo(next: Vector2, radius: number): boolean {
      const cell = worldToCell(next, map.grid.cellSize);
      if (loaded.blockingCells.has(cellKey(cell.x, cell.y))) return false;
      if (!isWithinWorldBounds(next, radius, { width: loaded.widthPx, height: loaded.heightPx })) return false;
      return !collidesWithAny(next, radius, map.collisions);
    }

    function applyContactDamageToPlayer(amount: number) {
      playerHpCurrent = Math.max(0, playerHpCurrent - amount);
      setPlayerHp({ current: playerHpCurrent, max: PLACEHOLDER_PLAYER_HP_MAX });
    }

    // Drives every non-dead enemy's AI one tick (game-core's stepEnemyAi decides state/movement;
    // this Pixi layer only applies it -- no AI logic is duplicated here). No pathfinding: if the
    // AI's chosen next position collides with static map geometry, the enemy holds its ground for
    // that tick rather than routing around the obstacle -- a documented limitation, not a bug, and
    // enemies do not slide along walls the way the player's axis-separated movement does.
    function stepEnemies(deltaSeconds: number, nowMs: number) {
      if (stageCompleted) return;
      for (const visual of enemyVisuals.values()) {
        if (visual.runtime.isDead && visual.ai.state !== "dead") {
          visual.ai = { ...visual.ai, state: "dead" };
        }
        if (visual.ai.state === "dead") continue;

        const result = stepEnemyAi(visual.ai, visual.config, playerPosition.x, playerPosition.y, deltaSeconds, nowMs);
        let nextAi = result.enemy;
        const moved = nextAi.x !== visual.ai.x || nextAi.y !== visual.ai.y;
        if (moved && !canEntityMoveTo({ x: nextAi.x, y: nextAi.y }, ENEMY_RADIUS)) {
          nextAi = { ...nextAi, x: visual.ai.x, y: visual.ai.y };
        }

        visual.ai = nextAi;
        repositionEnemyVisual(visual);

        if (result.didAttack) {
          applyContactDamageToPlayer(visual.config.contactDamage);
        }
      }
    }

    function syncProgressDisplay() {
      const bossEntry = objective.type === "boss_defeat" ? enemyVisuals.get(objective.bossEnemyId) : undefined;
      setProgress({
        objectiveType: objective.type,
        bossAlive: bossEntry ? !bossEntry.runtime.isDead : undefined,
        defeatedCount: [...enemyVisuals.values()].filter((visual) => visual.runtime.isDead).length,
        totalCount: enemyVisuals.size,
        exitReached,
      });
    }

    // Only ever called after a real event (an attack resolves, or the player moves) -- never
    // during initial setup, so the callback can never fire at mere mount.
    function checkObjectiveCompletion() {
      if (stageCompleted) return;
      syncProgressDisplay();

      const enemyContext = [...enemyVisuals.values()].map((visual) => ({ id: visual.runtime.id, isDead: visual.runtime.isDead }));
      if (!isStoryMapObjectiveSatisfied(objective, { enemies: enemyContext, exitReached })) return;

      stageCompleted = true;
      const defeatedEnemyIds = enemyContext.filter((enemy) => enemy.isDead).map((enemy) => enemy.id);
      const bossDefeated = objective.type === "boss_defeat" && enemyContext.some((enemy) => enemy.id === objective.bossEnemyId && enemy.isDead);
      const result: StoryMapStageResult = {
        mapId: map.id,
        objectiveType: objective.type,
        completed: true,
        defeatedEnemyIds,
        bossDefeated,
        exitReached,
        restartCount,
      };
      setCompletionResult(result);
      onStageCompletedRef.current?.(result);
    }

    function findMeleeTarget(): EnemyVisual | null {
      let nearest: EnemyVisual | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const visual of enemyVisuals.values()) {
        if (visual.runtime.isDead) continue;
        const distance = Math.hypot(visual.ai.x - playerPosition.x, visual.ai.y - playerPosition.y);
        if (distance <= MELEE_RANGE && distance < nearestDistance) {
          nearest = visual;
          nearestDistance = distance;
        }
      }
      return nearest;
    }

    function onPointerDown(event: PointerEvent) {
      if (stageCompleted || event.button !== 0) return;
      const target = findMeleeTarget();
      if (!target) return;

      const updated = attackStoryMapRuntimeEnemy(target.runtime, PLACEHOLDER_ATTACKER);
      target.runtime = updated;
      target.hpLabel.text = `${Math.round(updated.hpCurrent)}/${Math.round(updated.hpMax)}`;
      if (updated.isDead) {
        // Visuals disappear, but the entry stays in enemyVisuals (with isDead: true) -- objective
        // checks (defeat_all_enemies, boss_defeat) need to keep seeing dead enemies, not just
        // alive ones. findMeleeTarget() above already skips isDead entries, so this is safe.
        removeEnemyVisual(target);
      }
      checkObjectiveCompletion();
    }

    function resetStage() {
      playerPosition.x = initialPlayerPosition.x;
      playerPosition.y = initialPlayerPosition.y;
      drawPlayer();

      for (const visual of enemyVisuals.values()) {
        removeEnemyVisual(visual);
      }
      enemyVisuals.clear();
      spawnEnemies();

      exitReached = false;
      stageCompleted = false;
      restartCount += 1;
      playerHpCurrent = PLACEHOLDER_PLAYER_HP_MAX;
      setPlayerHp({ current: playerHpCurrent, max: PLACEHOLDER_PLAYER_HP_MAX });
      setCompletionResult(null);
      syncProgressDisplay();
    }
    resetRef.current = resetStage;

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
      spawnEnemies();
      for (const collision of map.collisions) {
        const g = new PIXI.Graphics();
        renderMapCollisionDebug(g, collision);
        world.addChild(g);
      }
      // The dungeon_exit convention (type "event" + target "dungeon_exit", documented on
      // MapTrigger in Phase G1) is now interpreted for the reach_exit objective and rendered
      // distinctly; every other trigger is still generic.
      for (const trigger of map.triggers) {
        const isDungeonExit = trigger.type === "event" && trigger.target === "dungeon_exit";
        const tint = isDungeonExit ? 0x8affc1 : 0x9ad9ff;
        const g = new PIXI.Graphics();
        g.rect(trigger.x, trigger.y, trigger.width, trigger.height)
          .fill({ color: tint, alpha: isDungeonExit ? 0.12 : 0.07 })
          .stroke({ color: tint, alpha: 0.85, width: 2 });
        world.addChild(g);
        addWorldLabel(labels, isDungeonExit ? "EXIT" : "trigger", trigger.x + trigger.width / 2, trigger.y + trigger.height / 2);
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
      return canEntityMoveTo(next, PLAYER_RADIUS);
    }

    function checkExitTrigger() {
      if (stageCompleted || exitReached || objective.type !== "reach_exit") return;
      const exitTrigger = map.triggers.find((trigger) => trigger.id === objective.triggerId);
      if (!exitTrigger) return;
      if (isInsideRect(playerPosition, exitTrigger, PLAYER_RADIUS)) {
        exitReached = true;
        checkObjectiveCompletion();
      }
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
        checkExitTrigger();
      }

      stepEnemies(ticker.deltaMS / 1000, performance.now());

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
      // Shows the initial objective/progress numbers -- this is a display sync, not a
      // completion check, so it never risks firing onStageCompleted at mount.
      syncProgressDisplay();
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
      resetRef.current = null;
      // app.canvas is a getter backed by the renderer PixiJS creates inside app.init() -- reading
      // it before that promise has resolved throws (not merely undefined, so `?.` doesn't help).
      // Everything below was only ever attached once `ready` became true (see setup() above), so
      // it's both safe and correct to skip all of it when init() hasn't finished yet.
      if (ready) {
        app.canvas.removeEventListener("pointerdown", onPointerDown);
        app.ticker.remove(tick);
        app.destroy(true, { children: true });
      }
    };
  }, [map]);

  function objectiveLabel(): string {
    if (!progress) return "";
    if (progress.objectiveType === "boss_defeat") {
      return `Boss objective — ${progress.bossAlive ? "Boss alive" : "Boss defeated"}`;
    }
    if (progress.objectiveType === "reach_exit") {
      return `Reach the exit — ${progress.exitReached ? "Exit reached" : "Exit not reached"}`;
    }
    if (progress.totalCount === 0) {
      return "Defeat all enemies — no enemies on this map, objective cannot be completed";
    }
    return `Defeat all enemies — ${progress.defeatedCount} / ${progress.totalCount} defeated`;
  }

  return (
    <div className="relative h-full min-h-[620px] w-full">
      <div ref={hostRef} className="h-full min-h-[620px] w-full" />
      {progress ? (
        <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-xs rounded-md border border-zinc-700 bg-black/82 p-3 font-ik-body text-xs text-zinc-100 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <div className="font-ik-menu text-[0.65rem] text-zinc-400">Objective</div>
          <div className="mt-1">{objectiveLabel()}</div>
          <div className="font-ik-menu mt-2 text-[0.65rem] text-zinc-400">Player HP (technical placeholder)</div>
          <div className="mt-1">{playerHp.current} / {playerHp.max}</div>
        </div>
      ) : null}
      {allowReset ? (
        <button
          className="pointer-events-auto absolute bottom-4 right-4 z-10 rounded-md border border-zinc-700 bg-black/82 px-3 py-2 font-ik-menu text-[0.65rem] uppercase tracking-wide text-zinc-100 hover:border-zinc-200"
          onClick={() => resetRef.current?.()}
          type="button"
        >
          Reset stage
        </button>
      ) : null}
      {completionResult ? (
        <div className="pointer-events-auto absolute inset-0 z-20 grid place-items-center bg-black/70">
          <div className="rounded-md border border-emerald-300/40 bg-black/90 p-6 text-center">
            <p className="font-ik-title text-lg text-emerald-200">Stage completed — dry run, no progression applied</p>
            {allowReset ? (
              <button
                className="mt-4 rounded-md border border-zinc-700 px-4 py-2 font-ik-menu text-xs uppercase tracking-wide text-zinc-100 hover:border-zinc-200"
                onClick={() => resetRef.current?.()}
                type="button"
              >
                Reset stage
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
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
