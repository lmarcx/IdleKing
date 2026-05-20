import type { CurrencyId } from "../currencies/index.js";
import type { EquipmentSlot, ItemRarity, NonEquipmentItem } from "../items/types.js";
import type { ResourceId } from "../resources/types.js";

export type MarketCategory = "resources" | "consumables" | "equipment";

export type MarketPrice = {
  currencyId: CurrencyId;
  amount: number;
};

export type MarketResourceEntry = {
  id: string;
  category: "resources";
  label: string;
  resourceId: ResourceId;
  buyPrice: MarketPrice;
  sellPrice: MarketPrice;
};

export type MarketConsumableEntry = {
  id: string;
  category: "consumables";
  label: string;
  item: Omit<NonEquipmentItem, "quantity">;
  buyPrice: MarketPrice;
  sellPrice: MarketPrice;
};

export type MarketEquipmentEntry = {
  id: string;
  category: "equipment";
  label: string;
  equipment: {
    idPrefix: string;
    name: string;
    slot: EquipmentSlot;
    itemLevel: number;
    rarity: ItemRarity;
    value: number;
  };
  buyPrice: MarketPrice;
  sellPrice: MarketPrice;
  sellable: boolean;
};

export type MarketCatalogEntry = MarketResourceEntry | MarketConsumableEntry | MarketEquipmentEntry;

export type MarketActionReason =
  | "ENTRY_NOT_FOUND"
  | "INVALID_QUANTITY"
  | "INSUFFICIENT_ECU"
  | "ITEM_NOT_FOUND"
  | "NOT_ENOUGH_INVENTORY"
  | "CURRENCY_NOT_SUPPORTED"
  | "QUEST_ITEM_NOT_SUPPORTED"
  | "UNSELLABLE_ITEM"
  | "UNSUPPORTED_ITEM";
