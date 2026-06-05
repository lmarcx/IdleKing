import {
  createPreciousStoneItem,
  FORGE_PRECIOUS_STONE_DROP_CHANCE,
  getForgeRecycleEcuRefund,
} from "../building/forge/rules.js";
import { generateEquipmentItem } from "../equipment/generation.js";
import type {
  EquipmentItem,
  ItemRarity,
  NonEquipmentItem,
} from "../items/types.js";
import type { SeededRng } from "../random/index.js";
import type { ResourceReward } from "../rewards/index.js";
import { getResourceDefinition } from "../resources/index.js";
import {
  BOSS_EQUIPMENT_LOOT_SLOTS,
  BOSS_EQUIPMENT_RARITY_WEIGHTS,
  ENEMY_LOOT_TABLES,
  type EnemyLootTableDefinition,
} from "./mvpConfig.js";

export type MaterialDrop = ResourceReward;

export type RollEquipmentLootParams = {
  itemLevel: number;
  rng: SeededRng;
};

export type DungeonChestRewardsParams = {
  enemyLootTableIds?: readonly string[];
  includeBossEquipment?: boolean;
  itemLevel: number;
  rng: SeededRng;
};

export type DungeonChestRewards = {
  equipment: EquipmentItem[];
  materials: MaterialDrop[];
};

export type RecycleEquipmentResult = {
  ecuGained: number;
  itemDestroyed: true;
  preciousStone?: NonEquipmentItem;
  recipeMaterials: readonly [];
};

const ENEMY_LOOT_TABLE_BY_ID = new Map(
  ENEMY_LOOT_TABLES.map((lootTable) => [lootTable.id, lootTable]),
);

export function validateEnemyLootTables(
  lootTables: readonly EnemyLootTableDefinition[] = ENEMY_LOOT_TABLES,
): void {
  const ids = new Set<string>();

  for (const lootTable of lootTables) {
    if (ids.has(lootTable.id)) {
      throw new Error(`Duplicate enemy loot table id: ${lootTable.id}`);
    }
    ids.add(lootTable.id);

    for (const drop of lootTable.drops) {
      if (!drop.resourceId) {
        throw new Error(`Enemy loot table ${lootTable.id} contains an empty resourceId`);
      }
      if (!getResourceDefinition(drop.resourceId)) {
        throw new Error(`Enemy loot table ${lootTable.id} references unknown MVP resource id: ${drop.resourceId}`);
      }
      if (!Number.isFinite(drop.chance) || drop.chance < 0 || drop.chance > 1) {
        throw new Error(
          `Enemy loot table ${lootTable.id} has invalid chance for ${drop.resourceId}`,
        );
      }
      if (
        !Number.isInteger(drop.minAmount) ||
        !Number.isInteger(drop.maxAmount) ||
        drop.minAmount < 0 ||
        drop.minAmount > drop.maxAmount
      ) {
        throw new Error(
          `Enemy loot table ${lootTable.id} has invalid amount range for ${drop.resourceId}`,
        );
      }
    }
  }
}

validateEnemyLootTables();

export function rollBossEquipmentRarity(rng: SeededRng): ItemRarity {
  return rng.pickWeighted(BOSS_EQUIPMENT_RARITY_WEIGHTS);
}

export function rollEquipmentLoot({
  itemLevel,
  rng,
}: RollEquipmentLootParams): EquipmentItem {
  const rarity = rollBossEquipmentRarity(rng);
  const slot =
    BOSS_EQUIPMENT_LOOT_SLOTS[rng.nextInt(0, BOSS_EQUIPMENT_LOOT_SLOTS.length - 1)];
  const instanceSeed = rng.nextInt(0, 0x7fffffff);

  return generateEquipmentItem({
    itemLevel,
    rarity,
    seed: `boss-loot-${instanceSeed}`,
    slot,
  });
}

export function rollEnemyMaterialDrops(
  lootTableId: string,
  rng: SeededRng,
): MaterialDrop[] {
  const lootTable = ENEMY_LOOT_TABLE_BY_ID.get(lootTableId);
  if (!lootTable) {
    throw new Error(`Unknown enemy loot table id: ${lootTableId}`);
  }

  return lootTable.drops.flatMap((drop) => {
    if (rng.nextFloat() >= drop.chance) {
      return [];
    }
    return [{
      resourceId: drop.resourceId,
      amount: rng.nextInt(drop.minAmount, drop.maxAmount),
    }];
  });
}

export function rollDungeonChestRewards({
  enemyLootTableIds = [],
  includeBossEquipment = false,
  itemLevel,
  rng,
}: DungeonChestRewardsParams): DungeonChestRewards {
  return {
    equipment: includeBossEquipment ? [rollEquipmentLoot({ itemLevel, rng })] : [],
    materials: enemyLootTableIds.flatMap((lootTableId) =>
      rollEnemyMaterialDrops(lootTableId, rng),
    ),
  };
}

export function recycleEquipment(
  item: EquipmentItem,
  rng: Pick<SeededRng, "nextFloat">,
): RecycleEquipmentResult {
  const preciousStone =
    rng.nextFloat() < FORGE_PRECIOUS_STONE_DROP_CHANCE
      ? createPreciousStoneItem(item.rarity)
      : undefined;

  return {
    ecuGained: getForgeRecycleEcuRefund(item),
    itemDestroyed: true,
    preciousStone,
    recipeMaterials: [],
  };
}
