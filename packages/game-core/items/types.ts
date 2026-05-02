export type ItemRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export type EquipmentSlot =
  | "weapon"
  | "offhand"
  | "helmet"
  | "chest"
  | "gloves"
  | "belt"
  | "boots"
  | "necklace"
  | "cape"
  | "artifact";

export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = [
  "weapon",
  "offhand",
  "helmet",
  "chest",
  "gloves",
  "belt",
  "boots",
  "necklace",
  "cape",
  "artifact",
] as const;

// TODO: reintroduce ring slots later for skill modifiers system
export type LegacyEquipmentSlot = "ring";

export const ITEM_SLOTS = ["WEAPON", "ARMOR", "CAPE", "AMULET"] as const;

export type ItemSlot = (typeof ITEM_SLOTS)[number];

export type LegacyItemSlot = "RING";

export type ItemId = string;

export type Item = {
  id: ItemId;
  name: string;
  slot: ItemSlot;

  ilvl: number;          // derived from world level at craft time (expectedIlvl)
  rarity: ItemRarity;

  // MVP: stats can be added later without changing the action APIs.
  stats?: Record<string, number>;
};

export function isItemSlot(slot: unknown): slot is ItemSlot {
  return typeof slot === "string" && (ITEM_SLOTS as readonly string[]).includes(slot);
}
