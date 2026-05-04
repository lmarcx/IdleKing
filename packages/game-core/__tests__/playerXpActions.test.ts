import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../game/state.js";
import { applyPlayerXpGain } from "../game/playerXpActions.js";
import { xpNext, xpTotal } from "../progression/xpCurve.js";

test("player XP gain without level up does not grant skill points", () => {
  const state = createInitialGameState();

  const result = applyPlayerXpGain(state, xpNext(1) - 1);

  assert.equal(result.next.progression.playerLevel, 1);
  assert.equal(result.next.skills.skillPoints, 0);
  assert.equal(result.skillPointsGained, 0);
});

test("player level 1 to 2 grants 1 skill point", () => {
  const state = createInitialGameState();

  const result = applyPlayerXpGain(state, xpNext(1));

  assert.equal(result.next.progression.playerLevel, 2);
  assert.equal(result.next.skills.skillPoints, 1);
  assert.equal(result.skillPointsGained, 1);
});

test("player level 1 to 7 grants 6 skill points", () => {
  const state = createInitialGameState();

  const result = applyPlayerXpGain(state, xpTotal(7));

  assert.equal(result.next.progression.playerLevel, 7);
  assert.equal(result.next.progression.playerXp, 0);
  assert.equal(result.next.skills.skillPoints, 6);
  assert.equal(result.skillPointsGained, 6);
});

test("player XP gain preserves and increments existing skill points", () => {
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
  assert.equal(result.next.skills.skillPoints, 5);
});
