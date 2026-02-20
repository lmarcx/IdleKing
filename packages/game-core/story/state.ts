import type { ChapterId, UnlockId } from "./types.js";

export type StoryState = {
  completedChapters: Set<ChapterId>;

  // ce que le joueur a débloqué via l'histoire (buildings/features)
  unlocked: Set<UnlockId>;
};

export function createEmptyStoryState(): StoryState {
  return {
    completedChapters: new Set(),
    unlocked: new Set(),
  };
}