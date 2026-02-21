import type { GameState } from "./state.js";
import type { ResourceId } from "../resources/types.js";
import { ageFromWorldLevel } from "../progression/age.js";

export function setFarmAllocation(
  state: GameState,
  alloc: Partial<Record<ResourceId, number>>
): GameState {
  const allowed = new Set(farmResourcesAvailable(state.progression.worldLevel));
  const maxWorkers = state.villagers.list.length;

  return {
    ...state,
    buildings: {
      ...state.buildings,
      farm: {
        ...state.buildings.farm,
        allocation: normalizeAllocFiltered(alloc, allowed, maxWorkers),
      },
    },
  };
}

export function setMineAllocation(
  state: GameState,
  alloc: Partial<Record<ResourceId, number>>
): GameState {
  const allowed = new Set(mineResourcesAvailable(state.progression.worldLevel));
  const maxWorkers = state.villagers.list.length;

  return {
    ...state,
    buildings: {
      ...state.buildings,
      mine: {
        ...state.buildings.mine,
        allocation: normalizeAllocFiltered(alloc, allowed, maxWorkers),
      },
    },
  };
}

export function setTempleXpGlobalAllocation(state: GameState, n: number): GameState {
  return {
    ...state,
    buildings: {
      ...state.buildings,
      temple: {
        ...state.buildings.temple,
        allocation: { XP_GLOBAL: Math.max(0, Math.floor(n)) },
      },
    },
  };
}

function normalizeAllocFiltered<T extends string>(
  alloc: Partial<Record<T, number>>,
  allowed: Set<T>,
  maxWorkers: number
): Partial<Record<T, number>> {
  const out: Partial<Record<T, number>> = {};

  let remaining = Math.max(0, Math.floor(maxWorkers));

  // On conserve l'ordre d'entrée (stable en JS moderne)
  for (const [k, raw] of Object.entries(alloc) as Array<[string, unknown]>) {
    const key = k as T;
    if (!allowed.has(key)) continue;

    const vNum = typeof raw === "number" ? raw : 0;
    const wanted = Math.max(0, Math.floor(vNum));

    if (wanted <= 0) continue;
    if (remaining <= 0) break;

    const used = Math.min(wanted, remaining);
    out[key] = used;
    remaining -= used;
  }

  return out;
}

// helpers: ressources dispo selon building+age (utilisable par UI + validation)
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