import type { GameState } from "./state.js";
import { findItem, removeItem } from "../items/inventory.js";
import { EQUIPMENT_SLOTS } from "../items/types.js";
import { normalizePlayerEquipmentState, unequipItem, unequipRingItem } from "../equipment/index.js";

export type RemoveInventoryItemError = "ITEM_NOT_FOUND";

export type RemoveInventoryItemResult =
  | {
      ok: true;
      next: GameState;
      removedItemId: string;
      wasEquipped: boolean;
    }
  | { ok: false; next: GameState; reason: RemoveInventoryItemError };

/**
 * Removes an item from inventory. If the item is currently equipped (a main
 * slot or a ring slot), it is unequipped first so no equipped-slot reference
 * is left dangling — forgeRecycle/forgeRecycleEquipment do NOT do this today
 * (see building/forge/recycle.ts), this is the compound-safe alternative.
 */
export function removeInventoryItem(state: GameState, itemId: string): RemoveInventoryItemResult {
  const item = findItem(state.inventory, itemId);
  if (!item) return { ok: false, next: state, reason: "ITEM_NOT_FOUND" };

  const equipped = normalizePlayerEquipmentState(state.equipment).equipped;
  let working: GameState = state;
  let wasEquipped = false;

  const ringSlotIndex = equipped.rings.indexOf(itemId);
  if (ringSlotIndex >= 0) {
    working = unequipRingItem(working, ringSlotIndex).state;
    wasEquipped = true;
  } else {
    const equippedSlot = EQUIPMENT_SLOTS.find((slot) => slot !== "ring" && equipped[slot] === itemId);
    if (equippedSlot) {
      working = unequipItem(working, equippedSlot).state;
      wasEquipped = true;
    }
  }

  return {
    ok: true,
    next: { ...working, inventory: removeItem(working.inventory, itemId) },
    removedItemId: itemId,
    wasEquipped,
  };
}
