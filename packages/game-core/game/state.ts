import type { StoryState } from "../story/state.js";
import type { ProgressionSnapshot } from "../progression/applyXpGain.js";
import type { TempleState } from "../building/temple.js";

export type VillagerState = {
  total: number;
  available: number;
  // stamina system (option 3) viendra ici
};

export type GameState = {
  progression: ProgressionSnapshot;
  story: StoryState;

  buildings: {
    temple: TempleState;
    // plus tard: farm, mine, kitchen...
  };

  villagers: VillagerState;
};

export function createInitialGameState(): GameState {
  return {
    progression: {
      playerLevel: 1,
      playerXp: 0,
      worldLevel: 1,
      worldWxp: 0,
    },
    story: {
      completedChapters: new Set(),
      unlocked: new Set(),
    },
    buildings: {
      temple: {
        unlocked: false,
        built: false,
        level: 1,
        assignedVillagers: 0,
      },
    },
    villagers: {
      total: 5,
      available: 5,
    },
  };
}