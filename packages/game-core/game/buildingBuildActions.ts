import type { GameState } from "./state.js";
import type { BuildingId } from "../building/types.js";
import { getBuildCost } from "../building/buildCosts.js";
import { hasAtLeast, spend } from "../resources/types.js";

export type BuildBuildingResult = {
  next: GameState;
  ok: boolean;
  reason?:
    | "BUILDING_LOCKED"
    | "ALREADY_BUILT"
    | "NOT_ENOUGH_RESOURCES";
  cost?: ReturnType<typeof getBuildCost>;
};

/**
 * Builds a building by spending resources.
 * This is a generic helper used for all Kingdom buildings in MVP.
 */
export function buildBuilding(state: GameState, buildingId: BuildingId): BuildBuildingResult {
  const b = state.buildings;

  const unlocked =
    (buildingId === "FORUM" && b.forum.unlocked) ||
    (buildingId === "FARM" && b.farm.unlocked) ||
    (buildingId === "MINE" && b.mine.unlocked) ||
    (buildingId === "KITCHEN" && b.kitchen.unlocked) ||
    (buildingId === "TEMPLE" && b.temple.unlocked) ||
    (buildingId === "FORGE" && b.forge.unlocked);

  if (!unlocked) {
    return { next: state, ok: false, reason: "BUILDING_LOCKED" };
  }

  const alreadyBuilt =
    (buildingId === "FORUM" && b.forum.built) ||
    (buildingId === "FARM" && b.farm.built) ||
    (buildingId === "MINE" && b.mine.built) ||
    (buildingId === "KITCHEN" && b.kitchen.built) ||
    (buildingId === "TEMPLE" && b.temple.built) ||
    (buildingId === "FORGE" && b.forge.built);

  if (alreadyBuilt) {
    return { next: state, ok: false, reason: "ALREADY_BUILT" };
  }

  const cost = getBuildCost(buildingId);
  if (!hasAtLeast(state.resources, cost)) {
    return { next: state, ok: false, reason: "NOT_ENOUGH_RESOURCES", cost };
  }

  const nextResources = spend(state.resources, cost);

  // Apply built flag immutably
  const nextBuildings = { ...state.buildings };

  switch (buildingId) {
    case "FORUM":
      nextBuildings.forum = { ...nextBuildings.forum, built: true, active: true };
      break;
    case "FARM":
      nextBuildings.farm = { ...nextBuildings.farm, built: true, active: true };
      break;
    case "MINE":
      nextBuildings.mine = { ...nextBuildings.mine, built: true, active: true };
      break;
    case "KITCHEN":
      nextBuildings.kitchen = { ...nextBuildings.kitchen, built: true, active: true };
      break;
    case "TEMPLE":
      nextBuildings.temple = { ...nextBuildings.temple, built: true, active: true };
      break;
    case "FORGE":
      nextBuildings.forge = { ...nextBuildings.forge, built: true, active: true };
      break;
  }

  return {
    ok: true,
    cost,
    next: {
      ...state,
      resources: nextResources,
      buildings: nextBuildings,
    },
  };
}
