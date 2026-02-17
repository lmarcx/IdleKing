export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export const RARITY_MULTIPLIER: Record<Rarity, number> = {
  COMMON: 1.0,
  RARE: 1.35,
  EPIC: 1.8,
  LEGENDARY: 2.5,
};

/**
 * Rarity bands inside each 100-ilvl segment.
 * Example: ilvl 201-300 => segmentIndex=2, local=1..100
 * Common: 1-30, Rare: 31-50, Epic: 51-60, Legendary: 61-100
 */
export function rarityFromIlvl(ilvl: number): { rarity: Rarity; local: number; segment: number } {
  if (!Number.isFinite(ilvl) || ilvl < 1) ilvl = 1;

  const segment = Math.floor((ilvl - 1) / 100); // 0..9 for 1..1000
  const local = ((ilvl - 1) % 100) + 1; // 1..100

  let rarity: Rarity;
  if (local <= 30) rarity = "COMMON";
  else if (local <= 50) rarity = "RARE";
  else if (local <= 60) rarity = "EPIC";
  else rarity = "LEGENDARY";

  return { rarity, local, segment };
}
