import assert from "node:assert/strict";
import test from "node:test";

import { TEST_MAP_01 } from "../level-editor/sample-maps.js";
import { validatePlayableMap } from "../level-editor/map-loader.js";
import type { MapEnemy, MapTrigger } from "../level-editor/types.js";

const BASE_ENEMY: MapEnemy = {
  id: "enemy_test",
  assetId: "enemy_shard_01",
  enemyId: "shard_test",
  name: "Test Shard",
  stats: { hp: 10, attack: 1, defense: 0, speed: 50 },
  behavior: "idle",
  aggroRadius: 80,
  x: 100,
  y: 100,
};

test("TEST_MAP_01 still validates with no enemy flagged isBoss (backward compatible)", () => {
  const result = validatePlayableMap(TEST_MAP_01);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.ok(TEST_MAP_01.enemies.every((enemy) => !enemy.isBoss));
});

test("a map with exactly one enemy flagged isBoss validates ok", () => {
  const map = {
    ...TEST_MAP_01,
    enemies: [{ ...BASE_ENEMY, id: "enemy_boss", isBoss: true }],
  };
  const result = validatePlayableMap(map);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("validatePlayableMap rejects more than one enemy flagged isBoss", () => {
  const map = {
    ...TEST_MAP_01,
    enemies: [
      { ...BASE_ENEMY, id: "enemy_boss_a", isBoss: true },
      { ...BASE_ENEMY, id: "enemy_boss_b", isBoss: true },
    ],
  };
  const result = validatePlayableMap(map);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("more than one enemy flagged isBoss")));
  assert.ok(result.errors.some((error) => error.includes("enemy_boss_a")));
  assert.ok(result.errors.some((error) => error.includes("enemy_boss_b")));
});

test("a dungeon_exit event trigger is a structurally valid MapTrigger (documented Story convention)", () => {
  const dungeonExit: MapTrigger = { id: "exit_zone", type: "event", x: 32, y: 32, width: 64, height: 64, target: "dungeon_exit" };
  const map = { ...TEST_MAP_01, triggers: [...TEST_MAP_01.triggers, dungeonExit] };
  const result = validatePlayableMap(map);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.ok(map.triggers.some((trigger) => trigger.type === "event" && trigger.target === "dungeon_exit"));
});
