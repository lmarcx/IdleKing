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

// TODO: Ring slots will be reintroduced later as skill modifier slots.
export type LegacyEquipmentSlot = "ring";

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

  itemLevel?: number;
  ilvl?: number; // legacy forge/display alias for itemLevel
  rarity?: ItemRarity;
};

export type NonEquipmentItem = {
  id: ItemId;
  kind: "material" | "resource" | "consumable" | "misc";
  name: string;
  quantity?: number;
  value?: number;
};

export type Item = EquipmentItem | NonEquipmentItem;

const LEGACY_ITEM_SLOT_MAP: Partial<Record<LegacyItemSlot, EquipmentSlot>> = {
  WEAPON: "weapon",
  ARMOR: "chest",
  CAPE: "cape",
  AMULET: "necklace",
};

export function isEquipmentSlot(slot: unknown): slot is EquipmentSlot {
  return typeof slot === "string" && (EQUIPMENT_SLOTS as readonly string[]).includes(slot);
}

export function normalizeEquipmentSlot(slot: unknown): EquipmentSlot | null {
  if (isEquipmentSlot(slot)) return slot;
  if (typeof slot !== "string") return null;
  return LEGACY_ITEM_SLOT_MAP[slot as LegacyItemSlot] ?? null;
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

  return {
    ...candidate,
    id: candidate.id,
    kind: "equipment",
    name: candidate.name,
    slot,
    stats: candidate.stats ?? {},
  };
}
