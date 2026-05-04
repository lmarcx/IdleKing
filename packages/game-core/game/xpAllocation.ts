import type { GameState } from "./state.js";
import { getQty } from "../resources/types.js";
import { convertXpToWxp, addWorldWxp } from "../progression/worldXp.js";
import { applyPlayerXpGain } from "./playerXpActions.js";

export type GlobalXpAllocation = {
  toPlayerXp: number;
  toWorldXp: number; // XP_GLOBAL routed to the world channel (converted to WXP and banked)
};

/**
 * Spends XP_GLOBAL and routes it into multiple progression sinks.
 * Current sinks:
 * - Player XP (levels)
 * - World WXP (banked, no auto rank-up)
 *
 * This keeps XP_GLOBAL as a universal currency that can later be routed to:
 * buildings upgrades, ranks, skills, trading, etc.
 */
export function allocateGlobalXp(
  state: GameState,
  alloc: GlobalXpAllocation
): GameState {
  const wantPlayer = Math.max(0, Math.floor(alloc.toPlayerXp));
  const wantWorld = Math.max(0, Math.floor(alloc.toWorldXp));
  const wantTotal = wantPlayer + wantWorld;

  if (wantTotal <= 0) return state;

  const available = getQty(state.resources, "XP_GLOBAL");
  const spend = Math.min(available, wantTotal);
  if (spend <= 0) return state;

  // If XP_GLOBAL is insufficient, distribute proportionally.
  const ratio = spend / wantTotal;
  const givePlayer = Math.floor(wantPlayer * ratio);
  const giveWorld = spend - givePlayer;

  // Deduct XP_GLOBAL from the stock.
  const nextResources = {
    ...state.resources,
    XP_GLOBAL: available - spend,
  };

  const playerState = applyPlayerXpGain(
    {
      ...state,
      resources: nextResources,
    },
    givePlayer
  );

  // Convert XP_GLOBAL -> WXP, then bank it (no auto level-up).
  const gainedWxp = convertXpToWxp(giveWorld);
  const wres = addWorldWxp(
    state.progression.worldLevel,
    state.progression.worldWxp,
    gainedWxp
  );

  return {
    ...playerState.next,
    progression: {
      ...playerState.next.progression,
      worldLevel: wres.newWorldLevel,
      worldWxp: wres.newWorldWxp,
    },
  };
}
