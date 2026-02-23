import type { GameState } from "./state.js";
import { hasAtLeast, spend, type ResourceStock, addQty } from "../resources/types.js";

export type RecruitCost = {
  meat: number;
  gold: number;
};

export type RecruitVillagerResult = {
  next: GameState;
  ok: boolean;
  reason?:
    | "FORUM_LOCKED"
    | "FORUM_NOT_BUILT"
    | "NOT_ENOUGH_RESOURCES";
  cost?: RecruitCost;
};

function uid(prefix = "v"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Computes the current recruitment cost based on the existing villager count.
 * Cost grows to prevent runaway exponential production in early game.
 */
export function recruitVillagerCost(currentVillagers: number): RecruitCost {
  const n = Math.max(0, Math.floor(currentVillagers));

  // MVP: linear-ish growth, tuned for early game.
  // First recruits remain affordable; later recruits become a meaningful sink.
  const meat = 2 + n;              // 2,3,4,5...
  const gold = 1 + Math.floor(n / 2); // 1,1,2,2,3...

  return { meat, gold };
}

/**
 * Recruits a new villager via the Forum by spending resources.
 * New villager starts with full stamina (100).
 */
export function recruitVillager(state: GameState): RecruitVillagerResult {
  if (!state.buildings.forum.unlocked) {
    return { next: state, ok: false, reason: "FORUM_LOCKED" };
  }
  if (!state.buildings.forum.built) {
    return { next: state, ok: false, reason: "FORUM_NOT_BUILT" };
  }

  const cost = recruitVillagerCost(state.villagers.list.length);

  const costStock: ResourceStock = {
    MEAT: cost.meat,
    GOLD: cost.gold,
  };

  if (!hasAtLeast(state.resources, costStock)) {
    return { next: state, ok: false, reason: "NOT_ENOUGH_RESOURCES", cost };
  }

  const nextResources = spend(state.resources, costStock);

  const nextVillager = {
    id: uid("v"),
    stamina: 100,
  };

  return {
    ok: true,
    cost,
    next: {
      ...state,
      resources: nextResources,
      villagers: {
        list: [...state.villagers.list, nextVillager],
      },
    },
  };
}