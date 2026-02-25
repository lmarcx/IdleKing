import type { BuildingModule } from "./types.js";
import { TEMPLE_BUILDING } from "./templeBuilding.js";
import { FARM_BUILDING } from "./farmBuilding.js";
import { MINE_BUILDING } from "./mineBuilding.js";
import { KITCHEN_BUILDING } from "./kitchenBuilding.js";
import { FORGE_BUILDING } from "./forgeBuilding.js";
import { CORNUCOPIA_BUILDING } from "./cornucopiaBuilding.js";

export const BUILDINGS: BuildingModule[] = [
  TEMPLE_BUILDING,
  FARM_BUILDING,
  MINE_BUILDING,
  KITCHEN_BUILDING,
  FORGE_BUILDING,
  CORNUCOPIA_BUILDING,
];