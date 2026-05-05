"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { CharacterView } from "@/components/game/character/character-view";
import { InventoryView } from "@/components/game/inventory/inventory-view";
import { SkillsView } from "@/components/game/skills/skills-view";
import { WorldsModeShell } from "@/components/game/worlds/worlds-mode-shell";
import { GameOverlay } from "@/components/game/hud/game-overlay";

export type GameHudOverlayId = "character" | "inventory" | "skills" | "worlds" | "settings";

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
  settings: "Settings",
  skills: "Skills",
  worlds: "World Gate",
};

export function GameHudOverlayProvider({ children }: { children: ReactNode }) {
  const [activeOverlay, setActiveOverlay] = useState<GameHudOverlayId | null>(null);
  const [mountedOverlays, setMountedOverlays] = useState<Record<GameHudOverlayId, boolean>>({
    character: false,
    inventory: false,
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

      {activeOverlay === "worlds" ? (
        <GameOverlay contentClassName="overscroll-contain" onClose={closeOverlay} open title={OVERLAY_TITLES.worlds}>
          <WorldsModeShell />
        </GameOverlay>
      ) : null}

      {activeOverlay === "settings" ? (
        <GameOverlay onClose={closeOverlay} open title={OVERLAY_TITLES.settings}>
          <div className="grid min-h-56 place-items-center rounded-lg border border-amber-200/18 bg-black/35 p-6 text-center">
            <div>
              <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-200/70">Settings</p>
              <h3 className="mt-2 font-ik-title text-2xl text-amber-50">Coming Soon</h3>
            </div>
          </div>
        </GameOverlay>
      ) : null}
    </>
  );
}
