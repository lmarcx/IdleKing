import test from "node:test";
import assert from "node:assert/strict";

import { computeTotalPower } from "../power/powerEngine.js";
import type { CombatStats } from "../power/types.js";

function emptyStats(): CombatStats {
  return {
    hp: 0,
    attack: 0,
    armor: 0,
    resists: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 0 },
    elemental: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 0 },
    critChance: 0,
    critDmg: 1.5,
    speedRating: 0,
    pierceRating: 0,
  };
}

test("worldPower and loadoutPower contribute to totalPower", () => {
  const world: CombatStats = {
    ...emptyStats(),
    hp: 500,
    armor: 50,
    resists: { FIRE: 10, ICE: 10, LIGHTNING: 10, VOID: 10 },
  };

  const loadout: CombatStats = {
    ...emptyStats(),
    attack: 120,
    elemental: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 80 },
    critChance: 1.2, // uncapped crit (120%)
    critDmg: 1.5,
    speedRating: 80,
    pierceRating: 60,
  };

  const p = computeTotalPower(world, loadout, 3);

  assert.ok(p.worldPower > 0);
  assert.ok(p.loadoutPower > 0);
  assert.ok(p.totalPower >= p.worldPower);
  assert.ok(p.totalPower >= p.loadoutPower);
});
