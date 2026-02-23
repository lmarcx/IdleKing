import type { GameState } from "./state.js";
import { applyOfflineProgress } from "./offlineProgress.js";

const SAVE_KEY = "idle_king_save_v1";
const SCHEMA_VERSION = 1;

type PersistedSave = {
  schemaVersion: number;
  savedAt: number;
  state: GameState;
};

export type LoadGameResult = {
  state: GameState;
  offlineReport: ReturnType<typeof applyOfflineProgress>["report"];
};

/**
 * Saves the current game state to localStorage.
 */
export function saveGame(state: GameState): void {
  if (typeof localStorage === "undefined") return;

  const payload: PersistedSave = {
    schemaVersion: SCHEMA_VERSION,
    savedAt: Date.now(),
    state,
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

/**
 * Loads the game state from localStorage and applies offline progression.
 * Returns both the resulting state and an offline report suitable for UI display.
 */
export function loadGameWithReport(): LoadGameResult | null {
  if (typeof localStorage === "undefined") return null;

  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedSave;

    // Future: migrations by schemaVersion
    const baseState = parsed.state;

    const now = Date.now();
    const diffMs = now - parsed.savedAt;
    const minutesAway = Math.floor(diffMs / 60000);

    const res = applyOfflineProgress(baseState, minutesAway);

    return {
      state: res.next,
      offlineReport: res.report,
    };
  } catch {
    return null;
  }
}

/**
 * Convenience loader: returns only the state.
 */
export function loadGame(): GameState | null {
  const r = loadGameWithReport();
  return r?.state ?? null;
}

/**
 * Clears saved data.
 */
export function clearSave(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(SAVE_KEY);
}