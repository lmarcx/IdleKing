import type { GameState } from "./state.js";
import { getQty, addQty } from "../resources/types.js";
import { applyPlayerXp } from "../progression/xp.js";
import { convertXpToWxp, applyWorldWxp } from "../progression/worldXp.js";

export type GlobalXpAllocation = {
  toPlayerXp: number;
  toWorldXp: number; // amount of XP_GLOBAL to send to world channel (converted to WXP)
};

export function allocateGlobalXp(state: GameState, alloc: GlobalXpAllocation): GameState {
  const toPlayer = Math.max(0, Math.floor(alloc.toPlayerXp));
  const toWorld = Math.max(0, Math.floor(alloc.toWorldXp));
  const total = toPlayer + toWorld;

  const available = getQty(state.resources, "XP_GLOBAL");
  const spend = Math.min(available, total);
  if (spend === 0) return state;

  // proportionnelle si demande > disponible
  const ratio = spend / total;
  const p = total === 0 ? 0 : Math.floor(toPlayer * ratio);
  const w = spend - p;

  // enlever XP_GLOBAL
  const nextResources = {
    ...state.resources,
    XP_GLOBAL: available - spend,
  };

  // apply player xp
  const pres = applyPlayerXp(state.progression.playerLevel, state.progression.playerXp, p);

  // world xp -> wxp
  const gainedWxp = convertXpToWxp(w);
  const wres = applyWorldWxp(state.progression.worldLevel, state.progression.worldWxp, gainedWxp);

  return {
    ...state,
    resources: nextResources,
    progression: {
      playerLevel: pres.newLevel,
      playerXp: pres.newXp,
      worldLevel: wres.newWorldLevel,
      worldWxp: wres.newWorldWxp,
    },
  };
}