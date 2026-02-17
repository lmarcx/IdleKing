import type { CombatStats, Element } from "../power/types.js";
import type { ResourceId } from "../loot/lootTables.js";
import { emptyCombatStats } from "../power/itemScore.js";
import { BUILDINGS } from "./buildings.js";
import type { WorldState } from "./worldState.js";

export type WorldProduction = Record<ResourceId, number>; // perSecond

export type WorldComputed = {
  worldStats: CombatStats;
  production: WorldProduction;
  flags: Set<string>;
};

function addElementMap(
  target: Record<Element, number>,
  add?: Partial<Record<Element, number>>,
  mult = 1
) {
  if (!add) return;
  for (const k of Object.keys(add) as Element[]) {
    target[k] += (add[k] ?? 0) * mult;
  }
}

export function computeWorldComputed(world: WorldState): WorldComputed {
  const worldStats = emptyCombatStats();
  const production: WorldProduction = {
    BRONZE: 0,
    COPPER: 0,
    SILVER: 0,
    GOLD: 0,
    WOOD: 0,
    STONE: 0,
    WATER: 0,
    MEAT: 0,
  };

  const flags = new Set<string>();

  for (const def of BUILDINGS) {
    const lvl = world.buildings[def.id] ?? 0;
    if (lvl <= 0) continue;

    // gating
    if (def.minWorldLevel != null && world.worldLevel < def.minWorldLevel) continue;

    // Flags
    for (const f of def.flags ?? []) flags.add(f);

    // Bonuses scale linearly with level (MVP). We can do softcap later.
    const mult = lvl;

    if (def.bonus) {
      worldStats.hp += (def.bonus.hp ?? 0) * mult;
      worldStats.attack += (def.bonus.attack ?? 0) * mult;
      worldStats.armor += (def.bonus.armor ?? 0) * mult;

      worldStats.critChance += (def.bonus.critChance ?? 0) * mult;
      worldStats.critDmg += (def.bonus.critDmg ?? 0) * mult;

      worldStats.speedRating += (def.bonus.speedRating ?? 0) * mult;
      worldStats.pierceRating += (def.bonus.pierceRating ?? 0) * mult;

      addElementMap(worldStats.resists, def.bonus.resists, mult);
      addElementMap(worldStats.elemental, def.bonus.elemental, mult);
    }

    if (def.production) {
      for (const p of def.production) {
        production[p.id] = (production[p.id] ?? 0) + p.perSecond * mult;
      }
    }
  }

  return { worldStats, production, flags };
}
