import type { BuildingModule } from "./types.js";

export const CORNUCOPIA_BUILDING: BuildingModule = {
  id: "CORNUCOPIA",

  isUnlocked(state) {
    return state.buildings.cornucopia.unlocked;
  },

  isActive(state) {
    return state.buildings.cornucopia.active;
  },

  // Pas de production passive en tick (claim manuel uniquement)
  tick(state) {
    return { next: state };
  },
};