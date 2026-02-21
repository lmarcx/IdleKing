import type { BuildingModule } from "./types.js";
import { addQty } from "../resources/types.js";
import { pickUsableVillagers, consumeVillagerPerMinute } from "../villagers/stamina.js";

const PROD_XP_GLOBAL_PER_MIN_PER_VILLAGER = 1;

const STAMINA_COST_PER_5SEC_PER_VILLAGER = 1; // tunable
const STAMINA_COST_PER_MIN_PER_VILLAGER = 12 * STAMINA_COST_PER_5SEC_PER_VILLAGER;

export const TEMPLE_BUILDING: BuildingModule = {
  id: "TEMPLE",

  isUnlocked(state) {
    return state.buildings.temple.unlocked === true;
  },

  isActive(state) {
    return state.buildings.temple.built === true && state.buildings.temple.active === true;
  },

  tick(state) {
    const temple = state.buildings.temple;

    // Demande de villageois sur le Temple (allocation par “ressource”)
    const desired = Math.max(0, Math.floor(temple.allocation?.XP_GLOBAL ?? 0));
    if (desired <= 0) return { next: state };

    // 1) Sélectionner les villageois utilisables (stamina > 0)
    const usableIds = pickUsableVillagers(state.villagers.list, desired);
    const workingCount = usableIds.length;

    if (workingCount <= 0) {
      return {
        next: state,
        log: ["Temple tick: no usable villagers (stamina=0)"],
      };
    }

    // 2) Production XP_GLOBAL
    const producedXp = workingCount * PROD_XP_GLOBAL_PER_MIN_PER_VILLAGER;

    // 3) Consommer stamina sur les workers
    const nextVillagers = state.villagers.list.map((v) =>
      usableIds.includes(v.id)
        ? consumeVillagerPerMinute(v, STAMINA_COST_PER_MIN_PER_VILLAGER)
        : v
    );

    // 4) Ajouter ressource XP_GLOBAL
    const nextResources = addQty(state.resources, "XP_GLOBAL", producedXp);

    return {
      next: {
        ...state,
        resources: nextResources,
        villagers: { list: nextVillagers },
      },
      log: [
        `Temple tick: +${producedXp} XP_GLOBAL (workers=${workingCount}/${desired})`,
      ],
    };
  },
};