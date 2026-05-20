import type { BuildingModule } from "./types.js";

export const TEMPLE_BUILDING: BuildingModule = {
  id: "TEMPLE",

  isUnlocked(state) {
    return state.buildings.temple.unlocked === true;
  },

  isActive(state) {
    return state.buildings.temple.built === true && state.buildings.temple.active === true;
  },

  tick(state) {
    return { next: state };
  },
};
