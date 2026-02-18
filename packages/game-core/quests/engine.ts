import type { QuestBook, QuestDef, QuestState } from "./types.js";
import { QUESTS } from "./defs.js";

export function initQuestBook(): QuestBook {
  const book: QuestBook = {};
  for (const q of QUESTS) {
    book[q.id] = { id: q.id, progress: 0, completed: false, claimed: false };
  }
  return book;
}

function getDef(id: string): QuestDef {
  const q = QUESTS.find((x) => x.id === id);
  if (!q) throw new Error(`Unknown quest ${id}`);
  return q;
}

export function addQuestProgress(book: QuestBook, id: string, delta: number): QuestBook {
  const def = getDef(id);
  const state = book[id] ?? ({ id, progress: 0, completed: false, claimed: false } as QuestState);

  if (state.completed && def.type === "REPEATABLE") {
    // repeatables reset after claim; until claimed, no extra progress
    return book;
  }

  const nextProgress = Math.max(0, state.progress + delta);

  let completed = state.completed;
  if (def.objective.kind === "CONVERT_RESOURCES") {
    completed = nextProgress >= def.objective.amount;
  } else if (def.objective.kind === "CLEAR_EXPEDITION") {
    completed = nextProgress >= def.objective.times;
  }

  return {
    ...book,
    [id]: { ...state, progress: nextProgress, completed },
  };
}

export function claimQuest(params: {
  book: QuestBook;
  id: string;
  kingamas: number;
}): { book: QuestBook; kingamas: number; gained: number } {
  const def = getDef(params.id);
  const state = params.book[params.id];
  if (!state || !state.completed || state.claimed) return { book: params.book, kingamas: params.kingamas, gained: 0 };

  const gained = def.rewards.kingamas;

  // mark claimed; for repeatables: reset after claim (so it can be done again)
  const nextState: QuestState =
    def.type === "REPEATABLE"
      ? { id: state.id, progress: 0, completed: false, claimed: false }
      : { ...state, claimed: true };

  return {
    book: { ...params.book, [params.id]: nextState },
    kingamas: params.kingamas + gained,
    gained,
  };
}
