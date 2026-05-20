import type { GameState } from "./state.js";
import type { BuildingId } from "../building/types.js";
import { getBuildCost } from "../building/buildCosts.js";
import { hasAtLeast, spend } from "../resources/types.js";
import {
  applyBuiltCanonicalState,
  getBuildingStateKey,
  isCanonicalBuildingId,
} from "../building/progression.js";

export type BuildBuildingResult = {
  next: GameState;
  ok: boolean;
  reason?:
    | "BUILDING_LOCKED"
    | "ALREADY_BUILT"
    | "NOT_ENOUGH_RESOURCES"
    | "UNKNOWN_BUILDING";
  cost?: ReturnType<typeof getBuildCost>;
};

export type BuildBuildingOptions = {
  allowLocked?: boolean;
};

/**
 * Builds a building by spending resources.
 * This is a generic helper used for all Kingdom buildings in MVP.
 */
export function buildBuilding(
  state: GameState,
  buildingId: BuildingId,
  options: BuildBuildingOptions = {},
): BuildBuildingResult {
  if (!isCanonicalBuildingId(buildingId)) {
    return { next: state, ok: false, reason: "UNKNOWN_BUILDING" };
  }

  const key = getBuildingStateKey(buildingId);
  const building = state.buildings[key];
  const unlocked = options.allowLocked === true || building.unlocked;

  if (!unlocked) {
    return { next: state, ok: false, reason: "BUILDING_LOCKED" };
  }

  if (building.built) {
    return { next: state, ok: false, reason: "ALREADY_BUILT" };
  }

  const cost = getBuildCost(buildingId);
  if (!hasAtLeast(state.resources, cost)) {
    return { next: state, ok: false, reason: "NOT_ENOUGH_RESOURCES", cost };
  }

  const nextResources = spend(state.resources, cost);

  const nextBuilding = applyBuiltCanonicalState(
    {
      ...building,
    },
    state.progression.worldLevel,
  );

  return {
    ok: true,
    cost,
    next: {
      ...state,
      resources: nextResources,
      buildings: {
        ...state.buildings,
        [key]: nextBuilding,
      },
    },
  };
}
