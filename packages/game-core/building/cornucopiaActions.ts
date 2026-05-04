import type { GameState } from "../game/state.js";
import { ALL_RESOURCES, addQty, type ResourceId } from "../resources/types.js";

export const CORNUCOPIA_MAX_CLAIM_AMOUNT = 999999;

export type ClaimCornucopiaError = "INVALID_AMOUNT" | "INVALID_RESOURCE";

export type ClaimCornucopiaResult =
  | {
      ok: true;
      next: GameState;
      resourceId: ResourceId;
      amount: number;
      staminaSpent: 0;
      overdrive: false;
    }
  | { ok: false; next: GameState; error: ClaimCornucopiaError };

function unique(ids: ResourceId[]): ResourceId[] {
  return Array.from(new Set(ids));
}

export function getCornucopiaClaimables(_state: GameState): ResourceId[] {
  return unique([...ALL_RESOURCES]);
}

export function claimCornucopia(
  state: GameState,
  input: { resourceId: ResourceId; amount?: number },
): ClaimCornucopiaResult {
  const amount = input.amount ?? 1;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, next: state, error: "INVALID_AMOUNT" };
  }

  const claimAmount = Math.min(CORNUCOPIA_MAX_CLAIM_AMOUNT, Math.floor(amount));
  if (claimAmount <= 0) {
    return { ok: false, next: state, error: "INVALID_AMOUNT" };
  }

  if (!getCornucopiaClaimables(state).includes(input.resourceId)) {
    return { ok: false, next: state, error: "INVALID_RESOURCE" };
  }

  return {
    ok: true,
    next: {
      ...state,
      resources: addQty(state.resources, input.resourceId, claimAmount),
    },
    resourceId: input.resourceId,
    amount: claimAmount,
    staminaSpent: 0,
    overdrive: false,
  };
}
