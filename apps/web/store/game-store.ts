"use client";

import { create } from "zustand";

import {
  world as worldCore,
  equipItem as equipCoreItem,
  unequipItem as unequipCoreItem,
  type EquipmentSlot,
  type EquipItemResult,
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
};

const SAVE_KEY = "idle_king_save_v1";

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
