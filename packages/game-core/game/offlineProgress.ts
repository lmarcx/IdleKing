import type { GameState } from "./state.js";
import { tickAllBuildings } from "../building/tick.js";
import type { ResourceId } from "../resources/types.js";
import { getQty } from "../resources/types.js";

export const MAX_OFFLINE_MINUTES = 60 * 12; // 12h cap

export type OfflineDiff = {
  resourcesGained: Partial<Record<ResourceId, number>>;
  staminaSpent: number; // total stamina delta across villagers (positive number = stamina spent)
};

export type OfflineReport = {
  minutesAway: number;
  cappedMinutes: number;
  logs: string[];
  diff: OfflineDiff;
};

export type OfflineProgressResult = {
  next: GameState;
  report: OfflineReport | null;
};

function snapshotResources(state: GameState): Partial<Record<ResourceId, number>> {
  // Keeps only resources present in stock for a compact diff.
  return { ...(state.resources ?? {}) };
}

function diffResources(before: GameState, after: GameState): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {};
  const keys = new Set<string>([
    ...Object.keys(before.resources ?? {}),
    ...Object.keys(after.resources ?? {}),
  ]);

  for (const k of keys) {
    const id = k as ResourceId;
    const b = getQty(before.resources, id);
    const a = getQty(after.resources, id);
    const d = a - b;
    if (d !== 0) out[id] = d;
  }

  return out;
}

function totalStamina(state: GameState): number {
  return state.villagers.list.reduce((sum, v) => sum + Math.max(0, Math.floor(v.stamina)), 0);
}

/**
 * Applies offline progression by simulating a number of building ticks.
 * Returns a report that can be displayed by the UI (later) as an "offline summary".
 */
export function applyOfflineProgress(state: GameState, minutesAway: number): OfflineProgressResult {
  const safeMinutes = Math.max(0, Math.floor(minutesAway));
  const cappedMinutes = Math.min(MAX_OFFLINE_MINUTES, safeMinutes);

  if (cappedMinutes <= 0) {
    return { next: state, report: null };
  }

  const before = state;
  const beforeStamina = totalStamina(before);
  const beforeResources = snapshotResources(before);

  const tickRes = tickAllBuildings(before, cappedMinutes);

  const after = tickRes.next;
  const afterStamina = totalStamina(after);

  const resourcesGained = diffResources(
    { ...before, resources: beforeResources },
    after
  );

  const staminaSpent = Math.max(0, beforeStamina - afterStamina);

  return {
    next: after,
    report: {
      minutesAway: safeMinutes,
      cappedMinutes,
      logs: tickRes.logs ?? [],
      diff: {
        resourcesGained,
        staminaSpent,
      },
    },
  };
}