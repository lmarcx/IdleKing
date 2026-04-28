import { CHAPTERS } from "./chapters.js";
import type { ChapterId, ChapterDef, UnlockId } from "./types.js";
import type { StoryState } from "./state.js";
import { storyChapterReward } from "../progression/sources.js";
import type { XpGain } from "../progression/sources.js";

export function getChapterDef(chapterId: ChapterId): ChapterDef | undefined {
  return CHAPTERS.find((c) => c.id === chapterId);
}

export function isChapterCompleted(story: StoryState, chapterId: ChapterId): boolean {
  return story.completedChapters.has(chapterId);
}

// MVP: simple "clic" => on autorise si chapitre précédent complété (progression linéaire)
export function canCompleteChapter(story: StoryState, chapterId: ChapterId): boolean {
  if (chapterId < 1 || chapterId > 20) return false;
  if (isChapterCompleted(story, chapterId)) return false;
  if (chapterId === 1) return true;
  return story.completedChapters.has((chapterId - 1) as ChapterId);
}

export type CompleteChapterResult = {
  nextStory: StoryState;
  gained: XpGain; // XP + WXP (via conversion)
  unlocksApplied: UnlockId[];
};

export function completeChapter(story: StoryState, chapterId: ChapterId): CompleteChapterResult {
  if (!canCompleteChapter(story, chapterId)) {
    return {
      nextStory: story,
      gained: { xp: 0, wxp: 0 },
      unlocksApplied: [],
    };
  }

  const def = getChapterDef(chapterId);
  if (!def) {
    return {
      nextStory: story,
      gained: { xp: 0, wxp: 0 },
      unlocksApplied: [],
    };
  }

  const gained = storyChapterReward(chapterId);

  const nextStory: StoryState = {
    completedChapters: new Set(story.completedChapters),
    completedLevels: new Set(story.completedLevels),
    discoveredEvents: new Set(story.discoveredEvents),
    completedEvents: new Set(story.completedEvents),
    unlocked: new Set(story.unlocked),
  };

  nextStory.completedChapters.add(chapterId);

  // appliquer les unlocks du chapitre, et garder la liste de ceux qui ont été effectivement appliqués (nouveaux)
  const unlocksApplied: UnlockId[] = [];
  for (const u of def.unlocks) {
    if (!nextStory.unlocked.has(u.id)) {
      nextStory.unlocked.add(u.id);
      unlocksApplied.push(u.id);
    }
  }

  return { nextStory, gained, unlocksApplied };
}

// MVP: progression linéaire simple, on propose le chapitre suivant à compléter
export function nextAvailableChapter(story: StoryState): ChapterId | null {
  for (let id = 1 as ChapterId; id <= 20; id = (id + 1) as ChapterId) {
    if (canCompleteChapter(story, id)) return id;
  }
  return null;
}
