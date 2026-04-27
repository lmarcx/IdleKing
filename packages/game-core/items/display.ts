import type { GameState } from "../game/state.js";
import { ALL_RESOURCES, getQty, type ResourceId } from "../resources/types.js";

export type InventoryCategory = "equipment" | "resources" | "consumables" | "unique" | "materials";

export type InventorySort =
  | "quantity-asc"
  | "quantity-desc"
  | "value-asc"
  | "value-desc"
  | "name-asc"
  | "name-desc";

export type InventorySortOption = InventorySort;

export type InventoryDisplayItem = {
  category: InventoryCategory;
  icon?: string;
  id: string;
  name: string;
  quantity: number;
  value: number;
};

export type InventoryFilterSortOptions = {
  category?: InventoryCategory | "all";
  search?: string;
  sort?: InventorySort;
};

const MATERIAL_RESOURCES = new Set<ResourceId>([
  "STONE",
  "WOOD",
  "COPPER",
  "SILVER",
  "GOLD",
  "IRON",
  "PLATINUM",
  "MITHRIL",
  "ORICHALUM",
  "RUNES",
  "INK",
  "PAPER",
  "SCROLLS",
  "GEMS",
]);

const CONSUMABLE_RESOURCES = new Set<ResourceId>(["PLATE_STEW", "PLATE_SALAD"]);

function formatResourceName(id: ResourceId): string {
  return id
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getResourceCategory(id: ResourceId): InventoryCategory {
  if (CONSUMABLE_RESOURCES.has(id)) return "consumables";
  if (MATERIAL_RESOURCES.has(id)) return "materials";
  return "resources";
}

function getResourceValue(id: ResourceId): number {
  const index = ALL_RESOURCES.indexOf(id);
  return index >= 0 ? index + 1 : 0;
}

export function getInventoryDisplayItems(state: GameState): InventoryDisplayItem[] {
  const equipmentItems = state.inventory.items.map((item) => ({
    category: "equipment" as const,
    id: item.id,
    name: item.name,
    quantity: 1,
    value: item.ilvl,
  }));

  const resourceItems = ALL_RESOURCES.map((id) => ({
    category: getResourceCategory(id),
    id,
    name: formatResourceName(id),
    quantity: getQty(state.resources, id),
    value: getResourceValue(id),
  }));

  return [...equipmentItems, ...resourceItems];
}

export function filterAndSortInventoryItems(
  items: InventoryDisplayItem[],
  options: InventoryFilterSortOptions = {}
): InventoryDisplayItem[] {
  const search = options.search?.trim().toLowerCase() ?? "";
  const category = options.category ?? "all";
  const sort = options.sort ?? "name-asc";

  const filtered = items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!search) return true;
    return item.name.toLowerCase().includes(search) || item.id.toLowerCase().includes(search);
  });

  return [...filtered].sort((a, b) => {
    switch (sort) {
      case "quantity-asc":
        return a.quantity - b.quantity || a.name.localeCompare(b.name);
      case "quantity-desc":
        return b.quantity - a.quantity || a.name.localeCompare(b.name);
      case "value-asc":
        return a.value - b.value || a.name.localeCompare(b.name);
      case "value-desc":
        return b.value - a.value || a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "name-asc":
      default:
        return a.name.localeCompare(b.name);
    }
  });
}
