import type { GameState } from "../game/state.js";
import type { ResourceId } from "../resources/types.js";
import { ALL_RESOURCES, addQty } from "../resources/types.js";

export type ClaimCornucopiaError =
  | "INVALID_RESOURCE"
  | "NOT_UNLOCKED"
  | "NOT_BUILT"
  | "NOT_ACTIVE"
  | "NO_STAMINA";

export type ClaimCornucopiaResult =
  | { ok: true; next: GameState; resourceId: ResourceId; amount: number; staminaSpent: number }
  | { ok: false; next: GameState; error: ClaimCornucopiaError };

// MVP: coût fixe par clic
export const CORNUCOPIA_STAMINA_COST = 20;

export function getCornucopiaClaimables(): ResourceId[] {
  return ALL_RESOURCES.filter((r) => r !== "XP_GLOBAL");
}

function computeCornucopiaAmount(params: { worldLevel: number; buildingLevel: number }) {
  const { worldLevel, buildingLevel } = params;

  const base = 10;
  const levelMul = 1 + 0.25 * Math.max(0, buildingLevel - 1);
  const worldMul = 1 + 0.02 * Math.max(0, worldLevel);

  return Math.max(1, Math.floor(base * levelMul * worldMul));
}

export function claimCornucopia(state: GameState, input: { resourceId: ResourceId }): ClaimCornucopiaResult {
  const { resourceId } = input;

  const claimables = getCornucopiaClaimables();
  if (!claimables.includes(resourceId)) {
    return { ok: false, next: state, error: "INVALID_RESOURCE" };
  }

  const b = state.buildings.cornucopia;

  if (!b.unlocked) return { ok: false, next: state, error: "NOT_UNLOCKED" };
  if (!b.built) return { ok: false, next: state, error: "NOT_BUILT" };
  if (!b.active) return { ok: false, next: state, error: "NOT_ACTIVE" };

  if (b.stamina < CORNUCOPIA_STAMINA_COST) {
    return { ok: false, next: state, error: "NO_STAMINA" };
  }

  const amount = computeCornucopiaAmount({
    worldLevel: state.progression.worldLevel,
    buildingLevel: b.level,
  });

  const next: GameState = {
    ...state,
    resources: addQty(state.resources, resourceId, amount),
    buildings: {
      ...state.buildings,
      cornucopia: {
        ...b,
        stamina: b.stamina - CORNUCOPIA_STAMINA_COST,
      },
    },
  };

  return { ok: true, next, resourceId, amount, staminaSpent: CORNUCOPIA_STAMINA_COST };
}