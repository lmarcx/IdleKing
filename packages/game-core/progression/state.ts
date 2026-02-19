export type StoryProgress = {
  // chapitres complétés (1..20)
  completedChapters: Set<number>;
};

export type DailyCounters = {
  dungeonRunsToday: number;  // max 5/jour (MVP)
  repeatableQuestsToday: number; // max 20/jour (MVP)
};

export type ProgressionState = {
  playerLevel: number; // 1..50
  playerXp: number;    // XP courant dans le level
  worldLevel: number;  // 1..50
  worldWxp: number;    // WXP courant dans le world level

  story: StoryProgress;
  daily: DailyCounters;

  // optionnel pour la prod passive
  templeLevel: 1 | 2 | 3 | 4 | 5;
};
