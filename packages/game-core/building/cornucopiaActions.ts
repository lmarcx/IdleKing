import type { GameState } from "../game/state.js";
import type { ResourceId } from "../resources/types.js";
import { addQty } from "../resources/types.js";

import {
  farmResourcesAvailable,
  mineResourcesAvailable,
} from "../game/buildingActions.js";

import {
  ageCoeffFromWorldLevel,
} from "../progression/age.js";

export type ClaimCornucopiaError =
  | "INVALID_RESOURCE"
  | "LOCKED_RESOURCE";

export type ClaimCornucopiaResult =
  | {
      ok: true;
      next: GameState;
      resourceId: ResourceId;
      amount: number;
      staminaSpent: number;
      overdrive: boolean;
    }
  | { ok: false; next: GameState; error: ClaimCornucopiaError };

function unique(ids: ResourceId[]): ResourceId[] {
  return Array.from(new Set(ids));
}

export function getCornucopiaClaimables(state: GameState): ResourceId[] {
  const wl = state.progression.worldLevel;

  const farm = farmResourcesAvailable(wl);
  const mine = mineResourcesAvailable(wl);

  return unique([...farm, ...mine]);
}

/* ---------------------------------------------------------
   AMOUNT COMPUTATION (Strategic version)
--------------------------------------------------------- */

function computeCornucopiaAmount(params: {
  worldLevel: number;
  buildingLevel: number;
  staminaRatio: number;
}) {
  const { worldLevel, buildingLevel, staminaRatio } = params;

  const base = 10;

  // Option 1 — scaling par Age
  const ageMul = ageCoeffFromWorldLevel(worldLevel);

  // Scaling par level bâtiment
  const levelMul = 1 + 0.25 * Math.max(0, buildingLevel - 1);

  // Option 4 — Overdrive si stamina > 80%
  const overdrive = staminaRatio >= 0.8;
  const overdriveMul = overdrive ? 1.3 : 1.0;

  const raw = base * ageMul * levelMul * overdriveMul;

  return {
    amount: Math.max(1, Math.floor(raw)),
    overdrive,
  };
}

/* ---------------------------------------------------------
   CLAIM
--------------------------------------------------------- */

export function claimCornucopia(
  state: GameState,
  input: { resourceId: ResourceId }
): ClaimCornucopiaResult {
  const { resourceId } = input;

  const claimables = getCornucopiaClaimables(state);

  if (!claimables.includes(resourceId)) {
    return { ok: false, next: state, error: "LOCKED_RESOURCE" };
  }

  const b = state.buildings.cornucopia;

  const staminaRatio = b.staminaMax > 0 ? b.stamina / b.staminaMax : 0;

  const { amount, overdrive } = computeCornucopiaAmount({
    worldLevel: state.progression.worldLevel,
    buildingLevel: b.level,
    staminaRatio,
  });

  const next: GameState = {
    ...state,
    resources: addQty(state.resources, resourceId, amount),
  };

  return {
    ok: true,
    next,
    resourceId,
    amount,
    staminaSpent: 0,
    overdrive,
  };
}
