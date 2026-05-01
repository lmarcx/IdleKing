import test from "node:test";
import assert from "node:assert/strict";

import {
  SKILL_DEFS,
  canCastSkill,
  castSkill,
  getDefaultSkillLoadout,
  getSkillRemainingCooldownMs,
  isSkillOnCooldown,
  type SkillCooldownState,
} from "../combat/index.js";

test("skills registry contains the 4 MVP skills", () => {
  assert.deepEqual(Object.keys(SKILL_DEFS), [
    "royal_beam",
    "king_aura",
    "royal_strike",
    "war_cry",
  ]);
});

test("default skill loadout maps the 4 MVP skills to slots 1 to 4", () => {
  assert.deepEqual(getDefaultSkillLoadout(), [
    { slot: 1, skillId: "royal_beam" },
    { slot: 2, skillId: "king_aura" },
    { slot: 3, skillId: "royal_strike" },
    { slot: 4, skillId: "war_cry" },
  ]);
});

test("unknown skill fails cleanly", () => {
  const result = canCastSkill({
    skillId: "unknown_skill",
    nowMs: 1000,
    cooldowns: {},
  });

  assert.equal(result.ok, false);
  assert.equal(result.skillId, "unknown_skill");
  assert.equal(result.reason, "UNKNOWN_SKILL");
});

test("available skill can be cast and then enters cooldown", () => {
  const startedAtMs = 10_000;
  const result = castSkill({
    skillId: "royal_beam",
    nowMs: startedAtMs,
    cooldowns: {},
  });

  assert.equal(result.ok, true);
  assert.equal(result.skillId, "royal_beam");
  assert.equal(result.startedAtMs, startedAtMs);
  assert.equal(result.nextAvailableAtMs, startedAtMs + 8000);

  const cooldowns: SkillCooldownState = {
    royal_beam: result.nextAvailableAtMs,
  };

  assert.equal(isSkillOnCooldown("royal_beam", cooldowns, startedAtMs + 1), true);

  const secondCast = castSkill({
    skillId: "royal_beam",
    nowMs: startedAtMs + 1,
    cooldowns,
  });

  assert.equal(secondCast.ok, false);
  assert.equal(secondCast.reason, "COOLDOWN");
  assert.equal(secondCast.remainingCooldownMs, 7999);
});

test("royal_strike is instant and does not create a persistent active effect", () => {
  const result = castSkill({
    skillId: "royal_strike",
    nowMs: 5000,
    cooldowns: {},
  });

  assert.equal(result.ok, true);
  assert.equal(result.skillId, "royal_strike");
  assert.equal(result.endsAtMs, undefined);
  assert.equal(result.activeEffect, undefined);
});

test("royal_beam creates an active effect with the expected end time", () => {
  const result = castSkill({
    skillId: "royal_beam",
    nowMs: 2000,
    cooldowns: {},
  });

  assert.equal(result.ok, true);
  assert.equal(result.endsAtMs, 3500);
  assert.equal(result.activeEffect?.skillId, "royal_beam");
  assert.equal(result.activeEffect?.kind, "beam");
  assert.equal(result.activeEffect?.endsAtMs, 3500);
});

test("king_aura creates an active effect with the expected end time", () => {
  const result = castSkill({
    skillId: "king_aura",
    nowMs: 2000,
    cooldowns: {},
  });

  assert.equal(result.ok, true);
  assert.equal(result.endsAtMs, 7000);
  assert.equal(result.activeEffect?.skillId, "king_aura");
  assert.equal(result.activeEffect?.kind, "aura");
  assert.equal(result.activeEffect?.endsAtMs, 7000);
});

test("war_cry creates a buff active effect with the expected end time", () => {
  const result = castSkill({
    skillId: "war_cry",
    nowMs: 2000,
    cooldowns: {},
  });

  assert.equal(result.ok, true);
  assert.equal(result.endsAtMs, 8000);
  assert.equal(result.activeEffect?.skillId, "war_cry");
  assert.equal(result.activeEffect?.kind, "buff");
  assert.equal(result.activeEffect?.bonusDamageMultiplier, 0.25);
  assert.equal(result.activeEffect?.endsAtMs, 8000);
});

test("remaining cooldown is calculated and clamped to zero", () => {
  const cooldowns: SkillCooldownState = {
    war_cry: 20_000,
  };

  assert.equal(getSkillRemainingCooldownMs("war_cry", cooldowns, 12_500), 7500);
  assert.equal(getSkillRemainingCooldownMs("war_cry", cooldowns, 20_000), 0);
  assert.equal(getSkillRemainingCooldownMs("war_cry", cooldowns, 25_000), 0);
});
