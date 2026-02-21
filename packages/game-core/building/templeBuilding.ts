import type { BuildingModule } from "./types.js";
import { applyWorldWxp } from "../progression/worldXp.js";
import { templeProductionPerMin } from "./temple.js";

// stamina helpers (simple)
// coût "toutes les 5 secondes" => 12 ticks / minute
function staminaCostPerMinute(costPer5Sec: number): number {
  return 12 * costPer5Sec;
}

export const TEMPLE_BUILDING: BuildingModule = {
  id: "TEMPLE",

  isUnlocked(state) {
    return state.buildings.temple.unlocked === true;
  },

  isActive(state) {
    // MVP : actif si construit + au moins 1 villageois assigné
    // (tu pourras ajouter "enabled" plus tard)
    return state.buildings.temple.built === true && state.buildings.temple.assignedVillagers > 0;
  },

  tick(state) {
    const temple = state.buildings.temple;

    // Production WXP/min dépend du world level + villagers (cap + diminishing returns déjà dans temple.ts)
    const wxpPerMin = templeProductionPerMin(
      temple.level,
      state.progression.worldLevel,
      temple.assignedVillagers
    );

    // Applique WXP au world
    const wres = applyWorldWxp(
      state.progression.worldLevel,
      state.progression.worldWxp,
      wxpPerMin
    );

    // Stamina: MVP ultra simple (niveau global)
    // Tu as dit "stamina baisse" : on commence par un coût global basé sur villageois assignés.
    // Plus tard: stamina individuelle par villager.
    const costPerVillagerPer5Sec = 1; // MVP (tunable)
    const cost = staminaCostPerMinute(costPerVillagerPer5Sec) * temple.assignedVillagers;

    const available = state.villagers.available;
    // on décrémente "available" comme proxy stamina (MVP) ? -> NON : available = quantité, pas stamina.
    // Donc: on introduit un champ stamina global minimal sur villagers (voir étape 3),
    // mais pour l’instant on ne casse pas: on log seulement.
    // => On fait un placeholder “no-op” stamina ici, et on branchera la vraie stamina (option 3).
    const next = {
      ...state,
      progression: {
        ...state.progression,
        worldLevel: wres.newWorldLevel,
        worldWxp: wres.newWorldWxp,
      },
    };

    return {
      next,
      log: [
        `Temple tick: +${wxpPerMin} WXP (villagers=${temple.assignedVillagers}, staminaCost=${cost}, available=${available})`,
      ],
    };
  },
};