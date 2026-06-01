import test from "node:test";
import assert from "node:assert/strict";

import { computePowerFromStats, computeTotalPower } from "../power/powerEngine.js";
import {
  computeDefenseMitigation,
  deriveStats,
} from "../power/statsModel.js";
import type { CombatStats } from "../power/types.js";
import {
  COOLDOWN_REDUCTION_CAP,
  CRIT_CHANCE_CAP,
  CRIT_DAMAGE_DEFAULT,
} from "../power/constants.js";
import { computeCritMultiplier } from "../power/crit.js";

function emptyStats(): CombatStats {
  return {
    hp: 0,
    attack: 0,
    armor: 0,
    resists: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 0 },
    elemental: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 0 },
    critChance: 0,
    critDmg: CRIT_DAMAGE_DEFAULT,
    speedRating: 0,
    pierceRating: 0,
  };
}

test("worldPower and loadoutPower contribute to totalPower", () => {
  // World has defensive + small offensive baseline (buildings can give attack in MVP)
  const world: CombatStats = {
    ...emptyStats(),
    hp: 500,
    attack: 10,
    armor: 50,
    resists: { FIRE: 10, ICE: 10, LIGHTNING: 10, VOID: 10 },
  };

  // Loadout needs SOME hp or it has EHP=0 => CombatScore=0 in our model
  const loadout: CombatStats = {
    ...emptyStats(),
    hp: 100, // ✅ critical to avoid EHP=0
    attack: 120,
    elemental: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 80 },
    critChance: 1.2, // input is capped by the MVP score model
    critDmg: CRIT_DAMAGE_DEFAULT,
    speedRating: 80,
    pierceRating: 60,
  };

  const p = computeTotalPower(world, loadout, 3);

  assert.ok(p.worldPower > 0, "worldPower should be > 0 with hp+attack");
  assert.ok(p.loadoutPower > 0, "loadoutPower should be > 0 with hp+attack");
  assert.ok(p.totalPower >= p.worldPower, "totalPower should be >= worldPower");
  assert.ok(p.totalPower >= p.loadoutPower, "totalPower should be >= loadoutPower");
});

test("derived stats enforce locked crit and cooldown rules", () => {
  const stats = deriveStats(
    { hp: 120, atk: 10, def: 5, speed: 8 },
    {
      advanced: {
        critChance: 1.4,
        cooldownReduction: 0.75,
      },
    }
  );

  assert.equal(stats.advanced.critChance, CRIT_CHANCE_CAP);
  assert.equal(stats.advanced.critDamage, CRIT_DAMAGE_DEFAULT);
  assert.equal(stats.advanced.cooldownReduction, COOLDOWN_REDUCTION_CAP);
});

test("crit multiplier caps crit chance at 100% and defaults crit damage to 200%", () => {
  assert.equal(computeCritMultiplier(1), CRIT_DAMAGE_DEFAULT);
  assert.equal(computeCritMultiplier(1.4), computeCritMultiplier(1));
});

test("DEF mitigation increases with diminishing returns", () => {
  const mitigationAt0 = computeDefenseMitigation(0);
  const mitigationAt100 = computeDefenseMitigation(100);
  const mitigationAt200 = computeDefenseMitigation(200);

  assert.equal(mitigationAt0, 0);
  assert.ok(mitigationAt100 < mitigationAt200);
  assert.ok(mitigationAt100 - mitigationAt0 > mitigationAt200 - mitigationAt100);
  assert.ok(mitigationAt200 < 1);
});

test("POWER is deterministic", () => {
  const stats = {
    ...emptyStats(),
    hp: 500,
    attack: 80,
    armor: 45,
    critChance: 0.3,
  };

  assert.deepEqual(computePowerFromStats(stats, 2), computePowerFromStats(stats, 2));
});

test("derived stats do not mutate their inputs", () => {
  const base = { hp: 120, atk: 10, def: 5, speed: 8 };
  const modifiers = {
    base: { hp: 30, def: 12 },
    advanced: { staminaRegen: 3 },
    maxMana: 20,
  };
  const baseSnapshot = structuredClone(base);
  const modifiersSnapshot = structuredClone(modifiers);

  const stats = deriveStats(base, modifiers);

  assert.deepEqual(base, baseSnapshot);
  assert.deepEqual(modifiers, modifiersSnapshot);
  assert.equal(stats.resources.maxHp, 150);
  assert.equal(stats.resources.maxMana, 120);
  assert.equal(stats.base.def, 17);
});
