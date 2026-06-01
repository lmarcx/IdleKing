import test from "node:test";
import assert from "node:assert/strict";

import { generateEquipmentItem } from "../equipment/index.js";
import { generateItem } from "../loot/itemGenerator.js";
import {
  BOSS_EQUIPMENT_RARITY_WEIGHTS,
  ENEMY_LOOT_TABLES,
  recycleEquipment,
  rollBossEquipmentRarity,
  rollDungeonChestRewards,
  rollEnemyMaterialDrops,
  validateEnemyLootTables,
} from "../loot/index.js";
import { ITEM_RARITIES } from "../items/types.js";
import { createSeededRng } from "../random/index.js";

test("boss equipment rarity roll produces MVP rarities only", () => {
  const rng = createSeededRng(101);

  for (let index = 0; index < 10_000; index += 1) {
    assert.ok(ITEM_RARITIES.includes(rollBossEquipmentRarity(rng)));
  }
});

test("boss equipment rarity roll follows the locked 50/25/15/8/2 table", () => {
  assert.deepEqual(BOSS_EQUIPMENT_RARITY_WEIGHTS, [
    { value: "COMMON", weight: 50 },
    { value: "UNCOMMON", weight: 25 },
    { value: "RARE", weight: 15 },
    { value: "EPIC", weight: 8 },
    { value: "LEGENDARY", weight: 2 },
  ]);

  const rng = createSeededRng(2026);
  const counts = Object.fromEntries(ITEM_RARITIES.map((rarity) => [rarity, 0]));
  const sampleSize = 100_000;

  for (let index = 0; index < sampleSize; index += 1) {
    counts[rollBossEquipmentRarity(rng)] += 1;
  }

  for (const entry of BOSS_EQUIPMENT_RARITY_WEIGHTS) {
    const actualPct = (counts[entry.value] / sampleSize) * 100;
    assert.ok(Math.abs(actualPct - entry.weight) < 0.7);
  }
});

test("enemy material loot tables validate and expose future resource registry refs", () => {
  validateEnemyLootTables();

  assert.ok(ENEMY_LOOT_TABLES.length > 0);
  assert.ok(
    ENEMY_LOOT_TABLES.every((lootTable) =>
      lootTable.drops.every((drop) => drop.resourceId.length > 0),
    ),
  );
});

test("enemy material drops are deterministic for the same seed", () => {
  const a = rollEnemyMaterialDrops(
    "enemy_wasteland_placeholder",
    createSeededRng(77),
  );
  const b = rollEnemyMaterialDrops(
    "enemy_wasteland_placeholder",
    createSeededRng(77),
  );

  assert.deepEqual(a, b);
});

test("dungeon chest drops differ for different seeds", () => {
  const a = rollDungeonChestRewards({
    enemyLootTableIds: ["enemy_wasteland_placeholder"],
    includeBossEquipment: true,
    itemLevel: 100,
    rng: createSeededRng(1),
  });
  const b = rollDungeonChestRewards({
    enemyLootTableIds: ["enemy_wasteland_placeholder"],
    includeBossEquipment: true,
    itemLevel: 100,
    rng: createSeededRng(2),
  });

  assert.notDeepEqual(a, b);
});

test("legacy equipment generator no longer applies smart-loot slot bias", () => {
  const base = {
    biome: "VOLCANIC" as const,
    ilvl: 100,
    seed: 11,
    worldLevel: 5,
  };

  assert.deepEqual(
    generateItem({ ...base, biasSlot: "NECKLACE" }),
    generateItem({ ...base, biasSlot: "STONE" }),
  );
});

test("equipment recycle grants ECU, destroys the item and never returns recipe materials", () => {
  const item = generateEquipmentItem({
    id: "recycle-ecu",
    itemLevel: 100,
    rarity: "RARE",
    slot: "chest",
  });
  item.value = 120;

  const result = recycleEquipment(item, createSeededRng(0));

  assert.equal(result.ecuGained, 60);
  assert.equal(result.itemDestroyed, true);
  assert.deepEqual(result.recipeMaterials, []);
});

test("equipment recycle can grant a same-rarity Precious Stone with seeded RNG", () => {
  const item = generateEquipmentItem({
    id: "recycle-stone",
    itemLevel: 100,
    rarity: "LEGENDARY",
    slot: "helmet",
  });
  const stoneSeed = Array.from({ length: 100 }, (_, seed) => seed).find(
    (seed) => createSeededRng(seed).nextFloat() < 0.2,
  );
  assert.notEqual(stoneSeed, undefined);

  const result = recycleEquipment(item, createSeededRng(stoneSeed!));

  assert.equal(result.preciousStone?.id, "precious_stone_legendary");
  assert.equal(result.preciousStone?.kind, "material");
});

test("enemy material drop rejects unknown table ids loudly", () => {
  assert.throws(
    () => rollEnemyMaterialDrops("missing_table", createSeededRng(1)),
    /Unknown enemy loot table id: missing_table/,
  );
});
