import test from "node:test";
import assert from "node:assert/strict";

import { runExpeditionLevel } from "../expedition/runner.js";
import { emptyCombatStats } from "../power/statHelpers.js";

test("expedition 1 produces a completion time (speedrun chrono)", () => {
  const world = { ...emptyCombatStats(), hp: 2000, attack: 80, armor: 60 };
  const loadout = { ...emptyCombatStats(), attack: 120, critChance: 0.6, pierceRating: 60 };

  const out = runExpeditionLevel({
    config: { biome: "VOLCANIC", worldLevel: 50, expeditionLevel: 1, seed: 1234 },
    worldStats: world,
    loadoutStats: loadout,
  });

  assert.equal(out.finished, true);
  assert.ok(out.totalTimeSec > 0);
});

test("expedition 10 returns a boss damage score (90s chrono)", () => {
  const world = { ...emptyCombatStats(), hp: 3000, attack: 120, armor: 80 };
  const loadout = { ...emptyCombatStats(), attack: 180, critChance: 1.2, pierceRating: 80, elemental: { FIRE:0, ICE:0, LIGHTNING:0, VOID:60 } };

  const out = runExpeditionLevel({
    config: { biome: "COSMIC_WRECK", worldLevel: 50, expeditionLevel: 10, seed: 9999 },
    worldStats: world,
    loadoutStats: loadout,
  });

  assert.equal(out.finished, true);
  assert.ok(typeof out.bossDamageScore === "number");
  assert.ok((out.bossDamageScore ?? 0) >= 0);
});
