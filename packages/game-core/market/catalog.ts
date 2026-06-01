import type { EquipmentItem, Item, NonEquipmentItem } from "../items/types.js";
import { ALL_RESOURCES, type ResourceId } from "../resources/types.js";
import type {
  MarketCatalogEntry,
  MarketConsumableEntry,
  MarketEquipmentEntry,
  MarketPrice,
  MarketResourceEntry,
} from "./types.js";

const ECU = "ECU" as const;

function ecu(amount: number): MarketPrice {
  return {
    currencyId: ECU,
    amount: Math.max(0, Math.floor(amount)),
  };
}

function sellPriceFromBuy(amount: number): MarketPrice {
  return ecu(Math.max(1, Math.floor(amount * 0.5)));
}

// PLACEHOLDER Phase 9B resource values. Rebalance with final economy data.
export const MARKET_RESOURCE_PLACEHOLDER_VALUES: Record<ResourceId, number> = {
  XP_GLOBAL: 1,
  STONE: 2,
  WOOD: 2,
  WATER: 2,
  MEAT: 3,
  COPPER: 5,
  SILVER: 8,
  GOLD: 12,
  WHEAT: 3,
  TOMATO: 3,
  CARROT: 3,
  EGG: 4,
  IRON: 8,
  MILK: 5,
  BREAD: 6,
  POTATO: 4,
  SALAD: 6,
  PLATINUM: 18,
  APPLE: 5,
  APRICOT: 5,
  PEACH: 5,
  GRAPE: 5,
  MITHRIL: 25,
  CHERRY: 7,
  STRAWBERRY: 7,
  RAZZBERRY: 7,
  ORICHALUM: 35,
  RUNES: 30,
  INK: 12,
  PAPER: 8,
  SCROLLS: 20,
  GEMS: 22,
  PLATE_STEW: 8,
  PLATE_SALAD: 8,
};

const MARKET_RESOURCE_IDS: ResourceId[] = ["WOOD", "STONE", "WATER", "MEAT", "COPPER", "IRON"];

export const MARKET_RESOURCE_ENTRIES: MarketResourceEntry[] = MARKET_RESOURCE_IDS.map((resourceId) => {
  const value = MARKET_RESOURCE_PLACEHOLDER_VALUES[resourceId];
  return {
    id: `resource_${resourceId.toLowerCase()}`,
    category: "resources",
    label: resourceId
      .split("_")
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(" "),
    resourceId,
    buyPrice: ecu(value),
    sellPrice: sellPriceFromBuy(value),
  };
});

export const MARKET_CONSUMABLE_ENTRIES: MarketConsumableEntry[] = [
  {
    id: "consumable_healing_potion",
    category: "consumables",
    label: "Healing Potion",
    item: {
      id: "healing_potion",
      kind: "consumable",
      name: "Healing Potion",
      value: 10,
    },
    buyPrice: ecu(10),
    sellPrice: ecu(5),
  },
  {
    id: "consumable_travel_ration",
    category: "consumables",
    label: "Travel Ration",
    item: {
      id: "travel_ration",
      kind: "consumable",
      name: "Travel Ration",
      value: 6,
    },
    buyPrice: ecu(6),
    sellPrice: ecu(3),
  },
];

export const MARKET_EQUIPMENT_ENTRIES: MarketEquipmentEntry[] = [
  {
    id: "equipment_basic_sword",
    category: "equipment",
    label: "Basic Sword",
    equipment: {
      idPrefix: "market_basic_sword",
      name: "Basic Sword",
      slot: "main_hand",
      itemLevel: 1,
      rarity: "COMMON",
      value: 24,
    },
    buyPrice: ecu(24),
    sellPrice: ecu(12),
    sellable: true,
  },
  {
    id: "equipment_basic_helm",
    category: "equipment",
    label: "Basic Helm",
    equipment: {
      idPrefix: "market_basic_helm",
      name: "Basic Helm",
      slot: "helmet",
      itemLevel: 1,
      rarity: "COMMON",
      value: 18,
    },
    buyPrice: ecu(18),
    sellPrice: ecu(9),
    sellable: true,
  },
];

export const MARKET_CATALOG: MarketCatalogEntry[] = [
  ...MARKET_RESOURCE_ENTRIES,
  ...MARKET_CONSUMABLE_ENTRIES,
  ...MARKET_EQUIPMENT_ENTRIES,
];

export function getMarketEntry(entryId: string): MarketCatalogEntry | undefined {
  return MARKET_CATALOG.find((entry) => entry.id === entryId);
}

export function getMarketBuyPrice(entry: MarketCatalogEntry): MarketPrice {
  return entry.buyPrice;
}

export function getResourceMarketSellPrice(resourceId: ResourceId): MarketPrice {
  return sellPriceFromBuy(MARKET_RESOURCE_PLACEHOLDER_VALUES[resourceId] ?? 1);
}

export function getMarketSellPrice(target: MarketCatalogEntry | Item | ResourceId): MarketPrice {
  if (typeof target === "string") return getResourceMarketSellPrice(target);
  if ("category" in target) return target.sellPrice;
  if ("slot" in target) {
    const entry = MARKET_EQUIPMENT_ENTRIES.find((candidate) => target.id.startsWith(candidate.equipment.idPrefix));
    return entry?.sellPrice ?? ecu(Math.max(1, Math.floor((target.value ?? 1) * 0.5)));
  }
  return ecu(Math.max(1, Math.floor((target.value ?? 1) * 0.5)));
}

export function isMarketCatalogResourceId(value: string): value is ResourceId {
  return ALL_RESOURCES.includes(value as ResourceId);
}

export function getConsumableMarketEntry(item: NonEquipmentItem): MarketConsumableEntry | undefined {
  return MARKET_CONSUMABLE_ENTRIES.find((entry) => entry.item.id === item.id);
}

export function getEquipmentMarketEntry(item: EquipmentItem): MarketEquipmentEntry | undefined {
  return MARKET_EQUIPMENT_ENTRIES.find((entry) => entry.sellable && item.id.startsWith(entry.equipment.idPrefix));
}
