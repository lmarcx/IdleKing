import type { GameState } from "./state.js";
import { createInitialGameState } from "./state.js";
import { applyOfflineProgress } from "./offlineProgress.js";
import { createDefaultPlayerSkillsState } from "../combat/skills/index.js";
import { normalizePlayerEquipmentState } from "../equipment/index.js";
import { normalizeEquipmentItem, type Item } from "../items/types.js";
import { normalizeWalletState } from "../currencies/index.js";
import { normalizeWorldResourcesState } from "../world/worldResources.js";

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

function stringifyGameState(payload: PersistedSave): string {
  return JSON.stringify(payload, (_key, value) => (value instanceof Set ? [...value] : value));
}

function toSet<T>(value: unknown): Set<T> {
  if (value instanceof Set) return new Set(value as Set<T>);
  if (Array.isArray(value)) return new Set(value as T[]);
  return new Set();
}

function reviveInventory(inventory: GameState["inventory"]): GameState["inventory"] {
  const items = Array.isArray(inventory?.items) ? inventory.items : [];

  return {
    items: items.flatMap((item): Item[] => {
      if (!item || typeof item !== "object") return [];
      if ("slot" in item) {
        const equipmentItem = normalizeEquipmentItem(item);
        return equipmentItem ? [equipmentItem] : [];
      }
      return [item as Item];
    }),
  };
}

function reviveGameState(state: GameState, nowMs = Date.now()): GameState {
  const defaults = createInitialGameState({ nowMs });
  const rawState = state as Partial<GameState>;
  const progression = {
    ...defaults.progression,
    ...(rawState.progression ?? {}),
  };
  const rawBuildings = rawState.buildings ?? defaults.buildings;

  return {
    ...defaults,
    ...state,
    progression,
    inventory: reviveInventory(rawState.inventory ?? defaults.inventory),
    equipment: normalizePlayerEquipmentState(rawState.equipment),
    skills: rawState.skills ?? createDefaultPlayerSkillsState(),
    wallet: normalizeWalletState(rawState.wallet),
    world: normalizeWorldResourcesState(rawState.world, progression.worldLevel, nowMs),
    buildings: {
      ...defaults.buildings,
      ...rawBuildings,
      forum: { ...defaults.buildings.forum, ...(rawBuildings as any).forum },
      temple: { ...defaults.buildings.temple, ...(rawBuildings as any).temple },
      farm: { ...defaults.buildings.farm, ...(rawBuildings as any).farm },
      mine: { ...defaults.buildings.mine, ...(rawBuildings as any).mine },
      kitchen: { ...defaults.buildings.kitchen, ...(rawBuildings as any).kitchen },
      forge: { ...defaults.buildings.forge, ...(rawBuildings as any).forge },
      cornucopia: { ...defaults.buildings.cornucopia, ...(rawBuildings as any).cornucopia },
    },
    story: {
      ...defaults.story,
      ...(rawState.story ?? {}),
      completedChapters: toSet(rawState.story?.completedChapters),
      completedEvents: toSet(rawState.story?.completedEvents),
      completedLevels: toSet(rawState.story?.completedLevels),
      discoveredEvents: toSet(rawState.story?.discoveredEvents),
      unlocked: toSet(rawState.story?.unlocked),
    },
  };
}

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

  localStorage.setItem(SAVE_KEY, stringifyGameState(payload));
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
    const now = Date.now();
    const baseState = reviveGameState(parsed.state, parsed.savedAt);
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
