import type { EquipmentSlot, ItemRarity } from "../items/types.js";
import type { WeightedEntry } from "../random/index.js";

export type EnemyMaterialDropDefinition = {
  chance: number;
  maxAmount: number;
  minAmount: number;
  resourceId: string;
};

export type EnemyLootTableDefinition = {
  drops: readonly EnemyMaterialDropDefinition[];
  id: string;
};

export const BOSS_EQUIPMENT_RARITY_WEIGHTS: readonly WeightedEntry<ItemRarity>[] = [
  { value: "COMMON", weight: 50 },
  { value: "UNCOMMON", weight: 25 },
  { value: "RARE", weight: 15 },
  { value: "EPIC", weight: 8 },
  { value: "LEGENDARY", weight: 2 },
];

// Artifact stays inert and does not drop in the MVP equipment loot path.
export const BOSS_EQUIPMENT_LOOT_SLOTS: readonly EquipmentSlot[] = [
  "main_hand",
  "off_hand",
  "helmet",
  "chest",
  "cape",
  "gloves",
  "belt",
  "boots",
  "necklace",
  "ring",
];

// DEFERRED balancing: temporary Phase 3 tables until RESOURCES_DATABASE lands in Phase 5.
export const ENEMY_LOOT_TABLES: readonly EnemyLootTableDefinition[] = [
  {
    id: "enemy_wasteland_placeholder",
    drops: [
      { resourceId: "iron_ore", chance: 0.7, minAmount: 1, maxAmount: 2 },
      { resourceId: "shadow_residue", chance: 0.25, minAmount: 1, maxAmount: 1 },
    ],
  },
  {
    id: "enemy_ash_placeholder",
    drops: [
      { resourceId: "ashwood", chance: 0.65, minAmount: 1, maxAmount: 2 },
      { resourceId: "dragon_scale_fragment", chance: 0.18, minAmount: 1, maxAmount: 1 },
    ],
  },
  {
    id: "boss_dark_amalgam_placeholder",
    drops: [
      { resourceId: "dark_amalgam_core", chance: 1, minAmount: 1, maxAmount: 1 },
    ],
  },
];
