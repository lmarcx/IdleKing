"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as PIXI from "pixi.js";

import { buildCombatLoadoutFromGameState } from "@/lib/combat-loadout";
import { useGameStore } from "@/store/game-store";
import { combat } from "@idleking/game-core";
import { addQty, type ResourceId } from "@idleking/game-core/resources/types.js";
import { SkillBar } from "./skill-bar";
import { isEnemyInBeam, isEnemyInCircle, isEnemyInFrontalAoe } from "./skills-hit-detection";
import { cleanupSkillEffects, renderSkillEffects, spawnInstantSkillEffect } from "./skills-visuals";
import {
  MELEE_DAMAGE,
  PLAYER_MAX_HP,
  RANGED_DAMAGE,
  createInitialEnemies,
  damageEnemy,
  damagePlayer,
  isCircleIntersectingCircle,
  isEnemyAlive,
  isTargetInsideAttackCone,
  rollEnemyLoot,
  updateEnemyMovement,
  type EnemyId,
  type EnemyLoot,
  type StoryLevelEnemy,
} from "./story-level-combat";

type PixiExplorationStageProps = {
  levelId: string;
  mapHeight: number;
  mapWidth: number;
  onPlayerMove: (position: { x: number; y: number }) => void;
  pointsOfInterest: ExplorationStagePoi[];
};

const PLAYER_SIZE = 48;
const PLAYER_SPEED = 310;
const MELEE_ATTACK_COOLDOWN_MS = 280;
const MELEE_DURATION_MS = 120;
const MELEE_RANGE = 86;
const RANGED_ATTACK_COOLDOWN_MS = 450;
const PROJECTILE_MAX_RANGE = 620;
const PROJECTILE_SPEED = 620;
const MELEE_ATTACK_HALF_ANGLE_RADIANS = 0.72;
const ENEMY_HIT_FLASH_MS = 140;
const ENEMY_DEATH_FADE_MS = 260;
const LOOT_POPUP_DURATION_MS = 900;
const PLAYER_SKILL_BASE_DAMAGE = MELEE_DAMAGE;
const IS_SKILL_HIT_DEBUG_ENABLED = process.env.NODE_ENV !== "production";
const SKILL_DEBUG_EVENT = "idleking:spawn-skill-debug-enemies";

export type ExplorationStagePoi = {
  color: number;
  id: string;
  x: number;
  y: number;
};

type Vector2 = {
  x: number;
  y: number;
};

type ActiveMeleeAttack = {
  ageMs: number;
  direction: Vector2;
  durationMs: number;
  graphic: PIXI.Graphics;
  hitEnemyIds: Set<EnemyId>;
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

type ActiveLootPopup = {
  ageMs: number;
  container: PIXI.Container;
  durationMs: number;
  position: Vector2;
};

type ActiveMouseAction = "melee" | "ranged" | null;

type ActiveEnemy = StoryLevelEnemy & {
  body: PIXI.Graphics;
  container: PIXI.Container;
  debugScenario?: boolean;
  deathFadeMs: number;
  hitFlashMs: number;
  hpBar: PIXI.Graphics;
};

type SkillId = combat.SkillId;
type SkillSlot = combat.SkillSlot;
type SkillCooldownState = combat.SkillCooldownState;
type VisualActiveSkillEffect = combat.ActiveSkillEffect & {
  angle?: number;
  directionX?: number;
  directionY?: number;
  hitEnemyIds?: Set<EnemyId>;
  lastDamageTickAtMs?: number;
  originX?: number;
  originY?: number;
  skillDef: combat.SkillDef;
};
type CharacterCombatLoadout = import("@idleking/game-core").CharacterCombatLoadout;
type EquippedCombatSkill = import("@idleking/game-core").EquippedCombatSkill;

type DirectionalSkillSnapshot = {
  angle: number;
  directionX: number;
  directionY: number;
  originX: number;
  originY: number;
};

type LocalSkillsState = {
  activeEffects: VisualActiveSkillEffect[];
  combatLoadout: CharacterCombatLoadout;
  cooldowns: SkillCooldownState;
  currentTimeMs: number;
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

const SKILL_SLOT_BY_KEY: Record<string, SkillSlot> = {
  "&": 1,
  "1": 1,
  "é": 2,
  "2": 2,
  "\"": 3,
  "3": 3,
  "'": 4,
  "4": 4,
};

const SKILL_SLOT_BY_CODE: Record<string, SkillSlot> = {
  Digit1: 1,
  Digit2: 2,
  Digit3: 3,
  Digit4: 4,
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

function createEnemyGraphics(enemy: StoryLevelEnemy): ActiveEnemy {
  const container = new PIXI.Container();
  const body = new PIXI.Graphics();
  const hpBar = new PIXI.Graphics();

  container.addChild(body);
  container.addChild(hpBar);
  container.position.set(enemy.position.x, enemy.position.y);

  return {
    ...enemy,
    body,
    container,
    debugScenario: false,
    deathFadeMs: 0,
    hitFlashMs: 0,
    hpBar,
  };
}

function createDebugEnemy(id: string, position: Vector2): StoryLevelEnemy {
  return {
    attackCooldownMs: 700,
    contactDamage: 0,
    detectionRadius: 0,
    hp: 40,
    id,
    kind: "grunt",
    lastContactDamageAt: -Infinity,
    lootClaimed: false,
    maxHp: 40,
    moveSpeed: 0,
    position,
    radius: 20,
    state: "idle",
  };
}

function renderEnemy(enemy: ActiveEnemy) {
  enemy.container.position.set(enemy.position.x, enemy.position.y);
  enemy.container.alpha = enemy.state === "dead" ? clamp(1 - enemy.deathFadeMs / ENEMY_DEATH_FADE_MS, 0, 1) : 1;

  const isChasing = enemy.state === "chasing";
  const hitProgress = clamp(enemy.hitFlashMs / ENEMY_HIT_FLASH_MS, 0, 1);
  const bodyColor = enemy.hitFlashMs > 0 ? 0xffd0d0 : isChasing ? 0xd44848 : 0x742828;
  const outlineColor = isChasing ? 0xff8f7c : 0x9f4a45;
  const scale = enemy.hitFlashMs > 0 ? 1 + hitProgress * 0.18 : 1;

  enemy.body.clear();
  enemy.body.circle(0, 0, enemy.radius * scale).fill({ color: bodyColor, alpha: enemy.state === "dead" ? 0.35 : 0.88 });
  enemy.body.circle(0, 0, enemy.radius * scale).stroke({ color: outlineColor, alpha: 0.9, width: 2 });
  enemy.body.circle(enemy.radius * 0.34, -enemy.radius * 0.18, enemy.radius * 0.18).fill(0x1a0c0c);

  const barWidth = enemy.radius * 2.3;
  const hpRatio = enemy.maxHp > 0 ? clamp(enemy.hp / enemy.maxHp, 0, 1) : 0;
  enemy.hpBar.clear();
  if (enemy.state !== "dead") {
    enemy.hpBar.roundRect(-barWidth / 2, -enemy.radius - 14, barWidth, 5, 2).fill({ color: 0x130808, alpha: 0.82 });
    enemy.hpBar.roundRect(-barWidth / 2, -enemy.radius - 14, barWidth * hpRatio, 5, 2).fill({
      color: hpRatio > 0.45 ? 0xff6b58 : 0xffc857,
      alpha: 0.95,
    });
  }
}

function getLootPopupColor(resourceId: ResourceId): number {
  switch (resourceId) {
    case "MEAT":
      return 0xff7b5d;
    case "WOOD":
      return 0x8bd46e;
    case "STONE":
      return 0xb8c0cc;
    default:
      return 0xfff1b8;
  }
}

function getLootPopupLabel(resourceId: ResourceId): string {
  switch (resourceId) {
    case "MEAT":
      return "FOOD";
    default:
      return resourceId;
  }
}

export function PixiExplorationStage({ levelId, mapHeight, mapWidth, onPlayerMove, pointsOfInterest }: PixiExplorationStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const onPlayerMoveRef = useRef(onPlayerMove);
  const playerSkills = useGameStore((s) => s.state.skills);
  const combatLoadout = useMemo(
    () => buildCombatLoadoutFromGameState({ ...useGameStore.getState().state, skills: playerSkills }),
    [playerSkills]
  );
  const [skillsState, setSkillsState] = useState<LocalSkillsState>(() => ({
    activeEffects: [],
    combatLoadout,
    cooldowns: {},
    currentTimeMs: 0,
  }));
  const skillsStateRef = useRef(skillsState);
  const [combatHud, setCombatHud] = useState({
    enemiesRemaining: 0,
    isDefeated: false,
    playerHp: PLAYER_MAX_HP,
  });

  useEffect(() => {
    onPlayerMoveRef.current = onPlayerMove;
  }, [onPlayerMove]);

  useEffect(() => {
    skillsStateRef.current = skillsState;
  }, [skillsState]);

  useEffect(() => {
    const nullableHostElement = hostRef.current;
    if (!nullableHostElement) return;
    const hostElement: HTMLDivElement = nullableHostElement;

    let cancelled = false;
    let initialized = false;
    const pressedKeys = new Set<string>();
    const app = new PIXI.Application();
    const world = new PIXI.Container();
    const enemyLayer = new PIXI.Container();
    const attackLayer = new PIXI.Container();
    const lootPopupLayer = new PIXI.Container();
    const player = drawPlayer();
    const playerPosition = {
      x: mapWidth / 2,
      y: mapHeight / 2,
    };
    const mouseInput = {
      activeMouseAction: null as ActiveMouseAction,
      isMeleeHeld: false,
      isRangedHeld: false,
      pointerWorldPosition: { ...playerPosition },
    };
    const playerFacing: Vector2 = { x: 0, y: -1 };
    const meleeAttacks: ActiveMeleeAttack[] = [];
    const projectiles: ActiveProjectile[] = [];
    const lootPopups: ActiveLootPopup[] = [];
    const enemies: ActiveEnemy[] = createInitialEnemies().map(createEnemyGraphics);
    let activeSkillEffects: VisualActiveSkillEffect[] = [...skillsStateRef.current.activeEffects];
    let skillCooldowns: SkillCooldownState = { ...skillsStateRef.current.cooldowns };
    let canvasElement: HTMLCanvasElement | null = null;
    let combatHudElapsed = 0;
    let hudElapsed = 0;
    let skillsHudElapsed = 0;
    let hasPointerWorldPosition = false;
    let isPlayerDefeated = false;
    let lastMeleeAttackAt = -Infinity;
    let lastRangedAttackAt = -Infinity;
    let playerHp = PLAYER_MAX_HP;

    function publishSkillsState(nowMs: number) {
      const nextState: LocalSkillsState = {
        activeEffects: [...activeSkillEffects],
        combatLoadout,
        cooldowns: { ...skillCooldowns },
        currentTimeMs: nowMs,
      };
      skillsStateRef.current = nextState;
      setSkillsState(nextState);
    }

    function removeExpiredSkillEffects(nowMs: number) {
      activeSkillEffects = activeSkillEffects.filter((effect) => effect.endsAtMs >= nowMs);
    }

    function getEquippedSkillForSlot(slot: SkillSlot): EquippedCombatSkill | undefined {
      return combatLoadout.skills.find((skill) => skill.slot === slot);
    }

    function createDirectionalSnapshot(): DirectionalSkillSnapshot {
      const direction = normalizeVector(playerFacing);
      return {
        angle: Math.atan2(direction.y, direction.x),
        directionX: direction.x,
        directionY: direction.y,
        originX: playerPosition.x,
        originY: playerPosition.y,
      };
    }

    function tryCastSkill(slot: SkillSlot, nowMs: number) {
      if (isPlayerDefeated) return;

      removeExpiredSkillEffects(nowMs);
      const equippedSkill = getEquippedSkillForSlot(slot);
      if (!equippedSkill) return;

      const result = combat.castSkillWithDef({
        cooldowns: skillCooldowns,
        nowMs,
        skillDef: equippedSkill.skillDef,
      });

      if (!result.ok) {
        publishSkillsState(nowMs);
        return;
      }

      skillCooldowns = {
        ...skillCooldowns,
        [result.skillId]: result.nextAvailableAtMs,
      };

      if (result.activeEffect) {
        const visualEffect =
          result.skillId === "royal_beam"
            ? {
                ...result.activeEffect,
                skillDef: equippedSkill.skillDef,
                ...createDirectionalSnapshot(),
                lastDamageTickAtMs: result.startedAtMs - (result.activeEffect.tickIntervalMs ?? 0),
              }
            : {
                ...result.activeEffect,
                skillDef: equippedSkill.skillDef,
                lastDamageTickAtMs: result.startedAtMs - (result.activeEffect.tickIntervalMs ?? 0),
              };
        activeSkillEffects = [...activeSkillEffects, visualEffect];
      } else if (result.skillId === "royal_strike") {
        const snapshot = createDirectionalSnapshot();
        spawnInstantSkillEffect(player, result.skillId, result.startedAtMs, snapshot);
        applyRoyalStrikeDamage(equippedSkill.skillDef, snapshot, nowMs);
      }

      publishSkillsState(nowMs);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isPlayerDefeated) return;
      if (IS_SKILL_HIT_DEBUG_ENABLED && event.code === "F8") {
        event.preventDefault();
        if (!event.repeat) {
          spawnSkillDebugScenario();
        }
        return;
      }

      const skillSlot = SKILL_SLOT_BY_KEY[event.key] ?? SKILL_SLOT_BY_CODE[event.code];
      if (skillSlot) {
        event.preventDefault();
        if (!event.repeat) {
          tryCastSkill(skillSlot, performance.now());
        }
        return;
      }

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
        hitEnemyIds: new Set(),
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
      if (isPlayerDefeated) return;
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

    function handleSkillDebugScenarioEvent() {
      spawnSkillDebugScenario();
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

    function removeEnemyAt(index: number) {
      const enemy = enemies[index];
      enemy.container.removeFromParent();
      enemy.container.destroy({ children: true });
      enemies.splice(index, 1);
    }

    function spawnSkillDebugScenario() {
      if (!IS_SKILL_HIT_DEBUG_ENABLED) return;

      for (let index = enemies.length - 1; index >= 0; index -= 1) {
        if (enemies[index].debugScenario) {
          removeEnemyAt(index);
        }
      }

      const direction = normalizeVector(playerFacing);
      const side = { x: -direction.y, y: direction.x };
      const debugEnemies = [
        createDebugEnemy("debug-skill-front", {
          x: clamp(playerPosition.x + direction.x * 120, 24, mapWidth - 24),
          y: clamp(playerPosition.y + direction.y * 120, 24, mapHeight - 24),
        }),
        createDebugEnemy("debug-skill-close", {
          x: clamp(playerPosition.x + side.x * 135, 24, mapWidth - 24),
          y: clamp(playerPosition.y + side.y * 135, 24, mapHeight - 24),
        }),
        createDebugEnemy("debug-skill-far", {
          x: clamp(playerPosition.x - side.x * 260, 24, mapWidth - 24),
          y: clamp(playerPosition.y - side.y * 260, 24, mapHeight - 24),
        }),
      ];

      for (const enemyDef of debugEnemies) {
        const enemy = createEnemyGraphics(enemyDef);
        enemy.debugScenario = true;
        renderEnemy(enemy);
        enemies.push(enemy);
        enemyLayer.addChild(enemy.container);
      }

      syncCombatHud();
    }

    function getEnemiesRemaining() {
      return enemies.filter(isEnemyAlive).length;
    }

    function addLootToPlayerResources(loot: EnemyLoot) {
      useGameStore.getState().dispatch((state) => ({
        ...state,
        resources: addQty(state.resources, loot.resourceId, loot.amount),
      }));
    }

    function createLootPopup(position: Vector2, loot: EnemyLoot) {
      const container = new PIXI.Container();
      const icon = new PIXI.Graphics();
      const text = new PIXI.Text({
        text: `+${loot.amount} ${getLootPopupLabel(loot.resourceId)}`,
        style: {
          fill: 0xfff1b8,
          fontFamily: "Arial",
          fontSize: 17,
          fontWeight: "700",
          stroke: { color: 0x150b08, width: 3 },
        },
      });

      icon.circle(0, 0, 8).fill({ color: getLootPopupColor(loot.resourceId), alpha: 0.95 });
      icon.circle(0, 0, 13).stroke({ color: 0xfff1b8, alpha: 0.55, width: 2 });
      text.anchor.set(0.5, 0.5);
      text.position.set(34, 0);
      container.addChild(icon);
      container.addChild(text);
      container.position.set(position.x - 18, position.y - 42);

      lootPopups.push({
        ageMs: 0,
        container,
        durationMs: LOOT_POPUP_DURATION_MS,
        position: { x: position.x - 18, y: position.y - 42 },
      });
      lootPopupLayer.addChild(container);
    }

    function claimEnemyLoot(enemy: ActiveEnemy) {
      if (enemy.lootClaimed) return;
      enemy.lootClaimed = true;

      const loot = rollEnemyLoot(enemy, levelId);
      addLootToPlayerResources(loot);
      createLootPopup(enemy.position, loot);
    }

    function syncCombatHud() {
      setCombatHud({
        enemiesRemaining: getEnemiesRemaining(),
        isDefeated: isPlayerDefeated,
        playerHp,
      });
    }

    function damageActiveEnemy(enemy: ActiveEnemy, amount: number) {
      const died = damageEnemy(enemy, amount);
      enemy.hitFlashMs = ENEMY_HIT_FLASH_MS;
      if (died) {
        enemy.deathFadeMs = 0;
        claimEnemyLoot(enemy);
      }
    }

    function getPlayerDamageMultiplier(effects: VisualActiveSkillEffect[], nowMs: number): number {
      const warCry = effects.find(
        (effect) => effect.skillId === "war_cry" && effect.startedAtMs <= nowMs && effect.endsAtMs >= nowMs
      );
      return warCry ? 1 + (warCry.bonusDamageMultiplier ?? 0.25) : 1;
    }

    function computeSkillDamage(skillDef: combat.SkillDef, nowMs: number): number {
      const damageMultiplier = skillDef.damageMultiplier ?? 0;
      if (damageMultiplier <= 0) return 0;

      const damage = PLAYER_SKILL_BASE_DAMAGE * damageMultiplier * getPlayerDamageMultiplier(activeSkillEffects, nowMs);
      return Math.max(1, Math.round(damage));
    }

    function computePlayerAttackDamage(baseDamage: number, nowMs: number): number {
      return Math.max(1, Math.round(baseDamage * getPlayerDamageMultiplier(activeSkillEffects, nowMs)));
    }

    function applySkillDamageToEnemy(enemy: ActiveEnemy, damage: number) {
      if (damage <= 0 || !isEnemyAlive(enemy)) return;
      damageActiveEnemy(enemy, damage);
    }

    function applyRoyalStrikeDamage(skillDef: combat.SkillDef, snapshot: DirectionalSkillSnapshot, nowMs: number) {
      if (skillDef.kind !== "frontal_aoe") return;

      const damage = computeSkillDamage(skillDef, nowMs);
      const hitEnemyIds = new Set<EnemyId>();

      for (const enemy of enemies) {
        if (!isEnemyAlive(enemy) || hitEnemyIds.has(enemy.id)) continue;
        if (
          !isEnemyInFrontalAoe(
            enemy,
            snapshot.originX,
            snapshot.originY,
            snapshot.directionX,
            snapshot.directionY,
            skillDef.range ?? 0,
            skillDef.width ?? 0
          )
        ) {
          continue;
        }

        hitEnemyIds.add(enemy.id);
        applySkillDamageToEnemy(enemy, damage);
      }

      if (hitEnemyIds.size > 0) {
        syncCombatHud();
      }
    }

    function applyActiveSkillEffectDamage(nowMs: number) {
      let didDamage = false;

      for (const effect of activeSkillEffects) {
        if (effect.skillId === "war_cry") continue;

        const skillDef = effect.skillDef;
        const tickIntervalMs = effect.tickIntervalMs ?? skillDef.tickIntervalMs;
        if (!tickIntervalMs || tickIntervalMs <= 0) continue;

        const lastDamageTickAtMs = effect.lastDamageTickAtMs ?? effect.startedAtMs - tickIntervalMs;
        if (nowMs - lastDamageTickAtMs < tickIntervalMs) continue;

        effect.lastDamageTickAtMs = nowMs;
        const damage = computeSkillDamage(skillDef, nowMs);
        if (damage <= 0) continue;

        const hitEnemyIds = new Set<EnemyId>();
        for (const enemy of enemies) {
          if (!isEnemyAlive(enemy) || hitEnemyIds.has(enemy.id)) continue;

          const isHit =
            effect.skillId === "royal_beam"
              ? isEnemyInBeam(
                  enemy,
                  effect.originX ?? playerPosition.x,
                  effect.originY ?? playerPosition.y,
                  effect.directionX ?? playerFacing.x,
                  effect.directionY ?? playerFacing.y,
                  skillDef.range ?? effect.range ?? 0,
                  skillDef.width ?? effect.width ?? 0
                )
              : effect.skillId === "king_aura"
                ? isEnemyInCircle(enemy, playerPosition.x, playerPosition.y, skillDef.radius ?? effect.radius ?? 0)
                : false;

          if (!isHit) continue;

          hitEnemyIds.add(enemy.id);
          applySkillDamageToEnemy(enemy, damage);
          didDamage = true;
        }
      }

      if (didDamage) {
        syncCombatHud();
      }
    }

    function applyMeleeHits(attack: ActiveMeleeAttack) {
      for (const enemy of enemies) {
        if (!isEnemyAlive(enemy) || attack.hitEnemyIds.has(enemy.id)) continue;

        const isHit = isTargetInsideAttackCone({
          attackDirection: attack.direction,
          attackPosition: attack.position,
          halfAngleRadians: MELEE_ATTACK_HALF_ANGLE_RADIANS,
          range: MELEE_RANGE,
          targetPosition: enemy.position,
          targetRadius: enemy.radius,
        });

        if (!isHit) continue;
        attack.hitEnemyIds.add(enemy.id);
        damageActiveEnemy(enemy, computePlayerAttackDamage(MELEE_DAMAGE, performance.now()));
      }
    }

    function applyProjectileHits(projectile: ActiveProjectile): boolean {
      for (const enemy of enemies) {
        if (!isEnemyAlive(enemy)) continue;
        if (!isCircleIntersectingCircle(projectile.position, 8, enemy.position, enemy.radius)) continue;

        damageActiveEnemy(enemy, computePlayerAttackDamage(RANGED_DAMAGE, performance.now()));
        return true;
      }

      return false;
    }

    function damagePlayerFromEnemy(enemy: ActiveEnemy, now: number) {
      if (now - enemy.lastContactDamageAt < enemy.attackCooldownMs) return;

      enemy.lastContactDamageAt = now;
      playerHp = damagePlayer(playerHp, enemy.contactDamage);
      if (playerHp <= 0) {
        isPlayerDefeated = true;
        pressedKeys.clear();
        resetHeldMouseButtons();
      }
      syncCombatHud();
    }

    function updateEnemies(deltaMs: number, now: number) {
      if (isPlayerDefeated) return;

      const deltaSeconds = deltaMs / 1000;
      for (const enemy of enemies) {
        if (enemy.state === "dead") {
          enemy.deathFadeMs += deltaMs;
          if (enemy.deathFadeMs >= ENEMY_DEATH_FADE_MS) {
            enemy.container.visible = false;
          }
          continue;
        }

        enemy.hitFlashMs = Math.max(0, enemy.hitFlashMs - deltaMs);
        updateEnemyMovement(enemy, playerPosition, deltaSeconds);

        if (isCircleIntersectingCircle(enemy.position, enemy.radius, playerPosition, PLAYER_SIZE / 2)) {
          damagePlayerFromEnemy(enemy, now);
        }
      }
    }

    function renderEnemies() {
      for (const enemy of enemies) {
        renderEnemy(enemy);
      }
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

      if (!isPlayerDefeated && mouseInput.activeMouseAction === "melee" && mouseInput.isMeleeHeld) {
        createMeleeAttack(now);
      }

      if (!isPlayerDefeated && mouseInput.activeMouseAction === "ranged" && mouseInput.isRangedHeld) {
        createRangedAttack(now);
      }

      for (let index = meleeAttacks.length - 1; index >= 0; index -= 1) {
        const attack = meleeAttacks[index];
        attack.ageMs += deltaMs;
        applyMeleeHits(attack);
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

        if (applyProjectileHits(projectile) || projectile.distanceTravelled >= projectile.maxRange || isOutOfBounds) {
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

    function updateLootPopups(deltaMs: number) {
      for (let index = lootPopups.length - 1; index >= 0; index -= 1) {
        const popup = lootPopups[index];
        popup.ageMs += deltaMs;

        const progress = clamp(popup.ageMs / popup.durationMs, 0, 1);
        popup.container.alpha = 1 - progress;
        popup.container.position.set(popup.position.x, popup.position.y - progress * 34);

        if (popup.ageMs < popup.durationMs) continue;
        popup.container.removeFromParent();
        popup.container.destroy({ children: true });
        lootPopups.splice(index, 1);
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

    function cleanupLootPopups() {
      for (const popup of lootPopups) {
        popup.container.removeFromParent();
        popup.container.destroy({ children: true });
      }
      lootPopups.length = 0;
    }

    function cleanupEnemies() {
      for (const enemy of enemies) {
        enemy.container.removeFromParent();
        enemy.container.destroy({ children: true });
      }
      enemies.length = 0;
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
      drawWorld(world, mapWidth, mapHeight, pointsOfInterest);
      for (const enemy of enemies) {
        renderEnemy(enemy);
        enemyLayer.addChild(enemy.container);
      }
      world.addChild(enemyLayer);
      world.addChild(attackLayer);
      world.addChild(lootPopupLayer);
      world.addChild(player);
      player.position.set(playerPosition.x, playerPosition.y);
      onPlayerMoveRef.current(playerPosition);
      syncCombatHud();

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      window.addEventListener("blur", handleWindowBlur);
      window.addEventListener("mouseup", handleWindowMouseUp);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerCancel);
      if (IS_SKILL_HIT_DEBUG_ENABLED) {
        window.addEventListener(SKILL_DEBUG_EVENT, handleSkillDebugScenarioEvent);
      }

      app.ticker.add((ticker) => {
        const nowMs = performance.now();
        const deltaSeconds = ticker.deltaMS / 1000;
        let directionX = 0;
        let directionY = 0;

        for (const key of pressedKeys) {
          const direction = KEY_DIRECTIONS[key];
          if (!direction) continue;
          directionX += direction.x;
          directionY += direction.y;
        }

        if (!isPlayerDefeated && (directionX !== 0 || directionY !== 0)) {
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

        removeExpiredSkillEffects(nowMs);
        updateEnemies(ticker.deltaMS, nowMs);
        updateAttacks(ticker.deltaMS, nowMs);
        applyActiveSkillEffectDamage(nowMs);
        updateLootPopups(ticker.deltaMS);
        renderEnemies();
        renderAttacks();
        player.rotation = Math.atan2(playerFacing.y, playerFacing.x) + Math.PI / 2;
        renderSkillEffects(app, player, activeSkillEffects);

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

        skillsHudElapsed += ticker.deltaMS;
        if (skillsHudElapsed >= 90) {
          skillsHudElapsed = 0;
          publishSkillsState(nowMs);
        }

        combatHudElapsed += ticker.deltaMS;
        if (combatHudElapsed >= 120) {
          combatHudElapsed = 0;
          syncCombatHud();
        }
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
      if (IS_SKILL_HIT_DEBUG_ENABLED) {
        window.removeEventListener(SKILL_DEBUG_EVENT, handleSkillDebugScenarioEvent);
      }
      canvasElement?.removeEventListener("contextmenu", handleContextMenu);
      canvasElement?.removeEventListener("pointerdown", handlePointerDown);
      canvasElement?.removeEventListener("pointerup", handlePointerUp);
      canvasElement?.removeEventListener("pointercancel", handlePointerCancel);
      canvasElement?.removeEventListener("pointerleave", handlePointerLeave);
      canvasElement?.removeEventListener("pointermove", handlePointerMove);
      resetHeldMouseButtons();
      pressedKeys.clear();
      cleanupAttacks();
      cleanupLootPopups();
      cleanupSkillEffects(player);
      cleanupEnemies();
      if (initialized) app.destroy(true);
    };
  }, [combatLoadout, levelId, mapHeight, mapWidth, pointsOfInterest]);

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="h-full w-full" />
      {IS_SKILL_HIT_DEBUG_ENABLED ? (
        <button
          className="absolute right-4 top-4 z-20 rounded-md border border-cyan-200/30 bg-cyan-950/80 px-3 py-2 font-ik-menu text-[0.65rem] uppercase tracking-[0.12em] text-cyan-100 shadow-[0_10px_28px_rgba(0,0,0,0.4)] transition hover:border-cyan-100"
          onClick={() => window.dispatchEvent(new Event(SKILL_DEBUG_EVENT))}
          type="button"
        >
          Debug hits
        </button>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
        <SkillBar
          combatLoadout={skillsState.combatLoadout}
          cooldowns={skillsState.cooldowns}
          currentTimeMs={skillsState.currentTimeMs}
        />
      </div>
      <div className="pointer-events-none absolute bottom-20 right-4 z-10 rounded-lg border border-red-200/25 bg-black/70 px-4 py-3 font-ik-body text-xs text-amber-50 shadow-[0_12px_30px_rgba(0,0,0,0.38)]">
        <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.18em] text-red-200">Combat prototype</p>
        <div className="mt-2 grid gap-1">
          <span>
            HP joueur {combatHud.playerHp}/{PLAYER_MAX_HP}
          </span>
          <span>Ennemis restants {combatHud.enemiesRemaining}</span>
        </div>
      </div>
      {combatHud.isDefeated ? (
        <div className="pointer-events-auto absolute inset-0 z-30 grid place-items-center bg-black/68 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-red-200/35 bg-zinc-950/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
            <p className="font-ik-menu text-xs uppercase tracking-[0.22em] text-red-200">Defaite</p>
            <h2 className="mt-2 font-ik-title text-2xl font-semibold text-amber-50">Vous etes tombe</h2>
            <p className="mt-3 font-ik-body text-sm text-muted-foreground">Le prototype de combat vous a mis hors d'etat.</p>
            <a
              className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-amber-200/45 bg-amber-500/18 px-4 py-3 font-ik-menu text-sm text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/24"
              href="/game/worlds"
            >
              Retour a la Story
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
