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

const MAP_WIDTH = 1800;
const MAP_HEIGHT = 1200;
const PLAYER_SIZE = 48;
const PLAYER_SPEED = 310;
const CORNUCOPIA_POSITION = { x: MAP_WIDTH / 2 + 280, y: MAP_HEIGHT / 2 };

type Vector2 = {
  x: number;
  y: number;
};

type Interactable = {
  id: string;
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

function drawWorld(container: PIXI.Container) {
  const background = new PIXI.Graphics();
  background.rect(0, 0, MAP_WIDTH, MAP_HEIGHT).fill(0x07090d);

  for (let y = 0; y < MAP_HEIGHT; y += 80) {
    for (let x = 0; x < MAP_WIDTH; x += 80) {
      const tone = (x / 80 + y / 80) % 2 === 0 ? 0x0e1714 : 0x0a1110;
      background.rect(x, y, 80, 80).fill({ color: tone, alpha: 0.5 });
    }
  }

  for (let x = 0; x <= MAP_WIDTH; x += 120) {
    background.moveTo(x, 0).lineTo(x, MAP_HEIGHT).stroke({ color: 0x375c49, alpha: 0.18, width: 1 });
  }

  for (let y = 0; y <= MAP_HEIGHT; y += 120) {
    background.moveTo(0, y).lineTo(MAP_WIDTH, y).stroke({ color: 0x375c49, alpha: 0.18, width: 1 });
  }

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

function drawCornucopia() {
  const container = new PIXI.Container();
  const marker = new PIXI.Graphics();
  marker.circle(0, 0, 62).fill({ color: 0xf0c26a, alpha: 0.11 });
  marker.circle(0, 0, 44).stroke({ color: 0xf0c26a, alpha: 0.5, width: 2 });
  marker.roundRect(-38, -28, 76, 56, 12).fill(0x6b3f1f);
  marker.roundRect(-34, -24, 68, 48, 10).stroke({ color: 0xf7d487, alpha: 0.9, width: 3 });
  marker.circle(-14, -6, 8).fill(0xffd166);
  marker.circle(8, -10, 7).fill(0x87d37c);
  marker.circle(18, 8, 8).fill(0xd86f45);
  container.addChild(marker);
  container.position.set(CORNUCOPIA_POSITION.x, CORNUCOPIA_POSITION.y);
  return container;
}

function formatResourceList(resources: ResourceId[]) {
  if (resources.length === 0) return "No resource available";
  return resources.join(", ");
}

export function KingdomHubStage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const isModalOpenRef = useRef(false);
  const isClaimingCornucopiaRef = useRef(false);
  const nearbyInteractableIdRef = useRef<string | null>(null);
  const state = useGameStore((store) => store.state);
  const dispatch = useGameStore((store) => store.dispatch);
  const showResourceGain = useResourceFeedbackStore((store) => store.showResourceGain);
  const [isCornucopiaOpen, setIsCornucopiaOpen] = useState(false);
  const [isClaimingCornucopia, setIsClaimingCornucopia] = useState(false);
  const [nearbyInteractableId, setNearbyInteractableId] = useState<string | null>(null);

  const cornucopiaClaimables = useMemo(() => getCornucopiaClaimables(state), [state]);
  const selectedResource = cornucopiaClaimables[0] ?? null;
  const cornucopia = state.buildings.cornucopia;
  const canClaimCornucopia = Boolean(selectedResource && cornucopia.unlocked && cornucopia.built && cornucopia.active);

  useEffect(() => {
    isModalOpenRef.current = isCornucopiaOpen;
    if (isCornucopiaOpen) {
      isClaimingCornucopiaRef.current = false;
      setIsClaimingCornucopia(false);
    }
  }, [isCornucopiaOpen]);

  const openCornucopia = useCallback(() => {
    if (isModalOpenRef.current) return;
    isModalOpenRef.current = true;
    setIsCornucopiaOpen(true);
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
    toast.success(`Claimed ${result.amount} ${result.resourceId}`);
    setIsCornucopiaOpen(false);
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
    const player = drawPlayer();
    const playerPosition = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
    const playerFacing = { x: 0, y: -1 };
    const interactables: Interactable[] = [
      {
        id: "cornucopia",
        x: CORNUCOPIA_POSITION.x,
        y: CORNUCOPIA_POSITION.y,
        radius: 118,
        onInteract: openCornucopia,
      },
    ];

    function setNearby(id: string | null) {
      if (nearbyInteractableIdRef.current === id) return;
      nearbyInteractableIdRef.current = id;
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

    let tickerCallback: ((ticker: PIXI.Ticker) => void) | null = null;

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
      app.stage.addChild(world);
      drawWorld(world);
      world.addChild(drawCornucopia());
      world.addChild(player);
      player.position.set(playerPosition.x, playerPosition.y);
      updateNearbyInteractable();

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      window.addEventListener("blur", handleWindowBlur);

      const updateHub = (ticker: PIXI.Ticker) => {
        const deltaSeconds = ticker.deltaMS / 1000;
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

        const screenWidth = app.renderer.width / app.renderer.resolution;
        const screenHeight = app.renderer.height / app.renderer.resolution;
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
      if (initialized) {
        app.destroy(true, { children: true });
      }
    };
  }, [openCornucopia]);

  return (
    <section className="relative h-[calc(100vh-7rem)] min-h-[34rem] overflow-hidden rounded-xl border border-amber-200/25 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.48)]">
      <div ref={hostRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-amber-200/18 bg-black/60 px-4 py-2 font-ik-body text-xs text-muted-foreground">
        Move: WASD, ZQSD or arrows.
      </div>

      {nearbyInteractableId === "cornucopia" ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 translate-y-20 rounded-md border border-amber-200/45 bg-black/70 px-4 py-2 font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-50 shadow-[0_0_24px_rgba(240,194,106,0.16)]">
          Press F
        </div>
      ) : null}

      <Dialog open={isCornucopiaOpen} onOpenChange={setIsCornucopiaOpen}>
        <DialogContent className="border-amber-200/25 bg-zinc-950 text-amber-50">
          <DialogHeader>
            <DialogTitle>Cornucopia</DialogTitle>
            <DialogDescription>Infinite resource source</DialogDescription>
          </DialogHeader>

          <div className="mt-4 rounded-md border border-amber-200/15 bg-black/35 p-3 font-ik-body text-sm text-muted-foreground">
            <div>Available: {formatResourceList(cornucopiaClaimables)}</div>
            <div className="mt-1">Stamina: {cornucopia.stamina}/{cornucopia.staminaMax}</div>
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
              disabled={!canClaimCornucopia || isClaimingCornucopia}
              onClick={handleClaimCornucopia}
              type="button"
            >
              Claim resources
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
