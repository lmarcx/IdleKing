import assert from "node:assert/strict";
import test from "node:test";

import {
  applyDamageToEnemyAi,
  createEnemyAiConfig,
  createEnemyAiRuntime,
  isEnemyAiAlive,
  stepEnemyAi,
  type EnemyAiRuntime,
} from "../level-editor/enemy-ai.js";
import type { MapEnemy } from "../level-editor/types.js";

const SHADOW: MapEnemy = {
  id: "shadow_1",
  assetId: "enemy_shard_01",
  enemyId: "shadow",
  name: "Shadow",
  stats: { hp: 60, attack: 8, defense: 0, speed: 90 },
  behavior: "idle",
  aggroRadius: 280,
  x: 500,
  y: 500,
};

const BOSS: MapEnemy = {
  ...SHADOW,
  id: "boss_dark_amalgam",
  isBoss: true,
  behavior: "boss",
  stats: { hp: 520, attack: 16, defense: 5, speed: 72 },
  aggroRadius: 400,
};

test("createEnemyAiRuntime starts idle at its own position, which is also its spawn anchor", () => {
  const runtime = createEnemyAiRuntime(SHADOW);
  assert.equal(runtime.state, "idle");
  assert.equal(runtime.x, SHADOW.x);
  assert.equal(runtime.y, SHADOW.y);
  assert.equal(runtime.spawnX, SHADOW.x);
  assert.equal(runtime.spawnY, SHADOW.y);
  assert.equal(runtime.hpCurrent, SHADOW.stats.hp);
});

test("createEnemyAiRuntime starts dead when hp is zero", () => {
  const dead: MapEnemy = { ...SHADOW, stats: { ...SHADOW.stats, hp: 0 } };
  assert.equal(createEnemyAiRuntime(dead).state, "dead");
});

test("createEnemyAiConfig gives bosses a larger attack range/cooldown than grunts", () => {
  const grunt = createEnemyAiConfig(SHADOW);
  const boss = createEnemyAiConfig(BOSS);
  assert.ok(boss.attackRange > grunt.attackRange);
  assert.ok(boss.attackCooldownMs > grunt.attackCooldownMs);
  assert.equal(grunt.contactDamage, SHADOW.stats.attack);
  assert.equal(boss.contactDamage, BOSS.stats.attack);
});

test("idle enemy aggros to chasing once the player enters aggroRadius, and not before", () => {
  const enemy = createEnemyAiRuntime(SHADOW);
  const config = createEnemyAiConfig(SHADOW);

  const farAway = stepEnemyAi(enemy, config, enemy.x + config.aggroRadius + 50, enemy.y, 0.1, 0);
  assert.equal(farAway.enemy.state, "idle");

  const inRange = stepEnemyAi(enemy, config, enemy.x + config.aggroRadius - 10, enemy.y, 0.1, 0);
  assert.equal(inRange.enemy.state, "chasing");
});

test("chasing enemy steps toward the player at moveSpeed * deltaSeconds, clamped to not overshoot", () => {
  const enemy: EnemyAiRuntime = { ...createEnemyAiRuntime(SHADOW), state: "chasing" };
  const config = createEnemyAiConfig(SHADOW);
  const playerX = enemy.x + 1000;

  const result = stepEnemyAi(enemy, config, playerX, enemy.y, 0.1, 0);
  assert.equal(result.enemy.x, enemy.x + config.moveSpeed * 0.1);

  const closePlayerX = enemy.x + 2;
  const overshootGuard = stepEnemyAi(enemy, config, closePlayerX, enemy.y, 10, 0);
  assert.ok(overshootGuard.enemy.x <= closePlayerX);
});

test("chasing enemy switches to attacking once within attackRange", () => {
  const enemy: EnemyAiRuntime = { ...createEnemyAiRuntime(SHADOW), state: "chasing" };
  const config = createEnemyAiConfig(SHADOW);
  const result = stepEnemyAi(enemy, config, enemy.x + config.attackRange - 5, enemy.y, 0.1, 0);
  assert.equal(result.enemy.state, "attacking");
});

test("attacking enemy attacks on cooldown, not every tick, and reports didAttack only on the tick it lands", () => {
  const enemy: EnemyAiRuntime = { ...createEnemyAiRuntime(SHADOW), state: "attacking" };
  const config = createEnemyAiConfig(SHADOW);
  const playerX = enemy.x + config.attackRange - 5;

  const first = stepEnemyAi(enemy, config, playerX, enemy.y, 0.1, 0);
  assert.equal(first.didAttack, true);

  const tooSoon = stepEnemyAi(first.enemy, config, playerX, enemy.y, 0.1, 100);
  assert.equal(tooSoon.didAttack, false);

  const afterCooldown = stepEnemyAi(first.enemy, config, playerX, enemy.y, 0.1, config.attackCooldownMs);
  assert.equal(afterCooldown.didAttack, true);
});

test("attacking enemy falls back to chasing once the player leaves attackRange", () => {
  const enemy: EnemyAiRuntime = { ...createEnemyAiRuntime(SHADOW), state: "attacking" };
  const config = createEnemyAiConfig(SHADOW);
  const result = stepEnemyAi(enemy, config, enemy.x + config.attackRange + 50, enemy.y, 0.1, 0);
  assert.equal(result.enemy.state, "chasing");
});

test("chasing enemy leashes once it strays leashDistance from its spawn anchor", () => {
  const base = createEnemyAiRuntime(SHADOW);
  const config = createEnemyAiConfig(SHADOW);
  const farFromSpawn: EnemyAiRuntime = { ...base, state: "chasing", x: base.spawnX + config.leashDistance + 10, y: base.spawnY };
  const result = stepEnemyAi(farFromSpawn, config, farFromSpawn.x + 500, farFromSpawn.y, 0.1, 0);
  assert.equal(result.enemy.state, "leashed");
});

test("leashed enemy walks back to its spawn anchor and settles into idle there", () => {
  const base = createEnemyAiRuntime(SHADOW);
  const config = createEnemyAiConfig(SHADOW);
  let enemy: EnemyAiRuntime = { ...base, state: "leashed", x: base.spawnX + 500, y: base.spawnY };
  const distantPlayerX = enemy.x + config.aggroRadius + 500;

  for (let i = 0; i < 200 && enemy.state !== "idle"; i += 1) {
    enemy = stepEnemyAi(enemy, config, distantPlayerX, base.spawnY, 0.1, i * 100).enemy;
  }

  assert.equal(enemy.state, "idle");
  assert.equal(enemy.x, base.spawnX);
  assert.equal(enemy.y, base.spawnY);
});

test("leashed enemy re-aggros to chasing if the player re-enters aggroRadius", () => {
  const base = createEnemyAiRuntime(SHADOW);
  const config = createEnemyAiConfig(SHADOW);
  const enemy: EnemyAiRuntime = { ...base, state: "leashed", x: base.spawnX + 500, y: base.spawnY };
  const result = stepEnemyAi(enemy, config, enemy.x + config.aggroRadius - 10, enemy.y, 0.1, 0);
  assert.equal(result.enemy.state, "chasing");
});

test("dead enemy never transitions or moves regardless of player position", () => {
  const base = createEnemyAiRuntime(SHADOW);
  const dead: EnemyAiRuntime = { ...base, state: "dead", hpCurrent: 0 };
  const config = createEnemyAiConfig(SHADOW);
  const result = stepEnemyAi(dead, config, dead.x + 1, dead.y, 1, 0);
  assert.deepEqual(result, { enemy: dead, didAttack: false });
});

test("applyDamageToEnemyAi clamps hp at zero and transitions to dead exactly at zero", () => {
  const enemy = createEnemyAiRuntime(SHADOW);
  const wounded = applyDamageToEnemyAi(enemy, enemy.hpMax - 1);
  assert.equal(wounded.hpCurrent, 1);
  assert.equal(isEnemyAiAlive(wounded), true);

  const killed = applyDamageToEnemyAi(wounded, 1);
  assert.equal(killed.hpCurrent, 0);
  assert.equal(isEnemyAiAlive(killed), false);

  const overkill = applyDamageToEnemyAi(enemy, enemy.hpMax + 1000);
  assert.equal(overkill.hpCurrent, 0);
});

test("applyDamageToEnemyAi on an already-dead enemy is a no-op", () => {
  const dead: EnemyAiRuntime = { ...createEnemyAiRuntime(SHADOW), state: "dead", hpCurrent: 0 };
  const result = applyDamageToEnemyAi(dead, 50);
  assert.deepEqual(result, dead);
});

