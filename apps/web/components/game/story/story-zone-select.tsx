"use client";

import type { PublicStoryChapterWithLevels } from "@idleking/game-core";
import { StoryZoneCard } from "./story-zone-card";

type StoryZoneSelectProps = {
  chapters: PublicStoryChapterWithLevels[];
  onOpenZone: (chapter: PublicStoryChapterWithLevels) => void;
};

export function StoryZoneSelect({ chapters, onOpenZone }: StoryZoneSelectProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {chapters.map((chapter) => (
        <StoryZoneCard chapter={chapter} key={chapter.chapterId} onOpen={onOpenZone} />
      ))}
    </div>
  );
}
