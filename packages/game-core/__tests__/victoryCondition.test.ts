import assert from "node:assert/strict";
import test from "node:test";

import {
  clearCustomVictoryConditionEvaluators,
  isVictoryConditionSatisfied,
  registerCustomVictoryConditionEvaluator,
  type VictoryCondition,
} from "../level-editor/victory-condition.js";

const aliveEnemy = { id: "e1", isDead: false };
const deadEnemy = { id: "e1", isDead: true };
const aliveBoss = { id: "boss", isDead: false, isBoss: true };
const deadBoss = { id: "boss", isDead: true, isBoss: true };

test("ALL_ENEMIES is satisfied only when every enemy is dead", () => {
  const condition: VictoryCondition = { kind: "ALL_ENEMIES" };
  assert.equal(isVictoryConditionSatisfied(condition, { enemies: [aliveEnemy, deadBoss], exitReached: false }), false);
  assert.equal(isVictoryConditionSatisfied(condition, { enemies: [deadEnemy, deadBoss], exitReached: false }), true);
});

test("ALL_ENEMIES on a zero-enemy map is never satisfied (avoids vacuous truth)", () => {
  const condition: VictoryCondition = { kind: "ALL_ENEMIES" };
  assert.equal(isVictoryConditionSatisfied(condition, { enemies: [], exitReached: false }), false);
});

test("BOSS_ONLY with an explicit bossEnemyId ignores other enemies", () => {
  const condition: VictoryCondition = { kind: "BOSS_ONLY", bossEnemyId: "boss" };
  assert.equal(isVictoryConditionSatisfied(condition, { enemies: [aliveEnemy, aliveBoss], exitReached: false }), false);
  assert.equal(isVictoryConditionSatisfied(condition, { enemies: [aliveEnemy, deadBoss], exitReached: false }), true);
});

test("BOSS_ONLY without bossEnemyId resolves the enemy flagged isBoss", () => {
  const condition: VictoryCondition = { kind: "BOSS_ONLY" };
  assert.equal(isVictoryConditionSatisfied(condition, { enemies: [aliveEnemy, deadBoss], exitReached: false }), true);
});

test("ESCAPE is satisfied only once exitReached is true", () => {
  const condition: VictoryCondition = { kind: "ESCAPE", triggerId: "exit_1" };
  assert.equal(isVictoryConditionSatisfied(condition, { enemies: [], exitReached: false }), false);
  assert.equal(isVictoryConditionSatisfied(condition, { enemies: [], exitReached: true }), true);
});

test("SURVIVE is satisfied once elapsedSeconds reaches durationSeconds", () => {
  const condition: VictoryCondition = { kind: "SURVIVE", durationSeconds: 30 };
  assert.equal(isVictoryConditionSatisfied(condition, { enemies: [], exitReached: false, elapsedSeconds: 10 }), false);
  assert.equal(isVictoryConditionSatisfied(condition, { enemies: [], exitReached: false, elapsedSeconds: 30 }), true);
});

test("CUSTOM delegates to a registered evaluator", (t) => {
  t.after(() => clearCustomVictoryConditionEvaluators());
  registerCustomVictoryConditionEvaluator("always_true_test", () => true);
  const condition: VictoryCondition = { kind: "CUSTOM", evaluatorId: "always_true_test" };
  assert.equal(isVictoryConditionSatisfied(condition, { enemies: [], exitReached: false }), true);
});

test("CUSTOM throws for an unregistered evaluatorId", () => {
  const condition: VictoryCondition = { kind: "CUSTOM", evaluatorId: "does_not_exist" };
  assert.throws(() => isVictoryConditionSatisfied(condition, { enemies: [], exitReached: false }));
});

test("registerCustomVictoryConditionEvaluator throws on duplicate registration", (t) => {
  t.after(() => clearCustomVictoryConditionEvaluators());
  registerCustomVictoryConditionEvaluator("dup_test", () => true);
  assert.throws(() => registerCustomVictoryConditionEvaluator("dup_test", () => false));
});

