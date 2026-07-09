import assert from "node:assert/strict";
import test from "node:test";

import {
  collectMapInteractables,
  describeInteractionFeedback,
  findNearestInteractable,
  TEST_MAP_01,
  type InteractionDefinition,
  type PlayableMap,
} from "../level-editor/index.js";

function baseMap(): PlayableMap {
  return {
    ...TEST_MAP_01,
    objects: [],
    buildings: [],
    npcs: [],
    enemies: [],
    collisions: [],
    triggers: [],
  };
}

function interaction(overrides: Partial<InteractionDefinition> = {}): InteractionDefinition {
  return {
    interactionType: "custom_trigger",
    interactionTargetId: "target_01",
    promptLabel: "Interact",
    radius: 40,
    ...overrides,
  };
}

test("collectMapInteractables only includes entities with a systemInteraction", () => {
  const map: PlayableMap = {
    ...baseMap(),
    buildings: [
      { id: "b1", assetId: "house_small_01", function: "house", x: 0, y: 0, collision: null, systemInteraction: interaction({ interactionType: "open_building_modal" }) },
      { id: "b2", assetId: "house_small_01", function: "house", x: 10, y: 10, collision: null },
    ],
    npcs: [
      { id: "n1", assetId: "villager_simple_01", name: "N", type: "villager", behavior: "idle", interaction: "dialogue", x: 20, y: 20, systemInteraction: interaction({ interactionType: "start_dialogue" }) },
    ],
    objects: [
      { id: "o1", assetId: "chest_simple_01", kind: "object", x: 30, y: 30, rotation: 0, systemInteraction: interaction({ interactionType: "custom_trigger" }) },
      { id: "o2", assetId: "tree_simple_01", kind: "nature", x: 40, y: 40, rotation: 0 },
    ],
  };

  const result = collectMapInteractables(map);

  assert.equal(result.length, 3);
  assert.deepEqual(result.map((item) => item.id).sort(), ["b1", "n1", "o1"]);
  assert.equal(result.find((item) => item.id === "b1")?.kind, "building");
  assert.equal(result.find((item) => item.id === "n1")?.kind, "npc");
  assert.equal(result.find((item) => item.id === "o1")?.kind, "object");
});

test("findNearestInteractable returns null when nothing is in range", () => {
  const map: PlayableMap = {
    ...baseMap(),
    buildings: [{ id: "b1", assetId: "house_small_01", function: "house", x: 500, y: 500, collision: null, systemInteraction: interaction({ radius: 20 }) }],
  };
  const interactables = collectMapInteractables(map);

  assert.equal(findNearestInteractable(interactables, { x: 0, y: 0 }), null);
});

test("findNearestInteractable returns the closest candidate within radius", () => {
  const map: PlayableMap = {
    ...baseMap(),
    buildings: [
      { id: "far", assetId: "house_small_01", function: "house", x: 100, y: 0, collision: null, systemInteraction: interaction({ radius: 200 }) },
      { id: "near", assetId: "house_small_01", function: "house", x: 10, y: 0, collision: null, systemInteraction: interaction({ radius: 200 }) },
    ],
  };
  const interactables = collectMapInteractables(map);

  const nearest = findNearestInteractable(interactables, { x: 0, y: 0 });
  assert.equal(nearest?.id, "near");
});

test("findNearestInteractable respects each interactable's own radius", () => {
  const map: PlayableMap = {
    ...baseMap(),
    buildings: [{ id: "b1", assetId: "house_small_01", function: "house", x: 50, y: 0, collision: null, systemInteraction: interaction({ radius: 10 }) }],
  };
  const interactables = collectMapInteractables(map);

  assert.equal(findNearestInteractable(interactables, { x: 0, y: 0 }), null);
  assert.equal(findNearestInteractable(interactables, { x: 45, y: 0 })?.id, "b1");
});

test("describeInteractionFeedback formats a readable label per interactionType", () => {
  assert.equal(
    describeInteractionFeedback(interaction({ interactionType: "open_time_gate", interactionTargetId: "era_glaciaire", promptLabel: "Enter Time Gate" })),
    "Enter Time Gate — Time Gate (era_glaciaire)"
  );
  assert.equal(
    describeInteractionFeedback(interaction({ interactionType: "start_dialogue", interactionTargetId: "npc_mira_intro", promptLabel: "Talk to Mira" })),
    "Talk to Mira — Dialogue (npc_mira_intro)"
  );
});

test("TEST_MAP_01 exposes real interactables for its authored building/object/npc", () => {
  const interactables = collectMapInteractables(TEST_MAP_01);
  const ids = interactables.map((item) => item.id).sort();

  assert.deepEqual(ids, ["chest_01", "house_01", "npc_mira"]);
  assert.equal(findNearestInteractable(interactables, { x: 176, y: 128 })?.id, "house_01");
});
