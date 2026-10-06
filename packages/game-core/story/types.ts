/** Legacy 20-chapter id, kept only to read `story.completedChapters` from old saves. */
export type ChapterId = number;

export type UnlockId =
  | "FORUM"
  | "FARM"
  | "MINE"
  | "KITCHEN"
  | "TEMPLE"
  | "REPEATABLE_QUESTS"
  | "TAVERN"
  | "DUNGEONS"
  | "FORGE"
  | "LABORATORY"
  | "FORTRESS"
  | "MARKET"
  | "TIME_GATE"
  | "WORLD_GATE"
  | "BANK"
  | "ROYAL_CASTLE"
  // extensible: ajouter d'autres ids plus tard sans casser
  | (string & {});
