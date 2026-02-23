"use client";

import { create } from "zustand";

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
}));

let initialized = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

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

export function hasPersistedSave(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SAVE_KEY) !== null;
}
