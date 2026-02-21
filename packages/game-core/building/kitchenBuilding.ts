import type { BuildingModule } from "./types.js";

export const KITCHEN_BUILDING: BuildingModule = {
  id: "KITCHEN",
  isUnlocked(state) {
    return state.story.unlocked.has("KITCHEN");
  },
  isActive() {
    return false;
  },
  tick(state) {
    return { next: state };
  },
};