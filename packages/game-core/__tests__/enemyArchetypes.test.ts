import test from "node:test";
import assert from "node:assert/strict";

import {
  DUNGEON_ENCOUNTERS,
  ENEMY_ARCHETYPES,
  getBossArchetype,
  getDungeonEncounterArchetypes,
  grantEnemyKillLoot,
  rollEnemyKillLoot,
  validateDungeonEncounters,
} from "../enemies/index.js";
import { ENEMY_LOOT_TABLES } from "../loot/mvpConfig.js";
import { STORY_BOSS_REGISTRY, STORY_DUNGEON_REGISTRY } from "../story/progressionMvp.js";
import { createInitialGameState } from "../game/state.js";
import { createSeededRng } from "../random/index.js";
import { getResourceDefinition } from "../resources/index.js";

test("every story dungeon has a roster and boss dungeons end on their story boss", () => {
  assert.doesNotThrow(() => validateDungeonEncounters(STORY_DUNGEON_REGISTRY));
  for (const dungeon of STORY_DUNGEON_REGISTRY) {
    const archetypes = getDungeonEncounterArchetypes(dungeon.id);
    assert.ok(archetypes.length > 0, `${dungeon.id} spawns enemies`);
    const last = archetypes.at(-1)!;
    if (dungeon.bossId) assert.equal(last.bossId, dungeon.bossId);
    else assert.notEqual(last.tier, "boss");
  }
});

test("every MVP boss has a boss archetype", () => {
  for (const boss of STORY_BOSS_REGISTRY) {
    const archetype = getBossArchetype(boss.id);
    assert.ok(archetype, `${boss.id} needs an archetype`);
    assert.equal(archetype.tier, "boss");
  }
});

test("archetype loot tables exist and only drop canonical resources", () => {
  const tableIds = new Set(ENEMY_LOOT_TABLES.map((table) => table.id));
  for (const archetype of ENEMY_ARCHETYPES) {
    assert.ok(tableIds.has(archetype.lootTableId), `${archetype.id} loot table missing`);
  }
  for (const table of ENEMY_LOOT_TABLES) {
    for (const drop of table.drops) assert.ok(getResourceDefinition(drop.resourceId), drop.resourceId);
  }
});

test("stats scale with chapter and tier", () => {
  const byId = new Map(ENEMY_ARCHETYPES.map((archetype) => [archetype.id, archetype]));
  assert.ok(byId.get("spectre_vagabond")!.stats.hp > byId.get("ombre_errante")!.stats.hp);
  assert.ok(byId.get("spectre_gele")!.stats.hp > byId.get("spectre_vagabond")!.stats.hp);
  assert.ok(byId.get("spectre_du_fleuve_noir")!.stats.hp > byId.get("spectre_hurleur")!.stats.hp);
  assert.equal(byId.get("ombre_archer")!.attack, "ranged");
  assert.equal(byId.get("ombre_brisee")!.attack, "melee");
});

test("regular kills drop materials only; boss kills also roll one equipment piece", () => {
  const rng = createSeededRng(42);
  for (let index = 0; index < 20; index += 1) {
    assert.equal(rollEnemyKillLoot("spectre_vagabond", rng).equipment.length, 0);
  }
  const boss = rollEnemyKillLoot("boss_dragon_shadow", createSeededRng(7), { dungeonId: "ashen_peak" });
  assert.equal(boss.equipment.length, 1);
  assert.notEqual(boss.equipment[0].slot, "artifact");
});

test("granting kill loot stacks materials and keeps equipment ids unique", () => {
  const loot = rollEnemyKillLoot("boss_dark_amalgam", createSeededRng(3), { dungeonId: "prologue_wastelands" });
  const once = grantEnemyKillLoot(createInitialGameState(), {
    materials: [{ resourceId: "iron_ore", amount: 2 }],
    equipment: loot.equipment,
  });
  const twice = grantEnemyKillLoot(once, loot);
  const ids = twice.inventory.items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(twice.resources.iron_ore, 2);
});

test("DUNGEON_ENCOUNTERS covers exactly the story dungeons", () => {
  assert.deepEqual(
    DUNGEON_ENCOUNTERS.map((encounter) => encounter.dungeonId).sort(),
    STORY_DUNGEON_REGISTRY.map((dungeon) => dungeon.id).sort(),
  );
});
