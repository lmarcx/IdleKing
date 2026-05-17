import type { GameState } from "./state.js";
import type { UnlockId } from "../story/types.js";
import {
  getBuildingStateKey,
  isCanonicalBuildingId,
  refreshCanonicalBuildingStatus,
} from "../building/progression.js";

export function applyUnlocks(state: GameState, unlocks: UnlockId[]): GameState {
  if (unlocks.length === 0) return state;

  const next: GameState = {
    ...state,
    story: {
      completedChapters: new Set(state.story.completedChapters),
      completedLevels: new Set(state.story.completedLevels),
      discoveredEvents: new Set(state.story.discoveredEvents),
      completedEvents: new Set(state.story.completedEvents),
      unlocked: new Set(state.story.unlocked),
    },
    buildings: {
      ...state.buildings,

      forum: { ...state.buildings.forum },
      temple: { ...state.buildings.temple },
      farm: { ...state.buildings.farm },
      mine: { ...state.buildings.mine },
      kitchen: { ...state.buildings.kitchen },
      forge: { ...state.buildings.forge },
      market: { ...state.buildings.market },
      worldGate: { ...state.buildings.worldGate },
      bank: { ...state.buildings.bank },
    },
  };

  for (const id of unlocks) {
    next.story.unlocked.add(id);

    if (isCanonicalBuildingId(id)) {
      const key = getBuildingStateKey(id);
      (next.buildings as any)[key] = refreshCanonicalBuildingStatus(
        {
          ...next.buildings[key],
          unlocked: true,
        },
        next.progression.worldLevel,
      );
    }
  }

  return next;
}
