import test from "node:test";
import assert from "node:assert/strict";

import { runExpeditionLevel } from "../expedition/runner.js";
import { emptyCombatStats } from "../power/statHelpers.js";
import { rollKingamasForExpedition } from "../economy/kingamas.js";
import type { ExpeditionConfig } from "../expedition/types.js";

test("expedition 10 chrono grants kingamas even if player dies early (valid run)", () => {
  const world = { ...emptyCombatStats(), hp: 200, attack: 10, armor: 0 };
  const loadout = { ...emptyCombatStats(), hp: 0, attack: 0, armor: 0 };

  const config: ExpeditionConfig = {
  biome: "COSMIC_WRECK",
  worldLevel: 50,
  expeditionLevel: 10,
  seed: 4242,
};

  const out = runExpeditionLevel({
    config,
    worldStats: world,
    loadoutStats: loadout,
    // no skills: likely to die fast
    bossScript: Array.from({ length: 200 }, () => ({ dt: 0.1, useSkill: null })),
  });

  assert.equal(out.finished, true);
  assert.equal(out.result, "WIN"); // VALID
  assert.ok(typeof out.bossDamageScore === "number");

  const k = rollKingamasForExpedition({ seed: config.seed, expeditionLevel: 10, win: true });
  assert.ok(k > 0);
});
