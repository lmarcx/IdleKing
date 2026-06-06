import type { GameState } from "./state.js";
import { createInitialGameState } from "./state.js";
import { applyOfflineProgress } from "./offlineProgress.js";
import { createDefaultPlayerSkillsState } from "../combat/skills/index.js";
import { normalizePlayerEquipmentState } from "../equipment/index.js";
import { normalizeEquipmentItem, type Item } from "../items/types.js";
import { normalizeWalletState } from "../currencies/index.js";
import { normalizeWorldResourcesState } from "../world/worldResources.js";
import { normalizeAllBuildingProgress } from "../building/progression.js";
import { normalizeMiniGameRuntimeState } from "../minigames/index.js";
import { normalizeBankState } from "../bank/index.js";
import { normalizeSpecialItemsState } from "../specialItems/index.js";
import { normalizeEffectSetsState } from "../effectSets/index.js";
import { ALL_RESOURCES, type ResourceStock } from "../resources/types.js";
import { RESOURCE_MAX_STACK } from "../resources/index.js";

const SAVE_KEY = "idle_king_save_v1";
const SCHEMA_VERSION = 2;

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

function clampSavedResourceQuantity(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(RESOURCE_MAX_STACK, Math.max(0, Math.floor(value)));
}

function normalizeResourceStockState(value: unknown): ResourceStock {
  if (!value || typeof value !== "object") return {};
  const allowed = new Set<string>(ALL_RESOURCES);
  const stock: ResourceStock = {};

  for (const [resourceId, amount] of Object.entries(value as Record<string, unknown>)) {
    if (!allowed.has(resourceId)) continue;
    const quantity = clampSavedResourceQuantity(amount);
    if (quantity > 0) stock[resourceId as keyof ResourceStock] = quantity;
  }

  return stock;
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

function omitLegacyAllocation<T extends Record<string, unknown> | undefined>(building: T): T {
  if (!building || typeof building !== "object") return building;
  const { allocation: _allocation, ...rest } = building;
  return rest as T;
}

function reviveGameState(state: GameState, nowMs = Date.now()): GameState {
  const defaults = createInitialGameState({ nowMs });
  const rawState = state as Partial<GameState>;
  const progression = {
    ...defaults.progression,
    ...(rawState.progression ?? {}),
  };
  const rawBuildings = rawState.buildings ?? defaults.buildings;

  const buildings = normalizeAllBuildingProgress(
    {
      ...defaults.buildings,
      ...rawBuildings,
      forum: { ...defaults.buildings.forum, ...(rawBuildings as any).forum },
      temple: { ...defaults.buildings.temple, ...omitLegacyAllocation((rawBuildings as any).temple) },
      farm: { ...defaults.buildings.farm, ...omitLegacyAllocation((rawBuildings as any).farm) },
      mine: { ...defaults.buildings.mine, ...omitLegacyAllocation((rawBuildings as any).mine) },
      kitchen: { ...defaults.buildings.kitchen, ...(rawBuildings as any).kitchen },
      forge: { ...defaults.buildings.forge, ...(rawBuildings as any).forge },
      market: { ...defaults.buildings.market, ...(rawBuildings as any).market },
      timeGate: { ...defaults.buildings.timeGate, ...((rawBuildings as any).timeGate ?? (rawBuildings as any).worldGate) },
      worldGate: { ...defaults.buildings.worldGate, ...(rawBuildings as any).worldGate },
      bank: { ...defaults.buildings.bank, ...(rawBuildings as any).bank },
      cornucopia: { ...defaults.buildings.cornucopia, ...(rawBuildings as any).cornucopia },
    },
    defaults.buildings,
    progression.worldLevel,
  );

  const rawStory = rawState.story as (Partial<GameState["story"]> & { defeatedBossIds?: unknown }) | undefined;
  const defeatedBossIds = toSet<string>(rawStory?.defeatedBossIds);
  const completedEvents = toSet<string>(rawStory?.completedEvents);
  for (const bossId of defeatedBossIds) {
    if (typeof bossId !== "string" || bossId.length === 0) continue;
    completedEvents.add(bossId);
    completedEvents.add(`boss:${bossId}:defeated`);
  }

  return {
    progression,
    story: {
      ...defaults.story,
      ...(rawState.story ?? {}),
      completedChapters: toSet(rawStory?.completedChapters),
      completedDungeonIds: toSet(rawStory?.completedDungeonIds),
      completedEvents,
      completedLevels: toSet(rawStory?.completedLevels),
      discoveredEvents: toSet(rawStory?.discoveredEvents),
      firstClearFlags: toSet(rawStory?.firstClearFlags),
      unlocked: toSet(rawStory?.unlocked),
    },
    resources: normalizeResourceStockState(rawState.resources),
    inventory: reviveInventory(rawState.inventory ?? defaults.inventory),
    bank: normalizeBankState(rawState.bank),
    equipment: normalizePlayerEquipmentState(rawState.equipment),
    skills: rawState.skills ?? createDefaultPlayerSkillsState(),
    wallet: normalizeWalletState(rawState.wallet),
    world: normalizeWorldResourcesState(rawState.world, progression.worldLevel, nowMs),
    miniGames: normalizeMiniGameRuntimeState(rawState.miniGames),
    specialItems: normalizeSpecialItemsState((rawState as any).specialItems),
    effectSets: normalizeEffectSetsState((rawState as any).effectSets),
    buildings,
    villagers: {
      list: Array.isArray(rawState.villagers?.list) ? rawState.villagers.list : defaults.villagers.list,
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
    state: reviveGameState(state, Date.now()),
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
