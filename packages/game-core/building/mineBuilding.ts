import type { BuildingModule } from "./types.js";

export const MINE_BUILDING: BuildingModule = {
  id: "MINE",

  isUnlocked(state) {
    return state.buildings.mine.unlocked === true || state.story.unlocked.has("MINE");
  },

  isActive(state) {
    return state.buildings.mine.built === true && state.buildings.mine.active === true;
  },

  tick(state) {
    return { next: state };
  },
};
