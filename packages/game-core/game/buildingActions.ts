import type { GameState } from "./state.js";
import type { ResourceId } from "../resources/types.js";
import { ageFromWorldLevel } from "../progression/age.js";

export function setFarmAllocation(state: GameState, alloc: Partial<Record<ResourceId, number>>): GameState {
  return {
    ...state,
    buildings: {
      ...state.buildings,
      farm: { ...state.buildings.farm, allocation: normalizeAlloc(alloc) },
    },
  };
}

export function setMineAllocation(state: GameState, alloc: Partial<Record<ResourceId, number>>): GameState {
  return {
    ...state,
    buildings: {
      ...state.buildings,
      mine: { ...state.buildings.mine, allocation: normalizeAlloc(alloc) },
    },
  };
}

export function setTempleWxpAllocation(state: GameState, villagersOnTemple: number): GameState {
  return {
    ...state,
    buildings: {
      ...state.buildings,
      temple: { ...state.buildings.temple, allocation: { WXP: Math.max(0, Math.floor(villagersOnTemple)) } },
    },
  };
}

function normalizeAlloc<T extends string>(
  alloc: Partial<Record<T, number>>
): Partial<Record<T, number>> {
  const out: Partial<Record<T, number>> = {};

  for (const [k, raw] of Object.entries(alloc) as Array<[string, unknown]>) {
    const vNum = typeof raw === "number" ? raw : 0;
    const n = Math.max(0, Math.floor(vNum));
    if (n > 0) out[k as T] = n;
  }

  return out;
}

// (optionnel) helper: ressources dispo selon building+age (utilisable par UI et validations)
export function farmResourcesAvailable(worldLevel: number): ResourceId[] {
  const age = ageFromWorldLevel(worldLevel);
  const base: ResourceId[] = ["STONE", "WOOD", "WATER", "MEAT"];
  const age2: ResourceId[] = ["WHEAT", "TOMATO", "CARROT", "EGG"];
  const age3: ResourceId[] = ["MILK", "BREAD", "POTATO", "SALAD"];
  const age4: ResourceId[] = ["APPLE", "APRICOT", "PEACH", "GRAPE"];
  const age5: ResourceId[] = ["CHERRY", "STRAWBERRY", "RAZZBERRY"];

  if (age === 1) return base;
  if (age === 2) return [...base, ...age2];
  if (age === 3) return [...base, ...age2, ...age3];
  if (age === 4) return [...base, ...age2, ...age3, ...age4];
  return [...base, ...age2, ...age3, ...age4, ...age5];
}

export function mineResourcesAvailable(worldLevel: number): ResourceId[] {
  const age = ageFromWorldLevel(worldLevel);
  const base: ResourceId[] = ["COPPER", "SILVER", "GOLD"];
  const age2: ResourceId[] = ["IRON"];
  const age3: ResourceId[] = ["PLATINUM"];
  const age4: ResourceId[] = ["MITHRIL"];
  const age5: ResourceId[] = ["ORICHALUM"];

  if (age === 1) return base;
  if (age === 2) return [...base, ...age2];
  if (age === 3) return [...base, ...age2, ...age3];
  if (age === 4) return [...base, ...age2, ...age3, ...age4];
  return [...base, ...age2, ...age3, ...age4, ...age5];
}