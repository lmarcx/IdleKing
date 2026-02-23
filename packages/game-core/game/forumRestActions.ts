import type { GameState } from "./state.js";

export type RestVillagerResult = {
  next: GameState;
  ok: boolean;
  reason?: "FORUM_LOCKED" | "FORUM_NOT_BUILT" | "VILLAGER_NOT_FOUND" | "ALREADY_FULL";
};

export const REST_STAMINA_GAIN = 30;

/**
 * Restores stamina for a single villager through the Forum.
 * This is a manual safety valve to prevent stamina soft-lock in MVP.
 */
export function restVillager(state: GameState, villagerId: string): RestVillagerResult {
  if (!state.buildings.forum.unlocked) {
    return { next: state, ok: false, reason: "FORUM_LOCKED" };
  }
  if (!state.buildings.forum.built) {
    return { next: state, ok: false, reason: "FORUM_NOT_BUILT" };
  }

  const idx = state.villagers.list.findIndex((v) => v.id === villagerId);
  if (idx < 0) {
    return { next: state, ok: false, reason: "VILLAGER_NOT_FOUND" };
  }

  const v = state.villagers.list[idx];
  if (v.stamina >= 100) {
    return { next: state, ok: false, reason: "ALREADY_FULL" };
  }

  const nextVillagers = state.villagers.list.slice();
  nextVillagers[idx] = {
    ...v,
    stamina: Math.min(100, v.stamina + REST_STAMINA_GAIN),
  };

  return {
    ok: true,
    next: {
      ...state,
      villagers: { list: nextVillagers },
    },
  };
}