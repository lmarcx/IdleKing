"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { CinematicPlayer } from "@/components/game/cinematic/cinematic-player";
import { useGameStore } from "@/store/game-store";
import { PROLOGUE_AWAKENING, getStartFlowStep, markIntroSeen } from "@idleking/game-core";

const PROLOGUE_LEVEL_ROUTE = "/game/story/levels/prologue_wastelands";
const KINGDOM_ROUTE = "/game/kingdom";

export default function GameStartPage() {
  const router = useRouter();
  const hydrated = useGameStore((s) => s.hydrated);
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);

  const step = hydrated ? getStartFlowStep(state) : null;

  useEffect(() => {
    if (step === "prologue") router.replace(PROLOGUE_LEVEL_ROUTE);
    else if (step === "kingdom") router.replace(KINGDOM_ROUTE);
  }, [router, step]);

  if (step === "cinematic") {
    return (
      <CinematicPlayer
        script={PROLOGUE_AWAKENING}
        onComplete={() => {
          dispatch(markIntroSeen);
          router.replace(PROLOGUE_LEVEL_ROUTE);
        }}
      />
    );
  }

  // Hydrating, or redirecting to prologue/kingdom.
  return (
    <div className="grid min-h-[calc(100vh-2rem)] place-items-center text-amber-100/70">
      <p className="font-ik-menu text-xs uppercase tracking-[0.22em]">Chargement…</p>
    </div>
  );
}
