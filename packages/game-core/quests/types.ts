export type QuestId = string;

export type QuestType = "REPEATABLE";

export type QuestDef = {
  id: QuestId;
  type: QuestType;
  name: string;
  desc: string;

  // minimal target types (MVP)
  objective:
    | { kind: "CONVERT_RESOURCES"; amount: number }
    | { kind: "CLEAR_EXPEDITION"; level: number; times: number };

  rewards: {
    kingamas: number;
  };
};

export type QuestState = {
  id: QuestId;
  progress: number;
  completed: boolean;
  claimed: boolean;
};

export type QuestBook = Record<QuestId, QuestState>;
