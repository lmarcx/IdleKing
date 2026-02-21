import type { BuildingModule } from "./types.js";
import { addQty } from "../resources/types.js";
import { consumeVillagerPerMinute } from "../villagers/stamina.js";
import { mineResourcesAvailable } from "../game/buildingActions.js";

const PROD_PER_MIN_PER_VILLAGER = 1;
const COST_PER_5SEC = 1;
const COST_PER_MIN = 12 * COST_PER_5SEC;

export const MINE_BUILDING: BuildingModule = {
  id: "MINE",

  isUnlocked(state) {
    return state.buildings.mine.unlocked === true || state.story.unlocked.has("MINE");
  },

  isActive(state) {
    return state.buildings.mine.built === true && state.buildings.mine.active === true;
  },

  tick(state) {
    const available = mineResourcesAvailable(state.progression.worldLevel);
    const allocEntries = Object.entries(state.buildings.mine.allocation)
      .filter(([rid, n]) => available.includes(rid as any) && (n ?? 0) > 0);

    if (allocEntries.length === 0) return { next: state };

    const villagers = state.villagers.list;
    const usable = villagers.filter(v => v.stamina > 0);
    if (usable.length === 0) return { next: state, log: ["Mine tick: no usable villagers"] };

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

    let nextResources = state.resources;
    for (const [rid, qty] of Object.entries(produced)) {
      nextResources = addQty(nextResources, rid as any, qty);
    }

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
      log: [`Mine tick: workersUsed=${workersUsed} produced=${JSON.stringify(produced)}`],
    };
  },
};