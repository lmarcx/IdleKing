import type { BuildingModule } from "./types.js";

export const FARM_BUILDING: BuildingModule = {
  id: "FARM",
  isUnlocked(state) {
    return state.story.unlocked.has("FARM");
  },
  isActive() {
    return false; // MVP: pas encore implémenté
  },
  tick(state) {
    return { next: state };
  },
};