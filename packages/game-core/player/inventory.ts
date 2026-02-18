import type { GeneratedItem } from "../loot/itemGenerator.js";
import type { Inventory } from "./types.js";

export function createInventory(): Inventory {
  return { items: {} };
}

export function addItem(inv: Inventory, item: GeneratedItem): Inventory {
  return {
    items: { ...inv.items, [item.id]: item },
  };
}

export function removeItem(inv: Inventory, itemId: string): Inventory {
  const next = { ...inv.items };
  delete next[itemId];
  return { items: next };
}

export function hasItem(inv: Inventory, itemId: string): boolean {
  return !!inv.items[itemId];
}

export function getItem(inv: Inventory, itemId: string): GeneratedItem | undefined {
  return inv.items[itemId];
}
