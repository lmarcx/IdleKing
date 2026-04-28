"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import {
  completeStoryLevel,
  getVisibleStoryChaptersWithLevels,
} from "../../../../../../packages/game-core/story/levels";
import type { StoryState } from "../../../../../../packages/game-core/story/state";
import type {
  PublicStoryChapterWithLevels,
  PublicStoryLevel,
  UnlockId,
} from "../../../../../../packages/game-core/story/types";

type MaybeSerializedSet<T> = Set<T> | T[] | undefined;

function toSet<T>(value: MaybeSerializedSet<T>): Set<T> {
  if (value instanceof Set) return new Set(value);
  if (Array.isArray(value)) return new Set(value);
  return new Set();
}

function normalizeStoryState(story: Partial<StoryState>): StoryState {
  return {
    completedChapters: toSet(story.completedChapters),
    completedEvents: toSet(story.completedEvents),
    completedLevels: toSet(story.completedLevels),
    discoveredEvents: toSet(story.discoveredEvents),
    unlocked: toSet<UnlockId>(story.unlocked as MaybeSerializedSet<UnlockId>),
  };
}

function getChapterStatusLabel(status: PublicStoryChapterWithLevels["status"]) {
  switch (status) {
    case "completed":
      return "completed";
    case "available":
      return "unlocked";
    case "locked":
    default:
      return "locked";
  }
}

function getLevelButtonLabel(status: PublicStoryLevel["status"]) {
  switch (status) {
    case "completed":
      return "Termine";
    case "available":
      return "Explorer";
    case "locked":
    default:
      return "Verrouille";
  }
}

function StoryLevelCard({
  level,
  onExplore,
}: {
  level: PublicStoryLevel;
  onExplore: (levelId: string) => void;
}) {
  const isAvailable = level.status === "available";
  const isCompleted = level.status === "completed";

  return (
    <div
      className={cn(
        "rounded-lg border bg-black/20 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        isCompleted && "border-emerald-300/35",
        isAvailable && "border-amber-300/35",
        level.status === "locked" && "border-border/55 opacity-70",
        level.kind === "special" && "bg-violet-300/5"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-ik-title text-sm font-semibold tracking-wide">{level.title}</h3>
            <span className="rounded border border-border/60 bg-black/30 px-2 py-0.5 font-ik-menu text-[10px] text-muted-foreground">
              {level.kind}
            </span>
          </div>
          <p className="mt-1 font-ik-body text-xs leading-relaxed text-muted-foreground">{level.description}</p>
        </div>

        <div className="text-right font-ik-body text-xs text-muted-foreground">
          <div className="font-ik-menu text-[10px]">Power</div>
          <div className="tabular-nums">{level.recommendedPower}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-ik-menu text-[10px] text-muted-foreground">{level.status}</span>
        <button
          className={cn(
            "rounded-md border px-3 py-2 font-ik-menu text-xs transition-colors",
            isAvailable && "border-amber-300/40 bg-amber-300/10 text-amber-100 hover:border-amber-300/65",
            isCompleted && "border-emerald-300/35 bg-emerald-300/[0.08] text-emerald-100",
            level.status === "locked" && "border-border/50 bg-muted/10 text-muted-foreground"
          )}
          disabled={!isAvailable}
          onClick={() => onExplore(level.id)}
          type="button"
        >
          {getLevelButtonLabel(level.status)}
        </button>
      </div>
    </div>
  );
}

function StoryChapterCard({
  chapter,
  onExplore,
}: {
  chapter: PublicStoryChapterWithLevels;
  onExplore: (levelId: string) => void;
}) {
  return (
    <section className="rounded-xl border border-border/70 bg-black/[0.18] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-ik-menu text-[11px] text-muted-foreground">Age {chapter.age}</div>
          <h2 className="font-ik-title text-lg font-semibold tracking-wide">{chapter.title}</h2>
        </div>
        <span className="rounded border border-amber-300/25 bg-black/30 px-2.5 py-1 font-ik-menu text-[10px] text-muted-foreground">
          {getChapterStatusLabel(chapter.status)}
        </span>
      </div>

      {chapter.levels.length === 0 ? (
        <p className="mt-4 font-ik-body text-sm text-muted-foreground">Aucun niveau Story disponible pour cette zone.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {chapter.levels.map((level) => (
            <StoryLevelCard key={level.id} level={level} onExplore={onExplore} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function OriginalWorldPage() {
  const story = useGameStore((s) => s.state.story);
  const dispatch = useGameStore((s) => s.dispatch);

  const normalizedStory = useMemo(() => normalizeStoryState(story), [story]);
  const chapters = useMemo(() => getVisibleStoryChaptersWithLevels(normalizedStory), [normalizedStory]);

  function handleExplore(levelId: string) {
    dispatch((state) => ({
      ...state,
      story: completeStoryLevel(normalizeStoryState(state.story), levelId),
    }));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-ik-title text-2xl font-semibold">Story</h1>
        <p className="font-ik-body mt-1 text-sm text-muted-foreground">Zones narratives</p>
      </div>

      <div className="grid gap-4">
        {chapters.map((chapter) => (
          <StoryChapterCard chapter={chapter} key={chapter.id} onExplore={handleExplore} />
        ))}
      </div>
    </div>
  );
}
