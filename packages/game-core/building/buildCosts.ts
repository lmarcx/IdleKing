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
      return { WOOD: 30, STONE: 60 };

    case "FORGE":
      return { WOOD: 50, STONE: 40, IRON: 25 };

    case "MARKET":
      return { WOOD: 35, STONE: 20, GOLD: 20 };

    case "TIME_GATE":
    case "WORLD_GATE":
      return { STONE: 80, GOLD: 25 };

    case "BANK":
      return { WOOD: 40, STONE: 50, GOLD: 30 };

    default:
      return {};
  }
}
