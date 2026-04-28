"use client";

import { cn } from "@/lib/utils";

export type WorldModeId = "story" | "expeditions" | "duel";

type WorldMode = {
  icon: string;
  id: WorldModeId;
  label: string;
  status: string;
};

const WORLD_MODES: WorldMode[] = [
  {
    icon: "/assets/worlds/story.svg",
    id: "story",
    label: "Story",
    status: "Disponible",
  },
  {
    icon: "/assets/worlds/expeditions.svg",
    id: "expeditions",
    label: "Expeditions",
    status: "Bientot disponible",
  },
  {
    icon: "/assets/worlds/duel.svg",
    id: "duel",
    label: "Duel",
    status: "Bientot disponible",
  },
];

type WorldModeSidebarProps = {
  activeMode: WorldModeId;
  onChangeMode: (mode: WorldModeId) => void;
};

export function WorldModeSidebar({ activeMode, onChangeMode }: WorldModeSidebarProps) {
  return (
    <nav aria-label="Modes de monde" className="grid gap-3">
      {WORLD_MODES.map((mode) => {
        const isActive = mode.id === activeMode;
        const isUnavailable = mode.id !== "story";

        return (
          <button
            aria-pressed={isActive}
            className={cn(
              "group grid min-h-32 place-items-center gap-2 rounded-xl border bg-black/35 p-3 text-center transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/55",
              isActive && "border-amber-200/75 bg-amber-200/[0.07] shadow-[0_0_26px_rgba(198,168,91,0.16)]",
              !isActive && "border-amber-200/18 hover:border-amber-200/45 hover:bg-white/[0.035]",
              isUnavailable && !isActive && "opacity-70"
            )}
            key={mode.id}
            onClick={() => onChangeMode(mode.id)}
            type="button"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full border border-amber-200/25 bg-black/45 shadow-[inset_0_0_18px_rgba(198,168,91,0.08)] transition-transform group-hover:scale-105">
              <img alt="" aria-hidden="true" className="h-10 w-10 object-contain" src={mode.icon} />
            </span>
            <span className="ik-story-heading text-sm text-amber-50">{mode.label}</span>
            <span className="font-ik-body text-[11px] text-muted-foreground">{mode.status}</span>
          </button>
        );
      })}
    </nav>
  );
}
