import test from "node:test";
import assert from "node:assert/strict";

import { createWorldState, setBuildingLevel } from "../world/worldState.js";
import { computeWorldComputed } from "../world/worldStats.js";

test("world buildings contribute to worldStats and production", () => {
  let world = createWorldState({ worldLevel: 12 });
  world = setBuildingLevel(world, "TOWN_HALL", 2);
  world = setBuildingLevel(world, "WELL", 3);

  const out = computeWorldComputed(world);

  assert.ok(out.worldStats.hp > 0);
  assert.ok(out.production.WATER > 0);
});

test("royal treasury gated by world level 11", () => {
  let world = createWorldState({ worldLevel: 10 });
  world = setBuildingLevel(world, "ROYAL_TREASURY", 1);

  const out = computeWorldComputed(world);
  assert.ok(!out.flags.has("UNLOCK_KINGAMAS"));

  world = { ...world, worldLevel: 11 };
  const out2 = computeWorldComputed(world);
  assert.ok(out2.flags.has("UNLOCK_KINGAMAS"));
});
