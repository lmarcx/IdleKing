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
  | "PLATE_SALAD"
  // Canonical Phase 5 resources. Uppercase ids above remain accepted by the
  // brownfield runtime until Mine/Farm and recipes migrate in later phases.
  | CanonicalResourceId;

export type CanonicalResourceId =
  | "iron_ore"
  | "cold_iron"
  | "silver_ore"
  | "quartz"
  | "sapphire"
  | "pale_diamond"
  | "old_wood"
  | "ashwood"
  | "frostpine"
  | "frostroot"
  | "tomato"
  | "carrot"
  | "tough_meat"
  | "frozen_fish"
  | "shadow_residue"
  | "spectral_dust"
  | "bone_fragment"
  | "dragon_scale_fragment"
  | "frozen_echo"
  | "pearlescent_scale"
  | "cold_shell_fragment"
  | "archival_fragment"
  | "experimental_tissue"
  | "dark_amalgam_core"
  | "dragon_ash_core"
  | "frost_amalgam_core"
  | "archmage_sigil"
  | "frozen_queen_tear";

export const ALL_RESOURCES: ResourceId[] = [
  "XP_GLOBAL",
  "STONE",
  "WOOD",
  "WATER",
  "MEAT",
  "COPPER",
  "SILVER",
  "GOLD",
  "WHEAT",
  "TOMATO",
  "CARROT",
  "EGG",
  "IRON",
  "MILK",
  "BREAD",
  "POTATO",
  "SALAD",
  "PLATINUM",
  "APPLE",
  "APRICOT",
  "PEACH",
  "GRAPE",
  "MITHRIL",
  "CHERRY",
  "STRAWBERRY",
  "RAZZBERRY",
  "ORICHALUM",
  "RUNES",
  "INK",
  "PAPER",
  "SCROLLS",
  "GEMS",
  "PLATE_STEW",
  "PLATE_SALAD",
  "iron_ore",
  "cold_iron",
  "silver_ore",
  "quartz",
  "sapphire",
  "pale_diamond",
  "old_wood",
  "ashwood",
  "frostpine",
  "frostroot",
  "tomato",
  "carrot",
  "tough_meat",
  "frozen_fish",
  "shadow_residue",
  "spectral_dust",
  "bone_fragment",
  "dragon_scale_fragment",
  "frozen_echo",
  "pearlescent_scale",
  "cold_shell_fragment",
  "archival_fragment",
  "experimental_tissue",
  "dark_amalgam_core",
  "dragon_ash_core",
  "frost_amalgam_core",
  "archmage_sigil",
  "frozen_queen_tear",
];

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
