import type { BuildingModule } from "./types.js";
import { addQty } from "../resources/types.js";
import { consumeVillagerPerMinute } from "../villagers/stamina.js";
import { farmResourcesAvailable } from "../game/buildingActions.js";

const PROD_PER_MIN_PER_VILLAGER = 1;
const COST_PER_5SEC = 1;
const COST_PER_MIN = 12 * COST_PER_5SEC;

export const FARM_BUILDING: BuildingModule = {
  id: "FARM",

  isUnlocked(state) {
    return state.buildings.farm.unlocked === true || state.story.unlocked.has("FARM");
  },

  isActive(state) {
    return state.buildings.farm.built === true && state.buildings.farm.active === true;
  },

  tick(state) {
    const available = farmResourcesAvailable(state.progression.worldLevel);
    const allocEntries = Object.entries(state.buildings.farm.allocation)
      .filter(([rid, n]) => available.includes(rid as any) && (n ?? 0) > 0);

    if (allocEntries.length === 0) return { next: state };

    // Villageois utilisables (stamina > 0)
    const villagers = state.villagers.list;
    const usable = villagers.filter(v => v.stamina > 0);
    if (usable.length === 0) return { next: state, log: ["Farm tick: no usable villagers"] };

    // On distribue les "workers" selon alloc
    let remainingWorkers = usable.length;

    const produced: Record<string, number> = {};
    let workersUsed = 0;

    for (const [rid, nRaw] of allocEntries) {
      if (remainingWorkers <= 0) break;
      const n = Math.max(0, Math.floor(nRaw as any));
      const use = Math.min(n, remainingWorkers);
      remainingWorkers -= use;
      workersUsed += use;
      produced[rid] = (produced[rid] ?? 0) + use * PROD_PER_MIN_PER_VILLAGER;
    }

    // Applique production ressources
    let nextResources = state.resources;
    for (const [rid, qty] of Object.entries(produced)) {
      nextResources = addQty(nextResources, rid as any, qty);
    }

    // Consomme stamina sur "workersUsed" villageois (les premiers utilisables)
    const nextVillagers = state.villagers.list.map((v) => v);
    let toConsume = workersUsed;
    for (let i = 0; i < nextVillagers.length && toConsume > 0; i++) {
      if (nextVillagers[i].stamina > 0) {
        nextVillagers[i] = consumeVillagerPerMinute(nextVillagers[i], COST_PER_MIN);
        toConsume--;
      }
    }

    return {
      next: {
        ...state,
        resources: nextResources,
        villagers: { list: nextVillagers },
      },
      log: [`Farm tick: workersUsed=${workersUsed} produced=${JSON.stringify(produced)}`],
    };
  },
};