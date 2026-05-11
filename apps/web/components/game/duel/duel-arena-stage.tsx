"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as PIXI from "pixi.js";

import { CombatHud } from "@/components/game/combat/combat-hud";
import { useGameHudOverlay } from "@/components/game/hud/game-hud-overlays";
import { buildCombatLoadoutFromGameState } from "@/lib/combat-loadout";
import { getResourceAssetPath } from "@/lib/resource-assets";
import { useGameStore } from "@/store/game-store";
import { useResourceFeedbackStore } from "@/store/resource-feedback-store";
import { applyPlayerXpGain, combat, type CharacterCombatLoadout, type EquippedCombatSkill } from "@idleking/game-core";
import { addQty, type ResourceId } from "@idleking/game-core/resources/types.js";
import {
  RESURRECTED_SCARECROW_BOSS,
  RESURRECTED_SCARECROW_COLUMNS,
  SCARECROW_DUEL_REWARDS,
  clamp,
  createDuelRng,
  createRainTarget,
  isCircleCollision,
  nextBasicDelayMs,
  nextSpecialDelayMs,
  pickNextSpecial,
  type DuelBossSpecialKind,
  type DuelColumnConfig,
  type DuelVector,
} from "./duel-boss-prototype";

const PLAYER_SIZE = 48;
const PLAYER_SPEED = 310;
const PLAYER_RADIUS = PLAYER_SIZE / 2;
const MELEE_ATTACK_COOLDOWN_MS = 280;
const MELEE_DURATION_MS = 120;
const MELEE_RANGE = 86;
const RANGED_ATTACK_COOLDOWN_MS = 450;
const PLAYER_PROJECTILE_MAX_RANGE = 620;
const PLAYER_PROJECTILE_SPEED = 620;
const MELEE_ATTACK_HALF_ANGLE_RADIANS = 0.72;
const SCARECROW_ASSET = "/assets/exploration/resurrected_scarecrow.png";

type ActiveMeleeAttack = {
  ageMs: number;
  direction: DuelVector;
  durationMs: number;
  graphic: PIXI.Graphics;
  hitBoss: boolean;
  position: DuelVector;
};

type PlayerProjectile = {
  direction: DuelVector;
  distanceTravelled: number;
  graphic: PIXI.Graphics;
  maxRange: number;
  position: DuelVector;
  radius: number;
  speed: number;
};

type BossProjectile = {
  damage: number;
  direction: DuelVector;
  graphic: PIXI.Graphics;
  position: DuelVector;
  radius: number;
  speed: number;
};

type RainImpact = {
  ageMs: number;
  damage: number;
  graphic: PIXI.Graphics;
  hasImpacted: boolean;
  position: DuelVector;
  radius: number;
  warningMs: number;
};

type ActiveSpecial =
  | {
      elapsedMs: number;
      kind: "columns";
      lanes: PIXI.Graphics[];
      nextShotMsByColumn: number[];
    }
  | {
      elapsedMs: number;
      kind: "rain";
      nextImpactMs: number;
      spawned: number;
    };

type ActiveMouseAction = "melee" | "ranged" | null;

type DuelArenaStageProps = {
  mapHeight: number;
  mapWidth: number;
};

type DuelHudState = {
  bossDefeated: boolean;
  bossHp: number;
  durationMs: number;
  rewardsApplied: boolean;
  outcome: "fighting" | "victory" | "defeat";
  playerHp: number;
};

type SkillId = combat.SkillId;
type SkillSlot = combat.SkillSlot;
type SkillCooldownState = combat.SkillCooldownState;
type ActiveDuelSkillEffect = combat.ActiveSkillEffect & {
  directionX?: number;
  directionY?: number;
  hitBoss?: boolean;
  lastDamageTickAtMs?: number;
  originX?: number;
  originY?: number;
  skillDef: combat.SkillDef;
};

type LocalSkillsState = {
  activeEffects: ActiveDuelSkillEffect[];
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

function normalizeVector(vector: DuelVector, fallback: DuelVector = { x: 0, y: -1 }): DuelVector {
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
  background.circle(center.x, center.y, 520).stroke({ color: 0xc9a654, alpha: 0.22, width: 2 });
  background.circle(center.x, center.y, 230).stroke({ color: 0xc9a654, alpha: 0.28, width: 2 });
  background.circle(center.x, center.y, 128).stroke({ color: 0x38bdf8, alpha: 0.22, width: 1 });
  background.moveTo(center.x - 420, center.y).lineTo(center.x + 420, center.y).stroke({ color: 0xc9a654, alpha: 0.18, width: 1 });
  background.moveTo(center.x, center.y - 420).lineTo(center.x, center.y + 420).stroke({ color: 0xc9a654, alpha: 0.18, width: 1 });

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

function drawBoss(texture: PIXI.Texture) {
  const container = new PIXI.Container();
  const shadow = new PIXI.Graphics();
  const aura = new PIXI.Graphics();
  const sprite = new PIXI.Sprite(texture);
  const displayHeight = 210;
  const scale = displayHeight / texture.height;

  shadow.ellipse(0, 64, 118, 34).fill({ color: 0x000000, alpha: 0.46 });
  aura.circle(0, 18, 118).fill({ color: 0x7f1d1d, alpha: 0.1 });
  aura.circle(0, 18, 76).stroke({ color: 0xf0c26a, alpha: 0.2, width: 3 });
  sprite.anchor.set(0.5, 0.78);
  sprite.scale.set(scale);

  container.addChild(shadow, aura, sprite);
  return { aura, container, sprite };
}

function drawPlayerProjectile(): PIXI.Graphics {
  const graphic = new PIXI.Graphics();
  graphic.circle(0, 0, 8).fill({ color: 0x7df7ff, alpha: 0.92 });
  graphic.circle(0, 0, 14).fill({ color: 0x62d8ff, alpha: 0.22 });
  return graphic;
}

function drawBossProjectile(color = 0xd95c36): PIXI.Graphics {
  const graphic = new PIXI.Graphics();
  graphic.circle(0, 0, 13).fill({ color, alpha: 0.96 });
  graphic.circle(0, 0, 22).stroke({ color: 0xffd58a, alpha: 0.34, width: 2 });
  return graphic;
}

function drawColumnLane(x: number, mapHeight: number): PIXI.Graphics {
  const lane = new PIXI.Graphics();
  lane.rect(-34, 0, 68, mapHeight).fill({ color: 0x7dd3fc, alpha: 0.055 });
  lane.rect(-34, 0, 68, mapHeight).stroke({ color: 0x7dd3fc, alpha: 0.18, width: 2 });
  lane.position.set(x, 0);
  return lane;
}

function isPointInsideMeleeCone({
  attackDirection,
  attackPosition,
  targetPosition,
  targetRadius,
}: {
  attackDirection: DuelVector;
  attackPosition: DuelVector;
  targetPosition: DuelVector;
  targetRadius: number;
}) {
  const toTarget = {
    x: targetPosition.x - attackPosition.x,
    y: targetPosition.y - attackPosition.y,
  };
  const distance = Math.hypot(toTarget.x, toTarget.y);
  if (distance > MELEE_RANGE + targetRadius) return false;
  const direction = normalizeVector(toTarget, attackDirection);
  const dot = clamp(attackDirection.x * direction.x + attackDirection.y * direction.y, -1, 1);
  return Math.acos(dot) <= MELEE_ATTACK_HALF_ANGLE_RADIANS;
}

function isBossInsideBeam({
  bossPosition,
  direction,
  origin,
  range,
  width,
}: {
  bossPosition: DuelVector;
  direction: DuelVector;
  origin: DuelVector;
  range: number;
  width: number;
}) {
  const toBoss = {
    x: bossPosition.x - origin.x,
    y: bossPosition.y - origin.y,
  };
  const forwardDistance = toBoss.x * direction.x + toBoss.y * direction.y;
  if (forwardDistance < -RESURRECTED_SCARECROW_BOSS.bossRadius || forwardDistance > range + RESURRECTED_SCARECROW_BOSS.bossRadius) {
    return false;
  }
  const perpendicularDistance = Math.abs(toBoss.x * -direction.y + toBoss.y * direction.x);
  return perpendicularDistance <= width / 2 + RESURRECTED_SCARECROW_BOSS.bossRadius;
}

function getActiveDamageMultiplier(effects: ActiveDuelSkillEffect[], nowMs: number) {
  return effects.reduce((multiplier, effect) => {
    if (effect.skillId !== "war_cry" || effect.endsAtMs < nowMs) return multiplier;
    return multiplier + (effect.bonusDamageMultiplier ?? effect.skillDef.bonusDamageMultiplier ?? 0);
  }, 1);
}

export function DuelArenaStage({ mapHeight, mapWidth }: DuelArenaStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const inputBlockedRef = useRef(false);
  const dispatch = useGameStore((store) => store.dispatch);
  const playerSkills = useGameStore((store) => store.state.skills);
  const showResourceGain = useResourceFeedbackStore((store) => store.showResourceGain);
  const { isOverlayOpen: isGameHudOverlayOpen } = useGameHudOverlay();
  const combatLoadout = useMemo(
    () => buildCombatLoadoutFromGameState({ ...useGameStore.getState().state, skills: playerSkills }),
    [playerSkills]
  );
  const playerMaxHp = Math.max(1, Math.ceil(combatLoadout.stats.hp));
  const [hudState, setHudState] = useState<DuelHudState>({
    bossDefeated: false,
    durationMs: 0,
    outcome: "fighting",
    bossHp: RESURRECTED_SCARECROW_BOSS.hp,
    rewardsApplied: false,
    playerHp: playerMaxHp,
  });
  const [skillsState, setSkillsState] = useState<LocalSkillsState>(() => ({
    activeEffects: [],
    combatLoadout,
    cooldowns: {},
    currentTimeMs: 0,
  }));
  const skillsStateRef = useRef(skillsState);

  useEffect(() => {
    const nextState = {
      activeEffects: skillsStateRef.current.activeEffects,
      combatLoadout,
      cooldowns: skillsStateRef.current.cooldowns,
      currentTimeMs: skillsStateRef.current.currentTimeMs,
    };
    skillsStateRef.current = nextState;
    setSkillsState(nextState);
  }, [combatLoadout]);

  useEffect(() => {
    skillsStateRef.current = skillsState;
  }, [skillsState]);

  useEffect(() => {
    inputBlockedRef.current = isGameHudOverlayOpen;
  }, [isGameHudOverlayOpen]);

  useEffect(() => {
    const nullableHostElement = hostRef.current;
    if (!nullableHostElement) return;
    const hostElement: HTMLDivElement = nullableHostElement;

    let cancelled = false;
    let destroyed = false;
    let initialized = false;
    const pressedKeys = new Set<string>();
    const app = new PIXI.Application();
    const world = new PIXI.Container();
    const backgroundLayer = new PIXI.Container();
    const warningLayer = new PIXI.Container();
    const bossProjectileLayer = new PIXI.Container();
    const attackLayer = new PIXI.Container();
    const entityLayer = new PIXI.Container();
    const fxLayer = new PIXI.Container();
    const player = drawPlayer();
    const bossPosition = {
      x: mapWidth / 2,
      y: Math.max(250, mapHeight * 0.24),
    };
    const playerPosition = {
      x: mapWidth / 2,
      y: mapHeight * 0.68,
    };
    const playerFacing: DuelVector = { x: 0, y: -1 };
    const mouseInput = {
      activeMouseAction: null as ActiveMouseAction,
      isMeleeHeld: false,
      isRangedHeld: false,
      pointerWorldPosition: { ...playerPosition },
    };
    const random = createDuelRng("epouvantail-ressuscite");
    const meleeAttacks: ActiveMeleeAttack[] = [];
    const playerProjectiles: PlayerProjectile[] = [];
    const bossProjectiles: BossProjectile[] = [];
    const rainImpacts: RainImpact[] = [];
    let activeSpecial: ActiveSpecial | null = null;
    let canvasElement: HTMLCanvasElement | null = null;
    let hasPointerWorldPosition = false;
    let lastMeleeAttackAt = -Infinity;
    let lastRangedAttackAt = -Infinity;
    let nextBasicShotAtMs = nextBasicDelayMs(random);
    let nextSpecialAtMs = nextSpecialDelayMs(random);
    let elapsedFightMs = 0;
    let lastSpecialKind: DuelBossSpecialKind | null = null;
    let bossHp: number = RESURRECTED_SCARECROW_BOSS.hp;
    let playerHp: number = playerMaxHp;
    let bossHitFlashMs = 0;
    let playerHitFlashMs = 0;
    let hudSyncElapsedMs = 0;
    let skillsHudSyncElapsedMs = 0;
    let activeSkillEffects: ActiveDuelSkillEffect[] = [...skillsStateRef.current.activeEffects];
    let skillCooldowns: SkillCooldownState = { ...skillsStateRef.current.cooldowns };
    let rewardsApplied = false;
    let tickerCallback: ((ticker: PIXI.Ticker) => void) | null = null;
    let bossVisual: ReturnType<typeof drawBoss> | null = null;

    function destroyPixiApp() {
      if (destroyed) return;
      destroyed = true;
      app.destroy(true, { children: true });
    }

    function syncHud(force = false) {
      if (cancelled) return;
      if (!force && hudSyncElapsedMs < 120) return;
      hudSyncElapsedMs = 0;
      setHudState({
        bossDefeated: bossHp <= 0,
        bossHp: Math.max(0, Math.ceil(bossHp)),
        durationMs: elapsedFightMs,
        outcome: bossHp <= 0 ? "victory" : playerHp <= 0 ? "defeat" : "fighting",
        playerHp: Math.max(0, Math.ceil(playerHp)),
        rewardsApplied,
      });
    }

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

    function applyRewardsOnce() {
      if (rewardsApplied) return;
      rewardsApplied = true;
      const result = applyPlayerXpGain(useGameStore.getState().state, SCARECROW_DUEL_REWARDS.playerXp);
      let nextResources = result.next.resources;
      for (const reward of SCARECROW_DUEL_REWARDS.resources) {
        nextResources = addQty(nextResources, reward.resourceId, reward.amount);
      }
      dispatch(() => ({
        ...result.next,
        resources: nextResources,
      }));
      showResourceGain(SCARECROW_DUEL_REWARDS.resources.map((reward) => ({ amount: reward.amount, resourceId: reward.resourceId })));
    }

    function damageBoss(amount: number) {
      if (bossHp <= 0) return;
      bossHp = Math.max(0, bossHp - amount);
      bossHitFlashMs = RESURRECTED_SCARECROW_BOSS.hitFlashMs;
      if (bossHp <= 0) {
        pressedKeys.clear();
        activeSpecial = null;
        cleanupBossProjectiles();
        cleanupRainImpacts();
        applyRewardsOnce();
      }
      syncHud(true);
    }

    function damagePlayer(amount: number) {
      if (playerHp <= 0 || bossHp <= 0) return;
      playerHp = Math.max(0, playerHp - amount);
      playerHitFlashMs = 180;
      if (playerHp <= 0) {
        pressedKeys.clear();
        resetHeldMouseButtons();
      }
      syncHud(true);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (inputBlockedRef.current) return;
      if (playerHp <= 0 || bossHp <= 0) return;
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

    function updatePlayerFacing(direction: DuelVector) {
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
        hitBoss: false,
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

      const projectile: PlayerProjectile = {
        direction,
        distanceTravelled: 0,
        graphic: drawPlayerProjectile(),
        maxRange: PLAYER_PROJECTILE_MAX_RANGE,
        position: {
          x: playerPosition.x + direction.x * 28,
          y: playerPosition.y + direction.y * 28,
        },
        radius: 8,
        speed: PLAYER_PROJECTILE_SPEED,
      };

      playerProjectiles.push(projectile);
      attackLayer.addChild(projectile.graphic);
      projectile.graphic.position.set(projectile.position.x, projectile.position.y);
    }

    function getPlayerDamage(multiplier = 1, nowMs = performance.now()) {
      return Math.max(1, Math.round(combatLoadout.stats.attack * multiplier * getActiveDamageMultiplier(activeSkillEffects, nowMs)));
    }

    function applyInstantSkillDamage(skillDef: combat.SkillDef, nowMs: number) {
      if (
        isPointInsideMeleeCone({
          attackDirection: { ...playerFacing },
          attackPosition: { ...playerPosition },
          targetPosition: bossPosition,
          targetRadius: RESURRECTED_SCARECROW_BOSS.bossRadius,
        })
      ) {
        damageBoss(getPlayerDamage(skillDef.damageMultiplier ?? 1, nowMs));
      }
    }

    function tryCastSkill(slot: SkillSlot, nowMs: number) {
      if (playerHp <= 0 || bossHp <= 0) return;
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
        const direction = normalizeVector(playerFacing);
        activeSkillEffects = [
          ...activeSkillEffects,
          {
            ...result.activeEffect,
            directionX: direction.x,
            directionY: direction.y,
            lastDamageTickAtMs: result.startedAtMs - (result.activeEffect.tickIntervalMs ?? 0),
            originX: playerPosition.x,
            originY: playerPosition.y,
            skillDef: equippedSkill.skillDef,
          },
        ];
      } else if (result.skillId === "royal_strike") {
        applyInstantSkillDamage(equippedSkill.skillDef, nowMs);
      }

      publishSkillsState(nowMs);
    }

    function createBossBasicProjectile() {
      if (bossHp <= 0) return;
      const direction = normalizeVector({
        x: playerPosition.x - bossPosition.x,
        y: playerPosition.y - bossPosition.y,
      });
      const projectile: BossProjectile = {
        damage: RESURRECTED_SCARECROW_BOSS.basicProjectileDamage,
        direction,
        graphic: drawBossProjectile(),
        position: { x: bossPosition.x, y: bossPosition.y + 44 },
        radius: RESURRECTED_SCARECROW_BOSS.basicProjectileRadius,
        speed: RESURRECTED_SCARECROW_BOSS.basicProjectileSpeed,
      };
      bossProjectiles.push(projectile);
      bossProjectileLayer.addChild(projectile.graphic);
      projectile.graphic.position.set(projectile.position.x, projectile.position.y);
    }

    function createColumnProjectile(column: DuelColumnConfig) {
      const projectile: BossProjectile = {
        damage: RESURRECTED_SCARECROW_BOSS.columnDamage,
        direction: { x: 0, y: 1 },
        graphic: drawBossProjectile(column.label === "fast" ? 0xef4444 : column.label === "medium" ? 0xf59e0b : 0x38bdf8),
        position: { x: mapWidth * column.xRatio, y: -30 },
        radius: RESURRECTED_SCARECROW_BOSS.columnProjectileRadius,
        speed: column.speed,
      };
      bossProjectiles.push(projectile);
      bossProjectileLayer.addChild(projectile.graphic);
      projectile.graphic.position.set(projectile.position.x, projectile.position.y);
    }

    function createRainImpact() {
      const target = createRainTarget(random, mapWidth, mapHeight);
      const graphic = new PIXI.Graphics();
      const impact: RainImpact = {
        ageMs: 0,
        damage: RESURRECTED_SCARECROW_BOSS.rainDamage,
        graphic,
        hasImpacted: false,
        position: target,
        radius: RESURRECTED_SCARECROW_BOSS.rainImpactRadius,
        warningMs: RESURRECTED_SCARECROW_BOSS.rainImpactWarningMs,
      };
      rainImpacts.push(impact);
      warningLayer.addChild(graphic);
      graphic.position.set(target.x, target.y);
    }

    function startSpecial(kind: DuelBossSpecialKind) {
      lastSpecialKind = kind;
      if (kind === "columns") {
        const lanes = RESURRECTED_SCARECROW_COLUMNS.map((column) => drawColumnLane(mapWidth * column.xRatio, mapHeight));
        for (const lane of lanes) warningLayer.addChild(lane);
        activeSpecial = {
          elapsedMs: 0,
          kind,
          lanes,
          nextShotMsByColumn: RESURRECTED_SCARECROW_COLUMNS.map((column) => RESURRECTED_SCARECROW_BOSS.specialWindupMs + column.delayMs),
        };
        return;
      }

      activeSpecial = {
        elapsedMs: 0,
        kind,
        nextImpactMs: RESURRECTED_SCARECROW_BOSS.specialWindupMs,
        spawned: 0,
      };
    }

    function handlePointerMove(event: PointerEvent) {
      if (playerHp <= 0 || bossHp <= 0) {
        resetHeldMouseButtons();
        return;
      }
      updatePointerWorldPosition(event);
      syncHeldMouseButtons(event.buttons);
    }

    function handlePointerDown(event: PointerEvent) {
      if (playerHp <= 0 || bossHp <= 0) return;
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

    function removeGraphic(graphic: PIXI.Graphics) {
      graphic.removeFromParent();
      graphic.destroy();
    }

    function removePlayerProjectileAt(index: number) {
      const projectile = playerProjectiles[index];
      removeGraphic(projectile.graphic);
      playerProjectiles.splice(index, 1);
    }

    function removeBossProjectileAt(index: number) {
      const projectile = bossProjectiles[index];
      removeGraphic(projectile.graphic);
      bossProjectiles.splice(index, 1);
    }

    function removeRainImpactAt(index: number) {
      const impact = rainImpacts[index];
      removeGraphic(impact.graphic);
      rainImpacts.splice(index, 1);
    }

    function cleanupActiveSpecial() {
      if (activeSpecial?.kind === "columns") {
        for (const lane of activeSpecial.lanes) removeGraphic(lane);
      }
      activeSpecial = null;
    }

    function cleanupBossProjectiles() {
      for (const projectile of bossProjectiles) {
        removeGraphic(projectile.graphic);
      }
      bossProjectiles.length = 0;
    }

    function cleanupRainImpacts() {
      for (const impact of rainImpacts) {
        removeGraphic(impact.graphic);
      }
      rainImpacts.length = 0;
    }

    function updatePlayerAttacks(deltaMs: number, now: number) {
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
        if (
          !attack.hitBoss &&
          isPointInsideMeleeCone({
            attackDirection: attack.direction,
            attackPosition: attack.position,
            targetPosition: bossPosition,
            targetRadius: RESURRECTED_SCARECROW_BOSS.bossRadius,
          })
        ) {
          attack.hitBoss = true;
          damageBoss(getPlayerDamage(RESURRECTED_SCARECROW_BOSS.meleeDamage / 10, now));
        }
        if (attack.ageMs >= attack.durationMs) {
          removeGraphic(attack.graphic);
          meleeAttacks.splice(index, 1);
        }
      }

      const deltaSeconds = deltaMs / 1000;
      for (let index = playerProjectiles.length - 1; index >= 0; index -= 1) {
        const projectile = playerProjectiles[index];
        const step = projectile.speed * deltaSeconds;
        projectile.position.x += projectile.direction.x * step;
        projectile.position.y += projectile.direction.y * step;
        projectile.distanceTravelled += step;

        const hitBoss = isCircleCollision(
          projectile.position,
          projectile.radius,
          bossPosition,
          RESURRECTED_SCARECROW_BOSS.bossRadius
        );
        const isOutOfBounds =
          projectile.position.x < 0 ||
          projectile.position.x > mapWidth ||
          projectile.position.y < 0 ||
          projectile.position.y > mapHeight;

        if (hitBoss) {
          damageBoss(getPlayerDamage(RESURRECTED_SCARECROW_BOSS.rangedDamage / 10, now));
          removePlayerProjectileAt(index);
        } else if (projectile.distanceTravelled >= projectile.maxRange || isOutOfBounds) {
          removePlayerProjectileAt(index);
        }
      }
    }

    function updateBossAi(deltaMs: number) {
      if (bossHp <= 0 || playerHp <= 0) return;
      elapsedFightMs += deltaMs;

      if (elapsedFightMs >= nextBasicShotAtMs) {
        createBossBasicProjectile();
        nextBasicShotAtMs = elapsedFightMs + nextBasicDelayMs(random);
      }

      if (!activeSpecial && elapsedFightMs >= nextSpecialAtMs) {
        startSpecial(pickNextSpecial(lastSpecialKind, random));
      }

      if (!activeSpecial) return;
      activeSpecial.elapsedMs += deltaMs;

      if (activeSpecial.kind === "columns") {
        for (let index = 0; index < RESURRECTED_SCARECROW_COLUMNS.length; index += 1) {
          const column = RESURRECTED_SCARECROW_COLUMNS[index];
          while (activeSpecial.elapsedMs >= activeSpecial.nextShotMsByColumn[index]) {
            createColumnProjectile(column);
            activeSpecial.nextShotMsByColumn[index] += column.intervalMs;
          }
        }

        if (activeSpecial.elapsedMs >= RESURRECTED_SCARECROW_BOSS.specialWindupMs + RESURRECTED_SCARECROW_BOSS.columnDurationMs) {
          cleanupActiveSpecial();
          nextSpecialAtMs = elapsedFightMs + nextSpecialDelayMs(random);
        }
        return;
      }

      while (
        activeSpecial.spawned < RESURRECTED_SCARECROW_BOSS.rainPatternCount &&
        activeSpecial.elapsedMs >= activeSpecial.nextImpactMs
      ) {
        createRainImpact();
        activeSpecial.spawned += 1;
        activeSpecial.nextImpactMs += RESURRECTED_SCARECROW_BOSS.rainIntervalMs;
      }

      const rainDuration =
        RESURRECTED_SCARECROW_BOSS.specialWindupMs +
        RESURRECTED_SCARECROW_BOSS.rainIntervalMs * RESURRECTED_SCARECROW_BOSS.rainPatternCount +
        RESURRECTED_SCARECROW_BOSS.rainImpactWarningMs +
        320;
      if (activeSpecial.elapsedMs >= rainDuration) {
        activeSpecial = null;
        nextSpecialAtMs = elapsedFightMs + nextSpecialDelayMs(random);
      }
    }

    function updateBossProjectiles(deltaMs: number) {
      const deltaSeconds = deltaMs / 1000;
      for (let index = bossProjectiles.length - 1; index >= 0; index -= 1) {
        const projectile = bossProjectiles[index];
        projectile.position.x += projectile.direction.x * projectile.speed * deltaSeconds;
        projectile.position.y += projectile.direction.y * projectile.speed * deltaSeconds;

        const hitPlayer = isCircleCollision(projectile.position, projectile.radius, playerPosition, PLAYER_RADIUS);
        const isOutOfBounds =
          projectile.position.x < -80 ||
          projectile.position.x > mapWidth + 80 ||
          projectile.position.y < -80 ||
          projectile.position.y > mapHeight + 80;

        if (hitPlayer) {
          damagePlayer(projectile.damage);
          removeBossProjectileAt(index);
        } else if (isOutOfBounds) {
          removeBossProjectileAt(index);
        }
      }
    }

    function updateActiveSkillEffects(nowMs: number) {
      removeExpiredSkillEffects(nowMs);
      let didMutateEffects = false;

      for (const effect of activeSkillEffects) {
        if (effect.skillId === "war_cry") continue;
        const interval = effect.tickIntervalMs ?? effect.skillDef.tickIntervalMs ?? 0;
        if (interval <= 0) continue;
        if (nowMs - (effect.lastDamageTickAtMs ?? effect.startedAtMs) < interval) continue;

        let isHit = false;
        if (effect.skillId === "royal_beam") {
          const direction = normalizeVector({
            x: effect.directionX ?? playerFacing.x,
            y: effect.directionY ?? playerFacing.y,
          });
          isHit = isBossInsideBeam({
            bossPosition,
            direction,
            origin: {
              x: effect.originX ?? playerPosition.x,
              y: effect.originY ?? playerPosition.y,
            },
            range: effect.range ?? effect.skillDef.range ?? 0,
            width: effect.width ?? effect.skillDef.width ?? 0,
          });
        } else if (effect.skillId === "king_aura") {
          isHit = isCircleCollision(
            playerPosition,
            effect.radius ?? effect.skillDef.radius ?? 0,
            bossPosition,
            RESURRECTED_SCARECROW_BOSS.bossRadius
          );
        }

        effect.lastDamageTickAtMs = nowMs;
        didMutateEffects = true;
        if (isHit) {
          damageBoss(getPlayerDamage(effect.damageMultiplier ?? effect.skillDef.damageMultiplier ?? 1, nowMs));
        }
      }

      if (didMutateEffects) {
        publishSkillsState(nowMs);
      }
    }

    function updateRainImpacts(deltaMs: number) {
      for (let index = rainImpacts.length - 1; index >= 0; index -= 1) {
        const impact = rainImpacts[index];
        impact.ageMs += deltaMs;
        if (!impact.hasImpacted && impact.ageMs >= impact.warningMs) {
          impact.hasImpacted = true;
          if (isCircleCollision(impact.position, impact.radius, playerPosition, PLAYER_RADIUS)) {
            damagePlayer(impact.damage);
          }
        }

        if (impact.ageMs >= impact.warningMs + 230) {
          removeRainImpactAt(index);
        }
      }
    }

    function renderPlayerAttacks() {
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

      for (const projectile of playerProjectiles) {
        projectile.graphic.position.set(projectile.position.x, projectile.position.y);
      }
    }

    function renderBossProjectiles() {
      for (const projectile of bossProjectiles) {
        projectile.graphic.position.set(projectile.position.x, projectile.position.y);
      }
    }

    function renderRainImpacts() {
      for (const impact of rainImpacts) {
        impact.graphic.clear();
        if (!impact.hasImpacted) {
          const progress = clamp(impact.ageMs / impact.warningMs, 0, 1);
          const radius = impact.radius * (0.28 + progress * 0.72);
          impact.graphic.circle(0, 0, radius).fill({ color: 0xf97316, alpha: 0.12 + progress * 0.18 });
          impact.graphic.circle(0, 0, radius).stroke({ color: 0xffd58a, alpha: 0.38 + progress * 0.34, width: 3 });
        } else {
          const progress = clamp((impact.ageMs - impact.warningMs) / 230, 0, 1);
          impact.graphic.circle(0, 0, impact.radius * (1 + progress * 0.18)).fill({ color: 0xffd58a, alpha: 0.34 * (1 - progress) });
          impact.graphic.circle(0, 0, impact.radius * 0.58).fill({ color: 0xef4444, alpha: 0.26 * (1 - progress) });
        }
      }
    }

    function renderBoss(deltaMs: number) {
      if (!bossVisual) return;
      bossHitFlashMs = Math.max(0, bossHitFlashMs - deltaMs);
      const flash = bossHitFlashMs > 0;
      bossVisual.sprite.tint = flash ? 0xfff1b8 : 0xffffff;
      bossVisual.sprite.x = flash ? Math.sin(bossHitFlashMs * 0.45) * 3 : 0;
      bossVisual.aura.alpha = bossHp <= 0 ? 0.04 : 0.9;
      bossVisual.container.alpha = bossHp <= 0 ? 0.42 : 1;
    }

    function renderPlayer(deltaMs: number) {
      playerHitFlashMs = Math.max(0, playerHitFlashMs - deltaMs);
      player.tint = playerHitFlashMs > 0 ? 0xff7272 : 0xffffff;
      player.rotation = Math.atan2(playerFacing.y, playerFacing.x) + Math.PI / 2;
    }

    function cleanupPlayerAttacks() {
      for (const attack of meleeAttacks) {
        removeGraphic(attack.graphic);
      }
      meleeAttacks.length = 0;

      for (const projectile of playerProjectiles) {
        removeGraphic(projectile.graphic);
      }
      playerProjectiles.length = 0;
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
        destroyPixiApp();
        return;
      }

      const bossTexture = await PIXI.Assets.load(SCARECROW_ASSET);
      if (cancelled) {
        destroyPixiApp();
        return;
      }

      bossVisual = drawBoss(bossTexture);
      canvasElement = app.canvas;
      hostElement.appendChild(canvasElement);
      canvasElement.addEventListener("contextmenu", handleContextMenu);
      canvasElement.addEventListener("pointerdown", handlePointerDown);
      canvasElement.addEventListener("pointerup", handlePointerUp);
      canvasElement.addEventListener("pointercancel", handlePointerCancel);
      canvasElement.addEventListener("pointerleave", handlePointerLeave);
      canvasElement.addEventListener("pointermove", handlePointerMove);

      app.stage.addChild(world);
      world.addChild(backgroundLayer, warningLayer, bossProjectileLayer, attackLayer, entityLayer, fxLayer);
      drawArenaWorld(backgroundLayer, mapWidth, mapHeight);
      entityLayer.addChild(bossVisual.container, player);
      bossVisual.container.position.set(bossPosition.x, bossPosition.y);
      player.position.set(playerPosition.x, playerPosition.y);

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      window.addEventListener("blur", handleWindowBlur);
      window.addEventListener("mouseup", handleWindowMouseUp);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerCancel);

      tickerCallback = (ticker: PIXI.Ticker) => {
        const deltaMs = Math.min(ticker.deltaMS, 50);
        const deltaSeconds = deltaMs / 1000;
        const now = performance.now();
        let directionX = 0;
        let directionY = 0;

        if (inputBlockedRef.current) {
          hudSyncElapsedMs += deltaMs;
          syncHud();
          return;
        }

        if (playerHp > 0 && bossHp > 0) {
          for (const key of pressedKeys) {
            const direction = KEY_DIRECTIONS[key];
            if (!direction) continue;
            directionX += direction.x;
            directionY += direction.y;
          }
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

        updatePlayerAttacks(deltaMs, now);
        updateActiveSkillEffects(now);
        updateBossAi(deltaMs);
        updateBossProjectiles(deltaMs);
        updateRainImpacts(deltaMs);
        renderPlayerAttacks();
        renderBossProjectiles();
        renderRainImpacts();
        renderBoss(deltaMs);
        renderPlayer(deltaMs);

        const screenWidth = app.renderer.width / app.renderer.resolution;
        const screenHeight = app.renderer.height / app.renderer.resolution;
        const cameraX = clamp(playerPosition.x - screenWidth / 2, 0, Math.max(0, mapWidth - screenWidth));
        const cameraY = clamp(playerPosition.y - screenHeight / 2, 0, Math.max(0, mapHeight - screenHeight));
        world.position.set(-cameraX, -cameraY);

        hudSyncElapsedMs += deltaMs;
        skillsHudSyncElapsedMs += deltaMs;
        if (skillsHudSyncElapsedMs >= 90) {
          skillsHudSyncElapsedMs = 0;
          publishSkillsState(now);
        }
        syncHud();
      };
      app.ticker.add(tickerCallback);
      syncHud(true);
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
      if (tickerCallback) app.ticker?.remove?.(tickerCallback);
      cleanupActiveSpecial();
      cleanupPlayerAttacks();
      cleanupBossProjectiles();
      cleanupRainImpacts();
      if (initialized) destroyPixiApp();
    };
  }, [combatLoadout, dispatch, mapHeight, mapWidth, playerMaxHp, showResourceGain]);

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="h-full w-full" />
      <CombatHud
        bossHealth={{ current: hudState.bossHp, max: RESURRECTED_SCARECROW_BOSS.hp }}
        bossLabel="Epouvantail Ressuscite"
        mode="duel"
        playerEnergy={{ current: 100, max: 100 }}
        playerHealth={{ current: hudState.playerHp, max: playerMaxHp }}
        skillBar={{
          combatLoadout: skillsState.combatLoadout,
          cooldowns: skillsState.cooldowns,
          currentTimeMs: skillsState.currentTimeMs,
        }}
        subtitle="Boss d'entrainement"
        title="Epouvantail Ressuscite"
      />

      {hudState.outcome === "victory" ? (
        <DuelVictoryScreen durationMs={hudState.durationMs} playerHp={hudState.playerHp} playerMaxHp={playerMaxHp} />
      ) : null}
      {hudState.outcome === "defeat" ? <DuelDefeatScreen /> : null}
    </div>
  );
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function DuelVictoryScreen({
  durationMs,
  playerHp,
  playerMaxHp,
}: {
  durationMs: number;
  playerHp: number;
  playerMaxHp: number;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-black/58 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-amber-200/35 bg-zinc-950/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
        <p className="font-ik-menu text-xs uppercase tracking-[0.22em] text-emerald-200">Duel termine</p>
        <h2 className="mt-2 font-ik-title text-3xl font-semibold text-amber-50">Victoire</h2>
        <p className="mt-2 font-ik-body text-sm text-muted-foreground">Boss vaincu : Epouvantail Ressuscite</p>

        <div className="mt-5 grid gap-3 rounded-lg border border-amber-200/18 bg-black/35 p-4 text-left font-ik-body text-sm text-amber-50">
          <div className="flex items-center justify-between gap-3">
            <span>Duree</span>
            <span className="font-ik-menu text-amber-100">{formatDuration(durationMs)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>HP restant</span>
            <span className="font-ik-menu text-amber-100">
              {Math.max(0, Math.ceil(playerHp))}/{playerMaxHp}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Player XP</span>
            <span className="font-ik-menu text-emerald-200">+{SCARECROW_DUEL_REWARDS.playerXp}</span>
          </div>
          <div className="grid gap-2">
            {SCARECROW_DUEL_REWARDS.resources.map((reward) => (
              <div className="flex items-center justify-between gap-3" key={reward.resourceId}>
                <span className="flex items-center gap-2">
                  <img
                    alt=""
                    aria-hidden="true"
                    className="h-5 w-5 object-contain"
                    src={getResourceAssetPath(reward.resourceId)}
                  />
                  {reward.resourceId}
                </span>
                <span className="font-ik-menu text-emerald-200">+{reward.amount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            className="inline-flex items-center justify-center rounded-md border border-amber-200/45 bg-amber-500/18 px-4 py-3 font-ik-menu text-sm text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/24"
            href="/game/kingdom"
          >
            Retour au Royaume
          </Link>
          <button
            className="inline-flex items-center justify-center rounded-md border border-cyan-200/35 bg-cyan-500/12 px-4 py-3 font-ik-menu text-sm text-cyan-50 transition hover:border-cyan-100 hover:bg-cyan-500/18"
            onClick={() => window.location.reload()}
            type="button"
          >
            Recommencer
          </button>
        </div>
      </div>
    </div>
  );
}

function DuelDefeatScreen() {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-black/62 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-red-200/35 bg-zinc-950/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
        <p className="font-ik-menu text-xs uppercase tracking-[0.22em] text-red-200">Defaite</p>
        <h2 className="mt-2 font-ik-title text-3xl font-semibold text-amber-50">Combat perdu</h2>
        <p className="mt-3 font-ik-body text-sm text-muted-foreground">Aucune recompense n'a ete appliquee.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            className="inline-flex items-center justify-center rounded-md border border-amber-200/45 bg-amber-500/18 px-4 py-3 font-ik-menu text-sm text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/24"
            href="/game/kingdom"
          >
            Retour au Royaume
          </Link>
          <button
            className="inline-flex items-center justify-center rounded-md border border-cyan-200/35 bg-cyan-500/12 px-4 py-3 font-ik-menu text-sm text-cyan-50 transition hover:border-cyan-100 hover:bg-cyan-500/18"
            onClick={() => window.location.reload()}
            type="button"
          >
            Recommencer
          </button>
        </div>
      </div>
    </div>
  );
}
