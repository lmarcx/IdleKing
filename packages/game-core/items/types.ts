export type ItemRarity =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "EPIC"
  | "LEGENDARY"
  | "MYTHIC"
  | "DIVINE"
  | "ANCIENT";

export const ITEM_RARITIES: readonly ItemRarity[] = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
  "MYTHIC",
  "DIVINE",
  "ANCIENT",
] as const;

export type EquipmentSlot =
  | "weapon"
  | "offhand"
  | "helmet"
  | "chest"
  | "gloves"
  | "belt"
  | "boots"
  | "necklace"
  | "ring"
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
  "ring",
  "cape",
  "artifact",
] as const;

export type LegacyItemSlot = "WEAPON" | "ARMOR" | "CAPE" | "AMULET" | "RING";

export type EquipmentStats = {
  hp?: number;
  attack?: number;
  defense?: number;
  power?: number;
};

export type ResolvedEquipmentStats = {
  hp: number;
  attack: number;
  defense: number;
  power: number;
};

export type ItemId = string;

export type EquipmentItem = {
  id: ItemId;
  kind?: "equipment";
  name: string;
  slot: EquipmentSlot;

  stats: EquipmentStats;
  baseStats?: EquipmentStats;

  itemLevel?: number;
  ilvl?: number; // legacy forge/display alias for itemLevel
  rarity?: ItemRarity;
  upgradeLevel: number;
  value?: number;
};

export type NonEquipmentItem = {
  id: ItemId;
  kind: "material" | "resource" | "consumable" | "misc" | "special" | "quest";
  name: string;
  quantity?: number;
  quality?: number;
  value?: number;
};

export type Item = EquipmentItem | NonEquipmentItem;

const LEGACY_ITEM_SLOT_MAP: Partial<Record<LegacyItemSlot, EquipmentSlot>> = {
  WEAPON: "weapon",
  ARMOR: "chest",
  CAPE: "cape",
  AMULET: "necklace",
  RING: "ring",
};

export function isEquipmentSlot(slot: unknown): slot is EquipmentSlot {
  return typeof slot === "string" && (EQUIPMENT_SLOTS as readonly string[]).includes(slot);
}

export function isItemRarity(rarity: unknown): rarity is ItemRarity {
  return typeof rarity === "string" && (ITEM_RARITIES as readonly string[]).includes(rarity);
}

export function normalizeEquipmentSlot(slot: unknown): EquipmentSlot | null {
  if (isEquipmentSlot(slot)) return slot;
  if (typeof slot !== "string") return null;
  return LEGACY_ITEM_SLOT_MAP[slot as LegacyItemSlot] ?? null;
}

function normalizeUpgradeLevel(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function isEquipmentItem(item: unknown): item is EquipmentItem {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Partial<EquipmentItem>;
  return typeof candidate.id === "string" && typeof candidate.name === "string" && isEquipmentSlot(candidate.slot);
}

export function normalizeEquipmentItem(item: unknown): EquipmentItem | null {
  if (!item || typeof item !== "object") return null;

  const candidate = item as Partial<EquipmentItem> & { slot?: unknown };
  const slot = normalizeEquipmentSlot(candidate.slot);
  if (!slot || typeof candidate.id !== "string" || typeof candidate.name !== "string") return null;
  const stats = candidate.stats ?? {};

  return {
    ...candidate,
    id: candidate.id,
    kind: "equipment",
    name: candidate.name,
    slot,
    stats,
    baseStats: candidate.baseStats ?? stats,
    rarity: isItemRarity(candidate.rarity) ? candidate.rarity : "COMMON",
    upgradeLevel: normalizeUpgradeLevel(candidate.upgradeLevel),
  };
}
