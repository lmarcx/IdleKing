import type { GameState } from "../game/state.js";
import { findItem } from "../items/inventory.js";
import { isEquipmentItem, type Item, type NonEquipmentItem } from "../items/types.js";
import { ALL_RESOURCES, addQty, getQty, type ResourceId, type ResourceStock } from "../resources/types.js";
import { CURRENCIES } from "../currencies/types.js";
import { BANK_STACK_MAX, type BankItemCategory, type BankStack } from "./types.js";

export type BankTransferReason =
  | "ITEM_NOT_FOUND"
  | "NOT_BANKABLE"
  | "EQUIPMENT_NOT_SUPPORTED"
  | "CURRENCY_NOT_SUPPORTED"
  | "QUEST_ITEM_NOT_SUPPORTED"
  | "INVALID_QUANTITY"
  | "NOT_ENOUGH_INVENTORY"
  | "NOT_ENOUGH_BANK";

export type BankTransferResult = {
  next: GameState;
  ok: boolean;
  quantity?: number;
  reason?: BankTransferReason;
};

export type BankBulkCategory = BankItemCategory | "all";

type BankableSource =
  | {
      category: "resources";
      id: ResourceId;
      name: string;
      quantity: number;
      stack: BankStack;
      source: "resource";
    }
  | {
      category: BankItemCategory;
      id: string;
      item: NonEquipmentItem;
      quantity: number;
      stack: BankStack;
      source: "inventory";
    };

const RESOURCE_SET = new Set<string>(ALL_RESOURCES);
const CURRENCY_SET = new Set<string>(CURRENCIES.map((currency) => currency.id));

function normalizeQuantity(quantity: number): number {
  return Math.max(0, Math.floor(Number.isFinite(quantity) ? quantity : 0));
}

function formatResourceName(id: ResourceId): string {
  return id
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function isResourceId(id: string): id is ResourceId {
  return RESOURCE_SET.has(id);
}

function isBankBulkCategoryMatch(category: BankBulkCategory | undefined, sourceCategory: BankItemCategory): boolean {
  return !category || category === "all" || category === sourceCategory;
}

function getItemQuantity(item: NonEquipmentItem): number {
  return Math.max(1, Math.floor(item.quantity ?? 1));
}

function getBankableItemCategory(item: NonEquipmentItem): BankItemCategory | null {
  if (item.kind === "resource") return "resources";
  if (item.kind === "consumable") return "consumables";
  if (item.kind === "material" || item.kind === "misc" || item.kind === "special") return "special";
  return null;
}

function createBankStackFromResource(id: ResourceId, quantity: number): BankStack {
  return {
    id,
    name: formatResourceName(id),
    category: "resources",
    quantity,
    kind: "resource",
  };
}

function createBankStackFromItem(item: NonEquipmentItem, category: BankItemCategory, quantity: number): BankStack {
  return {
    id: item.id,
    name: item.name,
    category,
    quantity,
    kind: item.kind,
    quality: item.quality,
    value: item.value,
  };
}

function addBankStack(stacks: BankStack[], stack: BankStack): BankStack[] {
  let remaining = normalizeQuantity(stack.quantity);
  if (remaining <= 0) return stacks;

  const next = stacks.map((entry) => ({ ...entry }));
  for (const entry of next) {
    if (
      entry.id !== stack.id ||
      entry.category !== stack.category ||
      entry.kind !== stack.kind ||
      entry.quality !== stack.quality ||
      entry.value !== stack.value
    ) {
      continue;
    }

    const room = BANK_STACK_MAX - entry.quantity;
    if (room <= 0) continue;
    const moved = Math.min(room, remaining);
    entry.quantity += moved;
    remaining -= moved;
    if (remaining <= 0) return next;
  }

  while (remaining > 0) {
    const quantity = Math.min(BANK_STACK_MAX, remaining);
    next.push({ ...stack, quantity });
    remaining -= quantity;
  }

  return next;
}

function removeBankQuantity(stacks: BankStack[], id: string, quantity: number): { ok: boolean; stacks: BankStack[]; removed?: BankStack } {
  const safeQuantity = normalizeQuantity(quantity);
  const total = stacks.filter((stack) => stack.id === id).reduce((sum, stack) => sum + stack.quantity, 0);
  if (safeQuantity <= 0 || total < safeQuantity) return { ok: false, stacks };

  let remaining = safeQuantity;
  let removed: BankStack | undefined;
  const next: BankStack[] = [];

  for (const stack of stacks) {
    if (stack.id !== id || remaining <= 0) {
      next.push(stack);
      continue;
    }

    removed ??= { ...stack, quantity: 0 };
    const take = Math.min(stack.quantity, remaining);
    removed.quantity += take;
    remaining -= take;

    const left = stack.quantity - take;
    if (left > 0) next.push({ ...stack, quantity: left });
  }

  return { ok: true, stacks: next, removed };
}

function removeInventoryQuantity(items: Item[], itemId: string, quantity: number): { ok: boolean; items: Item[] } {
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

function addInventoryItemStack(items: Item[], item: NonEquipmentItem, quantity: number): Item[] {
  let remaining = normalizeQuantity(quantity);
  const next = items.map((entry) => ({ ...entry })) as Item[];

  for (const entry of next) {
    if (isEquipmentItem(entry) || entry.id !== item.id || entry.kind !== item.kind) continue;
    const current = getItemQuantity(entry);
    const room = BANK_STACK_MAX - current;
    if (room <= 0) continue;
    const moved = Math.min(room, remaining);
    entry.quantity = current + moved;
    remaining -= moved;
    if (remaining <= 0) return next;
  }

  while (remaining > 0) {
    const moved = Math.min(BANK_STACK_MAX, remaining);
    next.push({ ...item, quantity: moved });
    remaining -= moved;
  }

  return next;
}

function getBankableSource(state: GameState, id: string): { source?: BankableSource; reason?: BankTransferReason } {
  if (CURRENCY_SET.has(id)) return { reason: "CURRENCY_NOT_SUPPORTED" };

  if (isResourceId(id)) {
    const quantity = getQty(state.resources, id);
    return {
      source: {
        category: "resources",
        id,
        name: formatResourceName(id),
        quantity,
        stack: createBankStackFromResource(id, quantity),
        source: "resource",
      },
    };
  }

  const item = findItem(state.inventory, id);
  if (!item) return { reason: "ITEM_NOT_FOUND" };
  if (isEquipmentItem(item)) return { reason: "EQUIPMENT_NOT_SUPPORTED" };
  if (item.kind === "quest") return { reason: "QUEST_ITEM_NOT_SUPPORTED" };

  const category = getBankableItemCategory(item);
  if (!category) return { reason: "NOT_BANKABLE" };
  const quantity = getItemQuantity(item);

  return {
    source: {
      category,
      id: item.id,
      item,
      quantity,
      stack: createBankStackFromItem(item, category, quantity),
      source: "inventory",
    },
  };
}

export function depositItemToBank(state: GameState, id: string, quantity: number): BankTransferResult {
  const safeQuantity = normalizeQuantity(quantity);
  if (safeQuantity <= 0) return { next: state, ok: false, reason: "INVALID_QUANTITY" };

  const { source, reason } = getBankableSource(state, id);
  if (!source) return { next: state, ok: false, reason };
  if (source.quantity < safeQuantity) return { next: state, ok: false, reason: "NOT_ENOUGH_INVENTORY" };

  if (source.source === "resource") {
    return {
      ok: true,
      quantity: safeQuantity,
      next: {
        ...state,
        resources: { ...state.resources, [source.id]: getQty(state.resources, source.id) - safeQuantity },
        bank: { stacks: addBankStack(state.bank.stacks, { ...source.stack, quantity: safeQuantity }) },
      },
    };
  }

  const inventory = removeInventoryQuantity(state.inventory.items, source.id, safeQuantity);
  if (!inventory.ok) return { next: state, ok: false, reason: "NOT_ENOUGH_INVENTORY" };

  return {
    ok: true,
    quantity: safeQuantity,
    next: {
      ...state,
      inventory: { items: inventory.items },
      bank: { stacks: addBankStack(state.bank.stacks, { ...source.stack, quantity: safeQuantity }) },
    },
  };
}

export function depositStackToBank(state: GameState, id: string): BankTransferResult {
  const { source, reason } = getBankableSource(state, id);
  if (!source) return { next: state, ok: false, reason };
  return depositItemToBank(state, id, source.quantity);
}

export function withdrawItemFromBank(state: GameState, id: string, quantity: number): BankTransferResult {
  const safeQuantity = normalizeQuantity(quantity);
  if (safeQuantity <= 0) return { next: state, ok: false, reason: "INVALID_QUANTITY" };
  if (CURRENCY_SET.has(id)) return { next: state, ok: false, reason: "CURRENCY_NOT_SUPPORTED" };

  const removed = removeBankQuantity(state.bank.stacks, id, safeQuantity);
  if (!removed.ok || !removed.removed) return { next: state, ok: false, reason: "NOT_ENOUGH_BANK" };

  if (removed.removed.category === "resources" && isResourceId(removed.removed.id)) {
    return {
      ok: true,
      quantity: safeQuantity,
      next: {
        ...state,
        resources: addQty(state.resources, removed.removed.id, safeQuantity),
        bank: { stacks: removed.stacks },
      },
    };
  }

  const item: NonEquipmentItem = {
    id: removed.removed.id,
    kind: removed.removed.kind === "resource" ? "resource" : (removed.removed.kind ?? "special"),
    name: removed.removed.name,
    quantity: safeQuantity,
    quality: removed.removed.quality,
    value: removed.removed.value,
  };

  return {
    ok: true,
    quantity: safeQuantity,
    next: {
      ...state,
      inventory: { items: addInventoryItemStack(state.inventory.items, item, safeQuantity) },
      bank: { stacks: removed.stacks },
    },
  };
}

export function withdrawStackFromBank(state: GameState, id: string): BankTransferResult {
  const quantity = state.bank.stacks.filter((stack) => stack.id === id).reduce((sum, stack) => sum + stack.quantity, 0);
  return withdrawItemFromBank(state, id, quantity);
}

export function depositAllToBank(state: GameState, category: BankBulkCategory = "all"): BankTransferResult {
  let next = state;
  let moved = 0;

  for (const id of ALL_RESOURCES) {
    const source = getBankableSource(next, id).source;
    if (!source || !isBankBulkCategoryMatch(category, source.category) || source.quantity <= 0) continue;
    const result = depositStackToBank(next, id);
    if (result.ok) {
      next = result.next;
      moved += result.quantity ?? 0;
    }
  }

  for (const item of [...next.inventory.items]) {
    if (isEquipmentItem(item)) continue;
    const source = getBankableSource(next, item.id).source;
    if (!source || !isBankBulkCategoryMatch(category, source.category) || source.quantity <= 0) continue;
    const result = depositStackToBank(next, item.id);
    if (result.ok) {
      next = result.next;
      moved += result.quantity ?? 0;
    }
  }

  return { ok: true, next, quantity: moved };
}

export function withdrawAllFromBank(state: GameState, category: BankBulkCategory = "all"): BankTransferResult {
  let next = state;
  let moved = 0;

  const ids = [...new Set(next.bank.stacks.filter((stack) => isBankBulkCategoryMatch(category, stack.category)).map((stack) => stack.id))];
  for (const id of ids) {
    const result = withdrawStackFromBank(next, id);
    if (result.ok) {
      next = result.next;
      moved += result.quantity ?? 0;
    }
  }

  return { ok: true, next, quantity: moved };
}
