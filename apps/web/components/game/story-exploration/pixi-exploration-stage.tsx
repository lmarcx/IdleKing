"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as PIXI from "pixi.js";

import { buildCombatLoadoutFromGameState } from "@/lib/combat-loadout";
import { useGameStore } from "@/store/game-store";
import { combat } from "@idleking/game-core";
import { addQty, type ResourceId } from "@idleking/game-core/resources/types.js";
import { isEnemyInFrontalAoe } from "./skills-hit-detection";
import { cleanupSkillEffects, renderSkillEffects, spawnInstantSkillEffect } from "./skills-visuals";
import {
  GRUNT_HP,
  createInitialEnemies,
  damageEnemy,
  isCircleIntersectingCircle,
  isEnemyAlive,
  isTargetInsideAttackCone,
  rollEnemyLoot,
  updateEnemyMovement,
  type EnemyId,
  type EnemyLoot,
  type StoryLevelEnemy,
} from "./story-level-combat";
import {
  computeStorySkillDamage,
  createStoryCombatRng,
  createStoryCombatRuntimeState,
  retargetStoryCombatRuntimeEnemy,
  STORY_RUNTIME_VISUAL_PLACEHOLDERS,
} from "./story-combat-runtime-adapter";
import {
  canCastSkill as canCastCanonicalSkill,
  castSkill as castCanonicalSkill,
  type SkillCastDamageInput,
  type SkillCategory,
  type SkillCooldownState,
  type SkillDefinition,
  type SkillId,
} from "@idleking/game-core/skills";

type PixiExplorationStageProps = {
  inputBlocked?: boolean;
  levelId: string;
  mapHeight: number;
  mapWidth: number;
  onCombatHudChangeAction?: (state: ExplorationCombatHudState) => void;
  onPlayerMoveAction: (position: { x: number; y: number }) => void;
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
const PLAYER_SHAKE_DURATION_MS = 160;
const PLAYER_SHAKE_INTENSITY = 5;
const STRONG_HIT_SHAKE_THRESHOLD_RATIO = 0.22;
const HIT_PARTICLE_DURATION_MS = 320;
const DAMAGE_NUMBER_DURATION_MS = 720;
const TELEGRAPH_DURATION_MS = 420;
const LOOT_POPUP_DURATION_MS = 900;
const SPARKLE_BURST_DURATION_MS = 520;
const POI_HIGHLIGHT_RADIUS = 96;
const IS_SKILL_HIT_DEBUG_ENABLED = process.env.NODE_ENV !== "production";
const SKILL_DEBUG_EVENT = "idleking:spawn-skill-debug-enemies";
const CHECKPOINT_RESPAWN_EVENT = "idleking:story-checkpoint-respawn";
const DASH_KEY_CODE = "Space";
const SPRINT_KEY_CODES = new Set(["ShiftLeft", "ShiftRight"]);
const TELEGRAPH_COLORS = {
  damage: 0xff9f43,
  debuff: 0x60a5fa,
  lethal: 0xef4444,
  safeHeal: 0x34d399,
  stun: 0xfacc15,
} as const;

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

type ActiveTelegraph = {
  ageMs: number;
  color: number;
  durationMs: number;
  graphic: PIXI.Graphics;
  position: Vector2;
  radius: number;
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

type ActiveHitParticle = {
  ageMs: number;
  durationMs: number;
  graphic: PIXI.Graphics;
  velocity: Vector2;
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

type SkillSlot = import("@idleking/game-core").CombatSkillSlot;
type VisualActiveSkillEffect = {
  category: SkillCategory;
  damageInput?: SkillCastDamageInput;
  endsAtMs: number;
  skillId: SkillId;
  startedAtMs: number;
  angle?: number;
  directionX?: number;
  directionY?: number;
  hitEnemyIds?: Set<EnemyId>;
  lastDamageTickAtMs?: number;
  originX?: number;
  originY?: number;
  skillDef: SkillDefinition;
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

export type ExplorationCombatHudState = {
  dashCooldownSeconds: number;
  dashFeedback?: string;
  enemiesRemaining: number;
  isDefeated: boolean;
  playerHealth: {
    current: number;
    max: number;
  };
  playerMana: {
    current: number;
    max: number;
  };
  playerStamina: {
    current: number;
    max: number;
  };
  securedRewards: Array<{
    amount: number;
    id: string;
    kind: string;
  }>;
  runtimeEnemyHealth?: {
    current: number;
    max: number;
  };
  runtimeEnemyLabel?: string;
  skillBar: {
    combatLoadout: CharacterCombatLoadout;
    cooldowns: SkillCooldownState;
    currentTimeMs: number;
  };
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
  "(": 5,
  "5": 5,
};

const SKILL_SLOT_BY_CODE: Record<string, SkillSlot> = {
  Digit1: 1,
  Digit2: 2,
  Digit3: 3,
  Digit4: 4,
  Digit5: 5,
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

export function PixiExplorationStage({
  inputBlocked = false,
  levelId,
  mapHeight,
  mapWidth,
  onCombatHudChangeAction,
  onPlayerMoveAction,
  pointsOfInterest,
}: PixiExplorationStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const inputBlockedRef = useRef(inputBlocked);
  const onCombatHudChangeRef = useRef(onCombatHudChangeAction);
  const onPlayerMoveRef = useRef(onPlayerMoveAction);
  const equipment = useGameStore((s) => s.state.equipment);
  const inventoryItems = useGameStore((s) => s.state.inventory.items);
  const combatLoadout = useMemo(
    // Loadout derives only from equipment + inventory; read full state fresh so
    // the dep array stays narrow without changing the computed value.
    () => buildCombatLoadoutFromGameState(useGameStore.getState().state),
    [equipment, inventoryItems]
  );
  const initialCombatRuntime = useMemo(
    () => createStoryCombatRuntimeState(combatLoadout, { hp: GRUNT_HP, maxHp: GRUNT_HP }),
    [combatLoadout]
  );
  // Latest loadout is read via ref inside the Pixi effect so a loadout change does
  // NOT tear down and rebuild the whole stage (see the main setup effect deps).
  const combatLoadoutRef = useRef(combatLoadout);
  const playerMaxHp = initialCombatRuntime.player.hpMax;
  const [skillsState, setSkillsState] = useState<LocalSkillsState>(() => ({
    activeEffects: [],
    combatLoadout,
    cooldowns: {},
    currentTimeMs: 0,
  }));
  const skillsStateRef = useRef(skillsState);
  const [combatHud, setCombatHud] = useState<Omit<ExplorationCombatHudState, "skillBar">>({
    dashCooldownSeconds: 0,
    enemiesRemaining: 0,
    isDefeated: false,
    playerHealth: {
      current: playerMaxHp,
      max: playerMaxHp,
    },
    playerMana: {
      current: initialCombatRuntime.player.manaCurrent,
      max: initialCombatRuntime.player.manaMax,
    },
    playerStamina: {
      current: initialCombatRuntime.player.staminaCurrent,
      max: initialCombatRuntime.player.staminaMax,
    },
    securedRewards: [],
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
    onPlayerMoveRef.current = onPlayerMoveAction;
  }, [onPlayerMoveAction]);

  useEffect(() => {
    onCombatHudChangeRef.current = onCombatHudChangeAction;
  }, [onCombatHudChangeAction]);

  useEffect(() => {
    inputBlockedRef.current = inputBlocked;
  }, [inputBlocked]);

  useEffect(() => {
    skillsStateRef.current = skillsState;
  }, [skillsState]);

  useEffect(() => {
    combatLoadoutRef.current = combatLoadout;
  }, [combatLoadout]);

  useEffect(() => {
    onCombatHudChangeRef.current?.({
      ...combatHud,
      skillBar: {
        combatLoadout: skillsState.combatLoadout,
        cooldowns: skillsState.cooldowns,
        currentTimeMs: skillsState.currentTimeMs,
      },
    });
  }, [combatHud, skillsState]);

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
    const telegraphs: ActiveTelegraph[] = [];
    const sparkleBursts: ActiveSparkleBurst[] = [];
    const hitParticles: ActiveHitParticle[] = [];
    const enemies: ActiveEnemy[] = [];
    const securedRewards = new Map<string, number>();
    const poiVisuals: PoiVisual[] = [];
    let activeSkillEffects: VisualActiveSkillEffect[] = [...skillsStateRef.current.activeEffects];
    let skillCooldowns: SkillCooldownState = { ...skillsStateRef.current.cooldowns };
    let playerSprite: PIXI.Sprite | null = null;
    let playerBaseScale = 1;
    let enemyTexture: PIXI.Texture | null = null;
    let sparkleTexture: PIXI.Texture | null = null;
    let canvasElement: HTMLCanvasElement | null = null;
    let combatHudElapsed = 0;
    let dashFeedback: string | undefined;
    let dashFeedbackExpiresAt = 0;
    let hudElapsed = 0;
    let lastUiHeight = 0;
    let lastUiWidth = 0;
    let playerHitFlashMs = 0;
    let playerShakeMs = 0;
    let skillsHudElapsed = 0;
    let hasPointerWorldPosition = false;
    let isPlayerDefeated = false;
    let lastMeleeAttackAt = -Infinity;
    let lastRangedAttackAt = -Infinity;
    let runtimeEnemyId: EnemyId | null = null;
    let runtimeState = createStoryCombatRuntimeState(combatLoadoutRef.current, {
      hp: GRUNT_HP,
      maxHp: GRUNT_HP,
    });
    const runtimeRng = createStoryCombatRng(levelId);

    function destroyPixiApp() {
      if (!initialized || destroyed) return;
      destroyed = true;
      app.destroy(true);
    }

    function publishSkillsState(nowMs: number) {
      const nextState: LocalSkillsState = {
        activeEffects: [...activeSkillEffects],
        combatLoadout: combatLoadoutRef.current,
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
      return combatLoadoutRef.current.skills.find((skill) => skill.slot === slot);
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

    function showDashFeedback(message: string, nowMs: number) {
      dashFeedback = message;
      dashFeedbackExpiresAt = nowMs + STORY_RUNTIME_VISUAL_PLACEHOLDERS.dashFeedbackDurationMs;
      syncCombatHud();
    }

    function tryDash(nowMs: number) {
      const result = combat.applyDashCost(runtimeState);
      runtimeState = result.next;

      if (!result.ok) {
        if (result.reason === "NOT_ENOUGH_STAMINA") {
          showDashFeedback("Dash indisponible : Stamina insuffisante", nowMs);
        } else if (result.reason === "COOLDOWN") {
          showDashFeedback(
            `Dash indisponible : cooldown ${Math.ceil(runtimeState.timers.dashCooldownRemainingSeconds)}s`,
            nowMs
          );
        }
        return;
      }

      dashFeedback = undefined;
      dashFeedbackExpiresAt = 0;
      playerPosition.x = clamp(
        playerPosition.x + playerFacing.x * STORY_RUNTIME_VISUAL_PLACEHOLDERS.dashDistance,
        PLAYER_SIZE / 2,
        mapWidth - PLAYER_SIZE / 2
      );
      playerPosition.y = clamp(
        playerPosition.y + playerFacing.y * STORY_RUNTIME_VISUAL_PLACEHOLDERS.dashDistance,
        PLAYER_SIZE / 2,
        mapHeight - PLAYER_SIZE / 2
      );
      syncCombatHud();
    }

    function tryCastSkill(slot: SkillSlot, nowMs: number) {
      if (isPlayerDefeated) return;

      removeExpiredSkillEffects(nowMs);
      const equippedSkill = getEquippedSkillForSlot(slot);
      if (!equippedSkill) return;

      runtimeState = {
        ...runtimeState,
        timers: {
          ...runtimeState.timers,
          skillCooldowns,
        },
      };

      const castOptions = {
        nowMs,
        ringSkillScaling: equippedSkill.ringSkillScaling,
      };
      const readiness = canCastCanonicalSkill(runtimeState, equippedSkill.skillId, castOptions);
      if (!readiness.success) {
        publishSkillsState(nowMs);
        return;
      }

      const result = castCanonicalSkill(runtimeState, equippedSkill.skillId, castOptions);
      if (!result.success) {
        publishSkillsState(nowMs);
        return;
      }

      runtimeState = result.updatedState;
      skillCooldowns = { ...runtimeState.timers.skillCooldowns };

      if (result.damageInput) {
        const snapshot = createDirectionalSnapshot();
        spawnInstantSkillEffect(player, result.skillDef.id, nowMs, snapshot);
        applyAttackSkillDamage(result.damageInput, snapshot, nowMs);
      } else {
        activeSkillEffects = [
          ...activeSkillEffects,
          {
            category: result.skillDef.category,
            endsAtMs: nowMs + 700,
            skillDef: result.skillDef,
            skillId: result.skillDef.id,
            startedAtMs: nowMs,
          },
        ];
        showDashFeedback(
          `${result.skillDef.name} — effet complet à venir (Mana consommée, cooldown appliqué)`,
          nowMs
        );
      }

      publishSkillsState(nowMs);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (inputBlockedRef.current) {
        pressedKeys.clear();
        resetHeldMouseButtons();
        return;
      }
      if (isPlayerDefeated) return;
      if (IS_SKILL_HIT_DEBUG_ENABLED && event.code === "F8") {
        event.preventDefault();
        if (!event.repeat) {
          spawnSkillDebugScenario();
        }
        return;
      }
      if (event.code === DASH_KEY_CODE) {
        event.preventDefault();
        if (!event.repeat) {
          tryDash(performance.now());
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

      if (KEY_DIRECTIONS[event.code] || SPRINT_KEY_CODES.has(event.code)) {
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
      if (inputBlockedRef.current) {
        resetHeldMouseButtons();
        return;
      }
      updatePointerWorldPosition(event);
      syncHeldMouseButtons(event.buttons);
    }

    function handlePointerDown(event: PointerEvent) {
      if (inputBlockedRef.current) {
        resetHeldMouseButtons();
        return;
      }
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
      if (inputBlockedRef.current) {
        resetHeldMouseButtons();
        return;
      }
      if (canvasElement?.hasPointerCapture(event.pointerId)) {
        canvasElement.releasePointerCapture(event.pointerId);
      }

      syncHeldMouseButtons(event.buttons);
    }

    function handlePointerLeave(event: PointerEvent) {
      if (inputBlockedRef.current) {
        resetHeldMouseButtons();
        return;
      }
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
      securedRewards.set(loot.resourceId, (securedRewards.get(loot.resourceId) ?? 0) + loot.amount);
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

    function createDamageNumber({
      amount,
      didCrit = false,
      isLethal = false,
      position,
      target = "enemy",
    }: {
      amount: number;
      didCrit?: boolean;
      isLethal?: boolean;
      position: Vector2;
      target?: "enemy" | "player";
    }) {
      const color = isLethal ? TELEGRAPH_COLORS.lethal : target === "player" ? 0xff6f61 : TELEGRAPH_COLORS.damage;
      const label = `${didCrit ? "CRIT " : ""}${Math.ceil(amount)}`;
      const container = new PIXI.Container();
      const text = new PIXI.Text({
        text: target === "player" ? `-${label}` : label,
        style: {
          fill: color,
          fontFamily: "Arial",
          fontSize: didCrit ? 24 : 19,
          fontWeight: "800",
          stroke: { color: 0x100805, width: 5 },
        },
      });
      text.anchor.set(0.5, 0.5);
      container.addChild(text);
      container.position.set(position.x, position.y);
      fxLayer.addChild(container);
      lootPopups.push({
        ageMs: 0,
        container,
        durationMs: DAMAGE_NUMBER_DURATION_MS,
        position: { ...position },
      });
    }

    function createCombatTelegraph(position: Vector2, radius: number, color: number) {
      const graphic = new PIXI.Graphics();
      graphic.position.set(position.x, position.y);
      fxLayer.addChild(graphic);
      telegraphs.push({
        ageMs: 0,
        color,
        durationMs: TELEGRAPH_DURATION_MS,
        graphic,
        position: { ...position },
        radius,
      });
    }

    function createHitParticles(position: Vector2) {
      const particleCount = 4 + Math.floor(Math.random() * 3);
      for (let index = 0; index < particleCount; index += 1) {
        const graphic = new PIXI.Graphics();
        const size = 2 + Math.random() * 4;
        const color = index % 2 === 0 ? 0xfff1b8 : 0xff7b5d;
        graphic.rect(-size / 2, -size / 2, size, size).fill({ color, alpha: 0.9 });
        graphic.position.set(position.x, position.y - 12);
        fxLayer.addChild(graphic);

        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 80;
        hitParticles.push({
          ageMs: 0,
          durationMs: HIT_PARTICLE_DURATION_MS,
          graphic,
          velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
          },
        });
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

    function updateHitParticles(deltaMs: number) {
      const deltaSeconds = deltaMs / 1000;
      for (let index = hitParticles.length - 1; index >= 0; index -= 1) {
        const particle = hitParticles[index];
        particle.ageMs += deltaMs;

        const progress = clamp(particle.ageMs / particle.durationMs, 0, 1);
        particle.graphic.position.x += particle.velocity.x * deltaSeconds;
        particle.graphic.position.y += particle.velocity.y * deltaSeconds;
        particle.graphic.alpha = 1 - progress;
        particle.graphic.scale.set(1 - progress * 0.5);

        if (particle.ageMs < particle.durationMs) continue;
        particle.graphic.removeFromParent();
        particle.graphic.destroy();
        hitParticles.splice(index, 1);
      }
    }

    function updateTelegraphs(deltaMs: number) {
      for (let index = telegraphs.length - 1; index >= 0; index -= 1) {
        const telegraph = telegraphs[index];
        telegraph.ageMs += deltaMs;
        const progress = clamp(telegraph.ageMs / telegraph.durationMs, 0, 1);
        const alpha = 0.42 * (1 - progress);
        const radius = telegraph.radius * (0.86 + progress * 0.24);

        telegraph.graphic.clear();
        telegraph.graphic.circle(0, 0, radius).fill({ color: telegraph.color, alpha: alpha * 0.16 });
        telegraph.graphic.circle(0, 0, radius).stroke({ color: telegraph.color, alpha, width: 3 });
        telegraph.graphic.position.set(telegraph.position.x, telegraph.position.y);

        if (telegraph.ageMs < telegraph.durationMs) continue;
        telegraph.graphic.removeFromParent();
        telegraph.graphic.destroy();
        telegraphs.splice(index, 1);
      }
    }

    function renderPlayer(nowMs: number) {
      player.position.set(playerPosition.x, playerPosition.y);
      player.rotation = Math.atan2(playerFacing.y, playerFacing.x) + Math.PI / 2;
      player.zIndex = playerPosition.y;

      if (!playerSprite) return;
      const breath = 1 + Math.sin(nowMs / 380) * 0.026;
      playerSprite.scale.set(playerBaseScale * breath, playerBaseScale * (1 / breath));
      playerSprite.tint = playerHitFlashMs > 0 ? 0xffd0d0 : 0xffffff;
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

      const loot = rollEnemyLoot(enemy, runtimeRng);
      addLootToPlayerResources(loot);
      createLootPopup(enemy.position, loot);
    }

    function syncCombatHud() {
      if (dashFeedback && performance.now() >= dashFeedbackExpiresAt) {
        dashFeedback = undefined;
        dashFeedbackExpiresAt = 0;
      }

      setCombatHud({
        dashCooldownSeconds: runtimeState.timers.dashCooldownRemainingSeconds,
        dashFeedback,
        enemiesRemaining: getEnemiesRemaining(),
        isDefeated: isPlayerDefeated,
        playerHealth: {
          current: runtimeState.player.hpCurrent,
          max: runtimeState.player.hpMax,
        },
        playerMana: {
          current: runtimeState.player.manaCurrent,
          max: runtimeState.player.manaMax,
        },
        playerStamina: {
          current: runtimeState.player.staminaCurrent,
          max: runtimeState.player.staminaMax,
        },
        securedRewards: [
          ...runtimeState.checkpoint.securedRewards.map((reward) => ({
            amount: reward.amount ?? 1,
            id: reward.id ?? reward.kind,
            kind: reward.kind,
          })),
          ...[...securedRewards.entries()].map(([resourceId, amount]) => ({
            amount,
            id: resourceId,
            kind: "resource",
          })),
        ],
        runtimeEnemyHealth: runtimeEnemyId
          ? {
              current: runtimeState.enemy.hpCurrent,
              max: runtimeState.enemy.hpMax,
            }
          : undefined,
        runtimeEnemyLabel: runtimeEnemyId ?? undefined,
      });
    }

    function selectRuntimeEnemy(enemy: ActiveEnemy) {
      runtimeEnemyId = enemy.id;
      runtimeState = retargetStoryCombatRuntimeEnemy(runtimeState, enemy);
    }

    function damageActiveEnemy(enemy: ActiveEnemy, amount: number, didCrit = false) {
      const isLethal = amount >= enemy.hp;
      const died = damageEnemy(enemy, amount);
      if (runtimeEnemyId === enemy.id) {
        runtimeState = retargetStoryCombatRuntimeEnemy(runtimeState, enemy);
      }
      enemy.hitFlashMs = ENEMY_HIT_FLASH_MS;
      createDamageNumber({
        amount,
        didCrit,
        isLethal,
        position: { x: enemy.position.x, y: enemy.position.y - 54 },
      });
      createCombatTelegraph(
        enemy.position,
        enemy.radius + 18,
        isLethal ? TELEGRAPH_COLORS.lethal : TELEGRAPH_COLORS.damage
      );
      createHitParticles(enemy.position);
      if (amount >= enemy.maxHp * STRONG_HIT_SHAKE_THRESHOLD_RATIO || died) {
        playerShakeMs = PLAYER_SHAKE_DURATION_MS;
      }
      if (died) {
        enemy.deathFadeMs = 0;
        claimEnemyLoot(enemy);
      }
    }

    function performRuntimeBasicAttack(enemy: ActiveEnemy) {
      selectRuntimeEnemy(enemy);
      const result = combat.performBasicAttack(runtimeState, runtimeRng);
      runtimeState = result.next;
      if (!result.ok) return;

      damageActiveEnemy(enemy, result.damage.damage, result.damage.didCrit);
      syncCombatHud();
    }

    function getPlayerDamageMultiplier(effects: VisualActiveSkillEffect[], nowMs: number): number {
      void effects;
      void nowMs;
      return 1;
    }

    function computeSkillDamage(damageInput: SkillCastDamageInput, nowMs: number): number {
      if (damageInput.skillDamageMultiplier <= 0) return 0;
      return computeStorySkillDamage(runtimeState, damageInput, {
        buffMultiplier: getPlayerDamageMultiplier(activeSkillEffects, nowMs),
      });
    }

    function applySkillDamageToEnemy(enemy: ActiveEnemy, damage: number) {
      if (damage <= 0 || !isEnemyAlive(enemy)) return;
      damageActiveEnemy(enemy, damage);
    }

    function applyAttackSkillDamage(damageInput: SkillCastDamageInput, snapshot: DirectionalSkillSnapshot, nowMs: number) {
      const damage = computeSkillDamage(damageInput, nowMs);
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
            260,
            170
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
      void nowMs;
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
        performRuntimeBasicAttack(enemy);
      }
    }

    function applyProjectileHits(projectile: ActiveProjectile): boolean {
      for (const enemy of enemies) {
        if (!isEnemyAlive(enemy)) continue;
        if (!isCircleIntersectingCircle(projectile.position, 8, enemy.position, enemy.radius)) continue;

        performRuntimeBasicAttack(enemy);
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

      const previousHp = runtimeState.player.hpCurrent;
      const isLethal = enemy.contactDamage >= previousHp;
      createCombatTelegraph(
        playerPosition,
        PLAYER_SIZE * 0.62,
        isLethal ? TELEGRAPH_COLORS.lethal : TELEGRAPH_COLORS.damage
      );
      runtimeState = combat.applyDamageToPlayer(runtimeState, enemy.contactDamage);
      if (runtimeState.player.hpCurrent < previousHp) {
        playerShakeMs = PLAYER_SHAKE_DURATION_MS;
        playerHitFlashMs = ENEMY_HIT_FLASH_MS;
        createDamageNumber({
          amount: previousHp - runtimeState.player.hpCurrent,
          isLethal,
          position: { x: playerPosition.x, y: playerPosition.y - 64 },
          target: "player",
        });
      }

      if (combat.isPlayerDead(runtimeState)) {
        isPlayerDefeated = true;
        playerShakeMs = PLAYER_SHAKE_DURATION_MS * 1.8;
        pressedKeys.clear();
        resetHeldMouseButtons();
      }
      syncCombatHud();
    }

    function handleCheckpointRespawnEvent() {
      runtimeState = combat.handlePlayerDeathAtCheckpoint(runtimeState);
      isPlayerDefeated = combat.isPlayerDead(runtimeState);
      playerHitFlashMs = 0;
      playerShakeMs = 0;
      dashFeedback = undefined;
      dashFeedbackExpiresAt = 0;
      createCombatTelegraph(playerPosition, PLAYER_SIZE * 0.72, TELEGRAPH_COLORS.safeHeal);
      lootPopups.push(
        createFloatingText({
          color: TELEGRAPH_COLORS.safeHeal,
          label: "Checkpoint",
          layer: lootPopupLayer,
          position: { x: playerPosition.x, y: playerPosition.y - 74 },
        })
      );
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

    function cleanupHitParticles() {
      for (const particle of hitParticles) {
        particle.graphic.removeFromParent();
        particle.graphic.destroy();
      }
      hitParticles.length = 0;
    }

    function cleanupTelegraphs() {
      for (const telegraph of telegraphs) {
        telegraph.graphic.removeFromParent();
        telegraph.graphic.destroy();
      }
      telegraphs.length = 0;
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

      if (inputBlockedRef.current) {
        pressedKeys.clear();
        resetHeldMouseButtons();
        return;
      }

      for (const key of pressedKeys) {
        const direction = KEY_DIRECTIONS[key];
        if (!direction) continue;
        directionX += direction.x;
        directionY += direction.y;
      }

      runtimeState = combat.tickCombatRuntime(runtimeState, deltaSeconds);
      const hasMovementInput = directionX !== 0 || directionY !== 0;
      const wantsToSprint = [...SPRINT_KEY_CODES].some((code) => pressedKeys.has(code));
      const isSprinting = hasMovementInput && wantsToSprint && combat.canSprint(runtimeState);
      if (isSprinting) {
        runtimeState = combat.applySprintCost(runtimeState, deltaSeconds);
      }

      if (!isPlayerDefeated && hasMovementInput) {
        const length = Math.hypot(directionX, directionY) || 1;
        const moveSpeed =
          PLAYER_SPEED * (isSprinting ? STORY_RUNTIME_VISUAL_PLACEHOLDERS.sprintSpeedMultiplier : 1);
        if (!hasPointerWorldPosition) {
          updatePlayerFacing({ x: directionX / length, y: directionY / length });
        }
        playerPosition.x = clamp(
          playerPosition.x + (directionX / length) * moveSpeed * deltaSeconds,
          PLAYER_SIZE / 2,
          mapWidth - PLAYER_SIZE / 2
        );
        playerPosition.y = clamp(
          playerPosition.y + (directionY / length) * moveSpeed * deltaSeconds,
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
      updateHitParticles(ticker.deltaMS);
      updateTelegraphs(ticker.deltaMS);
      renderEnemies();
      renderAttacks();
      renderPlayer(nowMs);
      renderSkillEffects(app, player, activeSkillEffects);

      playerHitFlashMs = Math.max(0, playerHitFlashMs - ticker.deltaMS);
      playerShakeMs = Math.max(0, playerShakeMs - ticker.deltaMS);
      let shakeX = 0;
      let shakeY = 0;
      if (playerShakeMs > 0) {
        shakeX = (Math.random() * 2 - 1) * PLAYER_SHAKE_INTENSITY;
        shakeY = (Math.random() * 2 - 1) * PLAYER_SHAKE_INTENSITY;
      }

      const screenWidth = app.renderer.width / app.renderer.resolution;
      const screenHeight = app.renderer.height / app.renderer.resolution;
      if (screenWidth !== lastUiWidth || screenHeight !== lastUiHeight) {
        lastUiWidth = screenWidth;
        lastUiHeight = screenHeight;
        resizeUiLayer();
      }

      const cameraX = clamp(playerPosition.x - screenWidth / 2, 0, Math.max(0, mapWidth - screenWidth));
      const cameraY = clamp(playerPosition.y - screenHeight / 2, 0, Math.max(0, mapHeight - screenHeight));
      world.position.set(-cameraX + shakeX, -cameraY + shakeY);

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
      const firstEnemy = enemies.find(isEnemyAlive);
      if (firstEnemy) {
        selectRuntimeEnemy(firstEnemy);
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
      window.addEventListener(CHECKPOINT_RESPAWN_EVENT, handleCheckpointRespawnEvent);
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
      window.removeEventListener(CHECKPOINT_RESPAWN_EVENT, handleCheckpointRespawnEvent);
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
      cleanupHitParticles();
      cleanupTelegraphs();
      cleanupSkillEffects(player);
      cleanupEnemies();
      destroyPixiApp();
    };
    // combatLoadout is intentionally read via combatLoadoutRef (not a dep) so a loadout
    // change does not remount the Pixi stage. Initial runtime is derived inside the effect.
  }, [levelId, mapHeight, mapWidth, pointsOfInterest]);

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
      <div className="pointer-events-none absolute bottom-24 right-4 z-10 rounded-lg border border-amber-200/20 bg-black/62 px-4 py-3 font-ik-body text-xs text-amber-50 shadow-[0_12px_30px_rgba(0,0,0,0.38)]">
        <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.18em] text-amber-200/80">Combat prototype</p>
        <span className="mt-1 block text-xs text-amber-50">Ennemis restants {combatHud.enemiesRemaining}</span>
        <span className="mt-1 block text-xs text-emerald-100">
          Dash {combatHud.dashCooldownSeconds > 0 ? `${Math.ceil(combatHud.dashCooldownSeconds)}s` : "pret"} - Stamina sprint/dash
        </span>
        {combatHud.dashFeedback ? <span className="mt-1 block text-xs text-red-200">{combatHud.dashFeedback}</span> : null}
      </div>
      <div className="pointer-events-none absolute bottom-24 left-4 z-10 rounded-lg border border-amber-200/18 bg-black/55 px-3 py-2 font-ik-menu text-[0.58rem] uppercase tracking-[0.1em] text-amber-50 shadow-[0_12px_30px_rgba(0,0,0,0.32)]">
        <div className="flex flex-wrap gap-2">
          <span className="text-orange-300">Damage</span>
          <span className="text-red-300">Lethal</span>
          <span className="text-yellow-300">Stun</span>
          <span className="text-blue-300">Debuff</span>
          <span className="text-emerald-300">Safe/Heal</span>
        </div>
      </div>
      {combatHud.isDefeated ? (
        <div className="pointer-events-auto absolute inset-0 z-30 grid place-items-center bg-black/68 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-red-200/35 bg-zinc-950/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
            <p className="font-ik-menu text-xs uppercase tracking-[0.22em] text-red-200">Defaite</p>
            <h2 className="mt-2 font-ik-title text-2xl font-semibold text-amber-50">Game Over</h2>
            <p className="mt-3 font-ik-body text-sm text-muted-foreground">
              Checkpoint conserve. Les rewards securisees restent acquises.
            </p>
            <div className="mt-5 rounded-md border border-amber-200/18 bg-black/45 p-4 text-left">
              <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Rewards securisees
              </p>
              <div className="mt-3 grid gap-2 font-ik-body text-sm text-amber-50">
                {combatHud.securedRewards.length > 0 ? (
                  combatHud.securedRewards.map((reward) => (
                    <div className="flex items-center justify-between gap-3" key={`${reward.kind}-${reward.id}`}>
                      <span>{reward.id}</span>
                      <span className="font-ik-menu text-emerald-200">+{reward.amount}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-muted-foreground">Aucune reward securisee pour ce checkpoint.</span>
                )}
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                className="inline-flex w-full items-center justify-center rounded-md border border-amber-200/45 bg-amber-500/18 px-4 py-3 font-ik-menu text-sm text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/24"
                onClick={() => window.dispatchEvent(new Event(CHECKPOINT_RESPAWN_EVENT))}
                type="button"
              >
                Relancer checkpoint
              </button>
              <a
                className="inline-flex w-full items-center justify-center rounded-md border border-amber-200/24 bg-black/35 px-4 py-3 font-ik-menu text-sm text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/14"
                href="/game/kingdom"
              >
                Retour Kingdom
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
