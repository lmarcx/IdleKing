import type { ItemRarity } from "@idleking/game-core/items";

/**
 * Centralized rarity -> style mapping.
 * The global UI remains minimalist B&W, but item frames use subtle rarity accents.
 * MVP rarities only: Common..Legendary.
 */
const RARITY_BORDER_CLASS: Record<ItemRarity, string> = {
  COMMON: "border-[#6a6a6a]/55",
  UNCOMMON: "border-[#7fa878]/75 shadow-[0_0_14px_rgba(127,168,120,0.14)]",
  RARE: "border-[#6f8fb8]/80 shadow-[0_0_14px_rgba(111,143,184,0.16)]",
  EPIC: "border-[#9b7bb8]/80 shadow-[0_0_14px_rgba(155,123,184,0.18)]",
  LEGENDARY: "border-[#c6a85b]/85 shadow-[0_0_14px_rgba(198,168,91,0.22)]",
};

const RARITY_TEXT_CLASS: Record<ItemRarity, string> = {
  COMMON: "text-neutral-400",
  UNCOMMON: "text-[#9fbe99]",
  RARE: "text-[#8faed6]",
  EPIC: "text-[#b99add]",
  LEGENDARY: "text-[#d5b76a]",
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