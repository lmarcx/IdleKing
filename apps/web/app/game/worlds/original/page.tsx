"use client";

import { useMemo, useState } from "react";

import { StoryZoneModal } from "@/components/game/story/story-zone-modal";
import { StoryZoneSelect } from "@/components/game/story/story-zone-select";
import { useGameStore } from "@/store/game-store";
import {
  completeStoryLevel,
  getVisibleStoryChaptersWithLevels,
} from "@idleking/game-core";
import type {
  PublicStoryChapterWithLevels,
  StoryState,
  UnlockId,
} from "@idleking/game-core";

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

export default function OriginalWorldPage() {
  const story = useGameStore((s) => s.state.story);
  const dispatch = useGameStore((s) => s.dispatch);
  const [selectedChapter, setSelectedChapter] = useState<PublicStoryChapterWithLevels | null>(null);

  const normalizedStory = useMemo(() => normalizeStoryState(story), [story]);
  const chapters = useMemo(() => getVisibleStoryChaptersWithLevels(normalizedStory), [normalizedStory]);

  const modalChapter = selectedChapter
    ? chapters.find((chapter) => chapter.chapterId === selectedChapter.chapterId) ?? selectedChapter
    : null;

  function handleExplore(levelId: string) {
    dispatch((state) => ({
      ...state,
      story: completeStoryLevel(normalizeStoryState(state.story), levelId),
    }));
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-ik-title text-4xl font-semibold tracking-wide text-amber-50">Story Mode</h1>
        <p className="font-ik-body mt-3 text-sm leading-relaxed text-muted-foreground">
          Explorez les terres du royaume et progressez zone par zone.
        </p>
      </div>

      <StoryZoneSelect chapters={chapters} onOpenZone={setSelectedChapter} />

      <StoryZoneModal chapter={modalChapter} onClose={() => setSelectedChapter(null)} onExplore={handleExplore} />
    </div>
  );
}
