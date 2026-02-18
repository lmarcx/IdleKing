import test from "node:test";
import assert from "node:assert/strict";

import { simulateCombat } from "../combat/simulator.js";
import { BOSSES } from "../combat/bosses.js";
import type { CombatTickInput } from "../combat/types.js";

test("combat sim runs and produces a winner", () => {
  const boss = BOSSES.BOSS_1;

  const playerStats = {
    hp: 1200,
    attack: 55,
    armor: 25,
    resists: { FIRE: 10, ICE: 10, LIGHTNING: 10, VOID: 10 },
    elemental: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 20 },
    critChance: 0.6,
    critDmg: 1.5,
    speedRating: 80,
    pierceRating: 50,
  };

  const script: CombatTickInput[] = Array.from({ length: 300 }, (_, i) => ({
    dt: 0.1,
    useSkill: i % 40 === 0 ? ("VOID_SPIKE" as const) : null,
  }));

  const out = simulateCombat({
    config: {
      boss,
      durationCapSec: 60,
      playerStamina: { max: 100, value: 100, regenPerSec: 12 },
      playerAutoAttackIntervalSec: 1.0,
    },
    playerStats,
    script,
  });

  assert.ok(out.durationSec > 0);
  assert.ok(out.winner === "PLAYER" || out.winner === "BOSS");
  assert.ok(out.playerDamageTotal >= 0);
});
