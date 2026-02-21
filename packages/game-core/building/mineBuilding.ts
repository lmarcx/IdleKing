import type { BuildingModule } from "./types.js";

export const MINE_BUILDING: BuildingModule = {
  id: "MINE",
  isUnlocked(state) {
    return state.story.unlocked.has("MINE");
  },
  isActive() {
    return false;
  },
  tick(state) {
    return { next: state };
  },
};