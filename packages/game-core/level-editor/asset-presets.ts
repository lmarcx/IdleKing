import type { GeometricAsset } from "./types.js";
import { SAMPLE_GEOMETRIC_ASSETS } from "./sample-assets.js";

const cloneWithId = (asset: GeometricAsset, id: string, name: string, tags: readonly string[]): GeometricAsset => ({
  ...asset,
  id,
  name,
  tags,
});

export const ASSET_CREATOR_PRESETS: readonly GeometricAsset[] = [
  ...SAMPLE_GEOMETRIC_ASSETS,
  cloneWithId(SAMPLE_GEOMETRIC_ASSETS[0], "preset_door_01", "Door", ["door", "building", "object"]),
  cloneWithId(SAMPLE_GEOMETRIC_ASSETS[0], "preset_window_01", "Window", ["window", "building"]),
  cloneWithId(SAMPLE_GEOMETRIC_ASSETS[0], "preset_roof_01", "Roof", ["roof", "building"]),
  cloneWithId(SAMPLE_GEOMETRIC_ASSETS[0], "preset_wall_01", "Wall", ["wall", "building"]),
  cloneWithId(SAMPLE_GEOMETRIC_ASSETS[2], "preset_column_01", "Column", ["column", "building"]),
  cloneWithId(SAMPLE_GEOMETRIC_ASSETS[1], "preset_grass_01", "Grass Blades", ["grass", "nature"]),
  cloneWithId(SAMPLE_GEOMETRIC_ASSETS[1], "preset_flower_01", "Flower", ["flower", "nature"]),
  cloneWithId(SAMPLE_GEOMETRIC_ASSETS[5], "preset_sign_01", "Sign", ["sign", "object"]),
];
