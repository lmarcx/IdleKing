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

export type CharacterEquipment = {
  description: string;
  icon: string;
  id: string;
  itemLevel: number;
  name: string;
  rarity: CharacterEquipmentRarity;
  slot: EquipmentSlotId;
  stats: Partial<CharacterStats>;
  value: number;
};

export type EquippedItems = Partial<Record<EquipmentSlotId, CharacterEquipment>>;

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

export function getEquipmentRarityClass(rarity?: CharacterEquipmentRarity) {
  switch (rarity) {
    case "legendary":
      return "border-white/80 shadow-[0_0_14px_rgba(242,242,242,0.30)]";
    case "epic":
      return "border-[#f2f2f2]/65 shadow-[0_0_14px_rgba(242,242,242,0.18)]";
    case "rare":
      return "border-[#c9c9c9]/65 shadow-[0_0_14px_rgba(242,242,242,0.12)]";
    case "uncommon":
      return "border-[#9a9a9a]/60 shadow-[0_0_14px_rgba(242,242,242,0.08)]";
    case "common":
      return "border-[#6a6a6a]/45";
    default:
      return "border-border/70";
  }
}

export function getEquipmentRarityLabel(rarity: CharacterEquipmentRarity) {
  switch (rarity) {
    case "legendary":
      return "Legendary";
    case "epic":
      return "Epic";
    case "rare":
      return "Rare";
    case "uncommon":
      return "Uncommon";
    case "common":
    default:
      return "Common";
  }
}
