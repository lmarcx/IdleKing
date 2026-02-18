import type { GeneratedItem } from "../loot/itemGenerator.js";
import type { ItemSlot } from "../loot/budget.js";
import type { Inventory, Loadout, LoadoutComputed } from "./types.js";
import { emptyCombatStats } from "./types.js";
import type { Element } from "../power/types.js";

function addElementMap(
  target: Record<Element, number>,
  add?: Partial<Record<Element, number>>
) {
  if (!add) return;
  for (const k of Object.keys(add) as Element[]) {
    target[k] = (target[k] ?? 0) + (add[k] ?? 0);
  }
}

function addItemStats(stats: ReturnType<typeof emptyCombatStats>, item: GeneratedItem) {
  const s = item.stats;

  stats.hp += Math.round(s.hp ?? 0);
  stats.attack += s.attack ?? 0;
  stats.armor += s.armor ?? 0;

  stats.critChance += s.critChance ?? 0;

  // We keep base critDmg = 1.5 at the end; items don't roll it in MVP.
  // If later items roll bonus critDmg, we'll decide how to apply it.
  // stats.critDmg += s.critDmg ?? 0;

  stats.speedRating += Math.round(s.speedRating ?? 0);
  stats.pierceRating += Math.round(s.pierceRating ?? 0);

  addElementMap(stats.resists, s.resists);
  addElementMap(stats.elemental, s.elemental);

  return stats;
}

/**
 * Equip an item by id into its slot.
 * - requires item in inventory
 * - overwrites existing slot (returns replaced itemId if any)
 */
export function equipItem(params: {
  inventory: Inventory;
  loadout: Loadout;
  itemId: string;
}): { loadout: Loadout; replaced?: string } {
  const item = params.inventory.items[params.itemId];
  if (!item) return { loadout: params.loadout };

  const slot: ItemSlot = item.slot;
  const replaced = params.loadout[slot];

  const next: Loadout = { ...params.loadout, [slot]: item.id };
  return { loadout: next, replaced };
}

export function unequipSlot(loadout: Loadout, slot: ItemSlot): Loadout {
  const next = { ...loadout };
  delete next[slot];
  return next;
}

/**
 * Compute aggregated loadoutStats from equipped items.
 */
export function computeLoadoutComputed(inventory: Inventory, loadout: Loadout): LoadoutComputed {
  const stats = emptyCombatStats();
  const equipped: GeneratedItem[] = [];

  for (const itemId of Object.values(loadout)) {
    if (!itemId) continue;
    const item = inventory.items[itemId];
    if (!item) continue;
    equipped.push(item);
    addItemStats(stats, item);
  }

  // Enforce base critDmg in MVP (uncapped critChance handled in combat model).
  stats.critDmg = 1.5;

  return { loadoutStats: stats, equippedItems: equipped };
}
