"use client";

import { cn } from "@/lib/utils";
import type { PublicStoryChapterWithLevels } from "@idleking/game-core";
import { getStoryZoneStatusLabel, getStoryZoneTitle, getStoryZoneVisual } from "./story-zone-data";

type StoryZoneCardProps = {
  chapter: PublicStoryChapterWithLevels;
  isSelected: boolean;
  onSelect: (chapterId: string) => void;
};

const toneClasses = {
  ember: "hover:border-amber-300/70 hover:shadow-[0_0_34px_rgba(217,119,6,0.22)]",
  frost: "hover:border-cyan-200/65 hover:shadow-[0_0_34px_rgba(34,211,238,0.18)]",
  void: "hover:border-violet-300/65 hover:shadow-[0_0_34px_rgba(168,85,247,0.2)]",
  gold: "hover:border-yellow-200/65 hover:shadow-[0_0_34px_rgba(234,179,8,0.18)]",
} as const;

export function StoryZoneCard({ chapter, isSelected, onSelect }: StoryZoneCardProps) {
  const visual = getStoryZoneVisual(chapter);
  const title = getStoryZoneTitle(chapter);
  const isLocked = chapter.status === "locked";
  const isCompleted = chapter.status === "completed";

  return (
    <button
      aria-label={`${title} - ${getStoryZoneStatusLabel(chapter.status)}`}
      className={cn(
        "group relative flex min-h-[22rem] w-full flex-col items-center justify-end overflow-hidden rounded-t-[7rem] rounded-b-xl border border-amber-200/25 bg-black/45 p-3 text-center transition duration-200",
        "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.035),0_18px_45px_rgba(0,0,0,0.36)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/55",
        toneClasses[visual.tone],
        isSelected && "border-amber-200/85 shadow-[0_0_34px_rgba(234,179,8,0.24),inset_0_0_0_1px_rgba(255,244,190,0.12)]",
        isLocked && "border-zinc-500/25 opacity-55 grayscale",
        isCompleted && "border-emerald-300/45"
      )}
      onClick={() => onSelect(chapter.chapterId)}
      type="button"
    >
      <div className="pointer-events-none absolute inset-2 rounded-t-[6.5rem] rounded-b-lg border border-amber-100/10" />
      <div className="pointer-events-none absolute left-1/2 top-2 h-5 w-5 -translate-x-1/2 rotate-45 border border-amber-200/45 bg-black/75" />
      <div className="pointer-events-none absolute bottom-16 left-1/2 h-6 w-6 -translate-x-1/2 rotate-45 border border-amber-200/35 bg-black/80" />
      <div className="pointer-events-none absolute inset-x-6 top-4 h-16 rounded-full bg-amber-200/10 blur-2xl transition group-hover:bg-amber-200/20" />

      <div className="relative mb-4 flex aspect-[3/4] w-full max-w-[12rem] items-center justify-center overflow-hidden rounded-t-[5.5rem] rounded-b-lg border border-amber-200/25 bg-zinc-950/75">
        <img
          alt={`Illustration ${title}`}
          className="h-full w-full object-cover"
          src={visual.image}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/0 to-black/55" />
        {isLocked ? (
          <div className="absolute bottom-4 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300/30 bg-black/70">
            <span className="relative h-5 w-5 rounded-sm border-2 border-zinc-300/75">
              <span className="absolute -top-3 left-1/2 h-4 w-4 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-zinc-300/75" />
            </span>
          </div>
        ) : null}
      </div>

      <div className="relative w-full rounded-lg border border-amber-200/25 bg-black/70 px-3 py-4 shadow-[0_-10px_28px_rgba(0,0,0,0.4)]">
        <h2 className="ik-story-heading text-xl text-amber-50">{title}</h2>
        <div
          className={cn(
            "mx-auto mt-2 w-fit rounded border px-2 py-1 font-ik-menu text-[10px]",
            chapter.status === "available" && "border-cyan-200/30 text-cyan-100",
            isCompleted && "border-emerald-300/35 text-emerald-100",
            isLocked && "border-zinc-400/25 text-zinc-400"
          )}
        >
          {getStoryZoneStatusLabel(chapter.status)}
        </div>
      </div>
    </button>
  );
}
