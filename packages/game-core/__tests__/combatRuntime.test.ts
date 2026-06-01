import test from "node:test";
import assert from "node:assert/strict";

import {
  DASH_STAMINA_COST,
  SPRINT_STAMINA_COST_PER_SECOND,
  applyDamageToPlayer,
  applyDashCost,
  applySprintCost,
  canDash,
  createCombatRuntimeState,
  handlePlayerDeathAtCheckpoint,
  isPlayerDead,
  performBasicAttack,
  regenerateResources,
  spendMana,
  spendStamina,
  tickCombatRuntime,
} from "../combat/runtime/index.js";
import { createSeededRng } from "../random/rng.js";

function createState() {
  return createCombatRuntimeState({
    player: {
      hpMax: 120,
      manaMax: 80,
      staminaMax: 100,
      manaRegenPerSecond: 5,
      staminaRegenPerSecond: 10,
      attack: 20,
      critChance: 0,
    },
    enemy: {
      hpMax: 150,
      def: 10,
    },
    checkpoint: {
      checkpointIndex: 2,
      securedRewards: [{ kind: "RESOURCE", id: "iron_ore", amount: 3 }],
    },
  });
}

test("combat runtime state initializes HP, Mana, and Stamina pools", () => {
  const state = createState();

  assert.equal(state.player.hpCurrent, 120);
  assert.equal(state.player.manaCurrent, 80);
  assert.equal(state.player.staminaCurrent, 100);
  assert.equal(state.enemy.hpCurrent, 150);
});

test("spendMana and spendStamina clamp resources at zero", () => {
  const state = createState();

  assert.equal(spendMana(state, 1_000).player.manaCurrent, 0);
  assert.equal(spendStamina(state, 1_000).player.staminaCurrent, 0);
});

test("sprint consumes Stamina while held", () => {
  const state = createState();
  const next = applySprintCost(state, 2);

  assert.equal(next.player.staminaCurrent, 100 - SPRINT_STAMINA_COST_PER_SECOND * 2);
});

test("dash consumes Stamina and applies its cooldown", () => {
  const state = createState();
  const result = applyDashCost(state);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.next.player.staminaCurrent, 100 - DASH_STAMINA_COST);
  assert.ok(result.next.timers.dashCooldownRemainingSeconds > 0);
});

test("dash is blocked when Stamina is insufficient", () => {
  const state = spendStamina(createState(), 100);
  const result = applyDashCost(state);

  assert.equal(canDash(state), false);
  assert.deepEqual(result, { ok: false, next: state, reason: "NOT_ENOUGH_STAMINA" });
});

test("resource regen restores Mana and Stamina without exceeding max", () => {
  const spent = spendStamina(spendMana(createState(), 40), 50);
  const regenerated = regenerateResources(spent, 100);

  assert.equal(regenerated.player.manaCurrent, regenerated.player.manaMax);
  assert.equal(regenerated.player.staminaCurrent, regenerated.player.staminaMax);
});

test("runtime tick decrements dash cooldown", () => {
  const dash = applyDashCost(createState());
  assert.equal(dash.ok, true);
  if (!dash.ok) return;

  assert.equal(tickCombatRuntime(dash.next, 10).timers.dashCooldownRemainingSeconds, 0);
});

test("basic attack reduces enemy HP through combat-core damage", () => {
  const state = createState();
  const result = performBasicAttack(state, createSeededRng(42));

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.damage.damage > 0);
  assert.equal(result.next.enemy.hpCurrent, state.enemy.hpCurrent - result.damage.damage);
});

test("player death is detected at zero HP", () => {
  const dead = applyDamageToPlayer(createState(), 1_000);

  assert.equal(dead.player.hpCurrent, 0);
  assert.equal(dead.player.respawnRequired, true);
  assert.equal(isPlayerDead(dead), true);
});

test("checkpoint respawn restores resources and preserves secured rewards", () => {
  const original = createState();
  const dead = applyDamageToPlayer(spendMana(spendStamina(original, 80), 70), 1_000);
  const respawned = handlePlayerDeathAtCheckpoint(dead);

  assert.equal(respawned.player.hpCurrent, respawned.player.hpMax);
  assert.equal(respawned.player.manaCurrent, respawned.player.manaMax);
  assert.equal(respawned.player.staminaCurrent, respawned.player.staminaMax);
  assert.equal(respawned.player.respawnRequired, false);
  assert.deepEqual(respawned.checkpoint.securedRewards, original.checkpoint.securedRewards);
});

test("runtime helpers do not mutate their input state", () => {
  const state = createState();
  const snapshot = structuredClone(state);

  spendMana(state, 10);
  spendStamina(state, 10);
  regenerateResources(state, 1);
  applySprintCost(state, 1);
  applyDashCost(state);
  applyDamageToPlayer(state, 10);
  performBasicAttack(state, createSeededRng(12));

  assert.deepEqual(state, snapshot);
});
