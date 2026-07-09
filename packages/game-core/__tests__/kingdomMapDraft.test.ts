import assert from "node:assert/strict";
import test from "node:test";

import { KINGDOM_DRAFT_MAP, validateKingdomMapDefinition, type KingdomMapDefinition } from "../level-editor/index.js";

test("KINGDOM_DRAFT_MAP is marked as a draft, not a live map", () => {
  assert.equal(KINGDOM_DRAFT_MAP.status, "draft");
  assert.equal(KINGDOM_DRAFT_MAP.id, "kingdom_draft");
});

test("KINGDOM_DRAFT_MAP has no duplicate entity ids across buildings/npcs/props", () => {
  const result = validateKingdomMapDefinition(KINGDOM_DRAFT_MAP);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test("KINGDOM_DRAFT_MAP covers the expected canonical Kingdom buildings", () => {
  const ids = KINGDOM_DRAFT_MAP.buildings.map((building) => building.id).sort();
  assert.deepEqual(ids, ["BANK", "CORNUCOPIA", "FARM", "FORGE", "FORUM", "KITCHEN", "MARKET", "MINE", "TEMPLE", "TIME_GATE"]);
});

test("every KINGDOM_DRAFT_MAP building carries a systemInteraction-shaped InteractionDefinition", () => {
  for (const building of KINGDOM_DRAFT_MAP.buildings) {
    assert.ok(building.interaction, `${building.id} should have an interaction`);
    assert.ok(building.interaction!.radius > 0);
    assert.ok(building.interaction!.promptLabel.length > 0);
  }
});

test("validateKingdomMapDefinition flags duplicate ids", () => {
  const broken: KingdomMapDefinition = {
    ...KINGDOM_DRAFT_MAP,
    npcs: [...KINGDOM_DRAFT_MAP.npcs, { id: "FORUM", assetId: "villager_simple_01", name: "Dup", x: 0, y: 0, interaction: null }],
  };
  const result = validateKingdomMapDefinition(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("Duplicate Kingdom entity id: FORUM")));
});
