import type { BuildingModule } from "./types.js";
import { TEMPLE_BUILDING } from "./templeBuilding.js";
import { FARM_BUILDING } from "./farmBuilding.js";
import { MINE_BUILDING } from "./mineBuilding.js";
import { KITCHEN_BUILDING } from "./kitchenBuilding.js";
import { FORGE_BUILDING } from "./forgeBuilding.js";
import { CORNUCOPIA_BUILDING } from "./cornucopiaBuilding.js";
import { TIME_GATE_BUILDING } from "./timeGateBuilding.js";

export const BUILDINGS: BuildingModule[] = [
  TEMPLE_BUILDING,
  FARM_BUILDING,
  MINE_BUILDING,
  KITCHEN_BUILDING,
  FORGE_BUILDING,
  TIME_GATE_BUILDING,
  CORNUCOPIA_BUILDING,
];
