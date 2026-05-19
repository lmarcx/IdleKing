import type { NonEquipmentItem } from "../items/types.js";

export const BANK_STACK_MAX = 999;

export type BankItemCategory = "resources" | "consumables" | "special";

export type BankStack = {
  id: string;
  name: string;
  category: BankItemCategory;
  quantity: number;
  kind?: NonEquipmentItem["kind"] | "resource";
  quality?: number;
  value?: number;
};

export type BankState = {
  stacks: BankStack[];
};

export function createDefaultBankState(): BankState {
  return { stacks: [] };
}

function normalizeQuantity(value: unknown): number {
  return Math.max(0, Math.floor(typeof value === "number" && Number.isFinite(value) ? value : 0));
}

export function normalizeBankState(value: Partial<BankState> | undefined): BankState {
  const rawStacks = Array.isArray(value?.stacks) ? value.stacks : [];
  const stacks: BankStack[] = [];

  for (const rawStack of rawStacks) {
    if (!rawStack || typeof rawStack !== "object") continue;
    const stack = rawStack as Partial<BankStack>;
    if (typeof stack.id !== "string" || typeof stack.name !== "string") continue;
    if (stack.category !== "resources" && stack.category !== "consumables" && stack.category !== "special") continue;

    let remaining = normalizeQuantity(stack.quantity);
    while (remaining > 0) {
      const quantity = Math.min(BANK_STACK_MAX, remaining);
      stacks.push({
        id: stack.id,
        name: stack.name,
        category: stack.category,
        quantity,
        kind: stack.kind,
        quality: typeof stack.quality === "number" && Number.isFinite(stack.quality) ? stack.quality : undefined,
        value: typeof stack.value === "number" && Number.isFinite(stack.value) ? stack.value : undefined,
      });
      remaining -= quantity;
    }
  }

  return { stacks };
}
