import { grantCurrency, spendCurrency } from "../currencies/index.js";
import { CURRENCIES } from "../currencies/types.js";
import { generateEquipmentItem } from "../equipment/index.js";
import type { GameState } from "../game/state.js";
import { addItem, findItem, removeItem } from "../items/inventory.js";
import { isEquipmentItem, type Item, type NonEquipmentItem } from "../items/types.js";
import { addQty, getQty, type ResourceId } from "../resources/types.js";
import {
  getConsumableMarketEntry,
  getEquipmentMarketEntry,
  getMarketEntry,
  getMarketSellPrice,
  isMarketCatalogResourceId,
  MARKET_CATALOG,
} from "./catalog.js";
import type { MarketActionReason, MarketCatalogEntry } from "./types.js";

export const MARKET_STACK_MAX = 999;

export type MarketActionResult = {
  ok: boolean;
  next: GameState;
  quantity?: number;
  ecuAmount?: number;
  reason?: MarketActionReason;
};

const CURRENCY_SET = new Set<string>(CURRENCIES.map((currency) => currency.id));

function normalizeQuantity(quantity: number): number {
  return Math.max(0, Math.floor(Number.isFinite(quantity) ? quantity : 0));
}

function getItemQuantity(item: NonEquipmentItem): number {
  return Math.max(1, Math.floor(item.quantity ?? 1));
}

function addInventoryStack(items: Item[], item: NonEquipmentItem, quantity: number): Item[] {
  let remaining = normalizeQuantity(quantity);
  const next = items.map((entry) => ({ ...entry })) as Item[];

  for (const entry of next) {
    if (isEquipmentItem(entry) || entry.id !== item.id || entry.kind !== item.kind) continue;
    const current = getItemQuantity(entry);
    const room = MARKET_STACK_MAX - current;
    if (room <= 0) continue;
    const moved = Math.min(room, remaining);
    entry.quantity = current + moved;
    remaining -= moved;
    if (remaining <= 0) return next;
  }

  while (remaining > 0) {
    const moved = Math.min(MARKET_STACK_MAX, remaining);
    next.push({ ...item, quantity: moved });
    remaining -= moved;
  }

  return next;
}

function removeInventoryStack(items: Item[], itemId: string, quantity: number): { ok: boolean; items: Item[] } {
  const safeQuantity = normalizeQuantity(quantity);
  let remaining = safeQuantity;
  const next: Item[] = [];

  for (const item of items) {
    if (item.id !== itemId || isEquipmentItem(item) || remaining <= 0) {
      next.push(item);
      continue;
    }

    const current = getItemQuantity(item);
    const take = Math.min(current, remaining);
    remaining -= take;
    const left = current - take;
    if (left > 0) next.push({ ...item, quantity: left });
  }

  return { ok: remaining === 0, items: next };
}

function countExistingEquipmentWithPrefix(state: GameState, prefix: string): number {
  return state.inventory.items.filter((item) => isEquipmentItem(item) && item.id.startsWith(prefix)).length;
}

function addMarketPurchase(state: GameState, entry: MarketCatalogEntry, quantity: number): GameState {
  if (entry.category === "resources") {
    return {
      ...state,
      resources: addQty(state.resources, entry.resourceId, quantity),
    };
  }

  if (entry.category === "consumables") {
    return {
      ...state,
      inventory: {
        items: addInventoryStack(state.inventory.items, entry.item, quantity),
      },
    };
  }

  let inventory = state.inventory;
  const existingCount = countExistingEquipmentWithPrefix(state, entry.equipment.idPrefix);
  for (let index = 0; index < quantity; index++) {
    const sequence = existingCount + index + 1;
    const id = `${entry.equipment.idPrefix}_${sequence}`;
    inventory = addItem(
      inventory,
      {
        ...generateEquipmentItem({
          id,
          name: entry.equipment.name,
          slot: entry.equipment.slot,
          itemLevel: entry.equipment.itemLevel,
          rarity: entry.equipment.rarity,
          seed: id,
        }),
        value: entry.equipment.value,
      },
    );
  }

  return { ...state, inventory };
}

export function marketBuy(state: GameState, entryId: string, quantity = 1): MarketActionResult {
  const safeQuantity = normalizeQuantity(quantity);
  if (safeQuantity <= 0) return { ok: false, next: state, reason: "INVALID_QUANTITY" };

  const entry = getMarketEntry(entryId);
  if (!entry) return { ok: false, next: state, reason: "ENTRY_NOT_FOUND" };

  const cost = entry.buyPrice.amount * safeQuantity;
  const spent = spendCurrency(state.wallet, "ECU", cost);
  if (!spent.ok) return { ok: false, next: state, reason: "INSUFFICIENT_ECU" };

  return {
    ok: true,
    quantity: safeQuantity,
    ecuAmount: cost,
    next: addMarketPurchase({ ...state, wallet: spent.wallet }, entry, safeQuantity),
  };
}

export function marketSell(state: GameState, id: string, quantity = 1): MarketActionResult {
  const safeQuantity = normalizeQuantity(quantity);
  if (safeQuantity <= 0) return { ok: false, next: state, reason: "INVALID_QUANTITY" };
  if (CURRENCY_SET.has(id)) return { ok: false, next: state, reason: "CURRENCY_NOT_SUPPORTED" };

  if (isMarketCatalogResourceId(id)) {
    const resourceId = id as ResourceId;
    if (getQty(state.resources, resourceId) < safeQuantity) {
      return { ok: false, next: state, reason: "NOT_ENOUGH_INVENTORY" };
    }
    const price = getMarketSellPrice(resourceId).amount * safeQuantity;
    return {
      ok: true,
      quantity: safeQuantity,
      ecuAmount: price,
      next: {
        ...state,
        resources: { ...state.resources, [resourceId]: getQty(state.resources, resourceId) - safeQuantity },
        wallet: grantCurrency(state.wallet, "ECU", price),
      },
    };
  }

  const item = findItem(state.inventory, id);
  if (!item) return { ok: false, next: state, reason: "ITEM_NOT_FOUND" };

  if (isEquipmentItem(item)) {
    const entry = getEquipmentMarketEntry(item);
    if (!entry) return { ok: false, next: state, reason: "UNSELLABLE_ITEM" };
    const price = getMarketSellPrice(entry).amount;
    return {
      ok: true,
      quantity: 1,
      ecuAmount: price,
      next: {
        ...state,
        inventory: removeItem(state.inventory, item.id),
        wallet: grantCurrency(state.wallet, "ECU", price),
      },
    };
  }

  if (item.kind === "quest") return { ok: false, next: state, reason: "QUEST_ITEM_NOT_SUPPORTED" };
  const entry = getConsumableMarketEntry(item);
  if (!entry) return { ok: false, next: state, reason: "UNSUPPORTED_ITEM" };
  if (getItemQuantity(item) < safeQuantity) return { ok: false, next: state, reason: "NOT_ENOUGH_INVENTORY" };

  const removed = removeInventoryStack(state.inventory.items, item.id, safeQuantity);
  if (!removed.ok) return { ok: false, next: state, reason: "NOT_ENOUGH_INVENTORY" };

  const price = getMarketSellPrice(entry).amount * safeQuantity;
  return {
    ok: true,
    quantity: safeQuantity,
    ecuAmount: price,
    next: {
      ...state,
      inventory: { items: removed.items },
      wallet: grantCurrency(state.wallet, "ECU", price),
    },
  };
}

export function getMarketBuyEntries(category: MarketCatalogEntry["category"] | "all" = "all"): MarketCatalogEntry[] {
  if (category === "all") return MARKET_CATALOG;
  return MARKET_CATALOG.filter((entry) => entry.category === category);
}
