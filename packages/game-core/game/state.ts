import type { StoryState } from "../story/state.js";
import type { ProgressionSnapshot } from "../progression/applyXpGain.js";
import type { TempleState } from "../building/temple.js";
import type { ResourceStock, ResourceId } from "../resources/types.js";
import type { Inventory } from "../items/inventory.js";

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
  resources: ResourceStock;
  inventory: Inventory;

  buildings: {
    forum: { unlocked: boolean; built: boolean; active: boolean };
    temple: TempleState & { active: boolean; allocation: { XP_GLOBAL: number } };
    farm: { unlocked: boolean; built: boolean; active: boolean; allocation: Partial<Record<ResourceId, number>> };
    mine: { unlocked: boolean; built: boolean; active: boolean; allocation: Partial<Record<ResourceId, number>> };
    kitchen: { unlocked: boolean; built: boolean; active: boolean };
    forge: { unlocked: boolean; built: boolean; active: boolean };

    cornucopia: {
      unlocked: boolean;
      built: boolean;
      active: boolean;
      level: number;

      // NEW: endurance propre à la corne
      stamina: number; // 0..max
      staminaMax: number;
    };
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
    resources: {},
    inventory: { items: [] },
    buildings: {
      forum: { unlocked: false, built: false, active: false },
      temple: { unlocked: false, built: false, level: 1, assignedVillagers: 0, active: false, allocation: { XP_GLOBAL: 0 } },
      farm: { unlocked: false, built: false, active: false, allocation: {} },
      mine: { unlocked: false, built: false, active: false, allocation: {} },
      kitchen: { unlocked: false, built: false, active: false },
      forge: { unlocked: false, built: false, active: false },

      // NEW
      cornucopia: {
        unlocked: false,
        built: false,
        active: false,
        level: 1,
        stamina: 100,
        staminaMax: 100,
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