import type { BuildingModule } from "./types.js";

export const FORGE_BUILDING: BuildingModule = {
  id: "FORGE",

  isUnlocked(state) {
    return state.buildings.forge.unlocked === true;
  },

  isActive(state) {
    return state.buildings.forge.built === true && state.buildings.forge.active === true;
  },

  // Forge does not produce per-minute resources in MVP.
  // Crafting actions are handled through explicit user actions.
  tick(state) {
    return { next: state };
  },
};