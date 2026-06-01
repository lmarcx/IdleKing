import type { ItemRarity } from "../items/types.js";

export type Rarity = ItemRarity;

export const RARITY_MULTIPLIER: Record<Rarity, number> = {
  COMMON: 1.0,
  UNCOMMON: 1.18,
  RARE: 1.35,
  EPIC: 1.8,
  LEGENDARY: 2.5,
};

/**
 * Rarity bands inside each 100-ilvl segment.
 * Example: ilvl 201-300 => segmentIndex=2, local=1..100
 * Current bands are PLACEHOLDER until full loot balancing lands.
 */
export function rarityFromIlvl(ilvl: number): { rarity: Rarity; local: number; segment: number } {
  if (!Number.isFinite(ilvl) || ilvl < 1) ilvl = 1;

  const segment = Math.floor((ilvl - 1) / 100); // 0..9 for 1..1000
  const local = ((ilvl - 1) % 100) + 1; // 1..100

  let rarity: Rarity;
  if (local <= 25) rarity = "COMMON";
  else if (local <= 40) rarity = "UNCOMMON";
  else if (local <= 55) rarity = "RARE";
  else if (local <= 70) rarity = "EPIC";
  else rarity = "LEGENDARY";

  return { rarity, local, segment };
}
