"use client";

import { useMemo, useState } from "react";

import { StoryZoneDetailPanel } from "@/components/game/story/story-zone-detail-panel";
import { StoryZoneSelect } from "@/components/game/story/story-zone-select";
import { useGameStore } from "@/store/game-store";
import {
  completeStoryLevel,
  getVisibleStoryChaptersWithLevels,
} from "@idleking/game-core";
import type { StoryState, UnlockId } from "@idleking/game-core";

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

export function StoryModeView() {
  const story = useGameStore((s) => s.state.story);
  const dispatch = useGameStore((s) => s.dispatch);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const normalizedStory = useMemo(() => normalizeStoryState(story), [story]);
  const chapters = useMemo(() => getVisibleStoryChaptersWithLevels(normalizedStory), [normalizedStory]);

  const activeChapterId =
    selectedChapterId ?? chapters.find((chapter) => chapter.status === "available")?.chapterId ?? chapters[0]?.chapterId ?? null;
  const selectedChapter = activeChapterId ? chapters.find((chapter) => chapter.chapterId === activeChapterId) ?? null : null;

  function handleExplore(levelId: string) {
    dispatch((state) => ({
      ...state,
      story: completeStoryLevel(normalizeStoryState(state.story), levelId),
    }));
  }

  return (
    <div className="ik-story-mode space-y-5">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="ik-story-title text-amber-50">Story Mode</h1>
        <p className="font-ik-body mt-3 text-sm leading-relaxed text-muted-foreground">
          Explorez les terres du royaume et progressez zone par zone.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.9fr)_minmax(520px,1.2fr)]">
        <StoryZoneSelect chapters={chapters} onSelectZone={setSelectedChapterId} selectedChapterId={activeChapterId} />
        <StoryZoneDetailPanel chapter={selectedChapter} onExplore={handleExplore} />
      </div>
    </div>
  );
}
