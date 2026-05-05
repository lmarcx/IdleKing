"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

import { GameHudOverlayProvider } from "@/components/game/hud/game-hud-overlays";
import { ResourceGainPopupLayer } from "@/components/game/resource-gain-popup-layer";
import { OfflineSummaryModal } from "@/components/offline-summary-modal";
import { useGameStore } from "@/store/game-store";

export default function GameLayout({ children }: { children: ReactNode }) {
  const hydrated = useGameStore((s) => s.hydrated);
  const loadGame = useGameStore((s) => s.loadGame);

  useEffect(() => {
    if (!hydrated) loadGame();
  }, [hydrated, loadGame]);

  return (
    <div className="ik-game-background min-h-screen">
      <GameHudOverlayProvider>
        <main className="relative z-10 min-h-screen w-full">
          {children}
          <OfflineSummaryModal />
          <ResourceGainPopupLayer />
        </main>
      </GameHudOverlayProvider>
    </div>
  );
}
