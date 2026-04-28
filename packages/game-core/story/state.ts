import type { ChapterId, UnlockId } from "./types.js";

export type StoryState = {
  completedChapters: Set<ChapterId>;
  completedLevels: Set<string>;
  discoveredEvents: Set<string>;
  completedEvents: Set<string>;

  // ce que le joueur a debloque via l'histoire (buildings/features)
  unlocked: Set<UnlockId>;
};

export function createEmptyStoryState(): StoryState {
  return {
    completedChapters: new Set(),
    completedLevels: new Set(),
    discoveredEvents: new Set(),
    completedEvents: new Set(),
    unlocked: new Set(),
  };
}
