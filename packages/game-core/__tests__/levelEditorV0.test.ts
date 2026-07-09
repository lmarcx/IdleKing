import assert from "node:assert/strict";
import test from "node:test";

import {
  ASSET_PALETTE_CATEGORIES,
  createAssetRegistry,
  getAssetsByCategory,
  isMapCellWalkable,
  loadPlayableMap,
  TEST_MAP_01,
  validatePlayableMap,
} from "../level-editor/index.js";

test("level editor asset registry exposes palette categories and sample assets", () => {
  const registry = createAssetRegistry();

  assert.ok(ASSET_PALETTE_CATEGORIES.includes("buildings"));
  assert.ok(ASSET_PALETTE_CATEGORIES.includes("enemies"));
  assert.equal(getAssetsByCategory(registry, "buildings").some((asset) => asset.id === "house_small_01"), true);
  assert.equal(getAssetsByCategory(registry, "characters").some((asset) => asset.id === "villager_simple_01"), true);
  assert.equal(registry.textures.length >= 5, true);
});

test("test map validates and blocks dead topography cells", () => {
  const result = validatePlayableMap(TEST_MAP_01);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);

  assert.equal(isMapCellWalkable(TEST_MAP_01, 1, 1), true);
  assert.equal(isMapCellWalkable(TEST_MAP_01, 8, 6), false);
  assert.equal(isMapCellWalkable(TEST_MAP_01, 0, 0), false);

  const loaded = loadPlayableMap(TEST_MAP_01);
  assert.equal(loaded.widthPx, TEST_MAP_01.grid.width * TEST_MAP_01.grid.cellSize);
  assert.equal(loaded.blockingCells.has("8:6"), true);
  assert.equal(loaded.collisions.length >= 1, true);
});
