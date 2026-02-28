import type { GameState } from "../game/state.js";
import type { ResourceId } from "../resources/types.js";
import { addQty } from "../resources/types.js";

// On réutilise la source de vérité "progression -> Age -> ressources dispo"
// (déjà utilisée par tes tests farm/mine).
import { farmResourcesAvailable } from "../game/buildingActions.js";
import { mineResourcesAvailable } from "../game/buildingActions.js";
import { ageFromWorldLevel } from "../progression/age.js";

export type ClaimCornucopiaError = "INVALID_RESOURCE" | "LOCKED_RESOURCE" | "NO_STAMINA";

export type ClaimCornucopiaResult =
  | { ok: true; next: GameState; resourceId: ResourceId; amount: number; staminaSpent: number }
  | { ok: false; next: GameState; error: ClaimCornucopiaError };

// Coût fixe par clic (MVP)
export const CORNUCOPIA_STAMINA_COST = 20;

function unique(ids: ResourceId[]): ResourceId[] {
  return Array.from(new Set(ids));
}

// Ressources brutes uniquement = farm + mine, filtrées par Age (donc progression)
export function getCornucopiaClaimables(state: GameState): ResourceId[] {
  const wl = state.progression.worldLevel;

  const farm = farmResourcesAvailable(wl);
  const mine = mineResourcesAvailable(wl);

  // exclure XP_GLOBAL (et tout le reste est "raw" par design)
  return unique([...farm, ...mine]).filter((r) => r !== "XP_GLOBAL");
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

  // sécurité : XP_GLOBAL jamais claimable
  if (resourceId === "XP_GLOBAL") {
    return { ok: false, next: state, error: "INVALID_RESOURCE" };
  }

  // Game design B: seulement ressources brutes actuellement débloquées
  const claimables = getCornucopiaClaimables(state);
  if (!claimables.includes(resourceId)) {
    return { ok: false, next: state, error: "LOCKED_RESOURCE" };
  }

  // Game design: toujours dispo => pas de checks unlocked/built/active
  const b = state.buildings.cornucopia;

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