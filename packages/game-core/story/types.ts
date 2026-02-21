export type ChapterId = number; // 1..20

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
  | "ROYAL_CASTLE"
  // extensible: ajouter d'autres ids plus tard sans casser
  | (string & {});

export type ChapterUnlock = {
  id: UnlockId;
  kind: "BUILDING" | "FEATURE";
};

export type ChapterDef = {
  id: ChapterId;
  age: 1 | 2 | 3 | 4 | 5;
  title: string;

  // MVP: narration simple
  scriptIds: string[]; // permet déjà plusieurs scripts par chapitre

  // Unlocks déclenchés quand on complete le chapitre (non-repeatable)
  unlocks: ChapterUnlock[];
};