import type { BuildingModule } from "./types.js";

export const FARM_BUILDING: BuildingModule = {
  id: "FARM",

  isUnlocked(state) {
    return state.buildings.farm.unlocked === true || state.story.unlocked.has("FARM");
  },

  isActive(state) {
    return state.buildings.farm.built === true && state.buildings.farm.active === true;
  },

  tick(state) {
    return { next: state };
  },
};
