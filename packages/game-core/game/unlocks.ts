import type { GameState } from "./state.js";
import type { UnlockId } from "../story/types.js";

export function applyUnlocks(state: GameState, unlocks: UnlockId[]): GameState {
  if (unlocks.length === 0) return state;

  const next: GameState = {
    ...state,
    story: {
      completedChapters: new Set(state.story.completedChapters),
      unlocked: new Set(state.story.unlocked),
    },
    buildings: {
      ...state.buildings,
      temple: { ...state.buildings.temple },
    },
  };

  for (const id of unlocks) {
    next.story.unlocked.add(id);

    // MVP: appliquer les effets "hard" quand c'est nécessaire
    if (id === "TEMPLE") {
      next.buildings.temple.unlocked = true;
    }
  }

  return next;
}