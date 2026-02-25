import type { GameState } from "../game/state.js";
import type { BuildingModule } from "./types.js";

export const cornucopiaBuilding: BuildingModule = {
  id: "CORNUCOPIA",

  isUnlocked(state: GameState) {
    return state.buildings.cornucopia.unlocked;
  },

  isActive(state: GameState) {
    return state.buildings.cornucopia.active;
  },

  // La Corne d'Abondance est un bâtiment "actif manuel" :
  // pas de production en tick (pour l’instant).
  tick(state: GameState) {
    return { next: state };
  },
};