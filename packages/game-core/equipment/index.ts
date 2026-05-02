import type { GameState } from "../game/state.js";
import {
  EQUIPMENT_SLOTS,
  isEquipmentItem,
  isEquipmentSlot,
  normalizeEquipmentItem,
  type EquipmentItem,
  type EquipmentSlot,
  type ResolvedEquipmentStats,
} from "../items/types.js";

export type PlayerEquipmentState = {
  equipped: Record<EquipmentSlot, string | null>;
};

export type EquipmentActionError = "ITEM_NOT_FOUND" | "ITEM_NOT_EQUIPMENT" | "INVALID_SLOT";

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

export function createDefaultPlayerEquipmentState(): PlayerEquipmentState {
  return {
    equipped: Object.fromEntries(EQUIPMENT_SLOTS.map((slot) => [slot, null])) as Record<EquipmentSlot, string | null>,
  };
}

export function normalizePlayerEquipmentState(value: unknown): PlayerEquipmentState {
  const base = createDefaultPlayerEquipmentState();
  if (!value || typeof value !== "object") return base;

  const equipped = (value as Partial<PlayerEquipmentState>).equipped;
  if (!equipped || typeof equipped !== "object") return base;

  for (const [slot, itemId] of Object.entries(equipped)) {
    if (!isEquipmentSlot(slot)) continue;
    base.equipped[slot] = typeof itemId === "string" ? itemId : null;
  }

  return base;
}

export function getEquippedItemIds(equipmentState: PlayerEquipmentState): string[] {
  return EQUIPMENT_SLOTS.flatMap((slot) => {
    const itemId = equipmentState.equipped[slot];
    return itemId ? [itemId] : [];
  });
}

function getInventoryEquipmentItem(gameState: GameState, itemId: string): EquipmentItem | null {
  const item = gameState.inventory.items.find((entry) => entry.id === itemId);
  if (!item) return null;
  return normalizeEquipmentItem(item);
}

export function getEquippedItems(gameState: GameState): EquipmentItem[] {
  const equipment = normalizePlayerEquipmentState(gameState.equipment);
  const items: EquipmentItem[] = [];

  for (const slot of EQUIPMENT_SLOTS) {
    const itemId = equipment.equipped[slot];
    if (!itemId) continue;

    const item = getInventoryEquipmentItem(gameState, itemId);
    if (!item || item.slot !== slot) continue;
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
  target.hp += item.stats.hp ?? 0;
  target.attack += item.stats.attack ?? 0;
  target.defense += item.stats.defense ?? 0;
  target.power += item.stats.power ?? 0;
}

export function calculateEquipmentStats(gameState: GameState): ResolvedEquipmentStats {
  const stats: ResolvedEquipmentStats = { hp: 0, attack: 0, defense: 0, power: 0 };

  for (const item of getEquippedItems(gameState)) {
    addEquipmentStats(stats, item);
  }

  return stats;
}

export function calculateFinalCharacterStats(gameState: GameState): ResolvedEquipmentStats {
  const equipmentStats = calculateEquipmentStats(gameState);

  // TODO: tune base character stats and derived power once combat balancing is revisited.
  return {
    hp: BASE_CHARACTER_STATS.hp + equipmentStats.hp,
    attack: BASE_CHARACTER_STATS.attack + equipmentStats.attack,
    defense: BASE_CHARACTER_STATS.defense + equipmentStats.defense,
    power: BASE_CHARACTER_STATS.power + equipmentStats.power,
  };
}

export type {
  EquipmentItem,
  EquipmentSlot,
  ResolvedEquipmentStats,
};
