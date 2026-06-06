"use client";

import { cn } from "@/lib/utils";
import type { PublicStoryLevel } from "@idleking/game-core";

type StoryLevelListProps = {
  levels: PublicStoryLevel[];
  selectedLevelId: string | null;
  onSelectLevel: (levelId: string) => void;
};

function getStatusLabel(status: PublicStoryLevel["status"]): string {
  switch (status) {
    case "completed":
      return "Terminé";
    case "available":
      return "Disponible";
    case "locked":
    default:
      return "Verrouillé";
  }
}

export function StoryLevelList({ levels, selectedLevelId, onSelectLevel }: StoryLevelListProps) {
  return (
    <div className="space-y-3">
      {levels.map((level, index) => {
        const isSelected = level.id === selectedLevelId;
        const isLocked = level.status === "locked";
        const isCompleted = level.status === "completed";

        return (
          <button
            aria-label={`${level.title} - ${getStatusLabel(level.status)}`}
            aria-pressed={isSelected}
            className={cn(
              "group grid w-full grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-lg border bg-black/35 p-3 text-left transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/45",
              isSelected && "border-amber-200/60 bg-amber-200/[0.07]",
              !isSelected && !isLocked && "border-amber-200/15 hover:border-amber-200/35 hover:bg-white/[0.035]",
              !isSelected && isLocked && "border-amber-200/15",
              isLocked && "cursor-not-allowed opacity-60",
              isCompleted && "border-emerald-300/30"
            )}
            disabled={isLocked}
            key={level.id}
            onClick={() => {
              if (isLocked) return;
              onSelectLevel(level.id);
            }}
            type="button"
          >
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center border bg-black/45 font-ik-title text-lg text-amber-100",
                level.kind === "special" ? "rotate-45 border-violet-300/50 text-violet-100" : "border-amber-200/35"
              )}
            >
              <span className={level.kind === "special" ? "-rotate-45 text-sm" : undefined}>
                {level.kind === "special" ? "SP" : index + 1}
              </span>
            </span>

            <span className="min-w-0">
              <span className="block truncate font-ik-title text-sm font-semibold tracking-wide text-amber-50">{level.title}</span>
              <span className="mt-1 block font-ik-body text-xs text-muted-foreground">
                Puissance recommandée : <span className="tabular-nums">{level.recommendedPower}</span>
              </span>
            </span>

            <span
              className={cn(
                "rounded border px-2 py-1 font-ik-menu text-[10px]",
                level.status === "available" && "border-cyan-200/30 text-cyan-100",
                isCompleted && "border-emerald-300/35 text-emerald-100",
                isLocked && "border-zinc-400/25 text-zinc-400"
              )}
            >
              {getStatusLabel(level.status)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
