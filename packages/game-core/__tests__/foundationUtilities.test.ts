import test from "node:test";
import assert from "node:assert/strict";

import { createSeededRng } from "../random/rng.js";
import {
  assertValidRegistries,
  defineRegistry,
  validateRegistries,
} from "../registry/validation.js";

function floatSequence(seed: number): number[] {
  const rng = createSeededRng(seed);
  return Array.from({ length: 6 }, () => rng.nextFloat());
}

test("seeded RNG returns the same sequence for the same seed", () => {
  assert.deepEqual(floatSequence(12345), floatSequence(12345));
});

test("seeded RNG returns different sequences for different seeds", () => {
  assert.notDeepEqual(floatSequence(12345), floatSequence(54321));
});

test("seeded RNG nextInt respects inclusive bounds", () => {
  const rng = createSeededRng(101);

  for (let index = 0; index < 200; index++) {
    const value = rng.nextInt(3, 7);
    assert.ok(value >= 3 && value <= 7);
  }

  assert.equal(rng.nextInt(4, 4), 4);
});

test("seeded RNG pickWeighted is deterministic", () => {
  const entries = [
    { value: "COMMON", weight: 50 },
    { value: "UNCOMMON", weight: 25 },
    { value: "RARE", weight: 15 },
    { value: "EPIC", weight: 8 },
    { value: "LEGENDARY", weight: 2 },
  ] as const;

  function picks(seed: number) {
    const rng = createSeededRng(seed);
    return Array.from({ length: 8 }, () => rng.pickWeighted(entries));
  }

  assert.deepEqual(picks(2026), picks(2026));
});

type ItemDef = {
  id: string;
};

type RecipeDef = {
  id: string;
  outputItemId: string;
};

function itemRegistry(entries: readonly ItemDef[]) {
  return defineRegistry({
    name: "items",
    entries,
  });
}

function recipeRegistry(entries: readonly RecipeDef[]) {
  return defineRegistry({
    name: "recipes",
    entries,
    references: [
      {
        field: "outputItemId",
        targetRegistry: "items",
        select: (recipe) => recipe.outputItemId,
      },
    ],
  });
}

test("registry validation passes when ids and references are valid", () => {
  const registries = [
    itemRegistry([{ id: "training_sword" }]),
    recipeRegistry([{ id: "craft_training_sword", outputItemId: "training_sword" }]),
  ];

  assert.deepEqual(validateRegistries(registries), []);
  assert.doesNotThrow(() => assertValidRegistries(registries));
});

test("registry validation throws a readable error for a broken reference", () => {
  const registries = [
    itemRegistry([{ id: "training_sword" }]),
    recipeRegistry([{ id: "craft_missing_item", outputItemId: "missing_item" }]),
  ];

  assert.throws(
    () => assertValidRegistries(registries),
    /Registry "recipes": source "craft_missing_item" field "outputItemId" references missing "missing_item" in registry "items"/
  );
});

test("registry validation throws a readable error for a duplicate id", () => {
  const registries = [
    itemRegistry([{ id: "training_sword" }, { id: "training_sword" }]),
  ];

  assert.throws(
    () => assertValidRegistries(registries),
    /Registry "items" has duplicate id "training_sword"/
  );
});
