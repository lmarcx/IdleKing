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

      forum: { ...state.buildings.forum },
      temple: { ...state.buildings.temple },
      farm: { ...state.buildings.farm },
      mine: { ...state.buildings.mine },
      kitchen: { ...state.buildings.kitchen },
    },
  };

  for (const id of unlocks) {
    next.story.unlocked.add(id);

    // Unlock effects are mirrored into concrete building states.
    switch (id) {
      case "FORUM":
        next.buildings.forum.unlocked = true;
        break;

      case "TEMPLE":
        next.buildings.temple.unlocked = true;
        break;

      case "FARM":
        next.buildings.farm.unlocked = true;
        break;

      case "MINE":
        next.buildings.mine.unlocked = true;
        break;

      case "KITCHEN":
        next.buildings.kitchen.unlocked = true;
        break;

      default:
        break;
    }
  }

  return next;
}