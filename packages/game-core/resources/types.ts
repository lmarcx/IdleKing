export type ResourceId =
  | "XP_GLOBAL"
  // Farm base (Age I)
  | "STONE"
  | "WOOD"
  | "WATER"
  | "MEAT"
  // Mine base (Age I)
  | "COPPER"
  | "SILVER"
  | "GOLD"
  // Farm Age II
  | "WHEAT"
  | "TOMATO"
  | "CARROT"
  | "EGG"
  // Mine Age II
  | "IRON"
  // Farm Age III
  | "MILK"
  | "BREAD"
  | "POTATO"
  | "SALAD"
  // Mine Age III
  | "PLATINUM"
  // Farm Age IV
  | "APPLE"
  | "APRICOT"
  | "PEACH"
  | "GRAPE"
  // Mine Age IV
  | "MITHRIL"
  // Farm Age V
  | "CHERRY"
  | "STRAWBERRY"
  | "RAZZBERRY"
  // Mine Age V
  | "ORICHALUM"
  // Future (endgame)
  | "RUNES"
  | "INK"
  | "PAPER"
  | "SCROLLS"
  | "GEMS"
  // Kitchen outputs (MVP)
  | "PLATE_STEW"
  | "PLATE_SALAD";
  

export type ResourceStock = Partial<Record<ResourceId, number>>;

export function getQty(stock: ResourceStock, id: ResourceId): number {
  return Math.max(0, Math.floor(stock[id] ?? 0));
}

export function addQty(stock: ResourceStock, id: ResourceId, amount: number): ResourceStock {
  const a = Math.max(0, Math.floor(amount));
  if (a === 0) return stock;
  return { ...stock, [id]: getQty(stock, id) + a };
}

export function hasAtLeast(stock: ResourceStock, cost: ResourceStock): boolean {
  for (const [k, v] of Object.entries(cost)) {
    const id = k as ResourceId;
    if (getQty(stock, id) < Math.max(0, Math.floor(v ?? 0))) return false;
  }
  return true;
}

export function spend(stock: ResourceStock, cost: ResourceStock): ResourceStock {
  if (!hasAtLeast(stock, cost)) return stock;
  const next: ResourceStock = { ...stock };
  for (const [k, v] of Object.entries(cost)) {
    const id = k as ResourceId;
    next[id] = getQty(next, id) - Math.max(0, Math.floor(v ?? 0));
  }
  return next;
}