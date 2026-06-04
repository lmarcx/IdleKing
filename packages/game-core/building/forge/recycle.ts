import { grantCurrencyReward } from "../../rewards/index.js";
import { removeItem, type Inventory } from "../../items/inventory.js";
import { isEquipmentItem, type EquipmentItem, type Item, type NonEquipmentItem } from "../../items/types.js";
import { recycleEquipment } from "../../loot/mvp.js";
import type { SeededRng } from "../../random/index.js";
import type { WalletState } from "../../currencies/index.js";

export type ForgeRecycleEquipmentInput = Readonly<{
  item: EquipmentItem | null | undefined;
  inventory?: Inventory;
  wallet: WalletState;
  rng: Pick<SeededRng, "nextFloat">;
}>;

export type ForgeRecycleEquipmentResult =
  | Readonly<{
      ok: true;
      ecuGained: number;
      itemDestroyed: true;
      preciousStone?: NonEquipmentItem;
      recipeMaterials: readonly [];
      updatedWallet: WalletState;
      updatedInventory?: Inventory;
    }>
  | Readonly<{
      ok: false;
      reason: "ITEM_NOT_FOUND";
    }>;

function addStackableInventoryItem(items: Item[], item: NonEquipmentItem): Item[] {
  const existingIndex = items.findIndex((entry) => entry.id === item.id && !isEquipmentItem(entry));
  if (existingIndex < 0) return [...items, item];

  const next = items.slice();
  const existing = next[existingIndex] as NonEquipmentItem;
  next[existingIndex] = {
    ...existing,
    quantity: Math.max(0, Math.floor(existing.quantity ?? 1)) + Math.max(1, Math.floor(item.quantity ?? 1)),
  };
  return next;
}

export function forgeRecycleEquipment(input: ForgeRecycleEquipmentInput): ForgeRecycleEquipmentResult {
  if (!input.item) return { ok: false, reason: "ITEM_NOT_FOUND" };

  const recycleResult = recycleEquipment(input.item, input.rng);
  const inventoryWithoutItem = input.inventory ? removeItem(input.inventory, input.item.id) : undefined;
  const updatedInventory = inventoryWithoutItem
    ? {
        items: recycleResult.preciousStone
          ? addStackableInventoryItem(inventoryWithoutItem.items, recycleResult.preciousStone)
          : inventoryWithoutItem.items,
      }
    : undefined;

  return {
    ok: true,
    ecuGained: recycleResult.ecuGained,
    itemDestroyed: recycleResult.itemDestroyed,
    preciousStone: recycleResult.preciousStone,
    recipeMaterials: recycleResult.recipeMaterials,
    updatedWallet: grantCurrencyReward(input.wallet, { currencyId: "ECU", amount: recycleResult.ecuGained }),
    updatedInventory,
  };
}
