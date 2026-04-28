"use client";

import type { PublicStoryChapterWithLevels } from "@idleking/game-core";
import { StoryZoneCard } from "./story-zone-card";

type StoryZoneSelectProps = {
  chapters: PublicStoryChapterWithLevels[];
  onSelectZone: (chapterId: string) => void;
  selectedChapterId: string | null;
};

export function StoryZoneSelect({ chapters, onSelectZone, selectedChapterId }: StoryZoneSelectProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
      {chapters.map((chapter) => (
        <StoryZoneCard
          chapter={chapter}
          isSelected={chapter.chapterId === selectedChapterId}
          key={chapter.chapterId}
          onSelect={onSelectZone}
        />
      ))}
    </div>
  );
}
