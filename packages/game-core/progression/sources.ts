export type XpGain = {
  xp: number;
  wxp: number;
};

export function makeXpGain(xp: number): XpGain {
  const safeXp = Math.max(0, Math.floor(xp));
  return { xp: safeXp, wxp: 0 };
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
