import type { Villager } from "../game/state.js";

export function countUsableVillagers(vs: Villager[]): number {
  return vs.filter(v => v.stamina > 0).length;
}