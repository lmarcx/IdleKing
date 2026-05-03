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
import { useGameStore } from "@/store/game-store";
import { useResourceFeedbackStore } from "@/store/resource-feedback-store";
import { claimCornucopia, getCornucopiaClaimables } from "@idleking/game-core/building/cornucopiaActions.js";
import type { ResourceId } from "@idleking/game-core/resources/types.js";
import { KingdomDialogueBox } from "./kingdom-dialogue-box";

const MAP_WIDTH = 1800;
const MAP_HEIGHT = 1200;
const PLAYER_SIZE = 48;
const PLAYER_SPEED = 310;
const CORNUCOPIA_POSITION = { x: MAP_WIDTH / 2 + 280, y: MAP_HEIGHT / 2 };
const ANCIENT_CHEST_POSITION = { x: MAP_WIDTH / 2 + 80, y: MAP_HEIGHT / 2 - 260 };
const FARM_SLOT = {
  id: "farm_slot_01",
  buildingType: "farm",
  label: "Farm",
  x: MAP_WIDTH / 2 - 320,
  y: MAP_HEIGHT / 2 - 90,
} as const;
const VILLAGER_NPC = {
  id: "npc_villager_01",
  label: "Villageois Errant",
  text: "Le royaume reprend vie, Majesté. Mais chaque pierre devra être rebâtie.",
  x: CORNUCOPIA_POSITION.x - 150,
  y: CORNUCOPIA_POSITION.y + 135,
} as const;

type Vector2 = {
  x: number;
  y: number;
};

type BuildingState = "locked" | "unlocked" | "built";

type BuildingModalState = {
  state: BuildingState;
} | null;

type PoiVisualKind = "chest" | "interactable" | "npc" | "resource";

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
  node: PIXI.Graphics;
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

function isInteractionKey(event: KeyboardEvent): boolean {
  return event.code === "KeyF";
}

function createGroundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");

  if (!ctx) return PIXI.Texture.WHITE;

  const gradient = ctx.createLinearGradient(0, 0, 160, 160);
  gradient.addColorStop(0, "#070a18");
  gradient.addColorStop(0.48, "#11102a");
  gradient.addColorStop(1, "#080812");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 160, 160);

  for (let i = 0; i < 130; i += 1) {
    const x = (i * 47) % 160;
    const y = (i * 83) % 160;
    const alpha = 0.035 + ((i % 7) * 0.007);
    ctx.fillStyle = `rgba(132, 96, 205, ${alpha})`;
    ctx.fillRect(x, y, 1 + (i % 2), 1 + ((i + 1) % 2));
  }

  ctx.strokeStyle = "rgba(96, 78, 168, 0.16)";
  ctx.lineWidth = 1;
  for (let i = -160; i <= 160; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 160);
    ctx.lineTo(i + 160, 0);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(50, 180, 150, 0.08)";
  ctx.beginPath();
  ctx.arc(80, 80, 46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(80, 80, 18, 0, Math.PI * 2);
  ctx.stroke();

  return PIXI.Texture.from(canvas);
}

function drawWorld(container: PIXI.Container) {
  const texture = createGroundTexture();
  const background = new PIXI.TilingSprite({
    height: MAP_HEIGHT,
    texture,
    width: MAP_WIDTH,
  });

  const haze = new PIXI.Graphics();
  haze.circle(MAP_WIDTH * 0.3, MAP_HEIGHT * 0.22, 340).fill({ color: 0x33235f, alpha: 0.16 });
  haze.circle(MAP_WIDTH * 0.76, MAP_HEIGHT * 0.68, 420).fill({ color: 0x062f38, alpha: 0.14 });
  haze.circle(MAP_WIDTH * 0.5, MAP_HEIGHT * 0.5, 560).stroke({ color: 0x7b5dde, alpha: 0.08, width: 2 });

  container.addChild(background, haze);
  return texture;
}

function renderVignette(vignette: PIXI.Graphics, width: number, height: number) {
  vignette.clear();
  vignette.rect(0, 0, width, height).fill({ color: 0x02030a, alpha: 0.12 });
  vignette.rect(0, 0, width, height * 0.18).fill({ color: 0x000000, alpha: 0.34 });
  vignette.rect(0, height * 0.78, width, height * 0.22).fill({ color: 0x000000, alpha: 0.42 });
  vignette.rect(0, 0, width * 0.14, height).fill({ color: 0x000000, alpha: 0.3 });
  vignette.rect(width * 0.86, 0, width * 0.14, height).fill({ color: 0x000000, alpha: 0.3 });
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

function createPoiShell(kind: PoiVisualKind, position: Vector2, radius: number) {
  const container = new PIXI.Container();
  const glow = new PIXI.Graphics();
  const art = new PIXI.Container();
  let isNear = false;

  const colorByKind: Record<PoiVisualKind, number> = {
    chest: 0xf0c26a,
    interactable: 0xb18cff,
    npc: 0x7df7ff,
    resource: 0x55d979,
  };

  const color = colorByKind[kind];
  glow.circle(0, 0, radius).fill({ color, alpha: 0.28 });
  glow.filters = [new PIXI.BlurFilter({ quality: 1, strength: kind === "chest" ? 14 : 9 })];

  container.addChild(glow, art);
  container.position.set(position.x, position.y);

  return {
    art,
    color,
    container,
    setNear: (near: boolean) => {
      isNear = near;
    },
    update: (elapsedSeconds: number) => {
      const pulse = Math.sin(elapsedSeconds * 3.2 + position.x * 0.01) * 0.035;
      const hover = isNear ? 1.12 : 1;
      container.scale.set(hover + pulse);
      glow.alpha = (isNear ? 0.78 : 0.42) + Math.sin(elapsedSeconds * 4.4) * 0.08;
    },
  };
}

function drawCornucopia() {
  const poi = createPoiShell("resource", CORNUCOPIA_POSITION, 70);
  const marker = new PIXI.Graphics();
  marker.circle(0, 0, 62).fill({ color: 0x55d979, alpha: 0.12 });
  marker.circle(0, 0, 44).stroke({ color: 0x55d979, alpha: 0.55, width: 2 });
  marker.roundRect(-38, -28, 76, 56, 12).fill(0x6b3f1f);
  marker.roundRect(-34, -24, 68, 48, 10).stroke({ color: 0xf7d487, alpha: 0.9, width: 3 });
  marker.circle(-14, -6, 8).fill(0xffd166);
  marker.circle(8, -10, 7).fill(0x87d37c);
  marker.circle(18, 8, 8).fill(0xd86f45);
  poi.art.addChild(marker);
  return poi;
}

function renderFarmSlot(marker: PIXI.Graphics, state: BuildingState) {
  marker.clear();

  const fillByState: Record<BuildingState, number> = {
    built: 0x4f7d41,
    locked: 0x171717,
    unlocked: 0x243c30,
  };
  const strokeByState: Record<BuildingState, number> = {
    built: 0xb9f28a,
    locked: 0x5e5e5e,
    unlocked: 0xf0c26a,
  };
  const alphaByState: Record<BuildingState, number> = {
    built: 0.92,
    locked: 0.35,
    unlocked: 0.78,
  };

  marker.roundRect(-54, -54, 108, 108, 8).fill({ color: fillByState[state], alpha: alphaByState[state] });
  marker.roundRect(-54, -54, 108, 108, 8).stroke({ color: strokeByState[state], alpha: 0.72, width: 3 });
  marker.rect(-34, -34, 68, 68).stroke({ color: 0x101010, alpha: 0.45, width: 2 });

  if (state === "built") {
    marker.roundRect(-30, -18, 60, 50, 6).fill(0x6b4b2a);
    marker.moveTo(-38, -18).lineTo(0, -48).lineTo(38, -18).closePath().fill(0x9f3a2f);
    marker.rect(-8, 6, 16, 26).fill(0x1b1410);
  } else if (state === "unlocked") {
    marker.rect(-28, -4, 56, 8).fill({ color: 0xf0c26a, alpha: 0.85 });
    marker.rect(-4, -28, 8, 56).fill({ color: 0xf0c26a, alpha: 0.85 });
  } else {
    marker.moveTo(-26, -26).lineTo(26, 26).stroke({ color: 0x777777, alpha: 0.6, width: 3 });
    marker.moveTo(26, -26).lineTo(-26, 26).stroke({ color: 0x777777, alpha: 0.6, width: 3 });
  }
}

function drawFarmSlot(state: BuildingState) {
  const poi = createPoiShell("interactable", FARM_SLOT, 70);
  const marker = new PIXI.Graphics();
  renderFarmSlot(marker, state);
  poi.art.addChild(marker);
  return {
    container: poi.container,
    render: (nextState: BuildingState) => renderFarmSlot(marker, nextState),
    setNear: poi.setNear,
    update: poi.update,
  };
}

function drawVillagerNpc() {
  const poi = createPoiShell("npc", VILLAGER_NPC, 52);
  const marker = new PIXI.Graphics();
  marker.circle(0, 22, 34).fill({ color: 0x2fd8c8, alpha: 0.1 });
  marker.circle(0, -16, 13).fill(0xc08a5a);
  marker.roundRect(-15, -2, 30, 42, 9).fill(0x24495a);
  marker.roundRect(-15, -2, 30, 42, 9).stroke({ color: 0x7df7ff, alpha: 0.5, width: 2 });
  marker.rect(-20, 8, 8, 28).fill(0x1d303b);
  marker.rect(12, 8, 8, 28).fill(0x1d303b);
  marker.circle(-5, -19, 2).fill(0x10202a);
  marker.circle(5, -19, 2).fill(0x10202a);
  poi.art.addChild(marker);
  return poi;
}

function drawAncientChest() {
  const poi = createPoiShell("chest", ANCIENT_CHEST_POSITION, 54);
  const marker = new PIXI.Graphics();
  marker.circle(0, 0, 46).fill({ color: 0xf0c26a, alpha: 0.12 });
  marker.roundRect(-34, -18, 68, 40, 7).fill(0x6e421e);
  marker.roundRect(-34, -18, 68, 40, 7).stroke({ color: 0xf0c26a, alpha: 0.92, width: 3 });
  marker.rect(-38, -20, 76, 11).fill(0x2a1720);
  marker.rect(-5, -4, 10, 16).fill(0xf0c26a);
  marker.circle(0, 4, 3).fill(0x1b1012);
  poi.art.addChild(marker);
  return poi;
}

function formatResourceLabel(resourceId: ResourceId) {
  return resourceId.replaceAll("_", " ");
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
  const [isCornucopiaOpen, setIsCornucopiaOpen] = useState(false);
  const [activeDialogue, setActiveDialogue] = useState<{ name: string; text: string } | null>(null);
  const [farmState, setFarmState] = useState<BuildingState>("unlocked");
  const [farmModal, setFarmModal] = useState<BuildingModalState>(null);
  const [selectedCornucopiaResource, setSelectedCornucopiaResource] = useState<ResourceId | null>(null);
  const [isClaimingCornucopia, setIsClaimingCornucopia] = useState(false);
  const [nearbyInteractableId, setNearbyInteractableId] = useState<string | null>(null);

  const cornucopiaClaimables = useMemo(() => getCornucopiaClaimables(state), [state]);
  const selectedResource = selectedCornucopiaResource;

  useEffect(() => {
    isModalOpenRef.current = isCornucopiaOpen || farmModal !== null;
    if (isCornucopiaOpen) {
      isClaimingCornucopiaRef.current = false;
      setIsClaimingCornucopia(false);
    }
  }, [farmModal, isCornucopiaOpen]);

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

    const result = claimCornucopia(useGameStore.getState().state, { resourceId: selectedResource });

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
  }, [dispatch, selectedResource, showResourceGain]);

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
    const vignette = new PIXI.Graphics();
    const interactables: Interactable[] = [
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
      return (
        interactables.find((interactable) => distanceBetween(playerPosition, interactable) <= interactable.radius) ?? null
      );
    }

    function updateNearbyInteractable() {
      setNearby(getNearbyInteractable()?.id ?? null);
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
        const particle = new PIXI.Graphics();
        particle.circle(0, 0, 3 + (i % 3)).fill({ color, alpha: 0.82 });
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
    let groundTexture: PIXI.Texture | null = null;

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
        app.destroy(true);
        return;
      }

      resizeTarget.appendChild(app.canvas);
      app.stage.addChild(world, uiLayer);
      world.addChild(backgroundLayer, entityLayer, fxLayer);
      groundTexture = drawWorld(backgroundLayer);
      const cornucopiaVisual = drawCornucopia();
      poiVisuals.set("cornucopia", cornucopiaVisual);
      entityLayer.addChild(cornucopiaVisual.container);
      const farmSlot = drawFarmSlot(farmStateRef.current);
      renderFarmSlotRef.current = farmSlot.render;
      poiVisuals.set(FARM_SLOT.id, farmSlot);
      entityLayer.addChild(farmSlot.container);
      const villagerVisual = drawVillagerNpc();
      poiVisuals.set(VILLAGER_NPC.id, villagerVisual);
      entityLayer.addChild(villagerVisual.container);
      const chestVisual = drawAncientChest();
      entityLayer.addChild(chestVisual.container);
      entityLayer.addChild(player);
      player.position.set(playerPosition.x, playerPosition.y);
      uiLayer.addChild(vignette);
      renderVignette(vignette, app.screen.width, app.screen.height);
      spawnWorldFxRef.current = spawnWorldFx;
      updateNearbyInteractable();

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      window.addEventListener("blur", handleWindowBlur);

      const updateHub = (ticker: PIXI.Ticker) => {
        const deltaSeconds = ticker.deltaMS / 1000;
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
          playerPosition.x = clamp(
            playerPosition.x + (directionX / length) * PLAYER_SPEED * deltaSeconds,
            PLAYER_SIZE / 2,
            MAP_WIDTH - PLAYER_SIZE / 2,
          );
          playerPosition.y = clamp(
            playerPosition.y + (directionY / length) * PLAYER_SPEED * deltaSeconds,
            PLAYER_SIZE / 2,
            MAP_HEIGHT - PLAYER_SIZE / 2,
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
        chestVisual.update(elapsedSeconds);
        updateFx(deltaSeconds);

        const screenWidth = app.renderer.width / app.renderer.resolution;
        const screenHeight = app.renderer.height / app.renderer.resolution;
        renderVignette(vignette, screenWidth, screenHeight);
        const cameraX = clamp(playerPosition.x - screenWidth / 2, 0, Math.max(0, MAP_WIDTH - screenWidth));
        const cameraY = clamp(playerPosition.y - screenHeight / 2, 0, Math.max(0, MAP_HEIGHT - screenHeight));
        world.position.set(-cameraX, -cameraY);
      };

      tickerCallback = updateHub;
      app.ticker.add(updateHub);
    }

    void setup();

    return () => {
      cancelled = true;
      if (tickerCallback) {
        app.ticker.remove(tickerCallback);
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
      groundTexture?.destroy(true);
      groundTexture = null;
      if (initialized) {
        app.destroy(true, { children: true });
      }
    };
  }, [closeDialogue, openCornucopia, openFarmSlot, openVillagerDialogue]);

  return (
    <section className="relative h-[calc(100vh-7rem)] min-h-[34rem] overflow-hidden rounded-xl border border-amber-200/25 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.48)]">
      <div ref={hostRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-amber-200/18 bg-black/60 px-4 py-2 font-ik-body text-xs text-muted-foreground">
        Move: WASD, ZQSD or arrows.
      </div>

      {nearbyInteractableId ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 translate-y-20 rounded-md border border-amber-200/45 bg-black/70 px-4 py-2 font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-50 shadow-[0_0_24px_rgba(240,194,106,0.16)]">
          Press F
        </div>
      ) : null}

      {activeDialogue ? (
        <KingdomDialogueBox name={activeDialogue.name} onClose={closeDialogue} text={activeDialogue.text} />
      ) : null}

      <Dialog open={isCornucopiaOpen} onOpenChange={setIsCornucopiaOpen}>
        <DialogContent className="border-amber-200/25 bg-zinc-950 text-amber-50">
          <DialogHeader>
            <DialogTitle>Cornucopia</DialogTitle>
            <DialogDescription>Infinite resource source</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {cornucopiaClaimables.length > 0 ? (
              cornucopiaClaimables.map((resourceId) => {
                const isSelected = resourceId === selectedResource;

                return (
                  <button
                    className={`rounded-md border px-3 py-2 text-left font-ik-menu text-xs uppercase tracking-[0.12em] transition ${
                      isSelected
                        ? "border-amber-200 bg-amber-500/18 text-amber-50 shadow-[0_0_18px_rgba(240,194,106,0.14)]"
                        : "border-amber-200/15 bg-black/35 text-muted-foreground hover:border-amber-200/35 hover:text-amber-50"
                    }`}
                    key={resourceId}
                    onClick={() => setSelectedCornucopiaResource(resourceId)}
                    type="button"
                  >
                    {formatResourceLabel(resourceId)}
                  </button>
                );
              })
            ) : (
              <div className="rounded-md border border-amber-200/15 bg-black/35 p-3 font-ik-body text-sm text-muted-foreground">
                No resource available
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              className="rounded-md border border-border/70 bg-muted/30 px-4 py-2 font-ik-menu text-sm text-muted-foreground transition hover:bg-muted/45"
              onClick={() => setIsCornucopiaOpen(false)}
              type="button"
            >
              Close
            </button>
            <button
              className="rounded-md border border-amber-300/45 bg-amber-500/18 px-4 py-2 font-ik-menu text-sm text-amber-50 transition hover:border-amber-200 hover:bg-amber-500/24 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isClaimingCornucopia}
              onClick={handleClaimCornucopia}
              type="button"
            >
              Claim resources
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
