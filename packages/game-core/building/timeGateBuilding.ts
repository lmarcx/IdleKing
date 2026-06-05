import type { BuildingModule } from "./types.js";

export const TIME_GATE_BUILDING: BuildingModule = {
  id: "TIME_GATE",

  isUnlocked(state) {
    return state.buildings.timeGate.unlocked;
  },

  isActive(state) {
    return state.buildings.timeGate.active;
  },

  tick(state) {
    return { next: state };
  },
};
