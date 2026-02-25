import type { GameState } from "../game/state.js";
import type { ResourceId } from "../resources/types.js";
import { addQty } from "../resources/types.js";

export type ClaimCornucopiaError =
  | "INVALID_RESOURCE"
  | "NOT_UNLOCKED"
  | "NOT_BUILT"
  | "NOT_ACTIVE"
  | "COOLDOWN";

export type ClaimCornucopiaResult =
  | { ok: true; next: GameState; resourceId: ResourceId; amount: number }
  | { ok: false; next: GameState; error: ClaimCornucopiaError; remainingMs?: number };

// Cooldown MVP (changeable)
export const CORNUCOPIA_COOLDOWN_MS = 8 * 60 * 60 * 1000;

// Liste runtime locale (pas possible de déduire depuis le type union au runtime)
const CORNUCOPIA_CLAIMABLES: ResourceId[] = [
  // Farm base (Age I)
  "STONE",
  "WOOD",
  "WATER",
  "MEAT",
  // Mine base (Age I)
  "COPPER",
  "SILVER",
  "GOLD",
  // Farm Age II
  "WHEAT",
  "TOMATO",
  "CARROT",
  "EGG",
  // Mine Age II
  "IRON",
  // Farm Age III
  "MILK",
  "BREAD",
  "POTATO",
  "SALAD",
  // Mine Age III
  "PLATINUM",
  // Farm Age IV
  "APPLE",
  "APRICOT",
  "PEACH",
  "GRAPE",
  // Mine Age IV
  "MITHRIL",
  // Farm Age V
  "CHERRY",
  "STRAWBERRY",
  "RAZZBERRY",
  // Mine Age V
  "ORICHALUM",
  // Future (endgame)
  "RUNES",
  "INK",
  "PAPER",
  "SCROLLS",
  "GEMS",
  // Kitchen outputs (MVP)
  "PLATE_STEW",
  "PLATE_SALAD",
];

// Helper si tu veux l’exposer à l’UI
export function getCornucopiaClaimables(): ResourceId[] {
  return [...CORNUCOPIA_CLAIMABLES];
}

function computeCornucopiaAmount(params: { worldLevel: number; buildingLevel: number }) {
  const { worldLevel, buildingLevel } = params;

  const base = 10;
  const levelMul = 1 + 0.25 * Math.max(0, buildingLevel - 1);
  const worldMul = 1 + 0.02 * Math.max(0, worldLevel);

  return Math.max(1, Math.floor(base * levelMul * worldMul));
}

export function claimCornucopia(state: GameState, input: { resourceId: ResourceId; nowMs: number }): ClaimCornucopiaResult {
  const { resourceId, nowMs } = input;

  // exclude XP + villagers already not part of ResourceId
  if (!CORNUCOPIA_CLAIMABLES.includes(resourceId)) {
    return { ok: false, next: state, error: "INVALID_RESOURCE" };
  }

  const b = state.buildings.cornucopia;

  if (!b.unlocked) return { ok: false, next: state, error: "NOT_UNLOCKED" };
  if (!b.built) return { ok: false, next: state, error: "NOT_BUILT" };
  if (!b.active) return { ok: false, next: state, error: "NOT_ACTIVE" };

  const last = b.lastClaimAtMs;
  if (last != null) {
    const remaining = last + CORNUCOPIA_COOLDOWN_MS - nowMs;
    if (remaining > 0) {
      return { ok: false, next: state, error: "COOLDOWN", remainingMs: remaining };
    }
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
        lastClaimAtMs: nowMs,
      },
    },
  };

  return { ok: true, next, resourceId, amount };
}