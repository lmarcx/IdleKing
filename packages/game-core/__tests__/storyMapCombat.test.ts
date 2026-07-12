import assert from "node:assert/strict";
import test from "node:test";

import { attackStoryMapRuntimeEnemy, createStoryMapRuntimeEnemy } from "../level-editor/story-map-combat.js";
import type { MapEnemy } from "../level-editor/types.js";

const BASE_ENEMY: MapEnemy = {
  id: "enemy_test",
  assetId: "enemy_shard_01",
  enemyId: "shard_test",
  name: "Test Shard",
  stats: { hp: 30, attack: 5, defense: 0, speed: 50 },
  behavior: "idle",
  aggroRadius: 80,
  x: 120,
  y: 240,
};

const ATTACKER = { attack: 20, critChance: 0 } as const;

test("MapEnemy converts to a runtime enemy with correct initial HP", () => {
  const runtime = createStoryMapRuntimeEnemy(BASE_ENEMY);
  assert.equal(runtime.hpMax, 30);
  assert.equal(runtime.hpCurrent, 30);
  assert.equal(runtime.isDead, false);
  assert.equal(runtime.id, "enemy_test");
  assert.equal(runtime.x, 120);
  assert.equal(runtime.y, 240);
});

test("applying damage reduces hpCurrent", () => {
  const runtime = createStoryMapRuntimeEnemy(BASE_ENEMY);
  const hit = attackStoryMapRuntimeEnemy(runtime, ATTACKER);
  assert.ok(hit.hpCurrent < runtime.hpCurrent);
});

test("hp never goes below 0", () => {
  let runtime = createStoryMapRuntimeEnemy({ ...BASE_ENEMY, stats: { ...BASE_ENEMY.stats, hp: 5 } });
  for (let i = 0; i < 20; i += 1) {
    runtime = attackStoryMapRuntimeEnemy(runtime, ATTACKER);
  }
  assert.equal(runtime.hpCurrent, 0);
  assert.ok(runtime.hpCurrent >= 0);
});

test("enemy dies when hp reaches 0", () => {
  let runtime = createStoryMapRuntimeEnemy({ ...BASE_ENEMY, stats: { ...BASE_ENEMY.stats, hp: 5 } });
  runtime = attackStoryMapRuntimeEnemy(runtime, ATTACKER);
  assert.equal(runtime.isDead, true);
  assert.equal(runtime.hpCurrent, 0);
});

test("a dead enemy is a no-op for further attacks", () => {
  let runtime = createStoryMapRuntimeEnemy({ ...BASE_ENEMY, stats: { ...BASE_ENEMY.stats, hp: 5 } });
  runtime = attackStoryMapRuntimeEnemy(runtime, ATTACKER);
  assert.equal(runtime.isDead, true);
  const after = attackStoryMapRuntimeEnemy(runtime, ATTACKER);
  assert.deepEqual(after, runtime);
});

test("the original MapEnemy definition is never mutated", () => {
  const original = JSON.parse(JSON.stringify(BASE_ENEMY)) as MapEnemy;
  const runtime = createStoryMapRuntimeEnemy(BASE_ENEMY);
  attackStoryMapRuntimeEnemy(runtime, ATTACKER);
  attackStoryMapRuntimeEnemy(runtime, ATTACKER);
  assert.deepEqual(BASE_ENEMY, original);
});

test("isBoss is preserved when set, and defaults to false when absent", () => {
  const withBoss = createStoryMapRuntimeEnemy({ ...BASE_ENEMY, id: "enemy_boss", isBoss: true });
  assert.equal(withBoss.isBoss, true);

  const withoutBoss = createStoryMapRuntimeEnemy(BASE_ENEMY);
  assert.equal(withoutBoss.isBoss, false);
});

test("multiple enemies have independent runtime state", () => {
  const enemyA = createStoryMapRuntimeEnemy({ ...BASE_ENEMY, id: "enemy_a" });
  const enemyB = createStoryMapRuntimeEnemy({ ...BASE_ENEMY, id: "enemy_b" });

  const hitA = attackStoryMapRuntimeEnemy(enemyA, ATTACKER);

  assert.ok(hitA.hpCurrent < enemyA.hpCurrent);
  assert.equal(enemyB.hpCurrent, enemyB.hpMax);
  assert.notEqual(hitA.id, enemyB.id);
});
