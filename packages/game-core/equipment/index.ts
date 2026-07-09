import type { GameState } from "../game/state.js";
export {
  generateEquipmentItem,
  generateEquipmentLootDrop,
} from "./generation.js";
export type {
  GenerateEquipmentItemParams,
  GenerateEquipmentLootDropParams,
} from "./generation.js";
export * from "./rules.js";
export * from "./sets.js";
export * from "./rings.js";
import {
  EQUIPMENT_SLOTS,
  isEquipmentItem,
  isEquipmentSlot,
  normalizeEquipmentSlot,
  normalizeEquipmentItem,
  type EquipmentAffix,
  type EquipmentInstance,
  type EquipmentItem,
  type EquipmentSlot,
  type ItemRarity,
  type ResolvedEquipmentStats,
} from "../items/types.js";
import {
  calculateEquipmentSetModifiersFromItems,
} from "./sets.js";
import {
  calculateEffectSetModifiers,
  getEffectiveSlottedEffectSets,
  type EffectSetModifiers,
} from "../effectSets/index.js";
import { calculateResonanceFromEquipment } from "../resonance/index.js";
import { deriveStats } from "../power/statsModel.js";
import type { StatsModifiers } from "../power/statsModel.js";
import {
  createEmptyEquippedRingIds,
  equipRing,
  isSkillBearingRing,
  MAX_EQUIPPED_RINGS,
  type EquippedRingIds,
  type RingEquipmentInstance,
} from "./rings.js";
import type { SkillId } from "../skills/types.js";

export type PlayerEquipmentState = {
  equipped: Record<EquipmentSlot, string | null> & {
    rings: EquippedRingIds;
  };
};

export type EquipmentActionError =
  | "ITEM_NOT_FOUND"
  | "ITEM_NOT_EQUIPMENT"
  | "INVALID_SLOT"
  | "INVALID_RING"
  | "INVALID_RING_SLOT"
  | "RING_SKILL_ALREADY_EQUIPPED"
  | "RING_SLOTS_FULL";

export type EquipItemResult =
  | {
      ok: true;
      state: GameState;
      item: EquipmentItem;
      replacedItemId: string | null;
    }
  | {
      ok: false;
      state: GameState;
      reason: EquipmentActionError;
    };

export type UnequipItemResult = {
  ok: true;
  state: GameState;
  removedItemId: string | null;
};

export const BASE_CHARACTER_STATS: ResolvedEquipmentStats = {
  hp: 100,
  attack: 25,
  defense: 0,
  power: 25,
} as const;

export const MVP_STARTER_RING_ID = "mvp-starter-ring-arcane-bolt";
export const MVP_STARTER_RING_SKILL_ID = "SK-004" satisfies SkillId;

export const MVP_STARTER_RING: EquipmentItem = {
  affixes: [],
  baseItemId: "starter_arcane_ring",
  baseStats: {
    hp: 0,
    attack: 0,
    defense: 0,
    power: 0,
  },
  id: MVP_STARTER_RING_ID,
  ilvl: 1,
  instanceId: MVP_STARTER_RING_ID,
  itemLevel: 1,
  kind: "equipment",
  name: "Starter Arcane Ring",
  rarity: "COMMON",
  rolledStats: {
    hp: 0,
    attack: 0,
    defense: 0,
    power: 0,
  },
  skillId: MVP_STARTER_RING_SKILL_ID,
  slot: "ring",
  stats: {
    hp: 0,
    attack: 0,
    defense: 0,
    power: 0,
  },
  upgradeLevel: 0,
  value: 1,
};

type InventorySkillRing = EquipmentItem & RingEquipmentInstance;

export type FinalCharacterStats = ResolvedEquipmentStats & {
  critChance: number;
  manaRegen: number;
  staminaRegen: number;
  combatTags: readonly string[];
  effectSetModifiers: EffectSetModifiers;
};

export function createDefaultPlayerEquipmentState(): PlayerEquipmentState {
  return {
    equipped: {
      ...Object.fromEntries(EQUIPMENT_SLOTS.map((slot) => [slot, null])) as Record<EquipmentSlot, string | null>,
      rings: createEmptyEquippedRingIds(),
    },
  };
}

export function normalizePlayerEquipmentState(value: unknown): PlayerEquipmentState {
  const base = createDefaultPlayerEquipmentState();
  if (!value || typeof value !== "object") return base;

  const equipped = (value as Partial<PlayerEquipmentState>).equipped;
  if (!equipped || typeof equipped !== "object") return base;

  for (const [slot, itemId] of Object.entries(equipped)) {
    if (slot === "rings") continue;
    const normalizedSlot = normalizeEquipmentSlot(slot);
    if (!normalizedSlot) continue;
    base.equipped[normalizedSlot] = typeof itemId === "string" ? itemId : null;
  }

  const ringIds = (equipped as Partial<PlayerEquipmentState["equipped"]>).rings;
  if (Array.isArray(ringIds)) {
    base.equipped.rings = createEmptyEquippedRingIds();
    for (let slotIndex = 0; slotIndex < base.equipped.rings.length; slotIndex += 1) {
      const itemId = ringIds[slotIndex];
      base.equipped.rings[slotIndex] = typeof itemId === "string" ? itemId : null;
    }
  } else if (base.equipped.ring) {
    // Legacy equipment had a single ring slot. Normalize it into the first MVP ring slot.
    base.equipped.rings[0] = base.equipped.ring;
  }
  base.equipped.ring = null;

  return base;
}

export function getEquippedItemIds(equipmentState: PlayerEquipmentState): string[] {
  const equipment = normalizePlayerEquipmentState(equipmentState);
  return EQUIPMENT_SLOTS.filter((slot) => slot !== "ring").flatMap((slot) => {
    const itemId = equipment.equipped[slot];
    return itemId ? [itemId] : [];
  }).concat(equipment.equipped.rings.filter((itemId): itemId is string => Boolean(itemId)));
}

function getInventoryEquipmentItem(gameState: GameState, itemId: string): EquipmentItem | null {
  const item = gameState.inventory.items.find((entry) => entry.id === itemId);
  if (!item) return null;
  return normalizeEquipmentItem(item);
}

export function getEquippedItems(gameState: GameState): EquipmentItem[] {
  const equipment = normalizePlayerEquipmentState(gameState.equipment);
  const items: EquipmentItem[] = [];

  for (const slot of EQUIPMENT_SLOTS.filter((entry) => entry !== "ring")) {
    const itemId = equipment.equipped[slot];
    if (!itemId) continue;

    const item = getInventoryEquipmentItem(gameState, itemId);
    if (!item || item.slot !== slot) continue;
    items.push(item);
  }

  for (const itemId of equipment.equipped.rings) {
    if (!itemId) continue;

    const item = getInventoryEquipmentItem(gameState, itemId);
    if (!item || item.slot !== "ring") continue;
    items.push(item);
  }

  return items;
}

export function equipItem(gameState: GameState, itemId: string): EquipItemResult {
  const rawItem = gameState.inventory.items.find((entry) => entry.id === itemId);
  if (!rawItem) {
    return { ok: false, state: gameState, reason: "ITEM_NOT_FOUND" };
  }

  if (!isEquipmentItem(normalizeEquipmentItem(rawItem))) {
    return { ok: false, state: gameState, reason: "ITEM_NOT_EQUIPMENT" };
  }

  const item = normalizeEquipmentItem(rawItem);
  if (!item || !isEquipmentSlot(item.slot)) {
    return { ok: false, state: gameState, reason: "INVALID_SLOT" };
  }

  const equipment = normalizePlayerEquipmentState(gameState.equipment);
  if (item.slot === "ring") {
    const slotIndex = equipment.equipped.rings.findIndex((itemId) => itemId === null);
    if (slotIndex < 0) {
      return { ok: false, state: gameState, reason: "RING_SLOTS_FULL" };
    }
    return equipRingItem(gameState, item.id, slotIndex);
  }
  const replacedItemId = equipment.equipped[item.slot];

  return {
    ok: true,
    item,
    replacedItemId,
    state: {
      ...gameState,
      equipment: {
        equipped: {
          ...equipment.equipped,
          [item.slot]: item.id,
        },
      },
    },
  };
}

export function unequipItem(gameState: GameState, slot: EquipmentSlot): UnequipItemResult {
  const equipment = normalizePlayerEquipmentState(gameState.equipment);
  const removedItemId = equipment.equipped[slot] ?? null;

  return {
    ok: true,
    removedItemId,
    state: {
      ...gameState,
      equipment: {
        equipped: {
          ...equipment.equipped,
          [slot]: null,
        },
      },
    },
  };
}

function addEquipmentStats(target: ResolvedEquipmentStats, item: EquipmentItem) {
  if (item.slot === "artifact") return;
  target.hp += item.stats.hp ?? 0;
  target.attack += item.stats.attack ?? 0;
  target.defense += item.stats.defense ?? 0;
  target.power += item.stats.power ?? 0;
}

export function calculateEquipmentStats(gameState: GameState): ResolvedEquipmentStats {
  const stats: ResolvedEquipmentStats = { hp: 0, attack: 0, defense: 0, power: 0 };
  const items = getEquippedItems(gameState);

  for (const item of items) {
    addEquipmentStats(stats, item);
  }

  const setModifiers = calculateEquipmentSetModifiersFromItems(items);
  stats.hp += setModifiers.base?.hp ?? 0;
  stats.attack += setModifiers.base?.atk ?? 0;
  stats.defense += setModifiers.base?.def ?? 0;

  return stats;
}

export function equipRingItem(gameState: GameState, itemId: string, slotIndex: number): EquipItemResult {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= MAX_EQUIPPED_RINGS) {
    return { ok: false, state: gameState, reason: "INVALID_RING_SLOT" };
  }

  const item = getInventoryEquipmentItem(gameState, itemId);
  if (!item) {
    return { ok: false, state: gameState, reason: "ITEM_NOT_FOUND" };
  }
  if (item.slot !== "ring" || !item.skillId) {
    return { ok: false, state: gameState, reason: "INVALID_RING" };
  }

  const equipment = normalizePlayerEquipmentState(gameState.equipment);
  const equippedRings = getEquippedRingItems(gameState);
  try {
    equipRing(equippedRings, item, slotIndex);
  } catch (error) {
    const reason = error instanceof Error && error.message.includes("already equipped")
      ? "RING_SKILL_ALREADY_EQUIPPED"
      : "INVALID_RING";
    return { ok: false, state: gameState, reason };
  }

  const replacedItemId = equipment.equipped.rings[slotIndex];
  const rings = [...equipment.equipped.rings] as EquippedRingIds;
  rings[slotIndex] = item.id;

  return {
    ok: true,
    item,
    replacedItemId,
    state: {
      ...gameState,
      equipment: {
        equipped: {
          ...equipment.equipped,
          rings,
        },
      },
    },
  };
}

export function getEquippedRingItems(gameState: GameState): Array<RingEquipmentInstance | null> {
  const equipment = normalizePlayerEquipmentState(gameState.equipment);
  return equipment.equipped.rings.map((itemId) => {
    if (!itemId) return null;
    const item = getInventoryEquipmentItem(gameState, itemId);
    return item?.slot === "ring" ? item as RingEquipmentInstance : null;
  });
}

function getInventorySkillRings(gameState: GameState): InventorySkillRing[] {
  return gameState.inventory.items.flatMap((item): InventorySkillRing[] => {
    const normalized = normalizeEquipmentItem(item);
    if (!normalized || normalized.slot !== "ring" || !isSkillBearingRing(normalized)) return [];
    return [normalized as InventorySkillRing];
  });
}

function hasEquippedSkillRing(gameState: GameState): boolean {
  return getEquippedRingItems(gameState).some((ring) => ring !== null && isSkillBearingRing(ring));
}

function hasInventoryItem(gameState: GameState, itemId: string): boolean {
  return gameState.inventory.items.some((item) => item.id === itemId);
}

export function ensureMvpStarterRing(gameState: GameState): GameState {
  const equipment = normalizePlayerEquipmentState(gameState.equipment);
  const inventory = {
    items: gameState.inventory.items.flatMap((item): EquipmentItem[] | [typeof item] => {
      if (!item || typeof item !== "object" || !("slot" in item)) return [item];
      const normalized = normalizeEquipmentItem(item);
      return normalized ? [normalized] : [];
    }),
  };
  const normalizedState = {
    ...gameState,
    inventory,
    equipment,
  };

  if (hasEquippedSkillRing(normalizedState)) return normalizedState;

  const inventorySkillRing = getInventorySkillRings(normalizedState)[0];
  const ringToEquip = inventorySkillRing ?? MVP_STARTER_RING;
  const inventoryWithStarter = inventorySkillRing || hasInventoryItem(normalizedState, MVP_STARTER_RING_ID)
    ? normalizedState.inventory
    : {
        items: [...normalizedState.inventory.items, MVP_STARTER_RING],
      };
  const nextState = {
    ...normalizedState,
    inventory: inventoryWithStarter,
  };

  if (equipment.equipped.rings.some((itemId) => itemId === ringToEquip.id)) {
    return nextState;
  }

  const slotIndex = equipment.equipped.rings.findIndex((itemId) => itemId === null);
  if (slotIndex < 0) return nextState;

  const rings = [...equipment.equipped.rings] as EquippedRingIds;
  rings[slotIndex] = ringToEquip.id;
  return {
    ...nextState,
    equipment: {
      equipped: {
        ...equipment.equipped,
        rings,
      },
    },
  };
}

export function unequipRingItem(gameState: GameState, slotIndex: number): UnequipItemResult {
  const equipment = normalizePlayerEquipmentState(gameState.equipment);
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= equipment.equipped.rings.length) {
    return { ok: true, state: gameState, removedItemId: null };
  }

  const removedItemId = equipment.equipped.rings[slotIndex];
  const rings = [...equipment.equipped.rings] as EquippedRingIds;
  rings[slotIndex] = null;

  return {
    ok: true,
    removedItemId,
    state: {
      ...gameState,
      equipment: {
        equipped: {
          ...equipment.equipped,
          rings,
        },
      },
    },
  };
}

export function calculateEquipmentSetModifiers(gameState: GameState): StatsModifiers {
  return calculateEquipmentSetModifiersFromItems(getEquippedItems(gameState));
}

export function calculateFinalCharacterStats(gameState: GameState): FinalCharacterStats {
  const equipmentStats = calculateEquipmentStats(gameState);
  const baseStats: ResolvedEquipmentStats = {
    hp: BASE_CHARACTER_STATS.hp + equipmentStats.hp,
    attack: BASE_CHARACTER_STATS.attack + equipmentStats.attack,
    defense: BASE_CHARACTER_STATS.defense + equipmentStats.defense,
    power: BASE_CHARACTER_STATS.power + equipmentStats.power,
  };
  const resonance = calculateResonanceFromEquipment({
    equipped: gameState.equipment,
    items: gameState.inventory.items,
  });
  const slottedEffects = getEffectiveSlottedEffectSets(gameState, { effectSlots: resonance.effectSlots });
  const effectSetModifiers = calculateEffectSetModifiers(slottedEffects);
  const statModifiers = effectSetModifiers.statModifiers;
  const derivedStats = deriveStats(
    {
      hp: baseStats.hp,
      atk: baseStats.attack,
      def: baseStats.defense,
      speed: 0,
    },
    {
      base: {
        def: statModifiers.defense,
        hp: statModifiers.hp,
      },
      advanced: {
        critChance: statModifiers.critChance,
        manaRegen: statModifiers.manaRegen,
        staminaRegen: 0,
      },
    }
  );

  return {
    ...baseStats,
    hp: derivedStats.base.hp,
    defense: derivedStats.base.def,
    critChance: derivedStats.advanced.critChance,
    manaRegen: derivedStats.advanced.manaRegen,
    staminaRegen: derivedStats.advanced.staminaRegen,
    combatTags: effectSetModifiers.combatTags,
    effectSetModifiers,
  };
}

export type {
  EquipmentItem,
  EquipmentAffix,
  EquipmentInstance,
  EquipmentSlot,
  ItemRarity,
  ResolvedEquipmentStats,
};
