import type { StoryState } from "../story/state.js";
import type { ProgressionSnapshot } from "../progression/applyXpGain.js";
import type { TempleState } from "../building/temple.js";
import type { CanonicalBuildingState } from "../building/types.js";
import type { ResourceStock } from "../resources/types.js";
import type { Inventory } from "../items/inventory.js";
import { createDefaultBankState, type BankState } from "../bank/index.js";
import { createDefaultWalletState, type WalletState } from "../currencies/index.js";
import { createDefaultWorldResourcesState, type GameWorldResourcesState } from "../world/worldResources.js";
import { createDefaultPlayerSkillsState, type PlayerSkillsState } from "../combat/skills/index.js";
import { createDefaultPlayerEquipmentState, type PlayerEquipmentState } from "../equipment/index.js";
import { createDefaultMiniGameRuntimeState, type MiniGameRuntimeState } from "../minigames/index.js";
import { createDefaultSpecialItemsState, type SpecialItemsState } from "../specialItems/index.js";

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
  bank: BankState;
  equipment: PlayerEquipmentState;
  skills: PlayerSkillsState;
  wallet: WalletState;
  world: GameWorldResourcesState;
  miniGames: MiniGameRuntimeState;
  specialItems: SpecialItemsState;

  buildings: {
    forum: CanonicalBuildingState;
    temple: TempleState & CanonicalBuildingState;
    farm: CanonicalBuildingState;
    mine: CanonicalBuildingState;
    kitchen: CanonicalBuildingState;
    forge: CanonicalBuildingState;
    market: CanonicalBuildingState;
    worldGate: CanonicalBuildingState;
    timeGate: CanonicalBuildingState;
    bank: CanonicalBuildingState;

    // Corne d'Abondance: toujours disponible dès le départ
    cornucopia: {
      unlocked: boolean;
      built: boolean;
      active: boolean;
      status: "built";
      level: number;
      maxLevel: number;

      // endurance propre à la corne
      stamina: number; // 0..staminaMax
      staminaMax: number;
    };
  };

  villagers: VillagersState;
};

export function createInitialGameState(params: { nowMs?: number } = {}): GameState {
  const nowMs = params.nowMs ?? Date.now();
  const lockedBuilding: CanonicalBuildingState = {
    active: false,
    built: false,
    level: 0,
    maxLevel: 50,
    status: "locked",
    unlocked: false,
  };
  const unlockedBuilding: CanonicalBuildingState = {
    ...lockedBuilding,
    status: "unlocked",
    unlocked: true,
  };

  return {
    progression: {
      playerLevel: 1,
      playerXp: 0,
      worldLevel: 1,
      worldWxp: 0,
    },
    story: {
      completedChapters: new Set(),
      completedLevels: new Set(),
      completedDungeonIds: new Set(),
      firstClearFlags: new Set(),
      discoveredEvents: new Set(),
      completedEvents: new Set(),
      unlocked: new Set(),
    },
    resources: {},
    inventory: { items: [] },
    bank: createDefaultBankState(),
    equipment: createDefaultPlayerEquipmentState(),
    skills: createDefaultPlayerSkillsState(),
    wallet: createDefaultWalletState(),
    world: createDefaultWorldResourcesState(1, nowMs),
    miniGames: createDefaultMiniGameRuntimeState(),
    specialItems: createDefaultSpecialItemsState(),
    buildings: {
      forum: { ...lockedBuilding },
      temple: { ...lockedBuilding, assignedVillagers: 0 },
      farm: { ...lockedBuilding },
      mine: { ...lockedBuilding },
      kitchen: { ...lockedBuilding },
      forge: { ...lockedBuilding },
      market: { ...unlockedBuilding },
      worldGate: { ...unlockedBuilding },
      timeGate: { ...unlockedBuilding },
      bank: { ...unlockedBuilding },

      // Toujours accessible (pas de build/unlock/activate requis)
      cornucopia: {
        unlocked: true,
        built: true,
        active: true,
        status: "built",
        level: 1,
        maxLevel: 1,
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
