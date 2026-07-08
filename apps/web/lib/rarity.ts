import type { ItemRarity } from "@idleking/game-core/items";

/**
 * Centralized rarity -> style mapping (MVP rarities only: Common..Legendary).
 * Grayscale intensity scale on purpose — this app's UI is minimalist B&W, not
 * per-rarity hues. Keyed on the core ItemRarity so both the Character screen
 * (which has its own lower-case CharacterEquipmentRarity wrapper) and the
 * Inventory screen (which gets raw upper-case ItemRarity strings) share one
 * source of truth.
 */
const RARITY_BORDER_CLASS: Record<ItemRarity, string> = {
  COMMON: "border-[#6a6a6a]/45",
  UNCOMMON: "border-[#9a9a9a]/60 shadow-[0_0_14px_rgba(242,242,242,0.08)]",
  RARE: "border-[#c9c9c9]/65 shadow-[0_0_14px_rgba(242,242,242,0.12)]",
  EPIC: "border-[#f2f2f2]/65 shadow-[0_0_14px_rgba(242,242,242,0.18)]",
  LEGENDARY: "border-white/80 shadow-[0_0_14px_rgba(242,242,242,0.30)]",
};

const RARITY_TEXT_CLASS: Record<ItemRarity, string> = {
  COMMON: "text-neutral-500",
  UNCOMMON: "text-neutral-400",
  RARE: "text-neutral-300",
  EPIC: "text-neutral-100",
  LEGENDARY: "text-white",
};

const RARITY_LABEL: Record<ItemRarity, string> = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
};

const DEFAULT_BORDER_CLASS = "border-border/70";
const DEFAULT_TEXT_CLASS = "text-muted-foreground";

export function getRarityBorderClass(rarity: ItemRarity | string | undefined): string {
  return (rarity && RARITY_BORDER_CLASS[rarity as ItemRarity]) || DEFAULT_BORDER_CLASS;
}

export function getRarityTextClass(rarity: ItemRarity | string | undefined): string {
  return (rarity && RARITY_TEXT_CLASS[rarity as ItemRarity]) || DEFAULT_TEXT_CLASS;
}

export function getRarityLabel(rarity: ItemRarity | string | undefined): string {
  if (!rarity) return "Unknown";
  return RARITY_LABEL[rarity as ItemRarity] ?? rarity;
}
