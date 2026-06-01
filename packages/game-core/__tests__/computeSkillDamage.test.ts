import test from "node:test";
import assert from "node:assert/strict";

import { calculateDamage } from "../combat/core/index.js";
import { SKILL_ATTACK_BASE_DAMAGE, computeSkillDamage } from "../combat/runtime/index.js";
import { createSeededRng } from "../random/rng.js";

test("computeSkillDamage reuses the game-core calculateDamage formula", () => {
  const viaHelper = computeSkillDamage({ attack: 40, skillDamageMultiplier: 1.8 }).damage;
  const direct = calculateDamage({
    baseDamage: SKILL_ATTACK_BASE_DAMAGE,
    attack: 40,
    skillCoefficient: 1.8,
    critChance: 0,
  }).damage;

  assert.equal(viaHelper, direct);
});

test("computeSkillDamage ignores any POWER value (POWER is never a damage source)", () => {
  const expected = computeSkillDamage({ attack: 25, skillDamageMultiplier: 1.5 }).damage;

  // POWER is not part of SkillDamageInput; a stray power field must not influence damage.
  const withStrayPower = computeSkillDamage({
    attack: 25,
    skillDamageMultiplier: 1.5,
    power: 99999,
  } as unknown as Parameters<typeof computeSkillDamage>[0]).damage;

  assert.equal(withStrayPower, expected);
});

test("computeSkillDamage scales with damageMultiplier and is zero at multiplier 0", () => {
  const low = computeSkillDamage({ attack: 20, skillDamageMultiplier: 0.5 }).damage;
  const high = computeSkillDamage({ attack: 20, skillDamageMultiplier: 2 }).damage;

  assert.ok(high > low);
  assert.equal(computeSkillDamage({ attack: 20, skillDamageMultiplier: 0 }).damage, 0);
});

test("computeSkillDamage applies the buff as an offensive modifier", () => {
  const base = computeSkillDamage({ attack: 20, skillDamageMultiplier: 1 }).damage;
  const buffed = computeSkillDamage({ attack: 20, skillDamageMultiplier: 1, buffMultiplier: 1.25 }).damage;
  const weakened = computeSkillDamage({ attack: 20, skillDamageMultiplier: 1, buffMultiplier: 0.5 }).damage;

  assert.ok(buffed > base);
  assert.ok(weakened < base);
});

test("computeSkillDamage applies target DEF mitigation", () => {
  const noDef = computeSkillDamage({ attack: 20, skillDamageMultiplier: 1 }).damage;
  const withDef = computeSkillDamage({ attack: 20, skillDamageMultiplier: 1, targetDef: 50 }).damage;

  assert.ok(withDef < noDef);
});

test("computeSkillDamage keeps crit disabled by default (deterministic, no RNG needed)", () => {
  const first = computeSkillDamage({ attack: 30, skillDamageMultiplier: 1 });
  const second = computeSkillDamage({ attack: 30, skillDamageMultiplier: 1 });

  assert.equal(first.didCrit, false);
  assert.equal(first.damage, second.damage);
});

test("computeSkillDamage is deterministic for a given seeded RNG when crit is enabled", () => {
  const input = { attack: 30, skillDamageMultiplier: 1, critChance: 0.5, critDamage: 2 } as const;

  const a = computeSkillDamage(input, createSeededRng(123));
  const b = computeSkillDamage(input, createSeededRng(123));

  assert.equal(a.damage, b.damage);
  assert.equal(a.didCrit, b.didCrit);
});
