import type { GameState } from "./state.js";
import { tickAllBuildings } from "../building/tick.js";

const SAVE_KEY = "idle_king_save_v1";
const SCHEMA_VERSION = 1;
const MAX_OFFLINE_MINUTES = 60 * 12; // 12h cap

type PersistedSave = {
  schemaVersion: number;
  savedAt: number;
  state: GameState;
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
 * Loads the game state from localStorage.
 * Applies offline progression based on elapsed minutes.
 */
export function loadGame(): GameState | null {
  if (typeof localStorage === "undefined") return null;

  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedSave;

    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      // Future: migration logic
      return parsed.state;
    }

    const now = Date.now();
    const diffMs = now - parsed.savedAt;
    const minutesAway = Math.floor(diffMs / 60000);

    const cappedMinutes = Math.min(MAX_OFFLINE_MINUTES, Math.max(0, minutesAway));

    if (cappedMinutes <= 0) return parsed.state;

    const result = tickAllBuildings(parsed.state, cappedMinutes);

    return result.next;
  } catch {
    return null;
  }
}

/**
 * Clears saved data.
 */
export function clearSave(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(SAVE_KEY);
}