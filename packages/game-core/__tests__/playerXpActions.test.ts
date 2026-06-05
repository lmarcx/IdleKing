import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { applyGameXpGain, applyPlayerXpGain } from "../game/playerXpActions.js";
import { xpNext, xpTotal } from "../progression/xpCurve.js";
import {
  addPlayerXp,
  getPlayerLevelFromXp,
  getXpRequiredForPlayerLevel,
} from "../progression/xp.js";

test("Player progression helpers expose the MVP XP curve", () => {
  assert.equal(getXpRequiredForPlayerLevel(1), xpNext(1));
  assert.equal(getPlayerLevelFromXp(0), 1);
  assert.equal(getPlayerLevelFromXp(xpNext(1)), 2);

  const result = addPlayerXp({ playerLevel: 1, playerXp: 0 }, xpNext(1) + 5);
  assert.deepEqual(result, { playerLevel: 2, playerXp: 5 });
});

test("player XP gain without level up does not grant skill points", () => {
  const state = createInitialGameState();

  const result = applyPlayerXpGain(state, xpNext(1) - 1);

  assert.equal(result.next.progression.playerLevel, 1);
  assert.equal(result.next.skills.skillPoints, 0);
  assert.equal(result.skillPointsGained, 0);
});

test("player level 1 to 2 grants no skill point in Phase 7 MVP", () => {
  const state = createInitialGameState();

  const result = applyPlayerXpGain(state, xpNext(1));

  assert.equal(result.next.progression.playerLevel, 2);
  assert.equal(result.next.skills.skillPoints, 0);
  assert.equal(result.skillPointsGained, 0);
});

test("player level 1 to 7 stays automatic and grants no skill point", () => {
  const state = createInitialGameState();

  const result = applyPlayerXpGain(state, xpTotal(7));

  assert.equal(result.next.progression.playerLevel, 7);
  assert.equal(result.next.progression.playerXp, 0);
  assert.equal(result.next.skills.skillPoints, 0);
  assert.equal(result.skillPointsGained, 0);
});

test("player XP gain preserves legacy skill points without incrementing them", () => {
  const base = createInitialGameState();
  const state = {
    ...base,
    skills: {
      ...base.skills,
      skillPoints: 4,
    },
  };

  const result = applyPlayerXpGain(state, xpNext(1));

  assert.equal(result.next.progression.playerLevel, 2);
  assert.equal(result.next.skills.skillPoints, 4);
});

test("generic XP gain levels the player automatically without skill points", () => {
  const state = createInitialGameState();

  const result = applyGameXpGain(state, { xp: xpNext(1), wxp: 0 });

  assert.equal(result.next.progression.playerLevel, 2);
  assert.equal(result.next.skills.skillPoints, 0);
  assert.equal(result.skillPointsGained, 0);
});
