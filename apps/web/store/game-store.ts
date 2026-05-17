"use client";

import { create } from "zustand";

import {
  createDefaultPlayerSkillsState,
  world as worldCore,
  equipItem as equipCoreItem,
  equipSkill,
  respecSkills,
  unequipItem as unequipCoreItem,
  unequipSkill,
  unlockOrUpgradeSkill,
  type EquipmentSlot,
  type EquipItemResult,
  type SkillEquipResult,
  type SkillId,
  type SkillRespecResult,
  type SkillSlot,
  type SkillUpgradeResult,
  type UnequipItemResult,
} from "@idleking/game-core";
import { createInitialGameState, type GameState } from "@idleking/game-core/game/state.js";
import {
  clearSave as clearPersistedSave,
  loadGameWithReport,
  saveGame,
  type LoadGameResult,
} from "@idleking/game-core/game/save.js";

type OfflineReport = NonNullable<LoadGameResult["offlineReport"]>;

type GameStore = {
  state: GameState;
  offlineReport: OfflineReport | null;
  hydrated: boolean;
  newGame: () => void;
  loadGame: () => void;
  clearSave: () => void;
  dismissOfflineReport: () => void;
  dispatch: (actionFn: (state: GameState) => GameState) => void;
  equipPlayerItem: (itemId: string) => EquipItemResult;
  unequipPlayerItem: (slot: EquipmentSlot) => UnequipItemResult;
  unlockOrUpgradePlayerSkill: (skillId: SkillId) => SkillUpgradeResult;
  equipPlayerSkill: (skillId: SkillId, slot: SkillSlot) => SkillEquipResult;
  unequipPlayerSkill: (slot: SkillSlot) => SkillEquipResult;
  respecPlayerSkills: () => SkillRespecResult;
  addDevSkillPoint: (amount: number) => void;
};

const SAVE_KEY = "idle_king_save_v1";

function getStateWithSkills(state: GameState): GameState {
  return {
    ...state,
    skills: state.skills ?? createDefaultPlayerSkillsState(),
  };
}

export const useGameStore = create<GameStore>((set) => ({
  state: createInitialGameState(),
  offlineReport: null,
  hydrated: false,
  newGame: () =>
    set({
      state: createInitialGameState(),
      offlineReport: null,
      hydrated: true,
    }),
  loadGame: () =>
    set(() => {
      const loaded = loadGameWithReport();
      if (!loaded) {
        return {
          state: createInitialGameState(),
          offlineReport: null,
          hydrated: true,
        };
      }

      return {
        state: loaded.state,
        offlineReport: loaded.offlineReport,
        hydrated: true,
      };
    }),
  clearSave: () => {
    clearPersistedSave();
    set({
      state: createInitialGameState(),
      offlineReport: null,
      hydrated: true,
    });
  },
  dismissOfflineReport: () => set({ offlineReport: null }),
  dispatch: (actionFn) =>
    set((current) => ({
      state: actionFn(current.state),
    })),
  equipPlayerItem: (itemId) => {
    let result: EquipItemResult | undefined;
    let fallbackState = createInitialGameState();
    set((current) => {
      fallbackState = current.state;
      result = equipCoreItem(current.state, itemId);
      if (!result.ok) return {};

      return {
        state: result.state,
      };
    });

    return (
      result ?? {
        ok: false,
        state: fallbackState,
        reason: "ITEM_NOT_FOUND",
      }
    );
  },
  unequipPlayerItem: (slot) => {
    let result: UnequipItemResult | undefined;
    let fallbackState = createInitialGameState();
    set((current) => {
      fallbackState = current.state;
      result = unequipCoreItem(current.state, slot);

      return {
        state: result.state,
      };
    });

    return result ?? unequipCoreItem(fallbackState, slot);
  },
  unlockOrUpgradePlayerSkill: (skillId) => {
    let result: SkillUpgradeResult | undefined;
    set((current) => {
      const state = getStateWithSkills(current.state);
      result = unlockOrUpgradeSkill(state.skills, skillId);
      if (!result.ok) {
        return { state };
      }

      return {
        state: {
          ...state,
          skills: result.state,
        },
      };
    });

    return result ?? unlockOrUpgradeSkill(createDefaultPlayerSkillsState(), skillId);
  },
  equipPlayerSkill: (skillId, slot) => {
    let result: SkillEquipResult | undefined;
    set((current) => {
      const state = getStateWithSkills(current.state);
      result = equipSkill(state.skills, skillId, slot);
      if (!result.ok) {
        return { state };
      }

      return {
        state: {
          ...state,
          skills: result.state,
        },
      };
    });

    return result ?? equipSkill(createDefaultPlayerSkillsState(), skillId, slot);
  },
  unequipPlayerSkill: (slot) => {
    let result: SkillEquipResult | undefined;
    set((current) => {
      const state = getStateWithSkills(current.state);
      result = unequipSkill(state.skills, slot);
      if (!result.ok) {
        return { state };
      }

      return {
        state: {
          ...state,
          skills: result.state,
        },
      };
    });

    return result ?? unequipSkill(createDefaultPlayerSkillsState(), slot);
  },
  respecPlayerSkills: () => {
    let result: SkillRespecResult | undefined;
    set((current) => {
      const state = getStateWithSkills(current.state);
      result = respecSkills(state.skills);

      return {
        state: {
          ...state,
          skills: result.state,
        },
      };
    });

    return result ?? respecSkills(createDefaultPlayerSkillsState());
  },
  addDevSkillPoint: (amount) => {
    if (process.env.NODE_ENV === "production") return;
    set((current) => {
      const state = getStateWithSkills(current.state);

      return {
        state: {
          ...state,
          skills: {
            ...state.skills,
            skillPoints: Math.max(0, state.skills.skillPoints + amount),
          },
        },
      };
    });
  },
}));

let initialized = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let worldRegenInitialized = false;
let worldRegenTimer: ReturnType<typeof setInterval> | null = null;

const WORLD_REGEN_INTERVAL_MS = 15_000;

function stateNeedsWorldRegen(state: GameState): boolean {
  const energyMax = worldCore.maxWorldEnergy(state.progression.worldLevel);
  const hpMax = worldCore.maxWorldHp(state.progression.worldLevel);

  return (
    state.world.energy.max !== energyMax ||
    state.world.hp.max !== hpMax ||
    state.world.energy.current < energyMax ||
    state.world.hp.current < hpMax
  );
}

function applyRuntimeWorldRegen() {
  const current = useGameStore.getState();
  if (!current.hydrated) return;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

  useGameStore.setState((store) => {
    if (!stateNeedsWorldRegen(store.state)) return {};

    return {
      state: {
        ...store.state,
        world: worldCore.applyWorldResourceRegen(store.state.world, store.state.progression.worldLevel),
      },
    };
  });
}

export function initGameStoreAutosave() {
  if (initialized) return;
  initialized = true;

  useGameStore.subscribe((store) => {
    if (!store.hydrated) return;

    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveGame(useGameStore.getState().state);
    }, 500);
  });
}

export function initGameStoreWorldRegen() {
  if (worldRegenInitialized) return () => {};
  worldRegenInitialized = true;

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") applyRuntimeWorldRegen();
  };

  applyRuntimeWorldRegen();
  worldRegenTimer = setInterval(applyRuntimeWorldRegen, WORLD_REGEN_INTERVAL_MS);

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  return () => {
    if (worldRegenTimer) clearInterval(worldRegenTimer);
    worldRegenTimer = null;
    worldRegenInitialized = false;
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  };
}

export function hasPersistedSave(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SAVE_KEY) !== null;
}
