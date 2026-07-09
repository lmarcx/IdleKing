import { getRarityBorderClass, getRarityLabel, getRarityTextClass } from "@/lib/rarity";
import type { ItemRarity } from "@idleking/game-core/items";

export type EquipmentSlotId =
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

export type CharacterStat = {
  helper?: string;
  label: string;
  placeholder?: boolean;
  value: number | string;
};

export type CharacterEquipmentRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export type CharacterStats = {
  atk: number;
  def: number;
  hp: number;
  power: number;
};

export type CharacterEquipmentAffix = {
  affixId: string;
  stat: string;
  value: number;
};

export type CharacterEquipment = {
  affixes?: CharacterEquipmentAffix[];
  description: string;
  icon: string;
  id: string;
  itemLevel: number;
  name: string;
  rarity: CharacterEquipmentRarity;
  setId?: string;
  skillId?: string | null;
  slot: EquipmentSlotId;
  stats: Partial<CharacterStats>;
  upgradeLevel?: number;
  value: number;
};

export type EquippedItems = Partial<Record<EquipmentSlotId, CharacterEquipment>>;

/** HTML5 drag-and-drop payload mime type for dragging an equipment item onto a doll slot. */
export const EQUIPMENT_DRAG_MIME = "application/x-idleking-equipment";

export type EquipmentDragPayload = {
  id: string;
  slot: EquipmentSlotId;
};

export type EquipmentSlotDefinition = {
  id: EquipmentSlotId;
  label: string;
};

export const EQUIPMENT_SLOTS: EquipmentSlotDefinition[] = [
  { id: "weapon", label: "Weapon" },
  { id: "offhand", label: "Offhand" },
  { id: "helmet", label: "Helmet" },
  { id: "chest", label: "Chest" },
  { id: "gloves", label: "Gloves" },
  { id: "belt", label: "Belt" },
  { id: "boots", label: "Boots" },
  { id: "necklace", label: "Necklace" },
  { id: "ring", label: "Ring" },
  { id: "cape", label: "Cape" },
  { id: "artifact", label: "Artifact" },
];

export function getSlotIconPath(slotId: EquipmentSlotId) {
  return `/assets/equipment-slots/${slotId}.svg`;
}

const CHARACTER_TO_CORE_RARITY: Record<CharacterEquipmentRarity, ItemRarity> = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY",
};

export function getEquipmentRarityClass(rarity?: CharacterEquipmentRarity) {
  return getRarityBorderClass(rarity ? CHARACTER_TO_CORE_RARITY[rarity] : undefined);
}

export function getEquipmentRarityLabel(rarity: CharacterEquipmentRarity) {
  return getRarityLabel(CHARACTER_TO_CORE_RARITY[rarity]);
}

export function getEquipmentRarityTextClass(rarity: CharacterEquipmentRarity) {
  return getRarityTextClass(CHARACTER_TO_CORE_RARITY[rarity]);
}
