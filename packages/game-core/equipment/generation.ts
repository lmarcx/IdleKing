import { EQUIPMENT_SLOTS, type EquipmentItem, type EquipmentSlot, type EquipmentStats, type ItemRarity } from "../items/types.js";

export type GenerateEquipmentItemParams = {
  id?: string;
  seed?: string | number;
  name?: string;
  slot: EquipmentSlot;
  itemLevel: number;
  rarity?: ItemRarity;
};

export type GenerateEquipmentLootDropParams = {
  seed: number;
  worldLevel: number;
  chance?: number;
  itemLevel?: number;
  rarity?: ItemRarity;
  slots?: readonly EquipmentSlot[];
};

const SLOT_BASE_NAMES: Record<EquipmentSlot, string> = {
  weapon: "Sword",
  offhand: "Guard",
  helmet: "Helm",
  chest: "Armor",
  gloves: "Gloves",
  belt: "Belt",
  boots: "Boots",
  necklace: "Pendant",
  cape: "Cape",
  artifact: "Relic",
};

const RARITY_MULTIPLIER: Record<ItemRarity, number> = {
  COMMON: 1,
  RARE: 1.18,
  EPIC: 1.42,
  LEGENDARY: 1.8,
};

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function stat(value: number): number {
  return Math.max(1, Math.round(value));
}

function derivedPower(stats: EquipmentStats): number {
  return stat((stats.attack ?? 0) + (stats.defense ?? 0) + (stats.hp ?? 0) * 0.1);
}

function normalizeItemLevel(itemLevel: number): number {
  return clamp(Math.round(Number.isFinite(itemLevel) ? itemLevel : 1), 1, 1000);
}

function buildStats(slot: EquipmentSlot, itemLevel: number, rarity: ItemRarity): EquipmentStats {
  const scale = itemLevel * RARITY_MULTIPLIER[rarity];

  switch (slot) {
    case "weapon": {
      const stats = { attack: stat(4 + scale * 0.32) };
      return { ...stats, power: derivedPower(stats) };
    }
    case "offhand": {
      const stats = { attack: stat(1 + scale * 0.1), defense: stat(2 + scale * 0.2) };
      return { ...stats, power: derivedPower(stats) };
    }
    case "helmet": {
      const stats = { hp: stat(8 + scale * 0.9), defense: stat(1 + scale * 0.12) };
      return { ...stats, power: derivedPower(stats) };
    }
    case "chest": {
      const stats = { hp: stat(16 + scale * 1.35), defense: stat(2 + scale * 0.18) };
      return { ...stats, power: derivedPower(stats) };
    }
    case "gloves": {
      const stats = { hp: stat(6 + scale * 0.55), defense: stat(1 + scale * 0.08), attack: stat(1 + scale * 0.08) };
      return { ...stats, power: derivedPower(stats) };
    }
    case "belt": {
      const stats = { hp: stat(12 + scale * 0.95), defense: stat(1 + scale * 0.1) };
      return { ...stats, power: derivedPower(stats) };
    }
    case "boots": {
      const stats = { hp: stat(8 + scale * 0.75), defense: stat(1 + scale * 0.1) };
      return { ...stats, power: derivedPower(stats) };
    }
    case "cape": {
      const stats = { hp: stat(10 + scale * 0.85), defense: stat(1 + scale * 0.11) };
      return { ...stats, power: derivedPower(stats) };
    }
    case "necklace": {
      const stats = { hp: stat(5 + scale * 0.45), attack: stat(1 + scale * 0.14) };
      return { ...stats, power: derivedPower(stats) + stat(1 + scale * 0.08) };
    }
    case "artifact": {
      const stats = { hp: stat(6 + scale * 0.5), attack: stat(2 + scale * 0.16), defense: stat(1 + scale * 0.08) };
      return { ...stats, power: derivedPower(stats) + stat(2 + scale * 0.18) };
    }
  }
}

export function generateEquipmentItem(params: GenerateEquipmentItemParams): EquipmentItem {
  const itemLevel = normalizeItemLevel(params.itemLevel);
  const rarity = params.rarity ?? "COMMON";
  const name = params.name ?? `${SLOT_BASE_NAMES[params.slot]} ${itemLevel}`;
  const id = params.id ?? `eq_${slug(String(params.seed ?? `${params.slot}-${itemLevel}-${rarity}`))}`;

  return {
    id,
    kind: "equipment",
    name,
    slot: params.slot,
    itemLevel,
    ilvl: itemLevel,
    rarity,
    stats: buildStats(params.slot, itemLevel, rarity),
  };
}

export function generateEquipmentLootDrop(params: GenerateEquipmentLootDropParams): EquipmentItem | null {
  const chance = clamp(params.chance ?? 0.08, 0, 1);
  const rng = mulberry32(params.seed);

  if (rng() >= chance) return null;

  const slots = (params.slots?.length ? params.slots : EQUIPMENT_SLOTS).filter((slot) =>
    (EQUIPMENT_SLOTS as readonly string[]).includes(slot),
  );
  const slot = slots[Math.floor(rng() * slots.length)] ?? "weapon";
  const itemLevel = params.itemLevel ?? clamp(Math.round(params.worldLevel * 20), 1, 1000);

  return generateEquipmentItem({
    slot,
    itemLevel,
    rarity: params.rarity,
    seed: `loot-${params.seed}-${slot}-${itemLevel}`,
  });
}
