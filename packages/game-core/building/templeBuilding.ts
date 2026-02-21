import type { BuildingModule } from "./types.js";
import { applyWorldWxp } from "../progression/worldXp.js";
import { templeProductionPerMin } from "./temple.js";
import {
  pickUsableVillagers,
  consumeVillagerPerMinute,
  regenVillagerPerMinute,
} from "../villagers/stamina.js";

const STAMINA_COST_PER_5SEC_PER_VILLAGER = 1; // tunable
const STAMINA_REGEN_PER_MIN = 2; // tunable

// "coûte des villageois toutes les 5 secondes" => 12 ticks / minute
function staminaCostPerMinute(costPer5Sec: number): number {
  return 12 * costPer5Sec;
}

export const TEMPLE_BUILDING: BuildingModule = {
  id: "TEMPLE",

  isUnlocked(state) {
    return state.buildings.temple.unlocked === true;
  },

  isActive(state) {
    // MVP : actif si construit + demande >0 villageois
    return state.buildings.temple.built === true && state.buildings.temple.assignedVillagers > 0;
  },

  tick(state) {
    const temple = state.buildings.temple;
    const desired = temple.assignedVillagers;

    // 1) Sélectionner les villageois utilisables (stamina > 0)
    const usableIds = pickUsableVillagers(state.villagers.list, desired);
    const workingCount = usableIds.length;

    // Si aucun villageois utilisable -> pas de prod, juste regen globale
    const baseWxpPerMin =
      workingCount > 0
        ? templeProductionPerMin(
            temple.level,
            state.progression.worldLevel,
            // IMPORTANT : la prod dépend des villageois réellement actifs ce tick
            workingCount
          )
        : 0;

    // 2) Appliquer WXP au world
    const wres = applyWorldWxp(
      state.progression.worldLevel,
      state.progression.worldWxp,
      baseWxpPerMin
    );

    // 3) Appliquer stamina :
    // - workers: consume
    // - others: regen
    const costPerMin = staminaCostPerMinute(STAMINA_COST_PER_5SEC_PER_VILLAGER);

    const nextVillagers = state.villagers.list.map((v) => {
      if (usableIds.includes(v.id)) return consumeVillagerPerMinute(v, costPerMin);
      return regenVillagerPerMinute(v, STAMINA_REGEN_PER_MIN);
    });

    const next = {
      ...state,
      progression: {
        ...state.progression,
        worldLevel: wres.newWorldLevel,
        worldWxp: wres.newWorldWxp,
      },
      villagers: {
        list: nextVillagers,
      },
    };

    const log = [
      `Temple tick: +${baseWxpPerMin} WXP (workers=${workingCount}/${desired}, costPerMin=${costPerMin})`,
    ];

    return { next, log };
  },
};