import type { Item } from "@idleking/game-core/items";

export type EquipmentSlotId =
  | "weapon"
  | "helmet"
  | "chest"
  | "gloves"
  | "boots"
  | "necklace"
  | "ring"
  | "artifact"
  | "offhand"
  | "belt";

export type CharacterStat = {
  helper?: string;
  label: string;
  placeholder?: boolean;
  value: number | string;
};

export type EquippedItems = Partial<Record<EquipmentSlotId, Item>>;

export type EquipmentSlotDefinition = {
  id: EquipmentSlotId;
  label: string;
};

export const EQUIPMENT_SLOTS: EquipmentSlotDefinition[] = [
  { id: "weapon", label: "Weapon" },
  { id: "helmet", label: "Helmet" },
  { id: "chest", label: "Chest" },
  { id: "gloves", label: "Gloves" },
  { id: "boots", label: "Boots" },
  { id: "necklace", label: "Necklace" },
  { id: "ring", label: "Ring" },
  { id: "artifact", label: "Artifact" },
  { id: "offhand", label: "Offhand" },
  { id: "belt", label: "Belt" },
];

export function getSlotIconPath(slotId: EquipmentSlotId) {
  return `/assets/equipment-slots/${slotId}.svg`;
}

export function getItemSlotId(item: Item): EquipmentSlotId {
  switch (item.slot) {
    case "WEAPON":
      return "weapon";
    case "ARMOR":
      return "chest";
    case "AMULET":
      return "necklace";
    case "RING":
      return "ring";
    default:
      return "artifact";
  }
}

export function formatItemStats(stats: Item["stats"]) {
  if (!stats || Object.keys(stats).length === 0) return [];

  return Object.entries(stats).map(([key, value]) => ({
    label: key,
    value,
  }));
}
