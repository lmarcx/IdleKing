"use client";

import { BookOpen, CircleDot, DoorOpen, Sparkles, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type WorldModeId = "story" | "time_gate" | "resonance" | "effect_sets";

type WorldMode = {
  icon: LucideIcon;
  id: WorldModeId;
  label: string;
  status: string;
};

const WORLD_MODES: WorldMode[] = [
  {
    icon: BookOpen,
    id: "story",
    label: "Story",
    status: "Disponible",
  },
  {
    icon: DoorOpen,
    id: "time_gate",
    label: "Time Gate",
    status: "MVP",
  },
  {
    icon: CircleDot,
    id: "resonance",
    label: "Resonance",
    status: "Derived",
  },
  {
    icon: Sparkles,
    id: "effect_sets",
    label: "Effect Sets",
    status: "MVP",
  },
];

type WorldModeSidebarProps = {
  activeMode: WorldModeId;
  onChangeMode: (mode: WorldModeId) => void;
};

export function WorldModeSidebar({ activeMode, onChangeMode }: WorldModeSidebarProps) {
  return (
    <nav aria-label="Modes de monde" className="grid gap-2">
      {WORLD_MODES.map((mode) => {
        const isActive = mode.id === activeMode;
        const Icon = mode.icon;

        return (
          <button
            aria-label={`Open ${mode.label} panel`}
            aria-pressed={isActive}
            className={cn(
              "group grid min-h-24 place-items-center gap-1.5 rounded-lg border bg-black/35 p-2 text-center transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/55",
              isActive && "border-amber-200/75 bg-amber-200/[0.07] shadow-[0_0_26px_rgba(198,168,91,0.16)]",
              !isActive && "border-amber-200/18 hover:border-amber-200/45 hover:bg-white/[0.035]"
            )}
            key={mode.id}
            onClick={() => onChangeMode(mode.id)}
            type="button"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full border border-amber-200/25 bg-black/45 shadow-[inset_0_0_14px_rgba(198,168,91,0.08)] transition-transform group-hover:scale-105">
              <Icon aria-hidden="true" className="h-6 w-6 text-amber-100" />
            </span>
            <span className="ik-story-heading text-xs text-amber-50">{mode.label}</span>
            <span className="font-ik-body text-[10px] leading-tight text-muted-foreground">{mode.status}</span>
          </button>
        );
      })}
    </nav>
  );
}
