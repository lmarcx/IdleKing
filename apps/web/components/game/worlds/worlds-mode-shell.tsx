"use client";

import { useState } from "react";

import { StoryModeView } from "@/components/game/story/story-mode-view";
import { TimeGatePanel } from "@/components/game/worlds/time-gate-panel";
import { WorldModeSidebar, type WorldModeId } from "./world-mode-sidebar";

type WorldsModeShellProps = {
  initialMode?: WorldModeId;
  initialOpponentId?: string | null;
};

export function WorldsModeShell({ initialMode = "story", initialOpponentId = null }: WorldsModeShellProps) {
  const [activeMode, setActiveMode] = useState<WorldModeId>(initialMode);

  return (
    <div className="grid gap-4 lg:grid-cols-[176px_minmax(0,1fr)]">
      <aside className="h-max rounded-xl border border-amber-200/18 bg-black/32 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.025)] lg:sticky lg:top-0">
        <WorldModeSidebar activeMode={activeMode} onChangeMode={setActiveMode} />
      </aside>

      <div className="min-w-0">
        {activeMode === "story" ? <StoryModeView /> : null}
        {activeMode === "time_gate" ? <TimeGatePanel /> : null}
      </div>
    </div>
  );
}
