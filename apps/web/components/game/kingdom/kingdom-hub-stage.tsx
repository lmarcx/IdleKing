"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEV_MODE } from "@/lib/env";
import { getResourceAssetPath } from "@/lib/resource-assets";
import { useGameStore } from "@/store/game-store";
import { useResourceFeedbackStore } from "@/store/resource-feedback-store";
import { GameHud } from "@/components/game/hud/game-hud";
import { useGameHudOverlay, type GameHudOverlayId } from "@/components/game/hud/game-hud-overlays";
import {
  FORGE_RECIPES,
  CORNUCOPIA_MAX_CLAIM_AMOUNT,
  buildBuilding,
  claimCornucopia,
  convertTempleGlobalXp,
  forgeCraft,
  getBuildCost,
  getCornucopiaClaimables,
  getQty,
  hasAtLeast,
  isEquipmentItem,
  xpNext,
  type BuildingId,
  type ForgeRecipe,
  type ResourceId,
  type TempleXpTarget,
} from "@idleking/game-core";
import { KingdomDialogueBox } from "./kingdom-dialogue-box";
import { KingdomOverlay } from "./kingdom-overlay";

const MAP_WIDTH = 1800;
const MAP_HEIGHT = 1200;
const PLAYER_SIZE = 48;
const PLAYER_SPEED = 310;
const PLAYER_COLLIDER = { height: 28, offsetY: 10, width: 32 } as const;
const SHOW_HUB_COLLIDER_DEBUG = false;
const HUB_ASSETS = {
  circleTile: "/assets/kingdom-hub/tile_circular_pattern.png",
  cornucopia: "/assets/kingdom-hub/cornucopia_magical.png",
  farm: "/assets/kingdom-hub/building_farm.png",
  floor: "/assets/kingdom-hub/tile_royal_stone_floor.png",
  forge: "/assets/kingdom-hub/building_forge.png",
  forum: "/assets/kingdom-hub/building_forum.png",
  kitchen: "/assets/kingdom-hub/building_kitchen.png",
  mine: "/assets/kingdom-hub/building_mine.png",
  npcVillager: "/assets/kingdom-hub/npc_villager.png",
  runeTile: "/assets/kingdom-hub/tile_engraved_runes.png",
  softGlow: "/assets/kingdom-hub/fx_soft_glow_aura.png",
  sparkle: "/assets/kingdom-hub/fx_sparkle_particles.png",
  temple: "/assets/kingdom-hub/building_temple.png",
} as const;
const FORUM_POSITION = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 - 170 };
const TEMPLE_POSITION = { x: MAP_WIDTH / 2 + 330, y: MAP_HEIGHT / 2 - 210 };
const MINE_POSITION = { x: MAP_WIDTH / 2 - 350, y: MAP_HEIGHT / 2 - 160 };
const KITCHEN_POSITION = { x: MAP_WIDTH / 2 - 70, y: MAP_HEIGHT / 2 + 270 };
const FORGE_POSITION = { x: MAP_WIDTH / 2 + 350, y: MAP_HEIGHT / 2 + 220 };
const CORNUCOPIA_POSITION = { x: MAP_WIDTH / 2 + 245, y: MAP_HEIGHT / 2 + 15 };
const PORTAL_POSITION = { x: MAP_WIDTH / 2 - 455, y: MAP_HEIGHT / 2 + 375 };
const HUB_DISPLAY_HEIGHTS = {
  cornucopia: 116,
  farm: 190,
  forge: 186,
  forum: 250,
  kitchen: 174,
  mine: 184,
  temple: 210,
} as const;
const FARM_SLOT = {
  id: "farm_slot_01",
  buildingType: "farm",
  label: "Farm",
  x: MAP_WIDTH / 2 - 340,
  y: MAP_HEIGHT / 2 + 150,
} as const;
const VILLAGER_NPC = {
  id: "npc_villager_01",
  label: "Villageois Errant",
  text: "Le royaume reprend vie, Majesté. Mais chaque pierre devra être rebâtie.",
  x: MAP_WIDTH / 2 - 105,
  y: MAP_HEIGHT / 2 + 75,
} as const;
const BOTO_NPC = {
  id: "npc_boto",
  label: "Boto",
  x: MAP_WIDTH / 2 + 95,
  y: MAP_HEIGHT / 2 + 88,
} as const;
const FORGE_MVP_RECIPE_IDS = new Set(["iron_sword", "iron_helmet", "copper_ring"]);
const FORGE_MVP_RECIPES = FORGE_RECIPES.filter((recipe) => FORGE_MVP_RECIPE_IDS.has(recipe.id));
const TEMPLE_BUILD_COST = getBuildCost("TEMPLE");
const FORGE_BUILD_COST = getBuildCost("FORGE");

type Vector2 = {
  x: number;
  y: number;
};

type BuildingState = "locked" | "unlocked" | "built";

type BuildingModalState = {
  state: BuildingState;
} | null;

type PlaceholderBuildingId = "forum" | "kitchen" | "mine";
type HubOverlayId = "boto";

type PlaceholderBuildingStatus = {
  active: boolean;
  built: boolean;
  unlocked: boolean;
};

const PLACEHOLDER_BUILDINGS: Record<
  PlaceholderBuildingId,
  {
    asset: string;
    label: string;
    position: Vector2;
  }
> = {
  forum: {
    asset: HUB_ASSETS.forum,
    label: "Forum",
    position: FORUM_POSITION,
  },
  kitchen: {
    asset: HUB_ASSETS.kitchen,
    label: "Kitchen",
    position: KITCHEN_POSITION,
  },
  mine: {
    asset: HUB_ASSETS.mine,
    label: "Mine",
    position: MINE_POSITION,
  },
};
const HUB_OVERLAYS: Record<HubOverlayId, { label: string; title: string }> = {
  boto: { label: "Boto", title: "Boto" },
};

type PoiVisual = {
  container: PIXI.Container;
  setNear: (near: boolean) => void;
  update: (elapsedSeconds: number) => void;
};

type FloatingTextFx = {
  age: number;
  duration: number;
  node: PIXI.Text;
  startY: number;
};

type ParticleFx = {
  age: number;
  duration: number;
  node: PIXI.Container;
  velocity: Vector2;
};

type SpawnWorldFx = (position: Vector2, label?: string, color?: number) => void;

type Interactable = {
  id: string;
  label: string;
  type: "building" | "building_slot" | "npc";
  x: number;
  y: number;
  radius: number;
  onInteract: () => void;
};

type HubCollider = {
  height: number;
  id: string;
  width: number;
  x: number;
  y: number;
};

type HubTextures = {
  circleTile: PIXI.Texture;
  cornucopia: PIXI.Texture;
  farm: PIXI.Texture;
  floor: PIXI.Texture;
  forge: PIXI.Texture;
  forum: PIXI.Texture;
  kitchen: PIXI.Texture;
  mine: PIXI.Texture;
  npcVillager: PIXI.Texture;
  runeTile: PIXI.Texture;
  softGlow: PIXI.Texture;
  sparkle: PIXI.Texture;
  temple: PIXI.Texture;
};

type HubSpriteOptions = {
  displayHeight: number;
  glowHeight?: number;
  glowTint?: number;
  hintOffsetY?: number;
  important?: boolean;
  position: Vector2;
  shadowAlpha?: number;
  shadowHeight?: number;
  shadowWidth?: number;
  texture: PIXI.Texture;
};

const KEY_DIRECTIONS: Record<string, Vector2> = {
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

function distanceBetween(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function rectsOverlap(a: HubCollider, b: HubCollider): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function isInteractionKey(event: KeyboardEvent): boolean {
  return event.code === "KeyF";
}

function setSpriteDisplayHeight(sprite: PIXI.Sprite, height: number): number {
  const textureHeight = Math.max(sprite.texture.height, 1);
  const scale = height / textureHeight;
  sprite.scale.set(scale);
  return scale;
}

function getTextureDisplayWidth(texture: PIXI.Texture, displayHeight: number): number {
  return (Math.max(texture.width, 1) / Math.max(texture.height, 1)) * displayHeight;
}

function createGroundCollider({
  displayHeight,
  heightRatio = 0.32,
  id,
  offsetY,
  position,
  texture,
  widthRatio = 0.68,
}: {
  displayHeight: number;
  heightRatio?: number;
  id: string;
  offsetY?: number;
  position: Vector2;
  texture: PIXI.Texture;
  widthRatio?: number;
}): HubCollider {
  const displayWidth = getTextureDisplayWidth(texture, displayHeight);
  const width = displayWidth * widthRatio;
  const height = displayHeight * heightRatio;
  const centerY = position.y + (offsetY ?? displayHeight * 0.08);

  return {
    height,
    id,
    width,
    x: position.x - width / 2,
    y: centerY - height / 2,
  };
}

function getPlayerCollider(position: Vector2): HubCollider {
  return {
    height: PLAYER_COLLIDER.height,
    id: "player",
    width: PLAYER_COLLIDER.width,
    x: position.x - PLAYER_COLLIDER.width / 2,
    y: position.y + PLAYER_COLLIDER.offsetY - PLAYER_COLLIDER.height / 2,
  };
}

function drawColliderDebug(colliders: HubCollider[]): PIXI.Container {
  const layer = new PIXI.Container();
  layer.zIndex = 10_000;

  for (const collider of colliders) {
    const rect = new PIXI.Graphics();
    rect
      .rect(collider.x, collider.y, collider.width, collider.height)
      .fill({ alpha: 0.08, color: 0x83f7ff })
      .stroke({ alpha: 0.38, color: 0x83f7ff, width: 1 });
    layer.addChild(rect);
  }

  return layer;
}

function createHubShadow(width: number, height: number, alpha = 0.4): PIXI.Graphics {
  const shadow = new PIXI.Graphics();
  shadow.ellipse(0, 0, width, height).fill({ color: 0x010208, alpha });
  return shadow;
}

function createGlowSprite(texture: PIXI.Texture, height: number, tint = 0xffffff, alpha = 0.34): PIXI.Sprite {
  const glow = new PIXI.Sprite(texture);
  glow.anchor.set(0.5);
  glow.alpha = alpha;
  glow.tint = tint;
  glow.roundPixels = true;
  setSpriteDisplayHeight(glow, height);
  return glow;
}

function createInteractionHint(offsetY = -100): PIXI.Text {
  const hint = new PIXI.Text({
    style: {
      fill: 0xfff0b8,
      fontFamily: "Arial",
      fontSize: 13,
      fontWeight: "700",
      stroke: { color: 0x100805, width: 4 },
    },
    text: "Press F",
  });
  hint.anchor.set(0.5);
  hint.alpha = 0;
  hint.position.set(0, offsetY);
  hint.visible = false;
  return hint;
}

function getHubTextures(): HubTextures {
  return {
    circleTile: PIXI.Texture.from(HUB_ASSETS.circleTile),
    cornucopia: PIXI.Texture.from(HUB_ASSETS.cornucopia),
    farm: PIXI.Texture.from(HUB_ASSETS.farm),
    floor: PIXI.Texture.from(HUB_ASSETS.floor),
    forge: PIXI.Texture.from(HUB_ASSETS.forge),
    forum: PIXI.Texture.from(HUB_ASSETS.forum),
    kitchen: PIXI.Texture.from(HUB_ASSETS.kitchen),
    mine: PIXI.Texture.from(HUB_ASSETS.mine),
    npcVillager: PIXI.Texture.from(HUB_ASSETS.npcVillager),
    runeTile: PIXI.Texture.from(HUB_ASSETS.runeTile),
    softGlow: PIXI.Texture.from(HUB_ASSETS.softGlow),
    sparkle: PIXI.Texture.from(HUB_ASSETS.sparkle),
    temple: PIXI.Texture.from(HUB_ASSETS.temple),
  };
}

function createTileAccent(texture: PIXI.Texture, x: number, y: number, alpha = 0.82, scale = 1): PIXI.Sprite {
  const tile = new PIXI.Sprite(texture);
  tile.anchor.set(0.5);
  tile.alpha = alpha;
  tile.position.set(x, y);
  tile.roundPixels = true;
  tile.scale.set(scale);
  return tile;
}

function drawWorld(container: PIXI.Container, textures: HubTextures) {
  const fallback = new PIXI.Graphics();
  fallback.rect(0, 0, MAP_WIDTH, MAP_HEIGHT).fill(0x050711);

  const floor = new PIXI.TilingSprite({
    height: MAP_HEIGHT,
    roundPixels: true,
    texture: textures.floor,
    width: MAP_WIDTH,
  });
  floor.alpha = 0.96;

  const tileVariations = [
    createTileAccent(textures.circleTile, FORUM_POSITION.x, FORUM_POSITION.y + 28, 0.92, 1.35),
    createTileAccent(textures.circleTile, TEMPLE_POSITION.x, TEMPLE_POSITION.y + 34, 0.82, 1.18),
    createTileAccent(textures.circleTile, CORNUCOPIA_POSITION.x, CORNUCOPIA_POSITION.y + 16, 0.9, 1.08),
    createTileAccent(textures.circleTile, PORTAL_POSITION.x, PORTAL_POSITION.y + 30, 0.78, 1.1),
    createTileAccent(textures.runeTile, 360, 274, 0.72),
    createTileAccent(textures.runeTile, 604, 658, 0.64),
    createTileAccent(textures.runeTile, 1148, 816, 0.66),
    createTileAccent(textures.runeTile, 1416, 454, 0.58),
    createTileAccent(textures.runeTile, 836, 1008, 0.52),
  ];

  const haze = new PIXI.Graphics();
  haze.circle(MAP_WIDTH * 0.3, MAP_HEIGHT * 0.22, 340).fill({ color: 0x33235f, alpha: 0.12 });
  haze.circle(MAP_WIDTH * 0.76, MAP_HEIGHT * 0.68, 420).fill({ color: 0x062f38, alpha: 0.11 });
  haze.circle(MAP_WIDTH * 0.5, MAP_HEIGHT * 0.5, 560).stroke({ color: 0x7b5dde, alpha: 0.08, width: 2 });

  container.addChild(fallback, floor, ...tileVariations, haze);
}

function drawPlayer() {
  const container = new PIXI.Container();
  const shadow = new PIXI.Graphics();
  const body = new PIXI.Graphics();

  shadow.ellipse(0, 24, 30, 11).fill({ color: 0x000000, alpha: 0.42 });

  body.roundRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE, 10).fill(0x1a2330);
  body.roundRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE, 10).stroke({
    color: 0xf0c26a,
    width: 2,
  });
  body.rect(-8, -18, 16, 12).fill(0xf0c26a);
  body.rect(-14, -4, 28, 24).fill(0x304457);
  body.circle(-8, -10, 3).fill(0x79f5d4);
  body.circle(8, -10, 3).fill(0x79f5d4);

  container.addChild(shadow, body);
  return { body, container, shadow };
}

function createHubSprite({
  displayHeight,
  glowTexture,
  glowHeight,
  glowTint = 0xffffff,
  hintOffsetY,
  important = false,
  position,
  shadowAlpha = 0.42,
  shadowHeight = 16,
  shadowWidth = 44,
  texture,
}: HubSpriteOptions & { glowTexture?: PIXI.Texture }): PoiVisual & { sprite: PIXI.Sprite } {
  const container = new PIXI.Container();
  const glow = glowHeight && glowTexture ? createGlowSprite(glowTexture, glowHeight, glowTint, important ? 0.34 : 0.22) : null;
  const shadow = createHubShadow(shadowWidth, shadowHeight, shadowAlpha);
  const sprite = new PIXI.Sprite(texture);
  const hint = hintOffsetY === undefined ? null : createInteractionHint(hintOffsetY);
  let isNear = false;

  shadow.position.set(0, 18);
  sprite.anchor.set(0.5, 0.78);
  sprite.roundPixels = true;
  const baseScale = setSpriteDisplayHeight(sprite, displayHeight);
  const baseGlowScale = glow?.scale.x ?? 1;
  if (glow) {
    glow.anchor.set(0.5, 0.72);
    glow.blendMode = "add";
  }

  if (glow) container.addChild(glow);
  container.addChild(shadow, sprite);
  if (hint) container.addChild(hint);
  container.position.set(position.x, position.y);
  container.zIndex = position.y;

  return {
    container,
    sprite,
    setNear: (near: boolean) => {
      isNear = near;
      if (hint) {
        hint.visible = near;
      }
    },
    update: (elapsedSeconds: number) => {
      const hover = isNear ? 1.07 : 1;
      sprite.scale.set(baseScale * hover);
      shadow.scale.set(isNear ? 1.04 : 1, 1);
      if (glow) {
        glow.alpha = (isNear ? 0.5 : important ? 0.22 : 0.14) + Math.sin(elapsedSeconds * 2.2) * 0.025;
        glow.scale.set(baseGlowScale);
      }
      if (hint) {
        hint.alpha = isNear ? 1 : 0;
      }
    },
  };
}

function createHubSpriteVisual(options: HubSpriteOptions & { glowTexture?: PIXI.Texture }): PoiVisual {
  return createHubSprite(options);
}

function renderFarmSlot(foundation: PIXI.Graphics, sprite: PIXI.Sprite, state: BuildingState) {
  foundation.clear();
  foundation.roundRect(-86, -60, 172, 112, 8).fill({
    alpha: state === "built" ? 0.12 : state === "unlocked" ? 0.22 : 0.12,
    color: state === "locked" ? 0x111111 : 0x243c30,
  });
  foundation.roundRect(-86, -60, 172, 112, 8).stroke({
    alpha: state === "built" ? 0.34 : state === "unlocked" ? 0.58 : 0.3,
    color: state === "locked" ? 0x5e5e5e : 0xf0c26a,
    width: 2,
  });
  sprite.alpha = state === "built" ? 1 : state === "unlocked" ? 0.78 : 0.42;
  sprite.tint = state === "locked" ? 0x777777 : 0xffffff;
}

function createFarmSlotVisual(textures: HubTextures, state: BuildingState) {
  const visual = createHubSprite({
    displayHeight: HUB_DISPLAY_HEIGHTS.farm,
    glowHeight: 154,
    glowTexture: textures.softGlow,
    glowTint: 0x9fdc76,
    hintOffsetY: -134,
    position: FARM_SLOT,
    shadowAlpha: 0.45,
    shadowHeight: 24,
    shadowWidth: 104,
    texture: textures.farm,
  });
  const foundation = new PIXI.Graphics();
  visual.container.addChildAt(foundation, 0);
  renderFarmSlot(foundation, visual.sprite, state);
  return {
    container: visual.container,
    render: (nextState: BuildingState) => renderFarmSlot(foundation, visual.sprite, nextState),
    setNear: visual.setNear,
    update: visual.update,
  };
}

function createBuildingSprite(options: HubSpriteOptions & { glowTexture?: PIXI.Texture }): PoiVisual {
  return createHubSpriteVisual(options);
}

function createPortalVisual(textures: HubTextures): PoiVisual {
  const container = new PIXI.Container();
  const glow = createGlowSprite(textures.softGlow, 190, 0x83f7ff, 0.24);
  const shadow = createHubShadow(86, 24, 0.46);
  const portal = new PIXI.Container();
  const base = new PIXI.Graphics();
  const outerRing = new PIXI.Graphics();
  const innerRing = new PIXI.Graphics();
  const core = new PIXI.Graphics();
  const hint = createInteractionHint(-88);
  let isNear = false;

  glow.blendMode = "add";
  glow.anchor.set(0.5, 0.58);
  shadow.position.set(0, 24);
  base.ellipse(0, 24, 72, 31).fill({ color: 0x06151f, alpha: 0.9 });
  base.ellipse(0, 24, 72, 31).stroke({ color: 0xf0c26a, alpha: 0.5, width: 3 });
  outerRing.ellipse(0, 0, 54, 78).stroke({ color: 0x83f7ff, alpha: 0.76, width: 5 });
  innerRing.ellipse(0, 0, 34, 55).stroke({ color: 0xb18cff, alpha: 0.72, width: 3 });
  core.ellipse(0, 0, 24, 42).fill({ color: 0x15427d, alpha: 0.38 });
  core.ellipse(0, 0, 18, 34).fill({ color: 0x83f7ff, alpha: 0.22 });
  portal.position.set(0, -22);
  portal.addChild(core, outerRing, innerRing);
  container.addChild(glow, shadow, base, portal, hint);
  container.position.set(PORTAL_POSITION.x, PORTAL_POSITION.y);
  container.zIndex = PORTAL_POSITION.y;

  return {
    container,
    setNear: (near: boolean) => {
      isNear = near;
      hint.visible = near;
    },
    update: (elapsedSeconds: number) => {
      const pulse = Math.sin(elapsedSeconds * 2.6) * 0.04;
      portal.scale.set(isNear ? 1.08 : 1);
      outerRing.alpha = (isNear ? 0.95 : 0.72) + pulse;
      innerRing.alpha = (isNear ? 0.88 : 0.64) - pulse;
      glow.alpha = (isNear ? 0.54 : 0.24) + Math.sin(elapsedSeconds * 2.1) * 0.035;
      hint.alpha = isNear ? 1 : 0;
    },
  };
}

function formatResourceLabel(resourceId: ResourceId) {
  return resourceId.replaceAll("_", " ");
}

function clampCornucopiaAmount(amount: number) {
  if (!Number.isFinite(amount)) return 1;
  return clamp(Math.floor(amount), 1, CORNUCOPIA_MAX_CLAIM_AMOUNT);
}

function getBuildingStatusLabel(building: { unlocked: boolean; built: boolean }) {
  if (!building.unlocked) return "Verrouillé";
  if (!building.built) return "À construire";
  return "Construit";
}

function getBuildActionLabel(building: { unlocked: boolean; built: boolean }, canBuild: boolean) {
  if (!building.unlocked) return "Verrouillé";
  if (building.built) return "Construit";
  if (!canBuild) return "Ressources insuffisantes";
  return "Construire";
}

function getEffectiveBuildingState<T extends { unlocked: boolean; built: boolean; active?: boolean }>(
  building: T,
  devMode = DEV_MODE,
): T {
  if (!devMode) return building;

  return {
    ...building,
    unlocked: true,
    active: building.built ? (building.active ?? true) : false,
  };
}

function isDevUnlocked(building: { unlocked: boolean }) {
  return DEV_MODE && !building.unlocked;
}

function getPlaceholderBuildingState(
  buildings: Record<PlaceholderBuildingId, PlaceholderBuildingStatus>,
  buildingId: PlaceholderBuildingId,
) {
  return getEffectiveBuildingState(buildings[buildingId]);
}

export function KingdomHubStage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const isModalOpenRef = useRef(false);
  const isDialogueOpenRef = useRef(false);
  const isClaimingCornucopiaRef = useRef(false);
  const nearbyInteractableIdRef = useRef<string | null>(null);
  const farmStateRef = useRef<BuildingState>("unlocked");
  const renderFarmSlotRef = useRef<((state: BuildingState) => void) | null>(null);
  const spawnWorldFxRef = useRef<SpawnWorldFx | null>(null);
  const state = useGameStore((store) => store.state);
  const dispatch = useGameStore((store) => store.dispatch);
  const showResourceGain = useResourceFeedbackStore((store) => store.showResourceGain);
  const {
    isOverlayOpen: isGameHudOverlayOpen,
    openOverlay: openGameHudOverlay,
  } = useGameHudOverlay();
  const [isCornucopiaOpen, setIsCornucopiaOpen] = useState(false);
  const [activeDialogue, setActiveDialogue] = useState<{ name: string; text: string } | null>(null);
  const [farmState, setFarmState] = useState<BuildingState>("unlocked");
  const [farmModal, setFarmModal] = useState<BuildingModalState>(null);
  const [isTempleOpen, setIsTempleOpen] = useState(false);
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [placeholderBuildingId, setPlaceholderBuildingId] = useState<PlaceholderBuildingId | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<HubOverlayId | null>(null);
  const [mountedOverlays, setMountedOverlays] = useState<Record<HubOverlayId, boolean>>({
    boto: false,
  });
  const [templeFeedback, setTempleFeedback] = useState<string | null>(null);
  const [forgeFeedback, setForgeFeedback] = useState<string | null>(null);
  const [selectedCornucopiaResource, setSelectedCornucopiaResource] = useState<ResourceId | null>(null);
  const [cornucopiaClaimAmount, setCornucopiaClaimAmount] = useState(100);
  const [isClaimingCornucopia, setIsClaimingCornucopia] = useState(false);
  const [nearbyInteractableId, setNearbyInteractableId] = useState<string | null>(null);

  const cornucopiaClaimables = useMemo(() => getCornucopiaClaimables(state), [state]);
  const selectedResource = selectedCornucopiaResource;
  const selectedResourceQuantity = selectedResource ? getQty(state.resources, selectedResource) : 0;
  const xpGlobalAvailable = getQty(state.resources, "XP_GLOBAL");
  const playerXpToNext = xpNext(state.progression.playerLevel);
  const forgeVillagerId = state.villagers.list.find((villager) => villager.stamina > 0)?.id ?? state.villagers.list[0]?.id ?? "";
  const effectiveTemple = getEffectiveBuildingState(state.buildings.temple);
  const effectiveForge = getEffectiveBuildingState(state.buildings.forge);
  const placeholderBuilding = placeholderBuildingId ? PLACEHOLDER_BUILDINGS[placeholderBuildingId] : null;
  const placeholderBuildingState = placeholderBuildingId
    ? getPlaceholderBuildingState(state.buildings, placeholderBuildingId)
    : null;
  const canBuildTemple = effectiveTemple.unlocked && !effectiveTemple.built && hasAtLeast(state.resources, TEMPLE_BUILD_COST);
  const canBuildForge = effectiveForge.unlocked && !effectiveForge.built && hasAtLeast(state.resources, FORGE_BUILD_COST);

  useEffect(() => {
    isModalOpenRef.current =
      isCornucopiaOpen ||
      farmModal !== null ||
      isTempleOpen ||
      isForgeOpen ||
      placeholderBuildingId !== null ||
      activeOverlay !== null ||
      isGameHudOverlayOpen;
    if (isCornucopiaOpen) {
      isClaimingCornucopiaRef.current = false;
      setIsClaimingCornucopia(false);
    }
  }, [activeOverlay, farmModal, isCornucopiaOpen, isForgeOpen, isGameHudOverlayOpen, isTempleOpen, placeholderBuildingId]);

  useEffect(() => {
    farmStateRef.current = farmState;
    renderFarmSlotRef.current?.(farmState);
  }, [farmState]);

  useEffect(() => {
    isDialogueOpenRef.current = activeDialogue !== null;
  }, [activeDialogue]);

  useEffect(() => {
    if (cornucopiaClaimables.length === 0) {
      setSelectedCornucopiaResource(null);
      return;
    }

    setSelectedCornucopiaResource((current) =>
      current && cornucopiaClaimables.includes(current) ? current : cornucopiaClaimables[0],
    );
  }, [cornucopiaClaimables]);

  const closeDialogue = useCallback(() => {
    isDialogueOpenRef.current = false;
    setActiveDialogue(null);
  }, []);

  const openCornucopia = useCallback(() => {
    if (isModalOpenRef.current || isDialogueOpenRef.current) return;
    spawnWorldFxRef.current?.(CORNUCOPIA_POSITION, undefined, 0x55d979);
    isModalOpenRef.current = true;
    setIsCornucopiaOpen(true);
  }, []);

  const closeFarmModal = useCallback(() => {
    isModalOpenRef.current = false;
    setFarmModal(null);
  }, []);

  const closeTempleModal = useCallback(() => {
    isModalOpenRef.current = false;
    setIsTempleOpen(false);
  }, []);

  const closeForgeModal = useCallback(() => {
    isModalOpenRef.current = false;
    setIsForgeOpen(false);
  }, []);

  const closePlaceholderBuildingModal = useCallback(() => {
    isModalOpenRef.current = false;
    setPlaceholderBuildingId(null);
  }, []);

  const closeHubOverlay = useCallback(() => {
    isModalOpenRef.current = false;
    setActiveOverlay(null);
  }, []);

  const openHubOverlay = useCallback((overlayId: HubOverlayId) => {
    if (isModalOpenRef.current || isDialogueOpenRef.current) return;
    isModalOpenRef.current = true;
    setMountedOverlays((current) => ({
      ...current,
      [overlayId]: true,
    }));
    setActiveOverlay(overlayId);
  }, []);

  const openGlobalHudOverlay = useCallback(
    (overlayId: GameHudOverlayId) => {
      if (isModalOpenRef.current || isDialogueOpenRef.current) return;
      isModalOpenRef.current = true;
      openGameHudOverlay(overlayId);
    },
    [openGameHudOverlay]
  );

  const openPlaceholderBuilding = useCallback((buildingId: PlaceholderBuildingId) => {
    if (isModalOpenRef.current || isDialogueOpenRef.current) return;
    const building = PLACEHOLDER_BUILDINGS[buildingId];
    spawnWorldFxRef.current?.(building.position, undefined, 0xf0c26a);
    isModalOpenRef.current = true;
    setPlaceholderBuildingId(buildingId);
  }, []);

  const openTemple = useCallback(() => {
    if (isModalOpenRef.current || isDialogueOpenRef.current) return;
    spawnWorldFxRef.current?.(TEMPLE_POSITION, undefined, 0x83f7ff);
    setTempleFeedback(null);
    isModalOpenRef.current = true;
    setIsTempleOpen(true);
  }, []);

  const openForge = useCallback(() => {
    if (isModalOpenRef.current || isDialogueOpenRef.current) return;
    spawnWorldFxRef.current?.(FORGE_POSITION, undefined, 0xf0c26a);
    setForgeFeedback(null);
    isModalOpenRef.current = true;
    setIsForgeOpen(true);
  }, []);

  const openFarmSlot = useCallback(() => {
    if (isModalOpenRef.current || isDialogueOpenRef.current) return;

    if (farmStateRef.current === "locked") {
      spawnWorldFxRef.current?.(FARM_SLOT, undefined, 0x777777);
      toast.error("Building not unlocked");
      return;
    }

    spawnWorldFxRef.current?.(FARM_SLOT, undefined, 0xb18cff);
    isModalOpenRef.current = true;
    setFarmModal({ state: farmStateRef.current });
  }, []);

  const handleBuildFarm = useCallback(() => {
    if (farmStateRef.current !== "unlocked") return;
    farmStateRef.current = "built";
    renderFarmSlotRef.current?.("built");
    spawnWorldFxRef.current?.(FARM_SLOT, "Built", 0xf0c26a);
    setFarmState("built");
    setFarmModal(null);
    isModalOpenRef.current = false;
  }, []);

  const handleBuildCoreBuilding = useCallback(
    (buildingId: Extract<BuildingId, "TEMPLE" | "FORGE">) => {
      const result = buildBuilding(useGameStore.getState().state, buildingId, { allowLocked: DEV_MODE });
      if (!result.ok) {
        toast.error(`Build failed: ${result.reason}`);
        return;
      }

      dispatch(() => result.next);
      const position = buildingId === "TEMPLE" ? TEMPLE_POSITION : FORGE_POSITION;
      const label = buildingId === "TEMPLE" ? "Temple built" : "Forge built";
      spawnWorldFxRef.current?.(position, "Built", buildingId === "TEMPLE" ? 0x83f7ff : 0xf0c26a);

      if (buildingId === "TEMPLE") {
        setTempleFeedback(label);
      } else {
        setForgeFeedback(label);
      }
      toast.success(label);
    },
    [dispatch],
  );

  const handleTempleConvert = useCallback(
    (target: TempleXpTarget) => {
      const amount = getQty(useGameStore.getState().state.resources, "XP_GLOBAL");
      if (amount <= 0) {
        toast.error("No XP_GLOBAL available");
        return;
      }

      const result = convertTempleGlobalXp(useGameStore.getState().state, target, amount, { allowLocked: DEV_MODE });
      if (!result.ok) {
        toast.error(`Temple conversion failed: ${result.reason}`);
        return;
      }

      dispatch(() => result.next);
      spawnWorldFxRef.current?.(TEMPLE_POSITION, `-${result.amount} XP`, target === "playerXp" ? 0x83f7ff : 0xb18cff);
      const feedback =
        target === "playerXp"
          ? `Converted ${result.amount} XP_GLOBAL to Player XP${
              result.player?.leveledUp ? ` (+${result.player.levelsGained} level)` : ""
            }.`
          : `Converted ${result.amount} XP_GLOBAL to ${result.amount} World WXP. Rank up remains available in the Forum.`;
      setTempleFeedback(feedback);
      toast.success(feedback);
    },
    [dispatch],
  );

  const handleForgeCraft = useCallback(
    (recipe: ForgeRecipe) => {
      if (!hasAtLeast(useGameStore.getState().state.resources, recipe.cost)) {
        toast.error("Not enough resources");
        return;
      }

      const currentState = useGameStore.getState().state;
      const villagerId = currentState.villagers.list.find((villager) => villager.stamina > 0)?.id ?? currentState.villagers.list[0]?.id;
      if (!villagerId) {
        toast.error("No villager available");
        return;
      }

      const result = forgeCraft(currentState, recipe.id, villagerId, { allowLocked: DEV_MODE });
      if (!result.ok) {
        toast.error(`Forge failed: ${result.reason}`);
        return;
      }

      const createdItem = result.next.inventory.items.find((item) => item.id === result.createdItemId);
      dispatch(() => result.next);
      spawnWorldFxRef.current?.(FORGE_POSITION, "Forged", 0xf0c26a);

      if (createdItem && isEquipmentItem(createdItem)) {
        const feedback = `${createdItem.name} crafted (${createdItem.slot}, ilvl ${createdItem.itemLevel ?? createdItem.ilvl ?? 1}).`;
        setForgeFeedback(feedback);
        toast.success(feedback);
        return;
      }

      setForgeFeedback(`${recipe.label} crafted.`);
      toast.success(`${recipe.label} crafted`);
    },
    [dispatch],
  );

  const openVillagerDialogue = useCallback(() => {
    if (isModalOpenRef.current || isDialogueOpenRef.current) return;
    spawnWorldFxRef.current?.(VILLAGER_NPC, undefined, 0x7df7ff);
    isDialogueOpenRef.current = true;
    setActiveDialogue({
      name: VILLAGER_NPC.label,
      text: VILLAGER_NPC.text,
    });
  }, []);

  const handleClaimCornucopia = useCallback(() => {
    if (isClaimingCornucopiaRef.current) return;

    if (!selectedResource) {
      toast.error("No Cornucopia resource available");
      return;
    }

    isClaimingCornucopiaRef.current = true;
    setIsClaimingCornucopia(true);

    const amount = clampCornucopiaAmount(cornucopiaClaimAmount);
    setCornucopiaClaimAmount(amount);

    const result = claimCornucopia(useGameStore.getState().state, { resourceId: selectedResource, amount });

    if (!result.ok) {
      toast.error(`Cornucopia claim failed: ${result.error}`);
      isClaimingCornucopiaRef.current = false;
      setIsClaimingCornucopia(false);
      return;
    }

    dispatch(() => result.next);
    showResourceGain({ amount: result.amount, resourceId: result.resourceId });
    spawnWorldFxRef.current?.(CORNUCOPIA_POSITION, `+${result.amount} ${result.resourceId}`, 0x55d979);
    toast.success(`Claimed ${result.amount} ${result.resourceId}`);
    isClaimingCornucopiaRef.current = false;
    setIsClaimingCornucopia(false);
  }, [cornucopiaClaimAmount, dispatch, selectedResource, showResourceGain]);

  useEffect(() => {
    const hostElement = hostRef.current;
    if (!hostElement) return;
    const resizeTarget: HTMLElement = hostElement;

    let cancelled = false;
    let initialized = false;
    const pressedKeys = new Set<string>();
    const app = new PIXI.Application();
    const world = new PIXI.Container();
    const backgroundLayer = new PIXI.Container();
    const entityLayer = new PIXI.Container();
    const fxLayer = new PIXI.Container();
    const uiLayer = new PIXI.Container();
    const playerVisual = drawPlayer();
    const player = playerVisual.container;
    const playerPosition = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
    const playerFacing = { x: 0, y: -1 };
    const poiVisuals = new Map<string, PoiVisual>();
    const floatingTexts: FloatingTextFx[] = [];
    const particles: ParticleFx[] = [];
    const solidColliders: HubCollider[] = [];
    let sparkleTexture: PIXI.Texture | null = null;
    const interactables: Interactable[] = [
      {
        id: "forum",
        label: "Forum",
        type: "building",
        x: FORUM_POSITION.x,
        y: FORUM_POSITION.y,
        radius: 138,
        onInteract: () => openPlaceholderBuilding("forum"),
      },
      {
        id: "cornucopia",
        label: "Cornucopia",
        type: "building",
        x: CORNUCOPIA_POSITION.x,
        y: CORNUCOPIA_POSITION.y,
        radius: 118,
        onInteract: openCornucopia,
      },
      {
        id: "portal",
        label: "Portail",
        type: "building",
        x: PORTAL_POSITION.x,
        y: PORTAL_POSITION.y,
        radius: 112,
        onInteract: () => openGlobalHudOverlay("worlds"),
      },
      {
        id: "temple",
        label: "Temple",
        type: "building",
        x: TEMPLE_POSITION.x,
        y: TEMPLE_POSITION.y,
        radius: 122,
        onInteract: openTemple,
      },
      {
        id: "forge",
        label: "Forge",
        type: "building",
        x: FORGE_POSITION.x,
        y: FORGE_POSITION.y,
        radius: 112,
        onInteract: openForge,
      },
      {
        id: "mine",
        label: "Mine",
        type: "building",
        x: MINE_POSITION.x,
        y: MINE_POSITION.y,
        radius: 116,
        onInteract: () => openPlaceholderBuilding("mine"),
      },
      {
        id: "kitchen",
        label: "Kitchen",
        type: "building",
        x: KITCHEN_POSITION.x,
        y: KITCHEN_POSITION.y,
        radius: 108,
        onInteract: () => openPlaceholderBuilding("kitchen"),
      },
      {
        id: FARM_SLOT.id,
        label: FARM_SLOT.label,
        type: "building_slot",
        x: FARM_SLOT.x,
        y: FARM_SLOT.y,
        radius: 104,
        onInteract: openFarmSlot,
      },
      {
        id: VILLAGER_NPC.id,
        label: VILLAGER_NPC.label,
        type: "npc",
        x: VILLAGER_NPC.x,
        y: VILLAGER_NPC.y,
        radius: 96,
        onInteract: openVillagerDialogue,
      },
      {
        id: BOTO_NPC.id,
        label: BOTO_NPC.label,
        type: "npc",
        x: BOTO_NPC.x,
        y: BOTO_NPC.y,
        radius: 92,
        onInteract: () => openHubOverlay("boto"),
      },
    ];

    function setNearby(id: string | null) {
      if (nearbyInteractableIdRef.current === id) return;
      nearbyInteractableIdRef.current = id;
      for (const [visualId, visual] of poiVisuals) {
        visual.setNear(visualId === id);
      }
      setNearbyInteractableId(id);
    }

    function getNearbyInteractable() {
      let nearest: Interactable | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (const interactable of interactables) {
        const distance = distanceBetween(playerPosition, interactable);
        if (distance > interactable.radius || distance >= nearestDistance) continue;
        nearest = interactable;
        nearestDistance = distance;
      }

      return nearest;
    }

    function updateNearbyInteractable() {
      setNearby(getNearbyInteractable()?.id ?? null);
    }

    function collidesWithBuilding(position: Vector2) {
      const playerCollider = getPlayerCollider(position);
      return solidColliders.some((collider) => rectsOverlap(playerCollider, collider));
    }

    function movePlayerWithCollisions(deltaX: number, deltaY: number) {
      const nextX = clamp(playerPosition.x + deltaX, PLAYER_SIZE / 2, MAP_WIDTH - PLAYER_SIZE / 2);
      if (!collidesWithBuilding({ x: nextX, y: playerPosition.y })) {
        playerPosition.x = nextX;
      }

      const nextY = clamp(playerPosition.y + deltaY, PLAYER_SIZE / 2, MAP_HEIGHT - PLAYER_SIZE / 2);
      if (!collidesWithBuilding({ x: playerPosition.x, y: nextY })) {
        playerPosition.y = nextY;
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isDialogueOpenRef.current) {
        if (!event.repeat && (isInteractionKey(event) || event.code === "Escape")) {
          event.preventDefault();
          closeDialogue();
        }
        return;
      }

      if (isModalOpenRef.current) return;

      if (isInteractionKey(event) && !event.repeat) {
        const nearby = getNearbyInteractable();
        if (nearby) {
          event.preventDefault();
          nearby.onInteract();
        }
        return;
      }

      if (!KEY_DIRECTIONS[event.code]) return;

      pressedKeys.add(event.code);
      event.preventDefault();
    }

    function handleKeyUp(event: KeyboardEvent) {
      pressedKeys.delete(event.code);
    }

    function handleWindowBlur() {
      pressedKeys.clear();
    }

    function spawnWorldFx(position: Vector2, label?: string, color = 0xf0c26a) {
      if (label) {
        const text = new PIXI.Text({
          style: {
            align: "center",
            dropShadow: {
              alpha: 0.85,
              blur: 3,
              color: 0x000000,
              distance: 2,
            },
            fill: color,
            fontFamily: "serif",
            fontSize: 16,
            fontWeight: "700",
          },
          text: label,
        });
        text.anchor.set(0.5);
        text.position.set(position.x, position.y - 72);
        fxLayer.addChild(text);
        floatingTexts.push({ age: 0, duration: 1.1, node: text, startY: text.y });
      }

      for (let i = 0; i < 14; i += 1) {
        const angle = (Math.PI * 2 * i) / 14;
        const speed = 42 + (i % 4) * 18;
        const particle = sparkleTexture ? new PIXI.Sprite(sparkleTexture) : new PIXI.Graphics();
        if (particle instanceof PIXI.Sprite) {
          particle.anchor.set(0.5);
          particle.tint = color;
          particle.scale.set(0.09 + (i % 3) * 0.018);
        } else {
          particle.circle(0, 0, 3 + (i % 3)).fill({ color, alpha: 0.82 });
        }
        particle.position.set(position.x, position.y);
        fxLayer.addChild(particle);
        particles.push({
          age: 0,
          duration: 0.62,
          node: particle,
          velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - 22 },
        });
      }
    }

    function updateFx(deltaSeconds: number) {
      for (let i = floatingTexts.length - 1; i >= 0; i -= 1) {
        const fx = floatingTexts[i];
        fx.age += deltaSeconds;
        const progress = clamp(fx.age / fx.duration, 0, 1);
        fx.node.y = fx.startY - progress * 42;
        fx.node.alpha = 1 - progress;
        fx.node.scale.set(1 + progress * 0.16);

        if (progress >= 1) {
          fx.node.destroy();
          floatingTexts.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const fx = particles[i];
        fx.age += deltaSeconds;
        const progress = clamp(fx.age / fx.duration, 0, 1);
        fx.node.position.set(
          fx.node.x + fx.velocity.x * deltaSeconds,
          fx.node.y + fx.velocity.y * deltaSeconds,
        );
        fx.velocity.y += 72 * deltaSeconds;
        fx.node.alpha = 1 - progress;
        fx.node.scale.set(1 - progress * 0.55);

        if (progress >= 1) {
          fx.node.destroy();
          particles.splice(i, 1);
        }
      }
    }

    let tickerCallback: ((ticker: PIXI.Ticker) => void) | null = null;
    let destroyed = false;

    function destroyPixiApp() {
      if (destroyed) return;
      destroyed = true;
      app.destroy(true, { children: true });
    }

    async function setup() {
      await app.init({
        antialias: true,
        autoDensity: true,
        backgroundAlpha: 0,
        resizeTo: resizeTarget,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });
      initialized = true;

      if (cancelled) {
        destroyPixiApp();
        return;
      }

      await PIXI.Assets.load(Object.values(HUB_ASSETS));
      const textures = getHubTextures();
      sparkleTexture = textures.sparkle;

      if (cancelled) {
        destroyPixiApp();
        return;
      }

      resizeTarget.appendChild(app.canvas);
      app.stage.addChild(world, uiLayer);
      world.addChild(backgroundLayer, entityLayer, fxLayer);
      entityLayer.sortableChildren = true;
      drawWorld(backgroundLayer, textures);

      solidColliders.push(
        createGroundCollider({
          displayHeight: HUB_DISPLAY_HEIGHTS.forum,
          heightRatio: 0.3,
          id: "forum",
          offsetY: 26,
          position: FORUM_POSITION,
          texture: textures.forum,
          widthRatio: 0.72,
        }),
        createGroundCollider({
          displayHeight: HUB_DISPLAY_HEIGHTS.temple,
          heightRatio: 0.34,
          id: "temple",
          offsetY: 22,
          position: TEMPLE_POSITION,
          texture: textures.temple,
          widthRatio: 0.66,
        }),
        createGroundCollider({
          displayHeight: HUB_DISPLAY_HEIGHTS.mine,
          heightRatio: 0.34,
          id: "mine",
          offsetY: 18,
          position: MINE_POSITION,
          texture: textures.mine,
          widthRatio: 0.74,
        }),
        createGroundCollider({
          displayHeight: HUB_DISPLAY_HEIGHTS.kitchen,
          heightRatio: 0.32,
          id: "kitchen",
          offsetY: 18,
          position: KITCHEN_POSITION,
          texture: textures.kitchen,
          widthRatio: 0.68,
        }),
        createGroundCollider({
          displayHeight: HUB_DISPLAY_HEIGHTS.forge,
          heightRatio: 0.34,
          id: "forge",
          offsetY: 20,
          position: FORGE_POSITION,
          texture: textures.forge,
          widthRatio: 0.7,
        }),
        createGroundCollider({
          displayHeight: HUB_DISPLAY_HEIGHTS.farm,
          heightRatio: 0.3,
          id: FARM_SLOT.id,
          offsetY: 20,
          position: FARM_SLOT,
          texture: textures.farm,
          widthRatio: 0.72,
        }),
        createGroundCollider({
          displayHeight: HUB_DISPLAY_HEIGHTS.cornucopia,
          heightRatio: 0.34,
          id: "cornucopia",
          offsetY: 12,
          position: CORNUCOPIA_POSITION,
          texture: textures.cornucopia,
          widthRatio: 0.68,
        }),
      );

      if (DEV_MODE && SHOW_HUB_COLLIDER_DEBUG) {
        entityLayer.addChild(drawColliderDebug(solidColliders));
      }

      const forumVisual = createBuildingSprite({
        displayHeight: HUB_DISPLAY_HEIGHTS.forum,
        glowHeight: 238,
        glowTexture: textures.softGlow,
        glowTint: 0xb18cff,
        hintOffsetY: -168,
        important: true,
        position: FORUM_POSITION,
        shadowAlpha: 0.48,
        shadowHeight: 30,
        shadowWidth: 132,
        texture: textures.forum,
      });
      poiVisuals.set("forum", forumVisual);
      entityLayer.addChild(forumVisual.container);

      const templeVisual = createBuildingSprite({
        displayHeight: HUB_DISPLAY_HEIGHTS.temple,
        glowHeight: 206,
        glowTexture: textures.softGlow,
        glowTint: 0x83f7ff,
        hintOffsetY: -142,
        important: true,
        position: TEMPLE_POSITION,
        shadowAlpha: 0.45,
        shadowHeight: 25,
        shadowWidth: 104,
        texture: textures.temple,
      });
      poiVisuals.set("temple", templeVisual);
      entityLayer.addChild(templeVisual.container);

      const mineVisual = createBuildingSprite({
        displayHeight: HUB_DISPLAY_HEIGHTS.mine,
        hintOffsetY: -126,
        position: MINE_POSITION,
        shadowAlpha: 0.48,
        shadowHeight: 24,
        shadowWidth: 108,
        texture: textures.mine,
      });
      poiVisuals.set("mine", mineVisual);
      entityLayer.addChild(mineVisual.container);

      const kitchenVisual = createBuildingSprite({
        displayHeight: HUB_DISPLAY_HEIGHTS.kitchen,
        hintOffsetY: -120,
        position: KITCHEN_POSITION,
        shadowAlpha: 0.45,
        shadowHeight: 23,
        shadowWidth: 96,
        texture: textures.kitchen,
      });
      poiVisuals.set("kitchen", kitchenVisual);
      entityLayer.addChild(kitchenVisual.container);

      const forgeVisual = createBuildingSprite({
        displayHeight: HUB_DISPLAY_HEIGHTS.forge,
        hintOffsetY: -128,
        position: FORGE_POSITION,
        shadowAlpha: 0.48,
        shadowHeight: 24,
        shadowWidth: 106,
        texture: textures.forge,
      });
      poiVisuals.set("forge", forgeVisual);
      entityLayer.addChild(forgeVisual.container);

      const cornucopiaVisual = createHubSpriteVisual({
        displayHeight: HUB_DISPLAY_HEIGHTS.cornucopia,
        glowHeight: 146,
        glowTexture: textures.softGlow,
        glowTint: 0xd2a4ff,
        hintOffsetY: -84,
        important: true,
        position: CORNUCOPIA_POSITION,
        shadowHeight: 16,
        shadowWidth: 62,
        texture: textures.cornucopia,
      });
      poiVisuals.set("cornucopia", cornucopiaVisual);
      entityLayer.addChild(cornucopiaVisual.container);

      const portalVisual = createPortalVisual(textures);
      poiVisuals.set("portal", portalVisual);
      entityLayer.addChild(portalVisual.container);

      const farmSlot = createFarmSlotVisual(textures, farmStateRef.current);
      renderFarmSlotRef.current = farmSlot.render;
      poiVisuals.set(FARM_SLOT.id, farmSlot);
      entityLayer.addChild(farmSlot.container);

      const villagerVisual = createHubSpriteVisual({
        displayHeight: 70,
        glowHeight: 82,
        glowTexture: textures.softGlow,
        glowTint: 0x7df7ff,
        hintOffsetY: -72,
        position: VILLAGER_NPC,
        shadowHeight: 9,
        shadowWidth: 24,
        texture: textures.npcVillager,
      });
      const botoVisual = createHubSpriteVisual({
        displayHeight: 78,
        glowHeight: 92,
        glowTexture: textures.softGlow,
        glowTint: 0x55d979,
        hintOffsetY: -78,
        position: BOTO_NPC,
        shadowHeight: 10,
        shadowWidth: 28,
        texture: textures.npcVillager,
      });
      poiVisuals.set(BOTO_NPC.id, botoVisual);
      entityLayer.addChild(botoVisual.container);

      poiVisuals.set(VILLAGER_NPC.id, villagerVisual);
      entityLayer.addChild(villagerVisual.container);
      entityLayer.addChild(player);
      player.position.set(playerPosition.x, playerPosition.y);
      spawnWorldFxRef.current = spawnWorldFx;
      updateNearbyInteractable();

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      window.addEventListener("blur", handleWindowBlur);

      const updateHub = (ticker: PIXI.Ticker) => {
        const deltaSeconds = Math.min(ticker.deltaMS / 1000, 0.05);
        const elapsedSeconds = ticker.lastTime / 1000;
        let directionX = 0;
        let directionY = 0;

        if (!isModalOpenRef.current) {
          for (const key of pressedKeys) {
            const direction = KEY_DIRECTIONS[key];
            if (!direction) continue;
            directionX += direction.x;
            directionY += direction.y;
          }
        }

        if (directionX !== 0 || directionY !== 0) {
          const length = Math.hypot(directionX, directionY) || 1;
          playerFacing.x = directionX / length;
          playerFacing.y = directionY / length;
          movePlayerWithCollisions(
            (directionX / length) * PLAYER_SPEED * deltaSeconds,
            (directionY / length) * PLAYER_SPEED * deltaSeconds,
          );
          player.position.set(playerPosition.x, playerPosition.y);
          player.rotation = Math.atan2(playerFacing.y, playerFacing.x) + Math.PI / 2;
          updateNearbyInteractable();
        }

        const breathing = 1 + Math.sin(elapsedSeconds * 2.4) * 0.025;
        playerVisual.body.scale.set(breathing);
        playerVisual.shadow.scale.set(1 + Math.sin(elapsedSeconds * 2.4 + Math.PI) * 0.045, 1);

        for (const visual of poiVisuals.values()) {
          visual.update(elapsedSeconds);
        }
        updateFx(deltaSeconds);

        const screenWidth = app.renderer.width / app.renderer.resolution;
        const screenHeight = app.renderer.height / app.renderer.resolution;
        const cameraX = clamp(playerPosition.x - screenWidth / 2, 0, Math.max(0, MAP_WIDTH - screenWidth));
        const cameraY = clamp(playerPosition.y - screenHeight / 2, 0, Math.max(0, MAP_HEIGHT - screenHeight));
        world.position.set(-cameraX, -cameraY);
        player.zIndex = playerPosition.y;
      };

      tickerCallback = updateHub;
      app.ticker.add(updateHub);
    }

    void setup();

    return () => {
      cancelled = true;
      if (tickerCallback) {
        app.ticker?.remove?.(tickerCallback);
        tickerCallback = null;
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      pressedKeys.clear();
      nearbyInteractableIdRef.current = null;
      renderFarmSlotRef.current = null;
      spawnWorldFxRef.current = null;
      for (const fx of floatingTexts) {
        fx.node.destroy();
      }
      floatingTexts.length = 0;
      for (const fx of particles) {
        fx.node.destroy();
      }
      particles.length = 0;
      poiVisuals.clear();
      if (initialized && !destroyed) {
        destroyPixiApp();
      }
    };
  }, [
    closeDialogue,
    openCornucopia,
    openFarmSlot,
    openForge,
    openGlobalHudOverlay,
    openHubOverlay,
    openPlaceholderBuilding,
    openTemple,
    openVillagerDialogue,
  ]);

  return (
    <section className="relative h-[calc(100vh-1rem)] min-h-[34rem] overflow-hidden rounded-xl border border-amber-200/25 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.48)]">
      <div ref={hostRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute left-3 right-3 top-3 z-20">
        <GameHud
          onOpenCharacter={() => openGlobalHudOverlay("character")}
          onOpenInventory={() => openGlobalHudOverlay("inventory")}
          onOpenSettings={() => openGlobalHudOverlay("settings")}
          onOpenSkills={() => openGlobalHudOverlay("skills")}
          onOpenWorlds={() => openGlobalHudOverlay("worlds")}
        />
      </div>

      {nearbyInteractableId ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 translate-y-20 rounded-md border border-amber-200/45 bg-black/70 px-4 py-2 font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-50 shadow-[0_0_24px_rgba(240,194,106,0.16)]">
          Press F
        </div>
      ) : null}

      {activeDialogue ? (
        <KingdomDialogueBox name={activeDialogue.name} onClose={closeDialogue} text={activeDialogue.text} />
      ) : null}

      {activeOverlay === "boto" ? (
        <KingdomOverlay onCloseAction={closeHubOverlay} open title={HUB_OVERLAYS.boto.title}>
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-xl border border-emerald-300/20 bg-black/50 p-4 text-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/10 text-4xl">
                🤖
              </div>
              <div className="mt-3 font-ik-title text-lg text-emerald-100">Boto Unit</div>
              <div className="mt-1 font-ik-menu text-xs uppercase tracking-[0.16em] text-emerald-300/70">
                Link established
              </div>
            </div>

            <div className="rounded-xl border border-emerald-300/20 bg-black/70 p-4">
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-emerald-300">
                &gt; BOTO
              </div>
              <p className="mt-3 font-ik-body text-sm text-emerald-50/90">
                Explorer. Analyser. Récolter... C'était quoi déjà ?
              </p>
              <p className="mt-2 font-ik-body text-sm text-muted-foreground">
                En attente d'instructions complémentaires. Mise en veille dans 5, 4, 3...
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  className="rounded-md border border-emerald-300/25 bg-emerald-500/10 px-4 py-2 font-ik-menu text-xs uppercase tracking-[0.12em] text-emerald-50 transition hover:border-emerald-200 hover:bg-emerald-500/16"
                  type="button"
                >
                  Qu'est-ce que c'est que ce truc ?
                </button>
                <button
                  className="rounded-md border border-emerald-300/25 bg-emerald-500/10 px-4 py-2 font-ik-menu text-xs uppercase tracking-[0.12em] text-emerald-50 transition hover:border-emerald-200 hover:bg-emerald-500/16"
                  type="button"
                >
                  Hé ! Toi, t'es un robot ! Mais c'est génial !
                </button>
              </div>
            </div>
          </div>
        </KingdomOverlay>
      ) : null}

      <Dialog
        open={placeholderBuildingId !== null}
        onOpenChange={(open) => {
          if (!open) closePlaceholderBuildingModal();
        }}
      >
        <DialogContent className="max-w-md border-amber-200/25 bg-zinc-950 text-amber-50">
          <DialogHeader>
            <DialogTitle>{placeholderBuilding?.label ?? "Building"}</DialogTitle>
            <DialogDescription>Coming Soon</DialogDescription>
          </DialogHeader>

          {placeholderBuilding ? (
            <div className="mt-4 space-y-4">
              <div className="flex justify-center rounded-md border border-amber-200/15 bg-black/35 p-5">
                <img
                  alt=""
                  aria-hidden="true"
                  className="h-32 w-auto object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]"
                  src={placeholderBuilding.asset}
                />
              </div>

              {placeholderBuildingState ? (
                <div className="rounded-md border border-amber-200/15 bg-black/35 p-3">
                  <div className="text-xs uppercase tracking-[0.14em] text-amber-100/70">Status</div>
                  <div className="mt-1 flex items-center gap-2 font-ik-menu text-lg text-amber-50">
                    {getBuildingStatusLabel(placeholderBuildingState)}
                    {placeholderBuildingId && isDevUnlocked(state.buildings[placeholderBuildingId]) ? (
                      <span className="rounded border border-amber-200/20 bg-amber-400/10 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-amber-100">
                        DEV UNLOCK
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="rounded-md border border-amber-200/15 bg-black/35 p-3 font-ik-title text-lg text-amber-50">
                Coming Soon
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <button
              className="rounded-md border border-border/70 bg-muted/30 px-4 py-2 font-ik-menu text-sm text-muted-foreground transition hover:bg-muted/45"
              onClick={closePlaceholderBuildingModal}
              type="button"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCornucopiaOpen} onOpenChange={setIsCornucopiaOpen}>
        <DialogContent className="max-w-3xl border-amber-200/25 bg-zinc-950 text-amber-50">
          <DialogHeader>
            <DialogTitle>Cornucopia</DialogTitle>
            <DialogDescription>Dev resource console for fast Kingdom testing.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="max-h-[24rem] overflow-y-auto rounded-md border border-amber-200/15 bg-black/35 p-2">
              <div className="space-y-1">
                {cornucopiaClaimables.map((resourceId) => {
                  const isSelected = resourceId === selectedResource;

                  return (
                    <button
                      className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left transition ${
                        isSelected
                          ? "border border-amber-200/55 bg-amber-500/18 text-amber-50 shadow-[0_0_18px_rgba(240,194,106,0.12)]"
                          : "border border-transparent text-muted-foreground hover:border-amber-200/20 hover:bg-amber-500/8 hover:text-amber-50"
                      }`}
                      key={resourceId}
                      onClick={() => setSelectedCornucopiaResource(resourceId)}
                      type="button"
                    >
                      <img alt="" aria-hidden="true" className="h-6 w-6 shrink-0" src={getResourceAssetPath(resourceId)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-ik-menu text-xs uppercase tracking-[0.12em]">
                          {formatResourceLabel(resourceId)}
                        </span>
                        <span className="block font-ik-body text-xs text-muted-foreground">
                          Owned {getQty(state.resources, resourceId)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-md border border-amber-200/18 bg-black/45 p-4">
              {selectedResource ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      alt=""
                      aria-hidden="true"
                      className="h-10 w-10"
                      src={getResourceAssetPath(selectedResource)}
                    />
                    <div>
                      <div className="font-ik-title text-base text-amber-50">{formatResourceLabel(selectedResource)}</div>
                      <div className="font-ik-body text-xs text-muted-foreground">Owned {selectedResourceQuantity}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-amber-100/70">Quantity</div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 10, 100, 1000].map((amount) => (
                        <button
                          className="rounded border border-amber-200/20 bg-amber-500/10 px-2 py-1 font-ik-menu text-xs text-amber-50 transition hover:border-amber-200/45 hover:bg-amber-500/18"
                          key={amount}
                          onClick={() => setCornucopiaClaimAmount(amount)}
                          type="button"
                        >
                          +{amount}
                        </button>
                      ))}
                    </div>
                    <input
                      className="w-full rounded-md border border-amber-200/20 bg-black/40 px-3 py-2 font-ik-menu text-sm text-amber-50 outline-none transition focus:border-amber-200/55"
                      max={CORNUCOPIA_MAX_CLAIM_AMOUNT}
                      min={1}
                      onChange={(event) => {
                        setCornucopiaClaimAmount(clampCornucopiaAmount(Number(event.target.value)));
                      }}
                      type="number"
                      value={cornucopiaClaimAmount}
                    />
                  </div>

                  <button
                    className="w-full rounded-md border border-amber-300/45 bg-amber-500/18 px-4 py-2 font-ik-menu text-sm text-amber-50 transition hover:border-amber-200 hover:bg-amber-500/24 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isClaimingCornucopia}
                    onClick={handleClaimCornucopia}
                    type="button"
                  >
                    Claim Resources
                  </button>
                </div>
              ) : (
                <div className="font-ik-body text-sm text-muted-foreground">No resource selected</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <button
              className="rounded-md border border-border/70 bg-muted/30 px-4 py-2 font-ik-menu text-sm text-muted-foreground transition hover:bg-muted/45"
              onClick={() => setIsCornucopiaOpen(false)}
              type="button"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTempleOpen}
        onOpenChange={(open) => {
          if (!open) closeTempleModal();
        }}
      >
        <DialogContent className="border-cyan-200/25 bg-zinc-950 text-cyan-50">
          <DialogHeader>
            <DialogTitle>Temple</DialogTitle>
            <DialogDescription>Convert XP_GLOBAL into Player XP or banked World WXP at a 1:1 rate.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-3 font-ik-body text-sm text-muted-foreground sm:grid-cols-3">
            <div className="rounded-md border border-cyan-200/15 bg-black/35 p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Status</div>
              <div className="mt-1 flex items-center gap-2 font-ik-menu text-lg text-cyan-50">
                {getBuildingStatusLabel(effectiveTemple)}
                {isDevUnlocked(state.buildings.temple) ? (
                  <span className="rounded border border-cyan-200/20 bg-cyan-400/10 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-cyan-100">
                    DEV UNLOCK
                  </span>
                ) : null}
              </div>
            </div>
            <div className="rounded-md border border-cyan-200/15 bg-black/35 p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">XP_GLOBAL</div>
              <div className="mt-1 font-ik-menu text-lg text-cyan-50">{xpGlobalAvailable}</div>
            </div>
            <div className="rounded-md border border-cyan-200/15 bg-black/35 p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Player</div>
              <div className="mt-1 font-ik-menu text-sm text-cyan-50">
                Level {state.progression.playerLevel} · XP {state.progression.playerXp}
                {playerXpToNext > 0 ? `/${playerXpToNext}` : ""}
              </div>
            </div>
            <div className="rounded-md border border-cyan-200/15 bg-black/35 p-3 sm:col-span-3">
              <div className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">World</div>
              <div className="mt-1 font-ik-menu text-sm text-cyan-50">
                Level {state.progression.worldLevel} · WXP {state.progression.worldWxp}
              </div>
            </div>
          </div>

          {!effectiveTemple.built ? (
            <div className="mt-3 rounded-md border border-cyan-200/20 bg-black/35 p-3">
              <div className="font-ik-title text-sm text-cyan-50">Construction</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.entries(TEMPLE_BUILD_COST) as Array<[ResourceId, number]>).map(([resourceId, amount]) => (
                  <span
                    className="inline-flex items-center gap-1 rounded border border-cyan-200/15 bg-black/40 px-2 py-1 font-ik-menu text-xs text-cyan-50"
                    key={resourceId}
                  >
                    <img alt="" aria-hidden="true" className="h-4 w-4" src={getResourceAssetPath(resourceId)} />
                    {formatResourceLabel(resourceId)} {amount}
                  </span>
                ))}
              </div>
              <button
                className="mt-3 rounded-md border border-cyan-300/45 bg-cyan-500/14 px-4 py-2 font-ik-menu text-sm text-cyan-50 transition hover:border-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canBuildTemple}
                onClick={() => handleBuildCoreBuilding("TEMPLE")}
                type="button"
              >
                {getBuildActionLabel(effectiveTemple, canBuildTemple)}
              </button>
            </div>
          ) : null}

          {templeFeedback ? (
            <div className="mt-3 rounded-md border border-cyan-200/20 bg-cyan-400/10 p-3 font-ik-body text-sm text-cyan-50">
              {templeFeedback}
            </div>
          ) : null}

          <DialogFooter>
            <button
              className="rounded-md border border-border/70 bg-muted/30 px-4 py-2 font-ik-menu text-sm text-muted-foreground transition hover:bg-muted/45"
              onClick={closeTempleModal}
              type="button"
            >
              Close
            </button>
            <button
              className="rounded-md border border-cyan-300/45 bg-cyan-500/14 px-4 py-2 font-ik-menu text-sm text-cyan-50 transition hover:border-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!effectiveTemple.built || xpGlobalAvailable <= 0}
              onClick={() => handleTempleConvert("playerXp")}
              type="button"
            >
              Convert to Player XP
            </button>
            <button
              className="rounded-md border border-violet-300/45 bg-violet-500/14 px-4 py-2 font-ik-menu text-sm text-violet-50 transition hover:border-violet-200 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!effectiveTemple.built || xpGlobalAvailable <= 0}
              onClick={() => handleTempleConvert("worldWxp")}
              type="button"
            >
              Convert to World WXP (1:1)
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isForgeOpen}
        onOpenChange={(open) => {
          if (!open) closeForgeModal();
        }}
      >
        <DialogContent className="max-w-2xl border-amber-200/25 bg-zinc-950 text-amber-50">
          <DialogHeader>
            <DialogTitle>Forge</DialogTitle>
            <DialogDescription>Craft deterministic MVP equipment from mined ore.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 rounded-md border border-amber-200/15 bg-black/35 p-3">
            <div className="text-xs uppercase tracking-[0.14em] text-amber-100/70">Status</div>
            <div className="mt-1 flex items-center gap-2 font-ik-menu text-lg text-amber-50">
              {getBuildingStatusLabel(effectiveForge)}
              {isDevUnlocked(state.buildings.forge) ? (
                <span className="rounded border border-amber-200/20 bg-amber-400/10 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-amber-100">
                  DEV UNLOCK
                </span>
              ) : null}
            </div>
          </div>

          {!effectiveForge.built ? (
            <div className="mt-3 rounded-md border border-amber-200/20 bg-black/35 p-3">
              <div className="font-ik-title text-sm text-amber-50">Construction</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.entries(FORGE_BUILD_COST) as Array<[ResourceId, number]>).map(([resourceId, amount]) => (
                  <span
                    className="inline-flex items-center gap-1 rounded border border-amber-200/15 bg-black/40 px-2 py-1 font-ik-menu text-xs text-amber-50"
                    key={resourceId}
                  >
                    <img alt="" aria-hidden="true" className="h-4 w-4" src={getResourceAssetPath(resourceId)} />
                    {formatResourceLabel(resourceId)} {amount}
                  </span>
                ))}
              </div>
              <button
                className="mt-3 rounded-md border border-amber-300/45 bg-amber-500/18 px-4 py-2 font-ik-menu text-sm text-amber-50 transition hover:border-amber-200 hover:bg-amber-500/24 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canBuildForge}
                onClick={() => handleBuildCoreBuilding("FORGE")}
                type="button"
              >
                {getBuildActionLabel(effectiveForge, canBuildForge)}
              </button>
            </div>
          ) : null}

          {effectiveForge.built ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {FORGE_MVP_RECIPES.map((recipe) => {
                const hasRecipeResources = hasAtLeast(state.resources, recipe.cost);
                const canCraft = hasRecipeResources && forgeVillagerId.length > 0;
                const craftLabel = canCraft
                  ? "Forge"
                  : !hasRecipeResources
                    ? "Ressources insuffisantes"
                    : "Verrouillé";

                return (
                  <div className="rounded-md border border-amber-200/15 bg-black/35 p-3" key={recipe.id}>
                    <div className="font-ik-title text-sm text-amber-50">{recipe.label}</div>
                    <div className="mt-1 font-ik-body text-xs capitalize text-muted-foreground">
                      {recipe.slot} · {recipe.rarity.toLowerCase()} · ilvl from World {state.progression.worldLevel}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(Object.entries(recipe.cost) as Array<[ResourceId, number]>).map(([resourceId, amount]) => (
                        <span
                          className="inline-flex items-center gap-1 rounded border border-amber-200/15 bg-black/40 px-2 py-1 font-ik-menu text-xs text-amber-50"
                          key={resourceId}
                        >
                          <img alt="" aria-hidden="true" className="h-4 w-4" src={getResourceAssetPath(resourceId)} />
                          {formatResourceLabel(resourceId)} {amount}
                        </span>
                      ))}
                    </div>
                    <button
                      className="mt-4 w-full rounded-md border border-amber-300/45 bg-amber-500/18 px-3 py-2 font-ik-menu text-sm text-amber-50 transition hover:border-amber-200 hover:bg-amber-500/24 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!canCraft}
                      onClick={() => handleForgeCraft(recipe)}
                      type="button"
                    >
                      {craftLabel}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

          {forgeFeedback ? (
            <div className="mt-3 rounded-md border border-amber-200/20 bg-amber-400/10 p-3 font-ik-body text-sm text-amber-50">
              {forgeFeedback}
            </div>
          ) : null}

          <DialogFooter>
            <button
              className="rounded-md border border-border/70 bg-muted/30 px-4 py-2 font-ik-menu text-sm text-muted-foreground transition hover:bg-muted/45"
              onClick={closeForgeModal}
              type="button"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={farmModal !== null}
        onOpenChange={(open) => {
          if (!open) closeFarmModal();
        }}
      >
        <DialogContent className="border-amber-200/25 bg-zinc-950 text-amber-50">
          <DialogHeader>
            <DialogTitle>Farm</DialogTitle>
            <DialogDescription>
              {farmModal?.state === "built" ? "Building ready (placeholder)" : "Construct this building?"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 rounded-md border border-amber-200/15 bg-black/35 p-3 font-ik-body text-sm text-muted-foreground">
            Building type: {FARM_SLOT.buildingType}
          </div>

          <DialogFooter>
            <button
              className="rounded-md border border-border/70 bg-muted/30 px-4 py-2 font-ik-menu text-sm text-muted-foreground transition hover:bg-muted/45"
              onClick={closeFarmModal}
              type="button"
            >
              Close
            </button>
            {farmModal?.state === "unlocked" ? (
              <button
                className="rounded-md border border-amber-300/45 bg-amber-500/18 px-4 py-2 font-ik-menu text-sm text-amber-50 transition hover:border-amber-200 hover:bg-amber-500/24"
                onClick={handleBuildFarm}
                type="button"
              >
                Build
              </button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
