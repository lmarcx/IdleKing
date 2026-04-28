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

export type StoryLevelKind = "standard" | "special";

export type StoryLevelStatus = "locked" | "available" | "completed";

export type StoryEventType =
  | "exploration"
  | "dialogue"
  | "discovery"
  | "encounter"
  | "boss"
  | "cutscene"
  | "unlock"
  | "return_to_boto";

export type StoryEventVisibility = "hidden" | "discovered" | "completed";

export type StoryEventDef = {
  id: string;
  type: StoryEventType;
  title: string;
  description: string;
};

export type StoryLevelDef = {
  id: string;
  chapterId: string;
  index: number;
  kind: StoryLevelKind;
  title: string;
  description: string;
  recommendedPower: number;
  isRequiredForNarrative: boolean;
  events: StoryEventDef[];
};

export type PublicStoryLevel = Omit<StoryLevelDef, "events"> & {
  status: StoryLevelStatus;
};

export type PublicStoryChapterWithLevels = {
  age: 1 | 2 | 3 | 4 | 5;
  chapterId: string;
  id: ChapterId;
  levels: PublicStoryLevel[];
  status: "locked" | "available" | "completed";
  title: string;
};
