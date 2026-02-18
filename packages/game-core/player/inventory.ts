import type { CombatStats, Element } from "../power/types.js";
import type { GeneratedItem } from "../loot/itemGenerator.js";
import type { ItemSlot } from "../loot/budget.js";

export type PlayerId = string;

export type Inventory = {
  items: Record<string, GeneratedItem>; // key = item.id
};

export type Loadout = Partial<Record<ItemSlot, string>>; // slot -> itemId

export type PlayerState = {
  level: number;
  inventory: Inventory;
  loadout: Loadout;
};

export type LoadoutComputed = {
  loadoutStats: CombatStats;
  equippedItems: GeneratedItem[];
};

export function emptyCombatStats(): CombatStats {
  const resists: Record<Element, number> = { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 0 };
  const elemental: Record<Element, number> = { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 0 };

  return {
    hp: 0,
    attack: 0,
    armor: 0,
    resists,
    elemental,
    critChance: 0,
    critDmg: 1.5,
    speedRating: 0,
    pierceRating: 0,
  };
}
