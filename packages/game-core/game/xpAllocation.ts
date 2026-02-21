import type { GameState } from "./state.js";
import { getQty } from "../resources/types.js";
import { applyPlayerXp } from "../progression/xp.js";
import { convertXpToWxp, applyWorldWxp } from "../progression/worldXp.js";

export type GlobalXpAllocation = {
  toPlayerXp: number;
  toWorldXp: number; // amount of XP_GLOBAL to send to world channel (converted to WXP)
};

export function allocateGlobalXp(state: GameState, alloc: GlobalXpAllocation): GameState {
  const wantPlayer = Math.max(0, Math.floor(alloc.toPlayerXp));
  const wantWorld = Math.max(0, Math.floor(alloc.toWorldXp));
  const wantTotal = wantPlayer + wantWorld;

  if (wantTotal <= 0) return state;

  const available = getQty(state.resources, "XP_GLOBAL");
  const spend = Math.min(available, wantTotal);
  if (spend <= 0) return state;

  // Si pas assez, on fait une allocation proportionnelle
  const ratio = spend / wantTotal;
  const givePlayer = Math.floor(wantPlayer * ratio);
  const giveWorld = spend - givePlayer;

  // Déduire XP_GLOBAL
  const nextResources = {
    ...state.resources,
    XP_GLOBAL: available - spend,
  };

  // Apply player XP
  const pres = applyPlayerXp(
    state.progression.playerLevel,
    state.progression.playerXp,
    givePlayer
  );

  // Apply world WXP (via conversion)
  const gainedWxp = convertXpToWxp(giveWorld);
  const wres = applyWorldWxp(
    state.progression.worldLevel,
    state.progression.worldWxp,
    gainedWxp
  );

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