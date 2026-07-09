import assert from "node:assert/strict";
import test from "node:test";

import { KINGDOM_STAGE_DEFINITION, validateKingdomStageDefinition } from "../level-editor/index.js";

test("KINGDOM_STAGE_DEFINITION is marked canon", () => {
  assert.equal(KINGDOM_STAGE_DEFINITION.status, "canon");
  assert.equal(KINGDOM_STAGE_DEFINITION.id, "kingdom_stage");
});

test("KINGDOM_STAGE_DEFINITION has no duplicate entity ids", () => {
  const result = validateKingdomStageDefinition(KINGDOM_STAGE_DEFINITION);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test("KINGDOM_STAGE_DEFINITION covers the real Kingdom building roster", () => {
  const ids = KINGDOM_STAGE_DEFINITION.buildings.map((building) => building.id).sort();
  assert.deepEqual(ids, ["BANK", "CORNUCOPIA", "FARM", "FORGE", "FORUM", "KITCHEN", "MARKET", "MINE", "TEMPLE", "TIME_GATE"]);
});

test("every building carries a real, positive interaction radius", () => {
  for (const building of KINGDOM_STAGE_DEFINITION.buildings) {
    assert.ok(building.interaction, `${building.id} should have an interaction`);
    assert.ok(building.interaction!.radius > 0);
  }
});

test("spawn matches the real PLAYER_START_POSITION extracted from kingdom-hub-stage.tsx", () => {
  assert.deepEqual(KINGDOM_STAGE_DEFINITION.spawn, { x: 900, y: 640 });
});

test("validateKingdomStageDefinition flags duplicate ids", () => {
  const broken = {
    ...KINGDOM_STAGE_DEFINITION,
    npcs: [...KINGDOM_STAGE_DEFINITION.npcs, { id: "FORUM", assetId: "villager_simple_01", name: "Dup", x: 0, y: 0, interaction: null }],
  };
  const result = validateKingdomStageDefinition(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("Duplicate Kingdom entity id: FORUM")));
});
