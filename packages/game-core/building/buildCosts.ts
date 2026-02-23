import type { ResourceStock } from "../resources/types.js";
import type { BuildingId } from "./types.js";

/**
 * Returns the construction cost for a building at base tier (MVP).
 * Costs are deliberately simple and can be rebalanced later.
 */
export function getBuildCost(buildingId: BuildingId): ResourceStock {
  switch (buildingId) {
    case "FORUM":
      return { WOOD: 20, STONE: 20, WATER: 10, GOLD: 10 };

    case "FARM":
      return { STONE: 10, WOOD: 5 };

    case "MINE":
      return { STONE: 15, WOOD: 5 };

    case "KITCHEN":
      return { WOOD: 20, STONE: 10, WATER: 5, GOLD: 5 };

    case "TEMPLE":
      // Matches your earlier temple base cost direction (can be adjusted).
      return { WOOD: 200, STONE: 150, WATER: 100, GOLD: 300 };

    case "FORGE":
      return { STONE: 30, WOOD: 10, COPPER: 10, GOLD: 10 };

    default:
      return {};
  }
}