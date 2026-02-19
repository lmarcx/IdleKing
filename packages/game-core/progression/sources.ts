import { convertXpToWxp } from "./worldXp.js";

export type XpGain = {
  xp: number;
  wxp: number;
};

export function makeXpGain(xp: number): XpGain {
  const safeXp = Math.max(0, Math.floor(xp));
  return { xp: safeXp, wxp: convertXpToWxp(safeXp) };
}

// --- Histoire ---
export const STORY_CHAPTERS = 20;
export const STORY_CHAPTER_XP = 2500;

export function storyChapterReward(chapter: number): XpGain {
  const c = Math.floor(chapter);
  if (c < 1 || c > STORY_CHAPTERS) return makeXpGain(0);
  return makeXpGain(STORY_CHAPTER_XP);
}

// --- Donjons ---
export const DUNGEON_RUNS_PER_DAY = 5;
export const DUNGEON_RUN_XP = 2500;

export function dungeonRunReward(): XpGain {
  return makeXpGain(DUNGEON_RUN_XP);
}

// --- Quêtes répétables ---
export const REPEATABLE_QUESTS_PER_DAY = 20;
export const REPEATABLE_QUEST_XP = 400;

export function repeatableQuestReward(): XpGain {
  return makeXpGain(REPEATABLE_QUEST_XP);
}
