"use client";

import { useState } from "react";

import { StoryModeView } from "@/components/game/story/story-mode-view";
import { WorldModeSidebar, type WorldModeId } from "./world-mode-sidebar";

function ComingSoonPanel({ title }: { title: string }) {
  return (
    <section className="grid min-h-[38rem] place-items-center rounded-xl border border-amber-200/20 bg-black/35 p-8 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="max-w-md">
        <div className="mx-auto mb-5 h-20 w-20 rotate-45 border border-amber-200/35 bg-black/45 shadow-[0_0_28px_rgba(198,168,91,0.12)]" />
        <h2 className="ik-story-heading text-2xl text-amber-50">{title}</h2>
        <p className="mt-3 font-ik-body text-sm leading-relaxed text-muted-foreground">
          Bientot disponible.
        </p>
      </div>
    </section>
  );
}

export function WorldsModeShell() {
  const [activeMode, setActiveMode] = useState<WorldModeId>("story");

  return (
    <div className="grid min-h-[calc(100vh-4rem)] gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-amber-200/18 bg-black/32 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.025)]">
        <WorldModeSidebar activeMode={activeMode} onChangeMode={setActiveMode} />
      </aside>

      <div className="min-w-0">
        {activeMode === "story" ? <StoryModeView /> : null}
        {activeMode === "expeditions" ? <ComingSoonPanel title="Expeditions" /> : null}
        {activeMode === "duel" ? <ComingSoonPanel title="Duel" /> : null}
      </div>
    </div>
  );
}
