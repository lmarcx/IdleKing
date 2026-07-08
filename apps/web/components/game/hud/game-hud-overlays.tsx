"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Grid2X2, Settings } from "lucide-react";

import { CharacterView } from "@/components/game/character/character-view";
import { InventoryView } from "@/components/game/inventory/inventory-view";
import { ResonanceTreePanel } from "@/components/game/resonance/resonance-tree-panel";
import { SkillsView } from "@/components/game/skills/skills-view";
import { WorldsModeShell } from "@/components/game/worlds/worlds-mode-shell";
import { GameOverlay } from "@/components/game/hud/game-overlay";

export type GameHudOverlayId = "character" | "inventory" | "resonance" | "skills" | "worlds" | "settings";

type GameHudOverlayContextValue = {
  activeOverlay: GameHudOverlayId | null;
  closeOverlay: () => void;
  isOverlayOpen: boolean;
  openOverlay: (overlayId: GameHudOverlayId) => void;
};

const GameHudOverlayContext = createContext<GameHudOverlayContextValue | null>(null);

const OVERLAY_TITLES: Record<GameHudOverlayId, string> = {
  character: "Character",
  inventory: "Inventory",
  resonance: "Résonance",
  settings: "Settings",
  skills: "Skills",
  worlds: "Time Gate",
};

export function GameHudOverlayProvider({ children }: { children: ReactNode }) {
  const [activeOverlay, setActiveOverlay] = useState<GameHudOverlayId | null>(null);
  const [mountedOverlays, setMountedOverlays] = useState<Record<GameHudOverlayId, boolean>>({
    character: false,
    inventory: false,
    resonance: false,
    settings: false,
    skills: false,
    worlds: false,
  });

  const closeOverlay = useCallback(() => {
    setActiveOverlay(null);
  }, []);

  const openOverlay = useCallback((overlayId: GameHudOverlayId) => {
    setMountedOverlays((current) => ({
      ...current,
      [overlayId]: true,
    }));
    setActiveOverlay(overlayId);
  }, []);

  const value = useMemo<GameHudOverlayContextValue>(
    () => ({
      activeOverlay,
      closeOverlay,
      isOverlayOpen: activeOverlay !== null,
      openOverlay,
    }),
    [activeOverlay, closeOverlay, openOverlay]
  );

  return (
    <GameHudOverlayContext.Provider value={value}>
      {children}
      <GameHudOverlayLayer activeOverlay={activeOverlay} closeOverlay={closeOverlay} mountedOverlays={mountedOverlays} />
    </GameHudOverlayContext.Provider>
  );
}

export function useGameHudOverlay() {
  const context = useContext(GameHudOverlayContext);
  if (!context) {
    throw new Error("useGameHudOverlay must be used inside GameHudOverlayProvider");
  }
  return context;
}

function GameHudOverlayLayer({
  activeOverlay,
  closeOverlay,
  mountedOverlays,
}: {
  activeOverlay: GameHudOverlayId | null;
  closeOverlay: () => void;
  mountedOverlays: Record<GameHudOverlayId, boolean>;
}) {
  return (
    <>
      {mountedOverlays.character ? (
        <GameOverlay keepMounted onClose={closeOverlay} open={activeOverlay === "character"} title={OVERLAY_TITLES.character}>
          <CharacterView />
        </GameOverlay>
      ) : null}

      {activeOverlay === "inventory" ? (
        <GameOverlay onClose={closeOverlay} open title={OVERLAY_TITLES.inventory}>
          <InventoryView />
        </GameOverlay>
      ) : null}

      {activeOverlay === "skills" ? (
        <GameOverlay contentClassName="overscroll-contain" onClose={closeOverlay} open title={OVERLAY_TITLES.skills}>
          <SkillsView />
        </GameOverlay>
      ) : null}

      {activeOverlay === "resonance" ? (
        <GameOverlay contentClassName="overscroll-contain" onClose={closeOverlay} open title={OVERLAY_TITLES.resonance}>
          <ResonanceTreePanel />
        </GameOverlay>
      ) : null}

      {activeOverlay === "worlds" ? (
        <GameOverlay contentClassName="overscroll-contain" onClose={closeOverlay} open title={OVERLAY_TITLES.worlds}>
          <WorldsModeShell />
        </GameOverlay>
      ) : null}

      {activeOverlay === "settings" ? (
        <GameOverlay onClose={closeOverlay} open title={OVERLAY_TITLES.settings}>
          <div className="ik-stagger grid gap-3 sm:grid-cols-2">
            <Link
              className="ik-card-hover group border-2 border-neutral-700 bg-black/50 p-5"
              href="/editor"
              onClick={closeOverlay}
            >
              <span className="grid h-11 w-11 place-items-center border-2 border-neutral-600 bg-neutral-900 transition group-hover:border-neutral-100">
                <Grid2X2 aria-hidden="true" className="h-5 w-5 text-neutral-200" />
              </span>
              <span className="mt-3 block font-ik-menu text-sm text-neutral-100">Mode éditeur</span>
              <span className="mt-1.5 block font-ik-body text-xs text-neutral-400">Assets et maps custom.</span>
            </Link>

            <Link
              className="ik-card-hover group border-2 border-neutral-700 bg-black/50 p-5"
              href="/game/settings"
              onClick={closeOverlay}
            >
              <span className="grid h-11 w-11 place-items-center border-2 border-neutral-600 bg-neutral-900 transition group-hover:border-neutral-100">
                <Settings aria-hidden="true" className="h-5 w-5 text-neutral-200" />
              </span>
              <span className="mt-3 block font-ik-menu text-sm text-neutral-100">Settings complets</span>
              <span className="mt-1.5 block font-ik-body text-xs text-neutral-400">Sauvegarde et options.</span>
            </Link>
          </div>
        </GameOverlay>
      ) : null}
    </>
  );
}
