import assert from "node:assert/strict";
import test from "node:test";

import { deriveStoryMapObjective, isStoryMapObjectiveSatisfied } from "../level-editor/story-map-objectives.js";
import { TEST_MAP_01 } from "../level-editor/sample-maps.js";
import type { MapEnemy, MapTrigger, PlayableMap } from "../level-editor/types.js";

const BASE_ENEMY: MapEnemy = {
  id: "enemy_grunt",
  assetId: "enemy_shard_01",
  enemyId: "shard_test",
  name: "Test Shard",
  stats: { hp: 30, attack: 5, defense: 0, speed: 50 },
  behavior: "idle",
  aggroRadius: 80,
  x: 100,
  y: 100,
};

const EXIT_TRIGGER: MapTrigger = { id: "exit_zone", type: "event", x: 0, y: 0, width: 64, height: 64, target: "dungeon_exit" };

function withEnemiesAndTriggers(enemies: readonly MapEnemy[], triggers: readonly MapTrigger[] = []): PlayableMap {
  return { ...TEST_MAP_01, enemies, triggers };
}

test("boss takes priority over an exit trigger", () => {
  const map = withEnemiesAndTriggers([{ ...BASE_ENEMY, id: "enemy_boss", isBoss: true }], [EXIT_TRIGGER]);
  const objective = deriveStoryMapObjective(map);
  assert.deepEqual(objective, { type: "boss_defeat", bossEnemyId: "enemy_boss" });
});

test("dungeon_exit trigger is used when there is no boss", () => {
  const map = withEnemiesAndTriggers([BASE_ENEMY], [EXIT_TRIGGER]);
  const objective = deriveStoryMapObjective(map);
  assert.deepEqual(objective, { type: "reach_exit", triggerId: "exit_zone" });
});

test("falls back to defeat_all_enemies when there is no boss and no dungeon_exit trigger", () => {
  const map = withEnemiesAndTriggers([BASE_ENEMY], []);
  const objective = deriveStoryMapObjective(map);
  assert.deepEqual(objective, { type: "defeat_all_enemies" });
});

test("an enter_map trigger is not mistaken for a dungeon_exit", () => {
  const map = withEnemiesAndTriggers([BASE_ENEMY], [{ id: "exit_north", type: "enter_map", x: 0, y: 0, width: 10, height: 10, target: "next_map" }]);
  const objective = deriveStoryMapObjective(map);
  assert.deepEqual(objective, { type: "defeat_all_enemies" });
});

test("deriveStoryMapObjective does not mutate the input map", () => {
  const map = withEnemiesAndTriggers([{ ...BASE_ENEMY, isBoss: true }], [EXIT_TRIGGER]);
  const before = JSON.parse(JSON.stringify(map));
  deriveStoryMapObjective(map);
  assert.deepEqual(map, before);
});

test("boss_defeat is satisfied only when the boss enemy is dead", () => {
  const objective = { type: "boss_defeat", bossEnemyId: "enemy_boss" } as const;
  assert.equal(
    isStoryMapObjectiveSatisfied(objective, { enemies: [{ id: "enemy_boss", isDead: false }], exitReached: false }),
    false,
  );
  assert.equal(
    isStoryMapObjectiveSatisfied(objective, { enemies: [{ id: "enemy_boss", isDead: true }], exitReached: false }),
    true,
  );
});

test("a grunt dying alone does not satisfy a boss_defeat objective", () => {
  const objective = { type: "boss_defeat", bossEnemyId: "enemy_boss" } as const;
  const satisfied = isStoryMapObjectiveSatisfied(objective, {
    enemies: [
      { id: "enemy_boss", isDead: false },
      { id: "enemy_grunt", isDead: true },
    ],
    exitReached: false,
  });
  assert.equal(satisfied, false);
});

test("defeat_all_enemies is satisfied only when every enemy is dead", () => {
  const objective = { type: "defeat_all_enemies" } as const;
  assert.equal(
    isStoryMapObjectiveSatisfied(objective, {
      enemies: [
        { id: "a", isDead: true },
        { id: "b", isDead: false },
      ],
      exitReached: false,
    }),
    false,
  );
  assert.equal(
    isStoryMapObjectiveSatisfied(objective, {
      enemies: [
        { id: "a", isDead: true },
        { id: "b", isDead: true },
      ],
      exitReached: false,
    }),
    true,
  );
});

test("defeat_all_enemies on a map with zero enemies is never satisfied (no vacuous truth)", () => {
  const objective = { type: "defeat_all_enemies" } as const;
  assert.equal(isStoryMapObjectiveSatisfied(objective, { enemies: [], exitReached: false }), false);
});

test("reach_exit is satisfied exactly by the exitReached flag", () => {
  const objective = { type: "reach_exit", triggerId: "exit_zone" } as const;
  assert.equal(isStoryMapObjectiveSatisfied(objective, { enemies: [], exitReached: false }), false);
  assert.equal(isStoryMapObjectiveSatisfied(objective, { enemies: [], exitReached: true }), true);
});
