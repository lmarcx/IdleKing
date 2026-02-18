import test from "node:test";
import assert from "node:assert/strict";

import { simulateCombat } from "../combat/simulator.js";
import { BOSSES } from "../combat/bosses.js";
import type { CombatTickInput } from "../combat/types.js";

test("chrono mode runs full timer with invincible boss and returns damage score", () => {
  const boss = BOSSES.BOSS_1;

  const playerStats = {
    hp: 2500,
    attack: 80,
    armor: 60,
    resists: { FIRE: 40, ICE: 40, LIGHTNING: 40, VOID: 40 },
    elemental: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 50 },
    critChance: 1.2, // always crit
    critDmg: 1.5,
    speedRating: 120,
    pierceRating: 80,
  };

  const script: CombatTickInput[] = Array.from({ length: 900 }, (_, i) => ({
    dt: 0.1, // 90 seconds
    useSkill: i % 60 === 0 ? ("VOID_SPIKE" as const) : null,
  }));

  const out = simulateCombat({
    config: {
      mode: "CHRONO",
      boss,
      durationCapSec: 90,
      bossInvincible: true,
      playerStamina: { max: 120, value: 120, regenPerSec: 14 },
      playerAutoAttackIntervalSec: 1.0,
    },
    playerStats,
    // ✅ make boss harmless so test guarantees TIME_UP
    bossStatsOverride: { attack: 0 },
    script,
  });

  assert.equal(out.mode, "CHRONO");
  assert.ok(out.timeUp, "should end by timer");
  assert.ok(out.playerDamageTotal > 0, "score should be damage dealt");
});
