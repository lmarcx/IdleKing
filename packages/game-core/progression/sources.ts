import { convertXpToWxp } from "./worldXp";

export type XpGain = {
  xp: number;
  wxp: number; // conversion auto
};

export function makeXpGain(xp: number): XpGain {
  return { xp, wxp: convertXpToWxp(xp) };
}

// Histoire : 20 chapitres, 2500 XP chacun, non répétable
export const STORY_CHAPTER_XP = 2500;

export function storyChapterReward(chapter: number): XpGain {
  if (chapter < 1 || chapter > 20) return makeXpGain(0);
  return makeXpGain(STORY_CHAPTER_XP);
}

// Donjons : 5 runs / jour, 2500 XP/run
export const DUNGEON_RUN_XP = 2500;
export const DUNGEON_RUNS_PER_DAY = 5;

export function dungeonRunReward(): XpGain {
  return makeXpGain(DUNGEON_RUN_XP);
}

// Quêtes répétables : 20/jour, 400 XP
export const REPEATABLE_QUEST_XP = 400;
export const REPEATABLE_QUESTS_PER_DAY = 20;

export function repeatableQuestReward(): XpGain {
  return makeXpGain(REPEATABLE_QUEST_XP);
}
