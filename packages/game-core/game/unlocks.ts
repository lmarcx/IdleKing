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

      // CLONAGE IMMUTABLE SAFE
      temple: { ...state.buildings.temple },
      farm: { ...state.buildings.farm },
      mine: { ...state.buildings.mine },
      kitchen: { ...state.buildings.kitchen },
    },
  };

  for (const id of unlocks) {
    next.story.unlocked.add(id);

    // Appliquer effets gameplay concrets
    switch (id) {
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
        // autres unlocks futurs (FORGE, LABORATORY, etc.)
        break;
    }
  }

  return next;
}