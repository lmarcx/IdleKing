import type { StoryState } from "../story/state.js";
import type { ProgressionSnapshot } from "../progression/applyXpGain.js";
import type { TempleState } from "../building/temple.js";

export type Villager = {
  id: string;
  stamina: number; // 0..100
};

export type VillagersState = {
  list: Villager[];
};

export type GameState = {
  progression: ProgressionSnapshot;
  story: StoryState;

  buildings: {
    temple: TempleState;
    // plus tard: farm, mine, kitchen...
  };

  villagers: VillagersState;
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
    list: [
      { id: "v1", stamina: 100 },
      { id: "v2", stamina: 100 },
      { id: "v3", stamina: 100 },
      { id: "v4", stamina: 100 },
      { id: "v5", stamina: 100 },
    ],
  },
  };
}