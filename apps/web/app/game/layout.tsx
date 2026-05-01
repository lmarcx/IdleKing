"use client";

import { useEffect } from "react";

import { ProgressionPanel } from "@/components/game/progression-panel";
import { ResourceGainPopupLayer } from "@/components/game/resource-gain-popup-layer";
import { RightSidebar } from "@/components/game/right-sidebar";
import { LeftNav } from "@/components/left-nav";
import { OfflineSummaryModal } from "@/components/offline-summary-modal";
import { GamePanel } from "@/components/ui/game-panel";
import { useGameStore } from "@/store/game-store";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useGameStore((s) => s.hydrated);
  const loadGame = useGameStore((s) => s.loadGame);

  useEffect(() => {
    if (!hydrated) loadGame();
  }, [hydrated, loadGame]);

  return (
    <div className="ik-game-background min-h-screen">
      <main className="relative z-10 grid min-h-screen w-full grid-cols-1 items-start gap-3 p-2 sm:p-3 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="min-w-0 space-y-3">
          <LeftNav />
          <ProgressionPanel />
        </aside>

        <GamePanel variant="ornate" className="min-h-[calc(100vh-1rem)] min-w-0 p-3 sm:min-h-[calc(100vh-1.5rem)]">
          {children}
        </GamePanel>

        <RightSidebar />
        <OfflineSummaryModal />
        <ResourceGainPopupLayer />
      </main>
    </div>
  );
}
