"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DEV_MODE } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { GameHud } from "@/components/game/hud/game-hud";
import { FarmMiniGamePanel } from "@/components/game/kingdom/farm-mini-game-panel";
import { KitchenMiniGamePanel } from "@/components/game/kingdom/kitchen-mini-game-panel";
import { MineMiniGamePanel } from "@/components/game/kingdom/mine-mini-game-panel";
import { useGameHudOverlay, type GameHudOverlayId } from "@/components/game/hud/game-hud-overlays";
import { forumRankUpWorld } from "@idleking/game-core/game/forumActions.js";
import { wxpNext } from "@idleking/game-core/progression";
import {
  FORGE_RECIPES,
  buildBuilding,
  convertTempleGlobalXp,
  forgeCraft,
  getBuildCost,
  getCanonicalBuildingStatus,
  getCanonicalForgeRecipeRequiredLevel,
  getForgeOutputBase,
  getQty,
  hasAtLeast,
  isEquipmentItem,
  isForgeRecipeAvailable,
  isPrologueComplete,
  normalizeForgeRecipeIngredients,
  xpNext,
  type BuildingId,
  type BuildingStatus,
  type ForgeRecipe,
  type TempleXpTarget,
} from "@idleking/game-core";
import { BW, createFigureGraphics, figureScaleFor } from "@/components/game/shared/geometric-figure";
import { createSparkGraphics, drawGroundGrid } from "@/components/game/shared/geometric-world";
import { createPlayerVisual } from "@/components/game/shared/player-visual";
import { BUILDING_SIZES, createBuildingGraphics, type HubBuildingKind } from "./geometric-buildings";
import { BankView } from "./bank-view";
import { MarketView } from "./market-view";
import { CornucopiaDevPanel } from "./cornucopia-dev-panel";
import { KingdomDialogueBox } from "./kingdom-dialogue-box";
import { KingdomOverlay } from "./kingdom-overlay";
import {
  BuildingBuildSection,
  BuildingCostChips,
  BuildingModalHeader,
  ModalActionButton,
} from "./building-modal";

const MAP_WIDTH = 1800;
const MAP_HEIGHT = 1200;
const PLAYER_DISPLAY_HEIGHT = 104;
const PLAYER_SPEED = 310;
const PLAYER_COLLIDER = { height: 28, offsetY: 10, width: 32 } as const;
const SHOW_HUB_COLLIDER_DEBUG = false;
const CAMERA_ZOOM = 1.45;
const MAP_WALK_BOUNDS = { height: 1152, width: 1752, x: 24, y: 24 } as const;
const PLAYER_START_POSITION = { x: 900, y: 640 } as const;
const KINGDOM_HUB_LAYOUT = {
  centralPlaza: { x: 900, y: 600 },
  eastNortheastPlaza: { x: 1416, y: 338 },
  northPlaza: { x: 900, y: 170 },
  southPlaza: { x: 900, y: 1015 },
  southeastPlaza: { x: 1418, y: 835 },
  southwestPlaza: { x: 376, y: 835 },
  westPlaza: { x: 376, y: 338 },
} as const;
const FORUM_POSITION = { x: KINGDOM_HUB_LAYOUT.southPlaza.x, y: KINGDOM_HUB_LAYOUT.southPlaza.y + 18 };
const TEMPLE_POSITION = { x: KINGDOM_HUB_LAYOUT.southeastPlaza.x, y: KINGDOM_HUB_LAYOUT.southeastPlaza.y + 22 };
const MINE_POSITION = { x: KINGDOM_HUB_LAYOUT.northPlaza.x - 135, y: KINGDOM_HUB_LAYOUT.northPlaza.y + 62 };
const KITCHEN_POSITION = { x: 585, y: 540 };
const FORGE_POSITION = { x: KINGDOM_HUB_LAYOUT.northPlaza.x + 135, y: KINGDOM_HUB_LAYOUT.northPlaza.y + 62 };
const BANK_POSITION = { x: KINGDOM_HUB_LAYOUT.eastNortheastPlaza.x, y: KINGDOM_HUB_LAYOUT.eastNortheastPlaza.y + 18 };
const MARKET_POSITION = { x: KINGDOM_HUB_LAYOUT.southwestPlaza.x, y: KINGDOM_HUB_LAYOUT.southwestPlaza.y + 14 };
const CORNUCOPIA_POSITION = { x: KINGDOM_HUB_LAYOUT.centralPlaza.x + 112, y: KINGDOM_HUB_LAYOUT.centralPlaza.y + 20 };
const PORTAL_POSITION = { x: KINGDOM_HUB_LAYOUT.centralPlaza.x - 128, y: KINGDOM_HUB_LAYOUT.centralPlaza.y + 22 };
const FARM_SLOT = {
  id: "farm_slot_01",
  buildingType: "farm",
  label: "Farm",
  x: 1210,
  y: 662,
} as const;
const VILLAGER_NPC = {
  id: "npc_villager_01",
  label: "Villageois Errant",
  text: "Le royaume reprend vie, Majesté. Mais chaque pierre devra être rebâtie.",
  x: KINGDOM_HUB_LAYOUT.centralPlaza.x - 46,
  y: KINGDOM_HUB_LAYOUT.centralPlaza.y + 126,
} as const;
const BOTO_NPC = {
  id: "npc_boto",
  label: "Boto",
  x: KINGDOM_HUB_LAYOUT.centralPlaza.x + 58,
  y: KINGDOM_HUB_LAYOUT.centralPlaza.y + 130,
} as const;
const FORGE_MVP_RECIPE_IDS = new Set(["iron_sword", "iron_helmet", "copper_ring"]);
const FORGE_MVP_RECIPES = FORGE_RECIPES.filter((recipe) => FORGE_MVP_RECIPE_IDS.has(recipe.id));
const TEMPLE_BUILD_COST = getBuildCost("TEMPLE");
const FORGE_BUILD_COST = getBuildCost("FORGE");
const BANK_BUILD_COST = getBuildCost("BANK");
const MARKET_BUILD_COST = getBuildCost("MARKET");
const FARM_BUILD_COST = getBuildCost("FARM");
const FORUM_BUILD_COST = getBuildCost("FORUM");

type Vector2 = {
  x: number;
  y: number;
};

type BuildingModalState = {
  state: BuildingStatus;
} | null;

type PlaceholderBuildingId = "forum" | "kitchen" | "mine";
type HubOverlayId = "boto";

type PlaceholderBuildingStatus = {
  active: boolean;
  built: boolean;
  level: number;
  maxLevel: number;
  status: BuildingStatus;
  unlocked: boolean;
};

const PLACEHOLDER_BUILDINGS: Record<
  PlaceholderBuildingId,
  {
    label: string;
    position: Vector2;
  }
> = {
  forum: {
    label: "Forum",
    position: FORUM_POSITION,
  },
  kitchen: {
    label: "Kitchen",
    position: KITCHEN_POSITION,
  },
  mine: {
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

type HubSpriteOptions = {
  /** Pre-sized drawn visual with its ground anchor at (0, 0). */
  content: PIXI.Container;
  hintOffsetY?: number;
  position: Vector2;
  shadowAlpha?: number;
  shadowHeight?: number;
  shadowWidth?: number;
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

function getCameraViewport(screenWidth: number, screenHeight: number) {
  return {
    height: screenHeight / CAMERA_ZOOM,
    width: screenWidth / CAMERA_ZOOM,
  };
}

function isInteractionKey(event: KeyboardEvent): boolean {
  return event.code === "KeyF";
}

function createGroundCollider({
  building,
  heightRatio = 0.32,
  id,
  offsetY,
  position,
  widthRatio = 0.68,
}: {
  building: HubBuildingKind;
  heightRatio?: number;
  id: string;
  offsetY?: number;
  position: Vector2;
  widthRatio?: number;
}): HubCollider {
  const size = BUILDING_SIZES[building];
  const width = size.width * widthRatio;
  const height = size.height * heightRatio;
  const centerY = position.y + (offsetY ?? size.height * 0.08);

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
      .fill({ alpha: 0.06, color: BW.white })
      .stroke({ alpha: 0.4, color: BW.white, width: 1 });
    layer.addChild(rect);
  }

  return layer;
}

function createHubShadow(width: number, height: number, alpha = 0.4): PIXI.Graphics {
  const shadow = new PIXI.Graphics();
  shadow.ellipse(0, 0, width, height).fill({ color: BW.gray1, alpha });
  return shadow;
}

function createInteractionHint(offsetY = -100): PIXI.Text {
  const hint = new PIXI.Text({
    style: {
      fill: BW.white,
      fontFamily: "monospace",
      fontSize: 13,
      fontWeight: "700",
      stroke: { color: BW.black, width: 4 },
    },
    text: "Press F",
  });
  hint.anchor.set(0.5);
  hint.alpha = 0;
  hint.position.set(0, offsetY);
  hint.visible = false;
  return hint;
}

function drawWorld(container: PIXI.Container) {
  const ground = new PIXI.Graphics();
  drawGroundGrid(ground, MAP_WIDTH, MAP_HEIGHT);

  // Plaza markers: one ring per layout anchor, larger for the central plaza.
  for (const [key, plaza] of Object.entries(KINGDOM_HUB_LAYOUT)) {
    const isCentral = key === "centralPlaza";
    ground.circle(plaza.x, plaza.y, isCentral ? 190 : 120).stroke({ color: BW.gray1, alpha: 0.9, width: 2 });
    ground.circle(plaza.x, plaza.y, isCentral ? 160 : 96).stroke({ color: BW.gray0, alpha: 0.9, width: 1 });
  }

  container.addChild(ground);
}

function createHubSprite({
  content,
  hintOffsetY,
  position,
  shadowAlpha = 0.42,
  shadowHeight = 16,
  shadowWidth = 44,
}: HubSpriteOptions): PoiVisual & { sprite: PIXI.Container } {
  const container = new PIXI.Container();
  const shadow = createHubShadow(shadowWidth, shadowHeight, shadowAlpha);
  const hint = hintOffsetY === undefined ? null : createInteractionHint(hintOffsetY);
  const baseScaleX = content.scale.x;
  const baseScaleY = content.scale.y;
  let isNear = false;

  shadow.position.set(0, 18);

  container.addChild(shadow, content);
  if (hint) container.addChild(hint);
  container.position.set(position.x, position.y);
  container.zIndex = position.y;

  return {
    container,
    sprite: content,
    setNear: (near: boolean) => {
      isNear = near;
      if (hint) {
        hint.visible = near;
      }
    },
    update: (elapsedSeconds: number) => {
      void elapsedSeconds;
      const hover = isNear ? 1.07 : 1;
      content.scale.set(baseScaleX * hover, baseScaleY * hover);
      shadow.scale.set(isNear ? 1.04 : 1, 1);
      if (hint) {
        hint.alpha = isNear ? 1 : 0;
      }
    },
  };
}

function createHubSpriteVisual(options: HubSpriteOptions): PoiVisual {
  return createHubSprite(options);
}

/** NPC figure pre-scaled to a display height, ground anchor at (0, 0). */
function createNpcContent(variant: Parameters<typeof createFigureGraphics>[0], displayHeight: number): PIXI.Graphics {
  const figure = createFigureGraphics(variant);
  figure.scale.set(figureScaleFor(displayHeight));
  return figure;
}

function isBuiltVisualState(state: BuildingStatus) {
  return state === "built" || state === "upgradeable" || state === "maxed";
}

function renderFarmSlot(foundation: PIXI.Graphics, building: PIXI.Graphics, state: BuildingStatus) {
  const isBuilt = isBuiltVisualState(state);
  foundation.clear();
  foundation.rect(-86, -60, 172, 112).fill({
    alpha: isBuilt ? 0.1 : state === "unlocked" ? 0.18 : 0.1,
    color: BW.gray0,
  });
  foundation.rect(-86, -60, 172, 112).stroke({
    alpha: isBuilt ? 0.34 : state === "unlocked" ? 0.7 : 0.3,
    color: state === "locked" ? BW.gray2 : BW.white,
    width: 2,
  });
  building.alpha = isBuilt ? 1 : state === "unlocked" ? 0.72 : 0.4;
  building.tint = state === "locked" ? 0x777777 : 0xffffff;
}

function createFarmSlotVisual(state: BuildingStatus) {
  const building = createBuildingGraphics("farm");
  const visual = createHubSprite({
    content: building,
    hintOffsetY: -134,
    position: FARM_SLOT,
    shadowAlpha: 0.45,
    shadowHeight: 24,
    shadowWidth: 104,
  });
  const foundation = new PIXI.Graphics();
  visual.container.addChildAt(foundation, 0);
  renderFarmSlot(foundation, building, state);
  return {
    container: visual.container,
    render: (nextState: BuildingStatus) => renderFarmSlot(foundation, building, nextState),
    setNear: visual.setNear,
    update: visual.update,
  };
}

function createBuildingSprite(options: HubSpriteOptions): PoiVisual {
  return createHubSpriteVisual(options);
}

function createServiceBuildingVisual({
  label,
  position,
  variant,
}: {
  label: string;
  position: Vector2;
  variant: "bank" | "market";
}): PoiVisual {
  const container = new PIXI.Container();
  const shadow = createHubShadow(118, 25, 0.45);
  const building = new PIXI.Container();
  const hint = createInteractionHint(-122);
  let isNear = false;

  shadow.position.set(0, 24);

  if (variant === "bank") {
    const base = new PIXI.Graphics();
    base.rect(-76, -78, 152, 118).fill(BW.gray0).stroke({ color: BW.white, width: 3 });
    base.rect(-88, -86, 176, 20).fill(BW.gray1).stroke({ color: BW.gray4, width: 2 });
    base.rect(-48, -40, 96, 80).fill(BW.black).stroke({ color: BW.gray3, width: 2 });
    base.circle(0, 0, 15).fill(BW.black).stroke({ color: BW.white, width: 3 });
    base.rect(-62, -58, 24, 18).fill(BW.gray1);
    base.rect(38, -58, 24, 18).fill(BW.gray1);
    building.addChild(base);
  } else {
    const stall = new PIXI.Graphics();
    stall.rect(-82, -56, 164, 96).fill(BW.gray0).stroke({ color: BW.white, width: 3 });
    stall.rect(-92, -86, 184, 32).fill(BW.gray1).stroke({ color: BW.gray4, width: 2 });
    for (let index = 0; index < 5; index++) {
      stall.rect(-88 + index * 36, -84, 30, 28).fill(index % 2 === 0 ? BW.gray4 : BW.gray1);
    }
    stall.rect(-54, -30, 38, 70).fill(BW.black);
    stall.rect(18, -20, 52, 34).fill(BW.gray1).stroke({ color: BW.gray4, width: 2 });
    building.addChild(stall);
  }

  const sign = new PIXI.Text({
    text: label,
    style: {
      fill: BW.white,
      fontFamily: "monospace",
      fontSize: 18,
      fontWeight: "700",
    },
  });
  sign.anchor.set(0.5);
  sign.position.set(0, -104);

  container.addChild(shadow, building, sign, hint);
  container.position.set(position.x, position.y);
  container.zIndex = position.y;

  return {
    container,
    setNear: (near: boolean) => {
      isNear = near;
      hint.visible = near;
    },
    update: (elapsedSeconds: number) => {
      const hover = isNear ? 1.06 : 1;
      building.scale.set(hover);
      sign.alpha = (isNear ? 1 : 0.82) + Math.sin(elapsedSeconds * 2.1) * 0.02;
      hint.alpha = isNear ? 1 : 0;
    },
  };
}

function createPortalVisual(): PoiVisual {
  const container = new PIXI.Container();
  const shadow = createHubShadow(86, 24, 0.46);
  const portal = new PIXI.Container();
  const base = new PIXI.Graphics();
  const outerRing = new PIXI.Graphics();
  const innerRing = new PIXI.Graphics();
  const core = new PIXI.Graphics();
  const hint = createInteractionHint(-88);
  let isNear = false;

  shadow.position.set(0, 24);
  base.ellipse(0, 24, 72, 31).fill({ color: BW.gray0, alpha: 0.9 });
  base.ellipse(0, 24, 72, 31).stroke({ color: BW.gray3, alpha: 0.8, width: 3 });
  outerRing.ellipse(0, 0, 54, 78).stroke({ color: BW.white, alpha: 0.85, width: 5 });
  innerRing.ellipse(0, 0, 34, 55).stroke({ color: BW.gray4, alpha: 0.72, width: 3 });
  core.ellipse(0, 0, 24, 42).fill({ color: BW.gray1, alpha: 0.5 });
  core.ellipse(0, 0, 18, 34).fill({ color: BW.gray2, alpha: 0.35 });
  portal.position.set(0, -22);
  portal.addChild(core, outerRing, innerRing);
  container.addChild(shadow, base, portal, hint);
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
      hint.alpha = isNear ? 1 : 0;
    },
  };
}

type BillyCompanion = {
  container: PIXI.Container;
  update: (deltaSeconds: number, elapsedSeconds: number, target: Vector2) => void;
};

const BILLY_FOLLOW_GAP = 74;
const BILLY_CATCHUP_SPEED = 360;
const BILLY_DISPLAY_HEIGHT = 66;

/**
 * Billy, the king's first companion. Joins at the end of the prologue and only
 * follows the player around the Kingdom hub (never in combat / other modes).
 * Drawn as the "companion" geometric silhouette (faces right; flipped for left).
 */
function createBillyCompanion(start: Vector2): BillyCompanion {
  const container = new PIXI.Container();
  const shadow = createHubShadow(22, 7, 0.4);
  shadow.position.set(0, 8);

  const body = new PIXI.Container();
  const sprite = createFigureGraphics("companion");
  const baseScale = figureScaleFor(BILLY_DISPLAY_HEIGHT);
  sprite.scale.set(baseScale);
  body.addChild(sprite);

  container.addChild(shadow, body);
  container.position.set(start.x, start.y);
  container.zIndex = start.y;

  const pos: Vector2 = { ...start };
  let facingX = 1;

  return {
    container,
    update: (deltaSeconds: number, elapsedSeconds: number, target: Vector2) => {
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.hypot(dx, dy);
      let moving = false;

      if (dist > BILLY_FOLLOW_GAP) {
        const step = Math.min(dist - BILLY_FOLLOW_GAP, BILLY_CATCHUP_SPEED * deltaSeconds);
        pos.x += (dx / dist) * step;
        pos.y += (dy / dist) * step;
        moving = step > 0.5;
        if (Math.abs(dx) > 2) facingX = dx > 0 ? 1 : -1;
      }

      const bob = moving ? Math.abs(Math.sin(elapsedSeconds * 11)) * 3 : Math.sin(elapsedSeconds * 2.4) * 1;
      body.position.y = -bob;
      sprite.scale.set(baseScale * facingX, baseScale);
      container.position.set(pos.x, pos.y);
      container.zIndex = pos.y;
    },
  };
}

function getBuildingStatusLabel(building: { unlocked: boolean; built: boolean; status?: BuildingStatus }) {
  const status = building.status ?? (!building.unlocked ? "locked" : !building.built ? "unlocked" : "built");

  switch (status) {
    case "locked":
      return "Verrouillé";
    case "unlocked":
      return "À construire";
    case "upgradeable":
      return "Améliorable";
    case "maxed":
      return "Max";
    case "built":
    default:
      return "Construit";
  }
}

function getBuildActionLabel(building: { unlocked: boolean; built: boolean }, canBuild: boolean) {
  if (!building.unlocked) return "Verrouillé";
  if (building.built) return "Construit";
  if (!canBuild) return "Ressources insuffisantes";
  return "Construire";
}

function getBuildingLevelParts(building: { built: boolean; level?: number; maxLevel?: number }) {
  return {
    level: Math.max(0, Math.floor(building.level ?? (building.built ? 1 : 0))),
    maxLevel: Math.max(1, Math.floor(building.maxLevel ?? 50)),
  };
}

function getEffectiveBuildingState<T extends { unlocked: boolean; built: boolean; active?: boolean }>(
  building: T,
  worldLevel: number,
  devMode = DEV_MODE,
): T {
  if (!devMode) return building;

  const effective = {
    ...building,
    unlocked: true,
    active: building.built ? (building.active ?? true) : false,
  };

  if ("status" in effective && "level" in effective && "maxLevel" in effective) {
    return {
      ...effective,
      status: getCanonicalBuildingStatus(effective as any, worldLevel),
    };
  }

  return effective;
}

function isDevUnlocked(building: { unlocked: boolean }) {
  return DEV_MODE && !building.unlocked;
}

function getPlaceholderBuildingState(
  buildings: Record<PlaceholderBuildingId, PlaceholderBuildingStatus>,
  buildingId: PlaceholderBuildingId,
  worldLevel: number,
) {
  return getEffectiveBuildingState(buildings[buildingId], worldLevel);
}

export function KingdomHubStage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const isModalOpenRef = useRef(false);
  const isDialogueOpenRef = useRef(false);
  const nearbyInteractableIdRef = useRef<string | null>(null);
  const farmStateRef = useRef<BuildingStatus>("unlocked");
  const renderFarmSlotRef = useRef<((state: BuildingStatus) => void) | null>(null);
  const spawnWorldFxRef = useRef<SpawnWorldFx | null>(null);
  const state = useGameStore((store) => store.state);
  const dispatch = useGameStore((store) => store.dispatch);
  const {
    isOverlayOpen: isGameHudOverlayOpen,
    openOverlay: openGameHudOverlay,
  } = useGameHudOverlay();
  const [isCornucopiaOpen, setIsCornucopiaOpen] = useState(false);
  const [activeDialogue, setActiveDialogue] = useState<{ name: string; text: string } | null>(null);
  const [farmState, setFarmState] = useState<BuildingStatus>("unlocked");
  const [farmModal, setFarmModal] = useState<BuildingModalState>(null);
  const [isTempleOpen, setIsTempleOpen] = useState(false);
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [placeholderBuildingId, setPlaceholderBuildingId] = useState<PlaceholderBuildingId | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<HubOverlayId | null>(null);
  const [mountedOverlays, setMountedOverlays] = useState<Record<HubOverlayId, boolean>>({
    boto: false,
  });
  const [templeFeedback, setTempleFeedback] = useState<string | null>(null);
  const [forgeFeedback, setForgeFeedback] = useState<string | null>(null);
  const [forumFeedback, setForumFeedback] = useState<string | null>(null);

  const xpGlobalAvailable = getQty(state.resources, "XP_GLOBAL");
  const playerXpToNext = xpNext(state.progression.playerLevel);
  const effectiveTemple = getEffectiveBuildingState(state.buildings.temple, state.progression.worldLevel);
  const effectiveForge = getEffectiveBuildingState(state.buildings.forge, state.progression.worldLevel);
  const effectiveFarm = getEffectiveBuildingState(state.buildings.farm, state.progression.worldLevel);
  const effectiveForum = getEffectiveBuildingState(state.buildings.forum, state.progression.worldLevel);
  const effectiveBank = getEffectiveBuildingState(state.buildings.bank, state.progression.worldLevel);
  const effectiveMarket = getEffectiveBuildingState(state.buildings.market, state.progression.worldLevel);
  const placeholderBuilding = placeholderBuildingId ? PLACEHOLDER_BUILDINGS[placeholderBuildingId] : null;
  const placeholderBuildingState = placeholderBuildingId
    ? getPlaceholderBuildingState(state.buildings, placeholderBuildingId, state.progression.worldLevel)
    : null;
  const canBuildTemple = effectiveTemple.unlocked && !effectiveTemple.built && hasAtLeast(state.resources, TEMPLE_BUILD_COST);
  const canBuildForge = effectiveForge.unlocked && !effectiveForge.built && hasAtLeast(state.resources, FORGE_BUILD_COST);
  const canBuildFarm = effectiveFarm.unlocked && !effectiveFarm.built && hasAtLeast(state.resources, FARM_BUILD_COST);
  const canBuildForum = effectiveForum.unlocked && !effectiveForum.built && hasAtLeast(state.resources, FORUM_BUILD_COST);
  const canBuildBank = effectiveBank.unlocked && !effectiveBank.built && hasAtLeast(state.resources, BANK_BUILD_COST);
  const canBuildMarket = effectiveMarket.unlocked && !effectiveMarket.built && hasAtLeast(state.resources, MARKET_BUILD_COST);
  const forumRequiredWxp = wxpNext(state.progression.worldLevel);
  const canRankUpForum =
    effectiveForum.built && forumRequiredWxp > 0 && state.progression.worldWxp >= forumRequiredWxp;

  useEffect(() => {
    isModalOpenRef.current =
      isCornucopiaOpen ||
      farmModal !== null ||
      isTempleOpen ||
      isForgeOpen ||
      isBankOpen ||
      isMarketOpen ||
      placeholderBuildingId !== null ||
      activeOverlay !== null ||
      isGameHudOverlayOpen;
  }, [
    activeOverlay,
    farmModal,
    isBankOpen,
    isCornucopiaOpen,
    isForgeOpen,
    isGameHudOverlayOpen,
    isMarketOpen,
    isTempleOpen,
    placeholderBuildingId,
  ]);

  useEffect(() => {
    setFarmState(effectiveFarm.status);
  }, [effectiveFarm.status]);

  useEffect(() => {
    farmStateRef.current = farmState;
    renderFarmSlotRef.current?.(farmState);
  }, [farmState]);

  useEffect(() => {
    isDialogueOpenRef.current = activeDialogue !== null;
  }, [activeDialogue]);

  const closeDialogue = useCallback(() => {
    isDialogueOpenRef.current = false;
    setActiveDialogue(null);
  }, []);

  const openCornucopia = useCallback(() => {
    if (isModalOpenRef.current || isDialogueOpenRef.current) return;
    spawnWorldFxRef.current?.(CORNUCOPIA_POSITION, undefined, 0xf2f2f2);
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

  const closeBankModal = useCallback(() => {
    isModalOpenRef.current = false;
    setIsBankOpen(false);
  }, []);

  const closeMarketModal = useCallback(() => {
    isModalOpenRef.current = false;
    setIsMarketOpen(false);
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
    spawnWorldFxRef.current?.(building.position, undefined, 0xf2f2f2);
    isModalOpenRef.current = true;
    setPlaceholderBuildingId(buildingId);
  }, []);

  const openTemple = useCallback(() => {
    if (isModalOpenRef.current || isDialogueOpenRef.current) return;
    spawnWorldFxRef.current?.(TEMPLE_POSITION, undefined, 0xc9c9c9);
    setTempleFeedback(null);
    isModalOpenRef.current = true;
    setIsTempleOpen(true);
  }, []);

  const openForge = useCallback(() => {
    if (isModalOpenRef.current || isDialogueOpenRef.current) return;
    spawnWorldFxRef.current?.(FORGE_POSITION, undefined, 0xf2f2f2);
    setForgeFeedback(null);
    isModalOpenRef.current = true;
    setIsForgeOpen(true);
  }, []);

  const openBank = useCallback(() => {
    if (isModalOpenRef.current || isDialogueOpenRef.current) return;
    spawnWorldFxRef.current?.(BANK_POSITION, undefined, 0xc9c9c9);
    isModalOpenRef.current = true;
    setIsBankOpen(true);
  }, []);

  const openMarket = useCallback(() => {
    if (isModalOpenRef.current || isDialogueOpenRef.current) return;
    spawnWorldFxRef.current?.(MARKET_POSITION, undefined, 0xf2f2f2);
    isModalOpenRef.current = true;
    setIsMarketOpen(true);
  }, []);

  const openFarmSlot = useCallback(() => {
    if (isModalOpenRef.current || isDialogueOpenRef.current) return;

    if (farmStateRef.current === "locked") {
      spawnWorldFxRef.current?.(FARM_SLOT, undefined, 0x6a6a6a);
      toast.error("Building not unlocked");
      return;
    }

    spawnWorldFxRef.current?.(FARM_SLOT, undefined, 0xc9c9c9);
    isModalOpenRef.current = true;
    setFarmModal({ state: farmStateRef.current });
  }, []);

  const handleBuildFarm = useCallback(() => {
    if (farmStateRef.current !== "unlocked") return;
    const result = buildBuilding(useGameStore.getState().state, "FARM", { allowLocked: DEV_MODE });
    if (!result.ok) {
      toast.error(`Build failed: ${result.reason}`);
      return;
    }

    dispatch(() => result.next);
    farmStateRef.current = result.next.buildings.farm.status;
    renderFarmSlotRef.current?.(result.next.buildings.farm.status);
    spawnWorldFxRef.current?.(FARM_SLOT, "Built", 0xf2f2f2);
    setFarmState(result.next.buildings.farm.status);
    setFarmModal(null);
    isModalOpenRef.current = false;
  }, [dispatch]);

  const handleBuildCoreBuilding = useCallback(
    (buildingId: Extract<BuildingId, "FORUM" | "TEMPLE" | "FORGE" | "BANK" | "MARKET">) => {
      const result = buildBuilding(useGameStore.getState().state, buildingId, { allowLocked: DEV_MODE });
      if (!result.ok) {
        toast.error(`Build failed: ${result.reason}`);
        return;
      }

      dispatch(() => result.next);
      const position =
        buildingId === "FORUM"
          ? FORUM_POSITION
          : buildingId === "TEMPLE"
          ? TEMPLE_POSITION
          : buildingId === "FORGE"
            ? FORGE_POSITION
            : buildingId === "BANK"
              ? BANK_POSITION
              : MARKET_POSITION;
      const label =
        buildingId === "FORUM"
          ? "Forum built"
          : buildingId === "TEMPLE"
          ? "Temple built"
          : buildingId === "FORGE"
            ? "Forge built"
            : buildingId === "BANK"
              ? "Bank built"
              : "Market built";
      spawnWorldFxRef.current?.(position, "Built", buildingId === "TEMPLE" || buildingId === "BANK" ? 0xc9c9c9 : 0xf2f2f2);

      if (buildingId === "FORUM") {
        setForumFeedback(label);
      } else if (buildingId === "TEMPLE") {
        setTempleFeedback(label);
      } else if (buildingId === "FORGE") {
        setForgeFeedback(label);
      }
      toast.success(label);
    },
    [dispatch],
  );

  const handleForumRankUpWorld = useCallback(() => {
    const result = forumRankUpWorld(useGameStore.getState().state);
    if (!result.rankedUp) {
      toast.error(`World rank up failed: ${result.reason}`);
      return;
    }

    dispatch(() => result.next);
    spawnWorldFxRef.current?.(FORUM_POSITION, "Rank up", 0xf2f2f2);
    const feedback = `World level increased to ${result.next.progression.worldLevel}.`;
    setForumFeedback(feedback);
    toast.success(feedback);
  }, [dispatch]);

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
      spawnWorldFxRef.current?.(TEMPLE_POSITION, `-${result.amount} XP`, target === "playerXp" ? 0xf2f2f2 : 0xc9c9c9);
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
      const ingredients = normalizeForgeRecipeIngredients(recipe.ingredients);
      if (!hasAtLeast(useGameStore.getState().state.resources, ingredients)) {
        toast.error("Not enough resources");
        return;
      }

      const currentState = useGameStore.getState().state;
      const result = forgeCraft(currentState, recipe.id, { allowLocked: DEV_MODE });
      if (!result.ok) {
        toast.error(`Forge failed: ${result.reason}`);
        return;
      }

      const createdItem = result.next.inventory.items.find((item) => item.id === result.createdItemId);
      dispatch(() => result.next);
      spawnWorldFxRef.current?.(FORGE_POSITION, "Forged", 0xf2f2f2);

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
    spawnWorldFxRef.current?.(VILLAGER_NPC, undefined, 0xc9c9c9);
    isDialogueOpenRef.current = true;
    setActiveDialogue({
      name: VILLAGER_NPC.label,
      text: VILLAGER_NPC.text,
    });
  }, []);

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
    const playerVisual = createPlayerVisual({ displayHeight: PLAYER_DISPLAY_HEIGHT });
    const player = playerVisual.container;
    const playerPosition: Vector2 = { ...PLAYER_START_POSITION };
    const playerFacing = { x: 0, y: -1 };
    const poiVisuals = new Map<string, PoiVisual>();
    const floatingTexts: FloatingTextFx[] = [];
    const particles: ParticleFx[] = [];
    const solidColliders: HubCollider[] = [];
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
      ...(DEV_MODE
        ? [
            {
              id: "cornucopia",
              label: "Cornucopia",
              type: "building" as const,
              x: CORNUCOPIA_POSITION.x,
              y: CORNUCOPIA_POSITION.y,
              radius: 118,
              onInteract: openCornucopia,
            },
          ]
        : []),
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
        id: "bank",
        label: "Bank",
        type: "building",
        x: BANK_POSITION.x,
        y: BANK_POSITION.y,
        radius: 104,
        onInteract: openBank,
      },
      {
        id: "market",
        label: "Market",
        type: "building",
        x: MARKET_POSITION.x,
        y: MARKET_POSITION.y,
        radius: 112,
        onInteract: openMarket,
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
      const nextX = clamp(
        playerPosition.x + deltaX,
        MAP_WALK_BOUNDS.x,
        MAP_WALK_BOUNDS.x + MAP_WALK_BOUNDS.width,
      );
      if (!collidesWithBuilding({ x: nextX, y: playerPosition.y })) {
        playerPosition.x = nextX;
      }

      const nextY = clamp(
        playerPosition.y + deltaY,
        MAP_WALK_BOUNDS.y,
        MAP_WALK_BOUNDS.y + MAP_WALK_BOUNDS.height,
      );
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

    function spawnWorldFx(position: Vector2, label?: string, color: number = BW.white) {
      if (label) {
        const text = new PIXI.Text({
          style: {
            align: "center",
            fill: color,
            fontFamily: "monospace",
            fontSize: 16,
            fontWeight: "700",
            stroke: { color: BW.black, width: 4 },
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
        const particle = createSparkGraphics(3 + (i % 3));
        particle.tint = color;
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

      resizeTarget.appendChild(app.canvas);
      app.stage.addChild(world, uiLayer);
      world.scale.set(CAMERA_ZOOM);
      world.addChild(backgroundLayer, entityLayer, fxLayer);
      entityLayer.sortableChildren = true;
      drawWorld(backgroundLayer);

      solidColliders.push(
        createGroundCollider({
          building: "forum",
          heightRatio: 0.3,
          id: "forum",
          offsetY: 26,
          position: FORUM_POSITION,
          widthRatio: 0.72,
        }),
        createGroundCollider({
          building: "temple",
          heightRatio: 0.34,
          id: "temple",
          offsetY: 22,
          position: TEMPLE_POSITION,
          widthRatio: 0.66,
        }),
        createGroundCollider({
          building: "mine",
          heightRatio: 0.34,
          id: "mine",
          offsetY: 18,
          position: MINE_POSITION,
          widthRatio: 0.74,
        }),
        createGroundCollider({
          building: "kitchen",
          heightRatio: 0.32,
          id: "kitchen",
          offsetY: 18,
          position: KITCHEN_POSITION,
          widthRatio: 0.68,
        }),
        createGroundCollider({
          building: "forge",
          heightRatio: 0.34,
          id: "forge",
          offsetY: 20,
          position: FORGE_POSITION,
          widthRatio: 0.7,
        }),
        {
          height: 58,
          id: "bank",
          width: 118,
          x: BANK_POSITION.x - 59,
          y: BANK_POSITION.y - 18,
        },
        {
          height: 54,
          id: "market",
          width: 130,
          x: MARKET_POSITION.x - 65,
          y: MARKET_POSITION.y - 12,
        },
        createGroundCollider({
          building: "farm",
          heightRatio: 0.3,
          id: FARM_SLOT.id,
          offsetY: 20,
          position: FARM_SLOT,
          widthRatio: 0.72,
        }),
      );

      if (DEV_MODE) {
        solidColliders.push(
          createGroundCollider({
            building: "cornucopia",
            heightRatio: 0.34,
            id: "cornucopia",
            offsetY: 12,
            position: CORNUCOPIA_POSITION,
            widthRatio: 0.68,
          }),
        );
      }

      if (DEV_MODE && SHOW_HUB_COLLIDER_DEBUG) {
        entityLayer.addChild(drawColliderDebug(solidColliders));
      }

      const forumVisual = createBuildingSprite({
        content: createBuildingGraphics("forum"),
        hintOffsetY: -168,
        position: FORUM_POSITION,
        shadowAlpha: 0.48,
        shadowHeight: 30,
        shadowWidth: 132,
      });
      poiVisuals.set("forum", forumVisual);
      entityLayer.addChild(forumVisual.container);

      const templeVisual = createBuildingSprite({
        content: createBuildingGraphics("temple"),
        hintOffsetY: -142,
        position: TEMPLE_POSITION,
        shadowAlpha: 0.45,
        shadowHeight: 25,
        shadowWidth: 104,
      });
      poiVisuals.set("temple", templeVisual);
      entityLayer.addChild(templeVisual.container);

      const mineVisual = createBuildingSprite({
        content: createBuildingGraphics("mine"),
        hintOffsetY: -126,
        position: MINE_POSITION,
        shadowAlpha: 0.48,
        shadowHeight: 24,
        shadowWidth: 108,
      });
      poiVisuals.set("mine", mineVisual);
      entityLayer.addChild(mineVisual.container);

      const kitchenVisual = createBuildingSprite({
        content: createBuildingGraphics("kitchen"),
        hintOffsetY: -120,
        position: KITCHEN_POSITION,
        shadowAlpha: 0.45,
        shadowHeight: 23,
        shadowWidth: 96,
      });
      poiVisuals.set("kitchen", kitchenVisual);
      entityLayer.addChild(kitchenVisual.container);

      const forgeVisual = createBuildingSprite({
        content: createBuildingGraphics("forge"),
        hintOffsetY: -128,
        position: FORGE_POSITION,
        shadowAlpha: 0.48,
        shadowHeight: 24,
        shadowWidth: 106,
      });
      poiVisuals.set("forge", forgeVisual);
      entityLayer.addChild(forgeVisual.container);

      const bankVisual = createServiceBuildingVisual({
        label: "Bank",
        position: BANK_POSITION,
        variant: "bank",
      });
      bankVisual.container.eventMode = "static";
      bankVisual.container.cursor = "pointer";
      bankVisual.container.on("pointertap", openBank);
      poiVisuals.set("bank", bankVisual);
      entityLayer.addChild(bankVisual.container);

      const marketVisual = createServiceBuildingVisual({
        label: "Market",
        position: MARKET_POSITION,
        variant: "market",
      });
      marketVisual.container.eventMode = "static";
      marketVisual.container.cursor = "pointer";
      marketVisual.container.on("pointertap", openMarket);
      poiVisuals.set("market", marketVisual);
      entityLayer.addChild(marketVisual.container);

      if (DEV_MODE) {
        const cornucopiaVisual = createHubSpriteVisual({
          content: createBuildingGraphics("cornucopia"),
          hintOffsetY: -84,
          position: CORNUCOPIA_POSITION,
          shadowHeight: 16,
          shadowWidth: 62,
        });
        poiVisuals.set("cornucopia", cornucopiaVisual);
        entityLayer.addChild(cornucopiaVisual.container);
      }

      const portalVisual = createPortalVisual();
      poiVisuals.set("portal", portalVisual);
      entityLayer.addChild(portalVisual.container);

      const farmSlot = createFarmSlotVisual(farmStateRef.current);
      renderFarmSlotRef.current = farmSlot.render;
      poiVisuals.set(FARM_SLOT.id, farmSlot);
      entityLayer.addChild(farmSlot.container);

      const villagerVisual = createHubSpriteVisual({
        content: createNpcContent("villager", 70),
        hintOffsetY: -72,
        position: VILLAGER_NPC,
        shadowHeight: 9,
        shadowWidth: 24,
      });
      const botoVisual = createHubSpriteVisual({
        content: createNpcContent("robot", 78),
        hintOffsetY: -78,
        position: BOTO_NPC,
        shadowHeight: 10,
        shadowWidth: 28,
      });
      poiVisuals.set(BOTO_NPC.id, botoVisual);
      entityLayer.addChild(botoVisual.container);

      poiVisuals.set(VILLAGER_NPC.id, villagerVisual);
      entityLayer.addChild(villagerVisual.container);
      entityLayer.addChild(player);
      player.position.set(playerPosition.x, playerPosition.y);

      // Billy follows the king around the Kingdom once he has joined (prologue done).
      let billy: BillyCompanion | null = null;
      if (isPrologueComplete(useGameStore.getState().state)) {
        billy = createBillyCompanion({ x: playerPosition.x - 70, y: playerPosition.y });
        entityLayer.addChild(billy.container);
      }

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

        const moving = directionX !== 0 || directionY !== 0;
        if (moving) {
          const length = Math.hypot(directionX, directionY) || 1;
          playerFacing.x = directionX / length;
          playerFacing.y = directionY / length;
          movePlayerWithCollisions(
            (directionX / length) * PLAYER_SPEED * deltaSeconds,
            (directionY / length) * PLAYER_SPEED * deltaSeconds,
          );
          player.position.set(playerPosition.x, playerPosition.y);
          updateNearbyInteractable();
        }

        playerVisual.update({ elapsedSeconds, facing: playerFacing, moving });
        if (billy) billy.update(deltaSeconds, elapsedSeconds, playerPosition);

        for (const visual of poiVisuals.values()) {
          visual.update(elapsedSeconds);
        }
        updateFx(deltaSeconds);

        const screenWidth = app.renderer.width / app.renderer.resolution;
        const screenHeight = app.renderer.height / app.renderer.resolution;
        const cameraViewport = getCameraViewport(screenWidth, screenHeight);
        const cameraX = clamp(
          playerPosition.x - cameraViewport.width / 2,
          0,
          Math.max(0, MAP_WIDTH - cameraViewport.width),
        );
        const cameraY = clamp(
          playerPosition.y - cameraViewport.height / 2,
          0,
          Math.max(0, MAP_HEIGHT - cameraViewport.height),
        );
        world.scale.set(CAMERA_ZOOM);
        world.position.set(-cameraX * CAMERA_ZOOM, -cameraY * CAMERA_ZOOM);
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
    openBank,
    closeDialogue,
    openCornucopia,
    openFarmSlot,
    openForge,
    openGlobalHudOverlay,
    openHubOverlay,
    openMarket,
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
        <DialogContent
          className={cn(
            "text-neutral-100",
            placeholderBuildingId === "mine" || placeholderBuildingId === "kitchen"
              ? "max-h-[92vh] max-w-5xl overflow-y-auto"
              : "max-w-md",
          )}
        >
          {placeholderBuilding && placeholderBuildingId ? (
            <div className="space-y-4">
              <BuildingModalHeader
                devUnlocked={isDevUnlocked(state.buildings[placeholderBuildingId])}
                glyph={placeholderBuildingId}
                level={placeholderBuildingState ? getBuildingLevelParts(placeholderBuildingState).level : undefined}
                maxLevel={placeholderBuildingState ? getBuildingLevelParts(placeholderBuildingState).maxLevel : undefined}
                statusLabel={placeholderBuildingState ? getBuildingStatusLabel(placeholderBuildingState) : "—"}
                subtitle={
                  placeholderBuildingId === "mine"
                    ? "Run de minage actif"
                    : placeholderBuildingId === "kitchen"
                      ? "Run de cuisine actif"
                      : "Montée de niveau du Monde"
                }
                title={placeholderBuilding.label}
              />

              {placeholderBuildingId === "mine" ? (
                <MineMiniGamePanel embedded />
              ) : placeholderBuildingId === "kitchen" ? (
                <KitchenMiniGamePanel embedded />
              ) : placeholderBuildingId === "forum" ? (
                <div className="space-y-3">
                  {!effectiveForum.built ? (
                    <BuildingBuildSection
                      canBuild={canBuildForum}
                      cost={FORUM_BUILD_COST}
                      label={getBuildActionLabel(effectiveForum, canBuildForum)}
                      onBuild={() => handleBuildCoreBuilding("FORUM")}
                      resources={state.resources}
                    />
                  ) : null}

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="border border-neutral-700 bg-neutral-950/60 p-3">
                      <div className="font-ik-menu text-[0.6rem] text-neutral-500">World Level</div>
                      <div className="mt-1 font-ik-title text-xl text-neutral-100 tabular-nums">
                        {state.progression.worldLevel}
                      </div>
                    </div>
                    <div className="border border-neutral-700 bg-neutral-950/60 p-3">
                      <div className="font-ik-menu text-[0.6rem] text-neutral-500">WXP</div>
                      <div className="mt-1 font-ik-title text-xl text-neutral-100 tabular-nums">
                        {state.progression.worldWxp}
                        {forumRequiredWxp > 0 ? `/${forumRequiredWxp}` : ""}
                      </div>
                      {forumRequiredWxp > 0 ? (
                        <div className="ik-bar mt-2">
                          <div
                            className="ik-bar__fill ik-bar__fill--dim"
                            style={{
                              width: `${Math.min(100, (state.progression.worldWxp / forumRequiredWxp) * 100)}%`,
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {forumFeedback ? (
                    <div className="ik-anim-rise-in border border-neutral-600 bg-neutral-900 p-3 font-ik-body text-sm text-neutral-100">
                      {forumFeedback}
                    </div>
                  ) : null}

                  <button
                    className={cn(
                      "flex min-h-11 w-full items-center justify-center gap-2 border-2 px-4 py-2 font-ik-menu text-xs transition",
                      canRankUpForum
                        ? "ik-ready-pulse border-neutral-100 bg-neutral-100 text-neutral-950 hover:bg-neutral-300"
                        : "cursor-not-allowed border-neutral-800 text-neutral-600",
                    )}
                    disabled={!canRankUpForum}
                    onClick={handleForumRankUpWorld}
                    type="button"
                  >
                    {forumRequiredWxp > 0 ? "Rank Up World" : "World Level Max"}
                  </button>
                </div>
              ) : (
                <div className="border border-dashed border-neutral-800 bg-neutral-950/60 p-4 text-center font-ik-menu text-xs text-neutral-500">
                  Prochainement
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <ModalActionButton onClick={closePlaceholderBuildingModal}>Fermer</ModalActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {DEV_MODE ? (
      <Dialog open={isCornucopiaOpen} onOpenChange={setIsCornucopiaOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto text-neutral-100">
          <div className="space-y-4">
            <BuildingModalHeader
              devUnlocked
              glyph="cornucopia"
              statusLabel="Console dev"
              subtitle="Génère n'importe quel contenu de test (ressources, currencies, équipement, rings, special items, unlocks)."
              title="Cornucopia"
            />

            <CornucopiaDevPanel />
          </div>

          <DialogFooter>
            <ModalActionButton onClick={() => setIsCornucopiaOpen(false)}>Fermer</ModalActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      ) : null}

      <Dialog
        open={isTempleOpen}
        onOpenChange={(open) => {
          if (!open) closeTempleModal();
        }}
      >
        <DialogContent className="text-neutral-100">
          <div className="space-y-4">
            <BuildingModalHeader
              devUnlocked={isDevUnlocked(state.buildings.temple)}
              glyph="temple"
              level={getBuildingLevelParts(effectiveTemple).level}
              maxLevel={getBuildingLevelParts(effectiveTemple).maxLevel}
              statusLabel={getBuildingStatusLabel(effectiveTemple)}
              subtitle="Convertit l'XP_GLOBAL en XP joueur ou WXP monde (1:1)."
              title="Temple"
            />

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="border border-neutral-700 bg-neutral-950/60 p-3">
                <div className="font-ik-menu text-[0.6rem] text-neutral-500">XP_GLOBAL</div>
                <div className="mt-1 font-ik-title text-xl text-neutral-100 tabular-nums">{xpGlobalAvailable}</div>
              </div>
              <div className="border border-neutral-700 bg-neutral-950/60 p-3">
                <div className="font-ik-menu text-[0.6rem] text-neutral-500">Joueur</div>
                <div className="mt-1 font-ik-title text-xl text-neutral-100 tabular-nums">
                  Nv {state.progression.playerLevel}
                </div>
                <div className="font-ik-body text-xs text-neutral-500 tabular-nums">
                  XP {state.progression.playerXp}
                  {playerXpToNext > 0 ? `/${playerXpToNext}` : ""}
                </div>
              </div>
              <div className="border border-neutral-700 bg-neutral-950/60 p-3">
                <div className="font-ik-menu text-[0.6rem] text-neutral-500">Monde</div>
                <div className="mt-1 font-ik-title text-xl text-neutral-100 tabular-nums">
                  Nv {state.progression.worldLevel}
                </div>
                <div className="font-ik-body text-xs text-neutral-500 tabular-nums">WXP {state.progression.worldWxp}</div>
              </div>
            </div>

            {!effectiveTemple.built ? (
              <BuildingBuildSection
                canBuild={canBuildTemple}
                cost={TEMPLE_BUILD_COST}
                label={getBuildActionLabel(effectiveTemple, canBuildTemple)}
                onBuild={() => handleBuildCoreBuilding("TEMPLE")}
                resources={state.resources}
              />
            ) : null}

            {templeFeedback ? (
              <div className="ik-anim-rise-in border border-neutral-600 bg-neutral-900 p-3 font-ik-body text-sm text-neutral-100">
                {templeFeedback}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <ModalActionButton onClick={closeTempleModal}>Fermer</ModalActionButton>
            <ModalActionButton
              disabled={!effectiveTemple.built || xpGlobalAvailable <= 0}
              onClick={() => handleTempleConvert("playerXp")}
              primary
            >
              → XP Joueur
            </ModalActionButton>
            <ModalActionButton
              disabled={!effectiveTemple.built || xpGlobalAvailable <= 0}
              onClick={() => handleTempleConvert("worldWxp")}
              primary
            >
              → WXP Monde
            </ModalActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isForgeOpen}
        onOpenChange={(open) => {
          if (!open) closeForgeModal();
        }}
      >
        <DialogContent className="max-w-2xl text-neutral-100">
          <div className="space-y-4">
            <BuildingModalHeader
              devUnlocked={isDevUnlocked(state.buildings.forge)}
              glyph="forge"
              level={getBuildingLevelParts(effectiveForge).level}
              maxLevel={getBuildingLevelParts(effectiveForge).maxLevel}
              statusLabel={getBuildingStatusLabel(effectiveForge)}
              subtitle="Forge de l'équipement à partir du minerai."
              title="Forge"
            />

            {!effectiveForge.built ? (
              <BuildingBuildSection
                canBuild={canBuildForge}
                cost={FORGE_BUILD_COST}
                label={getBuildActionLabel(effectiveForge, canBuildForge)}
                onBuild={() => handleBuildCoreBuilding("FORGE")}
                resources={state.resources}
              />
            ) : null}

            {effectiveForge.built ? (
              <div className="ik-stagger grid gap-2 sm:grid-cols-3">
                {FORGE_MVP_RECIPES.map((recipe) => {
                  const ingredients = normalizeForgeRecipeIngredients(recipe.ingredients);
                  const outputBase = getForgeOutputBase(recipe.outputBaseId);
                  const requiredForgeLevel = getCanonicalForgeRecipeRequiredLevel(recipe);
                  const hasRecipeResources = hasAtLeast(state.resources, ingredients);
                  const isRecipeAvailable = isForgeRecipeAvailable(state, recipe);
                  const canCraft = hasRecipeResources && isRecipeAvailable;
                  const craftLabel = canCraft
                    ? "Forger"
                    : !isRecipeAvailable
                      ? `Forge Nv ${requiredForgeLevel}`
                      : "Ressources";

                  return (
                    <div
                      className={cn(
                        "ik-card-hover border-2 bg-neutral-950/60 p-3",
                        canCraft ? "border-neutral-600" : "border-dashed border-neutral-800",
                      )}
                      key={recipe.id}
                    >
                      <div className="font-ik-title text-sm text-neutral-100">{recipe.label}</div>
                      <div className="mt-0.5 font-ik-body text-[0.68rem] capitalize text-neutral-500">
                        {outputBase?.slot ?? recipe.category} · ilvl Monde {state.progression.worldLevel}
                      </div>
                      <div className="mt-2.5">
                        <BuildingCostChips cost={ingredients} resources={state.resources} />
                      </div>
                      <button
                        className={cn(
                          "mt-3 flex min-h-9 w-full items-center justify-center gap-2 border-2 px-3 py-1.5 font-ik-menu text-[0.68rem] transition",
                          canCraft
                            ? "border-neutral-100 bg-neutral-100 text-neutral-950 hover:bg-neutral-300"
                            : "cursor-not-allowed border-neutral-800 text-neutral-600",
                        )}
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
              <div className="ik-anim-rise-in border border-neutral-600 bg-neutral-900 p-3 font-ik-body text-sm text-neutral-100">
                {forgeFeedback}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <ModalActionButton onClick={closeForgeModal}>Fermer</ModalActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isBankOpen}
        onOpenChange={(open) => {
          if (!open) closeBankModal();
        }}
      >
        <DialogContent
          className={cn(
            "text-neutral-100",
            effectiveBank.built ? "max-h-[92vh] max-w-4xl overflow-y-auto" : "max-w-md",
          )}
          data-testid="kingdom-bank-dialog"
        >
          <div className="space-y-4">
            <BuildingModalHeader
              devUnlocked={isDevUnlocked(state.buildings.bank)}
              glyph="bank"
              level={getBuildingLevelParts(effectiveBank).level}
              maxLevel={getBuildingLevelParts(effectiveBank).maxLevel}
              statusLabel={getBuildingStatusLabel(effectiveBank)}
              subtitle="Stocke ressources, consommables et objets spéciaux."
              title="Banque"
            />

            {!effectiveBank.built ? (
              <BuildingBuildSection
                canBuild={canBuildBank}
                cost={BANK_BUILD_COST}
                label={getBuildActionLabel(effectiveBank, canBuildBank)}
                onBuild={() => handleBuildCoreBuilding("BANK")}
                resources={state.resources}
              />
            ) : (
              <BankView embedded />
            )}
          </div>

          <DialogFooter>
            <ModalActionButton onClick={closeBankModal}>Fermer</ModalActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isMarketOpen}
        onOpenChange={(open) => {
          if (!open) closeMarketModal();
        }}
      >
        <DialogContent
          className={cn(
            "text-neutral-100",
            effectiveMarket.built ? "max-h-[92vh] max-w-4xl overflow-y-auto" : "max-w-md",
          )}
          data-testid="kingdom-market-dialog"
        >
          <div className="space-y-4">
            <BuildingModalHeader
              devUnlocked={isDevUnlocked(state.buildings.market)}
              glyph="market"
              level={getBuildingLevelParts(effectiveMarket).level}
              maxLevel={getBuildingLevelParts(effectiveMarket).maxLevel}
              statusLabel={getBuildingStatusLabel(effectiveMarket)}
              subtitle="Achète et vend des biens contre des ECU."
              title="Marché"
            />

            {!effectiveMarket.built ? (
              <BuildingBuildSection
                canBuild={canBuildMarket}
                cost={MARKET_BUILD_COST}
                label={getBuildActionLabel(effectiveMarket, canBuildMarket)}
                onBuild={() => handleBuildCoreBuilding("MARKET")}
                resources={state.resources}
              />
            ) : (
              <MarketView embedded />
            )}
          </div>

          <DialogFooter>
            <ModalActionButton onClick={closeMarketModal}>Fermer</ModalActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={farmModal !== null}
        onOpenChange={(open) => {
          if (!open) closeFarmModal();
        }}
      >
        <DialogContent
          className={cn(
            "text-neutral-100",
            farmModal?.state === "built" ? "max-h-[92vh] max-w-5xl overflow-y-auto" : "max-w-lg",
          )}
        >
          <div className="space-y-4">
            <BuildingModalHeader
              devUnlocked={isDevUnlocked(state.buildings.farm)}
              glyph="farm"
              level={getBuildingLevelParts(effectiveFarm).level}
              maxLevel={getBuildingLevelParts(effectiveFarm).maxLevel}
              statusLabel={getBuildingStatusLabel(effectiveFarm)}
              subtitle={farmModal?.state === "built" ? "Run de ferme actif" : "Cultive des ressources pour le Royaume."}
              title="Ferme"
            />

            {farmModal?.state === "built" ? (
              <FarmMiniGamePanel embedded />
            ) : farmModal?.state === "unlocked" ? (
              <BuildingBuildSection
                canBuild={canBuildFarm}
                cost={FARM_BUILD_COST}
                label={getBuildActionLabel(effectiveFarm, canBuildFarm)}
                onBuild={handleBuildFarm}
                resources={state.resources}
              />
            ) : null}
          </div>

          <DialogFooter>
            <ModalActionButton onClick={closeFarmModal}>Fermer</ModalActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
