import type { GameState } from "../game/state.js";
import { applyUnlocks } from "../game/unlocks.js";
import type { UnlockId } from "../story/types.js";
import {
  CURRENCIES,
  grantCurrency,
  isCurrencyId,
  type CurrencyId,
} from "../currencies/index.js";
import {
  EQUIPMENT_SETS,
  generateEquipmentItem,
  type EquipmentItem,
  type EquipmentSetId,
} from "../equipment/index.js";
import { EQUIPMENT_SLOTS, ITEM_RARITIES, type EquipmentSlot, type ItemRarity } from "../items/types.js";
import { addItem } from "../items/inventory.js";
import { SKILL_IDS, type SkillId } from "../skills/types.js";
import {
  ERA_REGISTRY,
  grantDropOfDarkness,
  grantFragmentDuTemps,
  grantKaleidoscope,
  unlockEraAtTimeGate,
  type EraId,
  type UnlockEraAtTimeGateResult,
} from "../specialItems/index.js";
import {
  EFFECT_SET_IDS,
  isEffectSetId,
  unlockEffectSet,
  type EffectSetId,
} from "../effectSets/index.js";
import { CORNUCOPIA_MAX_CLAIM_AMOUNT } from "./cornucopiaActions.js";

/**
 * Dev-only "grant anything" surface for the Cornucopia building. Every function here
 * is a pure GameState transform mirroring claimCornucopia's shape ({ ok, next, ... }),
 * and every claimable list is read from the real content registry for its domain —
 * nothing is hardcoded beyond what has no registry (special items, unlock ids), which
 * mirrors the canon closed sets for those domains.
 */

// ---------------------------------------------------------------------------
// Currencies
// ---------------------------------------------------------------------------

export type ClaimCornucopiaCurrencyError = "INVALID_AMOUNT" | "INVALID_CURRENCY";

export type ClaimCornucopiaCurrencyResult =
  | { ok: true; next: GameState; currencyId: CurrencyId; amount: number }
  | { ok: false; next: GameState; error: ClaimCornucopiaCurrencyError };

export function getCornucopiaCurrencyClaimables(): CurrencyId[] {
  return CURRENCIES.map((currency) => currency.id);
}

export function claimCornucopiaCurrency(
  state: GameState,
  input: { currencyId: CurrencyId; amount?: number },
): ClaimCornucopiaCurrencyResult {
  const amount = input.amount ?? 1;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, next: state, error: "INVALID_AMOUNT" };
  }

  if (!isCurrencyId(input.currencyId)) {
    return { ok: false, next: state, error: "INVALID_CURRENCY" };
  }

  const claimAmount = Math.min(CORNUCOPIA_MAX_CLAIM_AMOUNT, Math.floor(amount));

  return {
    ok: true,
    next: { ...state, wallet: grantCurrency(state.wallet, input.currencyId, claimAmount) },
    currencyId: input.currencyId,
    amount: claimAmount,
  };
}

// ---------------------------------------------------------------------------
// Equipment / Rings
// ---------------------------------------------------------------------------

export type ClaimCornucopiaEquipmentError =
  | "INVALID_SLOT"
  | "INVALID_RARITY"
  | "INVALID_ITEM_LEVEL"
  | "INVALID_SKILL"
  | "INVALID_SET";

export type ClaimCornucopiaEquipmentResult =
  | { ok: true; next: GameState; item: EquipmentItem }
  | { ok: false; next: GameState; error: ClaimCornucopiaEquipmentError };

export function getCornucopiaEquipmentSlotOptions(): EquipmentSlot[] {
  return [...EQUIPMENT_SLOTS];
}

export function getCornucopiaEquipmentRarityOptions(): ItemRarity[] {
  return [...ITEM_RARITIES];
}

export function getCornucopiaRingSkillOptions(): SkillId[] {
  return [...SKILL_IDS];
}

export function getCornucopiaEquipmentSetOptions(): EquipmentSetId[] {
  return EQUIPMENT_SETS.filter((set) => set.status === "active").map((set) => set.id);
}

export function claimCornucopiaEquipment(
  state: GameState,
  input: {
    slot: EquipmentSlot;
    rarity?: ItemRarity;
    itemLevel?: number;
    skillId?: SkillId;
    setId?: EquipmentSetId;
  },
): ClaimCornucopiaEquipmentResult {
  if (!getCornucopiaEquipmentSlotOptions().includes(input.slot)) {
    return { ok: false, next: state, error: "INVALID_SLOT" };
  }

  const rarity = input.rarity ?? "COMMON";
  if (!getCornucopiaEquipmentRarityOptions().includes(rarity)) {
    return { ok: false, next: state, error: "INVALID_RARITY" };
  }

  const itemLevel = input.itemLevel ?? 1;
  if (!Number.isFinite(itemLevel) || itemLevel <= 0) {
    return { ok: false, next: state, error: "INVALID_ITEM_LEVEL" };
  }

  if (input.skillId !== undefined && !getCornucopiaRingSkillOptions().includes(input.skillId)) {
    return { ok: false, next: state, error: "INVALID_SKILL" };
  }

  if (input.setId !== undefined && !getCornucopiaEquipmentSetOptions().includes(input.setId)) {
    return { ok: false, next: state, error: "INVALID_SET" };
  }

  const item = generateEquipmentItem({
    slot: input.slot,
    itemLevel,
    rarity,
    skillId: input.slot === "ring" ? input.skillId : undefined,
    setId: input.setId,
  });

  return {
    ok: true,
    next: { ...state, inventory: addItem(state.inventory, item) },
    item,
  };
}

// ---------------------------------------------------------------------------
// Special Items (Kaleidoscope, Fragment du Temps, Drop of Darkness — closed set, no registry by design)
// ---------------------------------------------------------------------------

export type CornucopiaSpecialItemId = "KALEIDOSCOPE" | "DROP_OF_DARKNESS" | "FRAGMENT_DU_TEMPS";

const CORNUCOPIA_SPECIAL_ITEM_IDS: readonly CornucopiaSpecialItemId[] = [
  "KALEIDOSCOPE",
  "DROP_OF_DARKNESS",
  "FRAGMENT_DU_TEMPS",
];

export type ClaimCornucopiaSpecialItemError = "INVALID_SPECIAL_ITEM" | "INVALID_AMOUNT";

export type ClaimCornucopiaSpecialItemResult =
  | { ok: true; next: GameState; specialItemId: CornucopiaSpecialItemId; amount: number }
  | { ok: false; next: GameState; error: ClaimCornucopiaSpecialItemError };

export function getCornucopiaSpecialItemClaimables(): CornucopiaSpecialItemId[] {
  return [...CORNUCOPIA_SPECIAL_ITEM_IDS];
}

export function claimCornucopiaSpecialItem(
  state: GameState,
  input: { specialItemId: CornucopiaSpecialItemId; amount?: number },
): ClaimCornucopiaSpecialItemResult {
  if (!CORNUCOPIA_SPECIAL_ITEM_IDS.includes(input.specialItemId)) {
    return { ok: false, next: state, error: "INVALID_SPECIAL_ITEM" };
  }

  if (input.specialItemId === "FRAGMENT_DU_TEMPS") {
    const amount = input.amount ?? 1;
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, next: state, error: "INVALID_AMOUNT" };
    }
    const claimAmount = Math.min(CORNUCOPIA_MAX_CLAIM_AMOUNT, Math.floor(amount));
    return {
      ok: true,
      next: grantFragmentDuTemps(state, claimAmount),
      specialItemId: input.specialItemId,
      amount: claimAmount,
    };
  }

  const next = input.specialItemId === "KALEIDOSCOPE" ? grantKaleidoscope(state) : grantDropOfDarkness(state);
  return { ok: true, next, specialItemId: input.specialItemId, amount: 1 };
}

// ---------------------------------------------------------------------------
// Unlocks — building/story (applyUnlocks)
// ---------------------------------------------------------------------------

/**
 * UnlockId (story/types.ts) has an extensible `(string & {})` fallback member, so it
 * cannot be enumerated at runtime. This mirrors its closed set of named literals —
 * the same ids the rest of the codebase treats as the real building/feature unlocks.
 */
const CORNUCOPIA_UNLOCK_IDS: readonly UnlockId[] = [
  "FORUM",
  "FARM",
  "MINE",
  "KITCHEN",
  "TEMPLE",
  "REPEATABLE_QUESTS",
  "TAVERN",
  "DUNGEONS",
  "FORGE",
  "LABORATORY",
  "FORTRESS",
  "MARKET",
  "TIME_GATE",
  "WORLD_GATE",
  "BANK",
  "ROYAL_CASTLE",
];

export type ClaimCornucopiaUnlockError = "INVALID_UNLOCK";

export type ClaimCornucopiaUnlockResult =
  | { ok: true; next: GameState; unlockId: UnlockId }
  | { ok: false; next: GameState; error: ClaimCornucopiaUnlockError };

export function getCornucopiaUnlockClaimables(): UnlockId[] {
  return [...CORNUCOPIA_UNLOCK_IDS];
}

export function claimCornucopiaUnlock(
  state: GameState,
  input: { unlockId: UnlockId },
): ClaimCornucopiaUnlockResult {
  if (!getCornucopiaUnlockClaimables().includes(input.unlockId)) {
    return { ok: false, next: state, error: "INVALID_UNLOCK" };
  }

  return { ok: true, next: applyUnlocks(state, [input.unlockId]), unlockId: input.unlockId };
}

// ---------------------------------------------------------------------------
// Unlocks — Time Gate eras (unlockEraAtTimeGate, real prerequisites apply on purpose)
// ---------------------------------------------------------------------------

export function getCornucopiaEraClaimables(): EraId[] {
  return ERA_REGISTRY.filter((era) => era.playable).map((era) => era.id);
}

export function claimCornucopiaEra(state: GameState, input: { eraId: EraId }): UnlockEraAtTimeGateResult {
  return unlockEraAtTimeGate(state, input.eraId);
}

// ---------------------------------------------------------------------------
// Unlocks — Effect Sets (unlockEffectSet)
// ---------------------------------------------------------------------------

export type ClaimCornucopiaEffectSetError = "INVALID_EFFECT_SET";

export type ClaimCornucopiaEffectSetResult =
  | { ok: true; next: GameState; effectSetId: EffectSetId }
  | { ok: false; next: GameState; error: ClaimCornucopiaEffectSetError };

export function getCornucopiaEffectSetClaimables(): EffectSetId[] {
  return [...EFFECT_SET_IDS];
}

export function claimCornucopiaEffectSet(
  state: GameState,
  input: { effectSetId: EffectSetId },
): ClaimCornucopiaEffectSetResult {
  if (!isEffectSetId(input.effectSetId)) {
    return { ok: false, next: state, error: "INVALID_EFFECT_SET" };
  }

  try {
    return { ok: true, next: unlockEffectSet(state, input.effectSetId), effectSetId: input.effectSetId };
  } catch {
    return { ok: false, next: state, error: "INVALID_EFFECT_SET" };
  }
}
