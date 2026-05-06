import type { GameState } from "./state.js";
import type { PlayerXpResult } from "../progression/xp.js";
import { addWorldWxp } from "../progression/worldXp.js";
import { getQty, spend } from "../resources/types.js";
import { applyPlayerXpGain } from "./playerXpActions.js";

export type TempleXpTarget = "playerXp" | "worldWxp";

export type TempleGlobalXpConversionResult =
  | {
      ok: true;
      next: GameState;
      amount: number;
      target: TempleXpTarget;
      player?: PlayerXpResult;
    }
  | {
      ok: false;
      next: GameState;
      reason: "TEMPLE_LOCKED" | "TEMPLE_NOT_BUILT" | "INVALID_AMOUNT" | "NOT_ENOUGH_XP_GLOBAL";
    };

export type TempleGlobalXpConversionOptions = {
  allowLocked?: boolean;
};

export function convertTempleGlobalXp(
  state: GameState,
  target: TempleXpTarget,
  amount: number,
  options: TempleGlobalXpConversionOptions = {},
): TempleGlobalXpConversionResult {
  if (!state.buildings.temple.unlocked && options.allowLocked !== true) {
    return { ok: false, next: state, reason: "TEMPLE_LOCKED" };
  }
  if (!state.buildings.temple.built) {
    return { ok: false, next: state, reason: "TEMPLE_NOT_BUILT" };
  }

  const spendAmount = Math.max(0, Math.floor(amount));
  if (spendAmount <= 0) return { ok: false, next: state, reason: "INVALID_AMOUNT" };

  if (getQty(state.resources, "XP_GLOBAL") < spendAmount) {
    return { ok: false, next: state, reason: "NOT_ENOUGH_XP_GLOBAL" };
  }

  const nextResources = spend(state.resources, { XP_GLOBAL: spendAmount });

  if (target === "playerXp") {
    const playerResult = applyPlayerXpGain(
      {
        ...state,
        resources: nextResources,
      },
      spendAmount,
    );

    return {
      ok: true,
      amount: spendAmount,
      target,
      player: playerResult.player,
      next: playerResult.next,
    };
  }

  const world = addWorldWxp(state.progression.worldLevel, state.progression.worldWxp, spendAmount);

  return {
    ok: true,
    amount: spendAmount,
    target,
    next: {
      ...state,
      resources: nextResources,
      progression: {
        ...state.progression,
        worldLevel: world.newWorldLevel,
        worldWxp: world.newWorldWxp,
      },
    },
  };
}
