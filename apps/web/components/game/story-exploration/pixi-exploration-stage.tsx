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
  PLAYER_MAX_HP,
  RANGED_DAMAGE_MULTIPLIER,
  calculatePlayerDamageFromStats,
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
const ENEMY_ATTACK_ANIM_MS = 200;
const ENEMY_DEATH_FADE_MS = 260;
const LOOT_POPUP_DURATION_MS = 900;
const SPARKLE_BURST_DURATION_MS = 520;
const POI_HIGHLIGHT_RADIUS = 96;
const IS_SKILL_HIT_DEBUG_ENABLED = process.env.NODE_ENV !== "production";
const SKILL_DEBUG_EVENT = "idleking:spawn-skill-debug-enemies";

const EXPLORATION_ASSETS = {
  chest: "/assets/exploration/golden_chest.png",
  crackedFloor: "/assets/exploration/cracked_stone_floor_tile.png",
  enemy: "/assets/exploration/resurrected_scarecrow.png",
  floor: "/assets/exploration/dark_stone_floor_tile.png",
  glow: "/assets/exploration/subtle_magic_glow.png",
  player: "/assets/exploration/player_king.png",
  rune: "/assets/exploration/ancient_rune.png",
  shrine: "/assets/exploration/healing_shrine.png",
  sparkle: "/assets/exploration/small_gold_sparkle.png",
} as const;

type ExplorationAssetKey = keyof typeof EXPLORATION_ASSETS;
type ExplorationTextures = Record<ExplorationAssetKey, PIXI.Texture>;

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

type ActiveSparkleParticle = {
  lifeOffset: number;
  sprite: PIXI.Sprite;
  velocity: Vector2;
};

type ActiveSparkleBurst = {
  ageMs: number;
  container: PIXI.Container;
  durationMs: number;
  particles: ActiveSparkleParticle[];
  position: Vector2;
};

type ActiveMouseAction = "melee" | "ranged" | null;

type ActiveEnemy = StoryLevelEnemy & {
  attackAnimMs: number;
  attackLungeX: number;
  attackLungeY: number;
  baseScale: number;
  body: PIXI.Sprite;
  container: PIXI.Container;
  debugScenario?: boolean;
  deathFadeMs: number;
  hitFlashMs: number;
  hpBar: PIXI.Graphics;
  shadow: PIXI.Graphics;
};

type PoiKind = "chest" | "rune" | "shrine";

type PoiVisual = {
  baseScale: number;
  container: PIXI.Container;
  glow: PIXI.Sprite;
  hint: PIXI.Text;
  id: string;
  kind: PoiKind;
  point: ExplorationStagePoi;
  pulseOffset: number;
  sprite: PIXI.Sprite;
  wasNear: boolean;
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

function createShadow(width: number, height: number, alpha = 0.42): PIXI.Graphics {
  const shadow = new PIXI.Graphics();
  shadow.ellipse(0, 0, width, height).fill({ color: 0x020307, alpha });
  return shadow;
}

function setSpriteDisplayHeight(sprite: PIXI.Sprite, height: number): number {
  const textureHeight = Math.max(sprite.texture.height, 1);
  const scale = height / textureHeight;
  sprite.scale.set(scale);
  return scale;
}

function createFloatingText({
  color,
  label,
  layer,
  position,
}: {
  color: number;
  label: string;
  layer: PIXI.Container;
  position: Vector2;
}): ActiveLootPopup {
  const container = new PIXI.Container();
  const text = new PIXI.Text({
    text: label,
    style: {
      fill: color,
      fontFamily: "Arial",
      fontSize: 17,
      fontWeight: "700",
      stroke: { color: 0x100805, width: 4 },
    },
  });
  text.anchor.set(0.5, 0.5);
  container.addChild(text);
  container.position.set(position.x, position.y);
  layer.addChild(container);

  return {
    ageMs: 0,
    container,
    durationMs: LOOT_POPUP_DURATION_MS,
    position: { ...position },
  };
}

function createSparkleBurst({
  layer,
  position,
  texture,
}: {
  layer: PIXI.Container;
  position: Vector2;
  texture: PIXI.Texture;
}): ActiveSparkleBurst {
  const container = new PIXI.Container();
  const particles: ActiveSparkleParticle[] = [];
  const particleCount = 8;

  for (let index = 0; index < particleCount; index += 1) {
    const sprite = new PIXI.Sprite(texture);
    const angle = (Math.PI * 2 * index) / particleCount + (index % 2) * 0.22;
    const speed = 48 + (index % 3) * 18;
    sprite.anchor.set(0.5);
    sprite.scale.set(0.08 + (index % 2) * 0.025);
    sprite.alpha = 0.92;
    sprite.roundPixels = true;
    container.addChild(sprite);
    particles.push({
      lifeOffset: index * 18,
      sprite,
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed - 24,
      },
    });
  }

  container.position.set(position.x, position.y);
  layer.addChild(container);

  return {
    ageMs: 0,
    container,
    durationMs: SPARKLE_BURST_DURATION_MS,
    particles,
    position: { ...position },
  };
}

function createVignette(width: number, height: number): PIXI.Graphics {
  const vignette = new PIXI.Graphics();
  vignette.rect(0, 0, width, height).stroke({ color: 0x010104, alpha: 0.55, width: 64 });
  vignette.rect(18, 18, Math.max(0, width - 36), Math.max(0, height - 36)).stroke({
    color: 0x090219,
    alpha: 0.22,
    width: 34,
  });
  return vignette;
}

function getPoiKind(point: ExplorationStagePoi): PoiKind {
  if (point.color === 0x8a5cff) return "rune";
  if (point.color === 0x2fd8c8) return "shrine";
  return "chest";
}

function createPoiSprite(point: ExplorationStagePoi, textures: ExplorationTextures): PoiVisual {
  const kind = getPoiKind(point);
  const container = new PIXI.Container();
  const glow = new PIXI.Sprite(textures.glow);
  const sprite = new PIXI.Sprite(textures[kind]);
  const hint = new PIXI.Text({
    text: "Nearby",
    style: {
      fill: 0xfff1b8,
      fontFamily: "Arial",
      fontSize: 14,
      fontWeight: "700",
      stroke: { color: 0x120c07, width: 4 },
    },
  });

  glow.anchor.set(0.5);
  glow.alpha = kind === "chest" ? 0.24 : 0.34;
  setSpriteDisplayHeight(glow, kind === "chest" ? 86 : 104);
  glow.tint = kind === "shrine" ? 0x7dffad : kind === "rune" ? 0x86a0ff : 0xffd36a;

  sprite.anchor.set(0.5, 0.76);
  sprite.roundPixels = true;
  const baseScale = setSpriteDisplayHeight(sprite, kind === "chest" ? 62 : 76);
  sprite.tint = kind === "shrine" ? 0xa4ffd0 : kind === "rune" ? 0xc5c7ff : 0xffffff;

  hint.anchor.set(0.5, 0.5);
  hint.position.set(0, -72);
  hint.alpha = 0;
  hint.visible = false;

  container.addChild(glow);
  container.addChild(sprite);
  container.addChild(hint);
  container.position.set(point.x, point.y);

  return {
    baseScale,
    container,
    glow,
    hint,
    id: point.id,
    kind,
    point,
    pulseOffset: point.x * 0.017 + point.y * 0.011,
    sprite,
    wasNear: false,
  };
}

function drawWorld({
  backgroundLayer,
  mapHeight,
  mapWidth,
  pointsOfInterest,
  textures,
  worldLayer,
}: {
  backgroundLayer: PIXI.Container;
  mapHeight: number;
  mapWidth: number;
  pointsOfInterest: ExplorationStagePoi[];
  textures: ExplorationTextures;
  worldLayer: PIXI.Container;
}): PoiVisual[] {
  const fallback = new PIXI.Graphics();
  fallback.rect(0, 0, mapWidth, mapHeight).fill(0x050711);
  backgroundLayer.addChild(fallback);

  const tileScale = 96 / Math.max(textures.floor.width, 1);
  const floor = new PIXI.TilingSprite({
    height: mapHeight,
    roundPixels: true,
    texture: textures.floor,
    tileScale: { x: tileScale, y: tileScale },
    width: mapWidth,
  });
  floor.alpha = 0.92;
  backgroundLayer.addChild(floor);

  const haze = new PIXI.Graphics();
  haze.rect(0, 0, mapWidth, mapHeight).fill({ color: 0x120728, alpha: 0.2 });
  backgroundLayer.addChild(haze);

  const crackScale = 92 / Math.max(textures.crackedFloor.height, 1);
  for (let index = 0; index < 34; index += 1) {
    const crack = new PIXI.Sprite(textures.crackedFloor);
    crack.anchor.set(0.5);
    crack.scale.set(crackScale * (index % 3 === 0 ? 1.18 : 1));
    crack.alpha = 0.16 + (index % 4) * 0.035;
    crack.rotation = ((index * 37) % 4) * (Math.PI / 2);
    crack.position.set((index * 397) % mapWidth, (index * 251 + 140) % mapHeight);
    backgroundLayer.addChild(crack);
  }

  const poiVisuals = pointsOfInterest.map((point) => createPoiSprite(point, textures));
  for (const visual of poiVisuals) {
    worldLayer.addChild(visual.container);
  }

  return poiVisuals;
}

function configurePlayerSprite(player: PIXI.Container, texture: PIXI.Texture) {
  player.removeChildren();
  const shadow = createShadow(22, 8, 0.5);
  shadow.position.set(0, 12);
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5, 0.82);
  sprite.roundPixels = true;
  const baseScale = setSpriteDisplayHeight(sprite, 68);
  player.addChild(shadow);
  player.addChild(sprite);
  return {
    baseScale,
    sprite,
  };
}

function createEnemyGraphics(enemy: StoryLevelEnemy, texture: PIXI.Texture): ActiveEnemy {
  const container = new PIXI.Container();
  const shadow = createShadow(enemy.radius * 0.95, enemy.radius * 0.34, 0.45);
  const body = new PIXI.Sprite(texture);
  const hpBar = new PIXI.Graphics();
  const baseScale = setSpriteDisplayHeight(body, enemy.radius * 3.2);

  body.anchor.set(0.5, 0.82);
  body.roundPixels = true;
  shadow.position.set(0, enemy.radius * 0.48);
  container.addChild(shadow);
  container.addChild(body);
  container.addChild(hpBar);
  container.position.set(enemy.position.x, enemy.position.y);

  return {
    ...enemy,
    attackAnimMs: 0,
    attackLungeX: 0,
    attackLungeY: 0,
    baseScale,
    body,
    container,
    debugScenario: false,
    deathFadeMs: 0,
    hitFlashMs: 0,
    hpBar,
    shadow,
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
  let lungeX = 0;
  let lungeY = 0;
  const isAttacking = enemy.attackAnimMs > 0;

  if (isAttacking) {
    const animProgress = enemy.attackAnimMs / ENEMY_ATTACK_ANIM_MS;
    const lungePower = Math.sin(animProgress * Math.PI);
    lungeX = enemy.attackLungeX * lungePower;
    lungeY = enemy.attackLungeY * lungePower;
  }

  enemy.container.position.set(enemy.position.x + lungeX, enemy.position.y + lungeY);
  enemy.container.zIndex = enemy.position.y;
  enemy.container.alpha = enemy.state === "dead" ? clamp(1 - enemy.deathFadeMs / ENEMY_DEATH_FADE_MS, 0, 1) : 1;

  const isChasing = enemy.state === "chasing";
  const hitProgress = clamp(enemy.hitFlashMs / ENEMY_HIT_FLASH_MS, 0, 1);
  const scale =
    enemy.hitFlashMs > 0 ? 1 + hitProgress * 0.16 : 1 + (isAttacking ? 0.14 : isChasing ? 0.03 : 0);
  enemy.body.scale.set(enemy.baseScale * scale);
  enemy.body.tint =
    enemy.hitFlashMs > 0 ? 0xffd0d0 : isAttacking ? 0xff7050 : isChasing ? 0xffb0a0 : 0xffffff;
  enemy.shadow.alpha = enemy.state === "dead" ? 0.16 : 0.45;

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
    if (process.env.NODE_ENV === "production") return;
    console.debug("[IdleKing] Story combat loadout", {
      attack: combatLoadout.stats.attack,
      power: combatLoadout.stats.power,
      skills: combatLoadout.skills.map((skill) => skill.skillId),
    });
  }, [combatLoadout]);

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
    let destroyed = false;
    let initialized = false;
    const pressedKeys = new Set<string>();
    const app = new PIXI.Application();
    const world = new PIXI.Container();
    const backgroundLayer = new PIXI.Container();
    const worldLayer = new PIXI.Container();
    const entityLayer = new PIXI.Container();
    const fxLayer = new PIXI.Container();
    const uiLayer = new PIXI.Container();
    const enemyLayer = new PIXI.Container();
    const attackLayer = new PIXI.Container();
    const lootPopupLayer = new PIXI.Container();
    const player = new PIXI.Container();
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
    const sparkleBursts: ActiveSparkleBurst[] = [];
    const enemies: ActiveEnemy[] = [];
    const poiVisuals: PoiVisual[] = [];
    let activeSkillEffects: VisualActiveSkillEffect[] = [...skillsStateRef.current.activeEffects];
    let skillCooldowns: SkillCooldownState = { ...skillsStateRef.current.cooldowns };
    let playerSprite: PIXI.Sprite | null = null;
    let playerBaseScale = 1;
    let enemyTexture: PIXI.Texture | null = null;
    let sparkleTexture: PIXI.Texture | null = null;
    let canvasElement: HTMLCanvasElement | null = null;
    let combatHudElapsed = 0;
    let hudElapsed = 0;
    let lastUiHeight = 0;
    let lastUiWidth = 0;
    let skillsHudElapsed = 0;
    let hasPointerWorldPosition = false;
    let isPlayerDefeated = false;
    let lastMeleeAttackAt = -Infinity;
    let lastRangedAttackAt = -Infinity;
    let playerHp = PLAYER_MAX_HP;

    function destroyPixiApp() {
      if (!initialized || destroyed) return;
      destroyed = true;
      app.destroy(true);
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
        const enemy = createEnemyGraphics(enemyDef, enemyTexture ?? PIXI.Texture.EMPTY);
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
      lootPopups.push(
        createFloatingText({
          color: getLootPopupColor(loot.resourceId),
          label: `+${loot.amount} ${getLootPopupLabel(loot.resourceId)}`,
          layer: lootPopupLayer,
          position: { x: position.x + 8, y: position.y - 54 },
        })
      );

      if (sparkleTexture) {
        sparkleBursts.push(
          createSparkleBurst({
            layer: fxLayer,
            position: { x: position.x, y: position.y - 24 },
            texture: sparkleTexture,
          })
        );
      }
    }

    function spawnPoiDiscoveryFeedback(visual: PoiVisual) {
      lootPopups.push(
        createFloatingText({
          color: visual.kind === "chest" ? 0xffe08a : visual.kind === "shrine" ? 0x8dffbd : 0xaeb4ff,
          label: "Discovered",
          layer: lootPopupLayer,
          position: { x: visual.point.x, y: visual.point.y - 74 },
        })
      );

      if (sparkleTexture) {
        sparkleBursts.push(
          createSparkleBurst({
            layer: fxLayer,
            position: { x: visual.point.x, y: visual.point.y - 18 },
            texture: sparkleTexture,
          })
        );
      }
    }

    function updatePoiVisuals(nowMs: number) {
      for (const visual of poiVisuals) {
        const distance = Math.hypot(playerPosition.x - visual.point.x, playerPosition.y - visual.point.y);
        const isNear = distance <= POI_HIGHLIGHT_RADIUS;
        const pulse = 1 + Math.sin(nowMs / 520 + visual.pulseOffset) * 0.035;
        const targetScale = visual.baseScale * pulse * (isNear ? 1.13 : 1);
        visual.sprite.scale.set(targetScale);
        visual.glow.alpha = (visual.kind === "chest" ? 0.22 : 0.32) + (isNear ? 0.3 : 0);
        visual.glow.scale.set(1 + Math.sin(nowMs / 650 + visual.pulseOffset) * 0.04 + (isNear ? 0.08 : 0));
        visual.hint.visible = isNear;
        visual.hint.alpha = isNear ? 0.72 + Math.sin(nowMs / 180) * 0.12 : 0;

        if (isNear && !visual.wasNear) {
          spawnPoiDiscoveryFeedback(visual);
        }
        visual.wasNear = isNear;
      }
    }

    function updateSparkleBursts(deltaMs: number) {
      for (let index = sparkleBursts.length - 1; index >= 0; index -= 1) {
        const burst = sparkleBursts[index];
        burst.ageMs += deltaMs;
        const burstProgress = clamp(burst.ageMs / burst.durationMs, 0, 1);
        burst.container.alpha = 1 - burstProgress;

        for (const particle of burst.particles) {
          const age = Math.max(0, burst.ageMs - particle.lifeOffset);
          const progress = clamp(age / Math.max(1, burst.durationMs - particle.lifeOffset), 0, 1);
          particle.sprite.position.set(particle.velocity.x * progress * 0.55, particle.velocity.y * progress * 0.55);
          particle.sprite.rotation += deltaMs * 0.003;
          particle.sprite.scale.set((0.08 + progress * 0.035) * (1 - progress * 0.35));
          particle.sprite.alpha = 1 - progress;
        }

        if (burst.ageMs < burst.durationMs) continue;
        burst.container.removeFromParent();
        burst.container.destroy({ children: true });
        sparkleBursts.splice(index, 1);
      }
    }

    function renderPlayer(nowMs: number) {
      player.position.set(playerPosition.x, playerPosition.y);
      player.rotation = Math.atan2(playerFacing.y, playerFacing.x) + Math.PI / 2;
      player.zIndex = playerPosition.y;

      if (!playerSprite) return;
      const breath = 1 + Math.sin(nowMs / 380) * 0.026;
      playerSprite.scale.set(playerBaseScale * breath, playerBaseScale * (1 / breath));
    }

    function resizeUiLayer() {
      uiLayer.removeChildren().forEach((child) => child.destroy({ children: true }));
      const screenWidth = app.renderer.width / app.renderer.resolution;
      const screenHeight = app.renderer.height / app.renderer.resolution;
      uiLayer.addChild(createVignette(screenWidth, screenHeight));
    }

    function getTextures(): ExplorationTextures {
      return {
        chest: PIXI.Texture.from(EXPLORATION_ASSETS.chest),
        crackedFloor: PIXI.Texture.from(EXPLORATION_ASSETS.crackedFloor),
        enemy: PIXI.Texture.from(EXPLORATION_ASSETS.enemy),
        floor: PIXI.Texture.from(EXPLORATION_ASSETS.floor),
        glow: PIXI.Texture.from(EXPLORATION_ASSETS.glow),
        player: PIXI.Texture.from(EXPLORATION_ASSETS.player),
        rune: PIXI.Texture.from(EXPLORATION_ASSETS.rune),
        shrine: PIXI.Texture.from(EXPLORATION_ASSETS.shrine),
        sparkle: PIXI.Texture.from(EXPLORATION_ASSETS.sparkle),
      };
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

      return calculatePlayerDamageFromStats({
        buffMultiplier: getPlayerDamageMultiplier(activeSkillEffects, nowMs),
        damageMultiplier,
        stats: combatLoadout.stats,
      });
    }

    function computePlayerAttackDamage(nowMs: number, rangedMultiplier = 1): number {
      return calculatePlayerDamageFromStats({
        buffMultiplier: getPlayerDamageMultiplier(activeSkillEffects, nowMs),
        rangedMultiplier,
        stats: combatLoadout.stats,
      });
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
        damageActiveEnemy(enemy, computePlayerAttackDamage(performance.now()));
      }
    }

    function applyProjectileHits(projectile: ActiveProjectile): boolean {
      for (const enemy of enemies) {
        if (!isEnemyAlive(enemy)) continue;
        if (!isCircleIntersectingCircle(projectile.position, 8, enemy.position, enemy.radius)) continue;

        damageActiveEnemy(enemy, computePlayerAttackDamage(performance.now(), RANGED_DAMAGE_MULTIPLIER));
        return true;
      }

      return false;
    }

    function damagePlayerFromEnemy(enemy: ActiveEnemy, now: number) {
      if (now - enemy.lastContactDamageAt < enemy.attackCooldownMs) return;

      enemy.lastContactDamageAt = now;

      // Trigger attack animation
      enemy.attackAnimMs = ENEMY_ATTACK_ANIM_MS;
      const dx = playerPosition.x - enemy.position.x;
      const dy = playerPosition.y - enemy.position.y;
      const dist = Math.hypot(dx, dy) || 1;
      enemy.attackLungeX = (dx / dist) * 18;
      enemy.attackLungeY = (dy / dist) * 18;

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
        enemy.attackAnimMs = Math.max(0, enemy.attackAnimMs - deltaMs);
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

    function cleanupSparkleBursts() {
      for (const burst of sparkleBursts) {
        burst.container.removeFromParent();
        burst.container.destroy({ children: true });
      }
      sparkleBursts.length = 0;
    }

    function cleanupEnemies() {
      for (const enemy of enemies) {
        enemy.container.removeFromParent();
        enemy.container.destroy({ children: true });
      }
      enemies.length = 0;
    }

    function tick(ticker: PIXI.Ticker) {
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
      }

      removeExpiredSkillEffects(nowMs);
      updateEnemies(ticker.deltaMS, nowMs);
      updateAttacks(ticker.deltaMS, nowMs);
      applyActiveSkillEffectDamage(nowMs);
      updatePoiVisuals(nowMs);
      updateLootPopups(ticker.deltaMS);
      updateSparkleBursts(ticker.deltaMS);
      renderEnemies();
      renderAttacks();
      renderPlayer(nowMs);
      renderSkillEffects(app, player, activeSkillEffects);

      const screenWidth = app.renderer.width / app.renderer.resolution;
      const screenHeight = app.renderer.height / app.renderer.resolution;
      if (screenWidth !== lastUiWidth || screenHeight !== lastUiHeight) {
        lastUiWidth = screenWidth;
        lastUiHeight = screenHeight;
        resizeUiLayer();
      }

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

      await PIXI.Assets.load(Object.values(EXPLORATION_ASSETS));
      const textures = getTextures();
      enemyTexture = textures.enemy;
      sparkleTexture = textures.sparkle;
      const configuredPlayer = configurePlayerSprite(player, textures.player);
      playerSprite = configuredPlayer.sprite;
      playerBaseScale = configuredPlayer.baseScale;

      if (cancelled) {
        destroyPixiApp();
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
      app.stage.addChild(uiLayer);
      world.addChild(backgroundLayer);
      world.addChild(worldLayer);
      world.addChild(entityLayer);
      world.addChild(fxLayer);
      entityLayer.sortableChildren = true;
      enemyLayer.sortableChildren = true;
      fxLayer.addChild(attackLayer);
      fxLayer.addChild(lootPopupLayer);
      poiVisuals.push(
        ...drawWorld({
          backgroundLayer,
          mapHeight,
          mapWidth,
          pointsOfInterest,
          textures,
          worldLayer,
        })
      );
      enemies.push(...createInitialEnemies().map((enemy) => createEnemyGraphics(enemy, textures.enemy)));
      for (const enemy of enemies) {
        renderEnemy(enemy);
        enemyLayer.addChild(enemy.container);
      }
      entityLayer.addChild(enemyLayer);
      entityLayer.addChild(player);
      player.position.set(playerPosition.x, playerPosition.y);
      resizeUiLayer();
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

      app.ticker.add(tick);
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
      app.ticker?.remove?.(tick);
      cleanupAttacks();
      cleanupLootPopups();
      cleanupSparkleBursts();
      cleanupSkillEffects(player);
      cleanupEnemies();
      destroyPixiApp();
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
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-red-950 bg-zinc-900 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
            <div
              className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-red-900 to-red-600 transition-all duration-500 ease-out"
              style={{ height: `${Math.max(0, Math.min(1, combatHud.playerHp / PLAYER_MAX_HP)) * 100}%` }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-ik-menu text-[0.65rem] font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              <span>{combatHud.playerHp}</span>
              <div className="my-0.5 h-[1px] w-8 bg-white/40" />
              <span className="opacity-70">{PLAYER_MAX_HP}</span>
            </div>
          </div>
          <div className="grid gap-1">
            <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.18em] text-red-200">Combat prototype</p>
            <span className="text-xs text-amber-50">Ennemis restants {combatHud.enemiesRemaining}</span>
          </div>
        </div>
      </div>
      {combatHud.isDefeated ? (
        <div className="pointer-events-auto absolute inset-0 z-30 grid place-items-center bg-black/68 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-red-200/35 bg-zinc-950/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
            <p className="font-ik-menu text-xs uppercase tracking-[0.22em] text-red-200">Defaite</p>
            <h2 className="mt-2 font-ik-title text-2xl font-semibold text-amber-50">Game Over</h2>
            <p className="mt-3 font-ik-body text-sm text-muted-foreground">Vous vous êtes fait arrachés...</p>
            <a
              className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-amber-200/45 bg-amber-500/18 px-4 py-3 font-ik-menu text-sm text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/24"
              href="/game/kingdom"
            >
              Retour au Royaume
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
