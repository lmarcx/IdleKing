"use client";

import { useEffect } from "react";

import { LeftNav } from "@/components/left-nav";
import { OfflineSummaryModal } from "@/components/offline-summary-modal";
import { ResourceGainPopupLayer } from "@/components/game/resource-gain-popup-layer";
import { RightHud } from "@/components/right-hud";
import { useGameStore } from "@/store/game-store";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useGameStore((s) => s.hydrated);
  const loadGame = useGameStore((s) => s.loadGame);

  useEffect(() => {
    if (!hydrated) loadGame();
  }, [hydrated, loadGame]);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 gap-4 p-4 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
      <LeftNav />
      <section className="rounded-xl border bg-card p-4">{children}</section>
      <RightHud />
      <OfflineSummaryModal />
      <ResourceGainPopupLayer />
    </main>
  );
}
