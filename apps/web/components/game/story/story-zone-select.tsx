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
    <div className="flex items-start justify-center">
      <div className="grid w-full max-w-[27rem] grid-cols-2 gap-3">
        {chapters.map((chapter) => (
          <StoryZoneCard
            chapter={chapter}
            isSelected={chapter.chapterId === selectedChapterId}
            key={chapter.chapterId}
            onSelect={onSelectZone}
          />
        ))}
      </div>
    </div>
  );
}
