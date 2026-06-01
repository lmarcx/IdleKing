import test from "node:test";
import assert from "node:assert/strict";

import {
  applyStatusDamageModifiers,
  calculateCritMultiplier,
  calculateDamage,
  calculateTargetMitigation,
  isDamageOverTimeStatus,
  isSlowStatus,
  preventsActions,
  preventsCasts,
} from "../combat/core/index.js";
import { createSeededRng } from "../random/rng.js";

test("damage increases with base damage, ATK, and coefficients", () => {
  const base = calculateDamage({ baseDamage: 100, attack: 0 }).damage;
  const withBaseDamage = calculateDamage({ baseDamage: 120, attack: 0 }).damage;
  const withAttack = calculateDamage({ baseDamage: 100, attack: 20 }).damage;
  const withCoefficients = calculateDamage({
    baseDamage: 100,
    attack: 0,
    weaponCoefficient: 1.2,
    skillCoefficient: 1.5,
  }).damage;

  assert.ok(withBaseDamage > base);
  assert.ok(withAttack > base);
  assert.ok(withCoefficients > base);
});

test("DEF reduces damage with diminishing returns", () => {
  const mitigationAt0 = calculateTargetMitigation(0);
  const mitigationAt100 = calculateTargetMitigation(100);
  const mitigationAt200 = calculateTargetMitigation(200);

  assert.ok(calculateDamage({ baseDamage: 100, attack: 0, targetDef: 100 }).damage < 100);
  assert.ok(mitigationAt100.mitigation < mitigationAt200.mitigation);
  assert.ok(
    mitigationAt100.mitigation - mitigationAt0.mitigation >
      mitigationAt200.mitigation - mitigationAt100.mitigation
  );
});

test("100% crit applies the default 200% crit damage deterministically", () => {
  const result = calculateDamage({
    baseDamage: 100,
    attack: 0,
    critChance: 1,
  });

  assert.equal(result.didCrit, true);
  assert.equal(result.damage, 200);
});

test("0% crit never applies a crit", () => {
  const result = calculateCritMultiplier(
    { critChance: 0 },
    createSeededRng(123)
  );

  assert.equal(result.didCrit, false);
  assert.equal(result.multiplier, 1);
});

test("fractional crit is deterministic with seeded RNG", () => {
  function sequence(seed: number) {
    const rng = createSeededRng(seed);
    return Array.from(
      { length: 8 },
      () => calculateCritMultiplier({ critChance: 0.5 }, rng).didCrit
    );
  }

  assert.deepEqual(sequence(456), sequence(456));
});

test("Shock increases incoming damage by the locked base 10%", () => {
  const result = calculateDamage({
    baseDamage: 100,
    attack: 0,
    targetStatuses: [{ id: "SHOCK" }],
  });

  assert.ok(Math.abs(result.damage - 110) < 1e-9);
});

test("Bleed reduces outgoing damage by the locked base 10%", () => {
  const result = calculateDamage({
    baseDamage: 100,
    attack: 0,
    attackerStatuses: [{ id: "BLEED" }],
  });

  assert.equal(result.damage, 90);
});

test("canonical status helpers expose locked MVP semantics", () => {
  assert.equal(isDamageOverTimeStatus("BURN"), true);
  assert.equal(isSlowStatus("FREEZE"), true);
  assert.equal(preventsActions("STUN"), true);
  assert.equal(preventsCasts("SILENCE"), true);
});

test("damage and status helpers do not mutate inputs", () => {
  const input = {
    baseDamage: 100,
    attack: 15,
    offensiveModifiers: [1.1, 1.2],
    attackerStatuses: [{ id: "BLEED" as const, debuffPower: 4 }],
    targetStatuses: [{ id: "SHOCK" as const, debuffPower: 3 }],
    targetDef: 25,
    critChance: 0,
  };
  const snapshot = structuredClone(input);

  calculateDamage(input);
  applyStatusDamageModifiers(input);

  assert.deepEqual(input, snapshot);
});
