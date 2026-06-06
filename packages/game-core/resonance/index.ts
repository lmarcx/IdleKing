import {
  normalizePlayerEquipmentState,
  type PlayerEquipmentState,
} from "../equipment/index.js";
import {
  isItemRarity,
  normalizeEquipmentItem,
  type EquipmentItem,
  type EquipmentSlot,
  type Item,
  type ItemRarity,
} from "../items/types.js";

// Freeze V1: off_hand remains eligible even when a two-handed weapon leaves it empty.
export const RESONANCE_ELIGIBLE_SLOTS = [
  "helmet",
  "chest",
  "cape",
  "gloves",
  "belt",
  "boots",
  "main_hand",
  "off_hand",
  "necklace",
] as const satisfies readonly EquipmentSlot[];

export type ResonanceSlot = typeof RESONANCE_ELIGIBLE_SLOTS[number];

export type ResonanceSlotBreakdown = Readonly<{
  slot: ResonanceSlot;
  itemId: string | null;
  rarity: ItemRarity | null;
  value: number;
}>;

export type ResonanceBreakdown = Readonly<{
  totalResonance: number;
  effectSlots: number;
  slots: readonly ResonanceSlotBreakdown[];
}>;

export type ResonanceEquipmentInput = Readonly<{
  equipped: PlayerEquipmentState;
  items?: readonly Item[];
}>;

export const RESONANCE_VALUE_BY_RARITY = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
} as const satisfies Readonly<Record<ItemRarity, number>>;

export function getResonanceValueForRarity(rarity: ItemRarity): number {
  if (!isItemRarity(rarity)) {
    throw new Error(`Unknown MVP item rarity for Resonance: ${String(rarity)}`);
  }
  return RESONANCE_VALUE_BY_RARITY[rarity];
}

export function getResonanceEligibleSlots(): readonly ResonanceSlot[] {
  return RESONANCE_ELIGIBLE_SLOTS;
}

export function calculateEffectSlotCount(totalResonance: number): number {
  if (!Number.isFinite(totalResonance)) return 0;
  return Math.floor(Math.max(0, Math.floor(totalResonance)) / RESONANCE_ELIGIBLE_SLOTS.length);
}

export function calculateResonanceFromEquipment(input: ResonanceEquipmentInput): ResonanceBreakdown;
export function calculateResonanceFromEquipment(
  equipped: PlayerEquipmentState,
  items?: readonly Item[]
): ResonanceBreakdown;
export function calculateResonanceFromEquipment(
  inputOrEquipped: ResonanceEquipmentInput | PlayerEquipmentState,
  maybeItems: readonly Item[] = []
): ResonanceBreakdown {
  const input = isResonanceEquipmentInput(inputOrEquipped)
    ? inputOrEquipped
    : { equipped: inputOrEquipped, items: maybeItems };
  const equipment = normalizePlayerEquipmentState(input.equipped);
  const itemById = buildEquipmentItemMap(input.items ?? []);

  const slots = RESONANCE_ELIGIBLE_SLOTS.map((slot): ResonanceSlotBreakdown => {
    const itemId = equipment.equipped[slot] ?? null;
    if (!itemId) {
      return { slot, itemId: null, rarity: null, value: 0 };
    }

    const item = itemById.get(itemId);
    if (!item || item.slot !== slot) {
      return { slot, itemId, rarity: null, value: 0 };
    }

    return {
      slot,
      itemId,
      rarity: item.rarity,
      value: getResonanceValueForRarity(item.rarity),
    };
  });
  const totalResonance = slots.reduce((total, slot) => total + slot.value, 0);

  return {
    totalResonance,
    effectSlots: calculateEffectSlotCount(totalResonance),
    slots,
  };
}

function isResonanceEquipmentInput(input: unknown): input is ResonanceEquipmentInput {
  if (!input || typeof input !== "object" || !("equipped" in input)) return false;
  const equipped = (input as { equipped?: unknown }).equipped;
  return Boolean(equipped && typeof equipped === "object" && "equipped" in equipped);
}

function buildEquipmentItemMap(items: readonly Item[]): Map<string, EquipmentItem> {
  const itemById = new Map<string, EquipmentItem>();
  for (const item of items) {
    const normalized = normalizeResonanceEquipmentItem(item);
    if (normalized) {
      itemById.set(normalized.id, normalized);
    }
  }
  return itemById;
}

function normalizeResonanceEquipmentItem(item: Item): EquipmentItem | null {
  if (!item || typeof item !== "object" || !("slot" in item)) return null;
  const candidate = item as Partial<EquipmentItem> & { rarity?: unknown };
  if (candidate.rarity !== undefined && !isItemRarity(candidate.rarity)) {
    throw new Error(`Unknown MVP item rarity for Resonance: ${String(candidate.rarity)}`);
  }
  return normalizeEquipmentItem(item);
}
