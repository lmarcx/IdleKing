import test from "node:test";
import assert from "node:assert/strict";

import { generateExpedition } from "../expedition/generator.js";
import { createRunModifiers, applyRunModifiers } from "../expedition/runModifiers.js";
import { resolveChoiceRoom } from "../expedition/choiceResolver.js";
import type { CombatStats } from "../power/types.js";

function base(): CombatStats {
  return {
    hp: 1000,
    attack: 50,
    armor: 10,
    resists: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 0 },
    elemental: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 0 },
    critChance: 0,
    critDmg: 1.5,
    speedRating: 0,
    pierceRating: 0,
  };
}

test("choice room pick applies buff/malus persistently for the run", () => {
  const exp = generateExpedition({
    biome: "COSMIC_WRECK",
    worldLevel: 50,
    expeditionLevel: 3,
    seed: 777,
  });

  const room2 = exp.rooms.find((r) => r.type === "CHOICE" && r.index === 2);
  assert.ok(room2 && room2.type === "CHOICE");

  let mods = createRunModifiers();

  // pick first option deterministically
  const pick = room2.options[0];
  const out = resolveChoiceRoom({ room: room2, pickId: pick.id, modifiers: mods });
  mods = out.nextModifiers;

  const after = applyRunModifiers(base(), mods);

  // It must change something if BUFF/MALUS; if RESOURCE it won't change stats.
  // So just assert: if picked is BUFF/MALUS then stats differ.
  if (out.picked.kind === "BUFF") {
    assert.notDeepEqual(after, base());
  } else if (out.picked.kind === "MALUS") {
    assert.notDeepEqual(after, base());
  } else {
    assert.deepEqual(after, base());
  }
});
