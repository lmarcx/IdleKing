import type { Item } from "./types.js";

export type Inventory = {
  items: Item[];
};

export function addItem(inv: Inventory, item: Item): Inventory {
  return { items: [...inv.items, item] };
}

export function removeItem(inv: Inventory, itemId: string): Inventory {
  return { items: inv.items.filter((i) => i.id !== itemId) };
}

export function findItem(inv: Inventory, itemId: string): Item | undefined {
  return inv.items.find((i) => i.id === itemId);
}