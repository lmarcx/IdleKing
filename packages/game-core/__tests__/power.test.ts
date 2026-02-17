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
    critChance: 1.2, // uncapped crit (120%)
    critDmg: 1.5,
    speedRating: 80,
    pierceRating: 60,
  };

  const p = computeTotalPower(world, loadout, 3);

  assert.ok(p.worldPower > 0, "worldPower should be > 0 with hp+attack");
  assert.ok(p.loadoutPower > 0, "loadoutPower should be > 0 with hp+attack");
  assert.ok(p.totalPower >= p.worldPower, "totalPower should be >= worldPower");
  assert.ok(p.totalPower >= p.loadoutPower, "totalPower should be >= loadoutPower");
});
