export type ItemRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export type ItemSlot = "WEAPON" | "ARMOR" | "RING" | "AMULET";

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