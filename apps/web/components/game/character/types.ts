export type EquipmentSlotId =
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

// TODO: reintroduce ring slots later for skill modifiers system
export type LegacyEquipmentSlotId = "ring";

export type CharacterStat = {
  helper?: string;
  label: string;
  placeholder?: boolean;
  value: number | string;
};

export type CharacterEquipmentRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

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
  { id: "cape", label: "Cape" },
  { id: "artifact", label: "Artifact" },
];

export function getSlotIconPath(slotId: EquipmentSlotId) {
  return `/assets/equipment-slots/${slotId}.svg`;
}

export function getEquipmentRarityClass(rarity?: CharacterEquipmentRarity) {
  switch (rarity) {
    case "legendary":
      return "border-orange-300/70 shadow-[0_0_14px_rgba(251,146,60,0.16)]";
    case "epic":
      return "border-violet-300/65 shadow-[0_0_14px_rgba(196,181,253,0.13)]";
    case "rare":
      return "border-sky-300/65 shadow-[0_0_14px_rgba(125,211,252,0.12)]";
    case "uncommon":
      return "border-emerald-300/60 shadow-[0_0_14px_rgba(110,231,183,0.10)]";
    case "common":
      return "border-slate-300/45";
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
