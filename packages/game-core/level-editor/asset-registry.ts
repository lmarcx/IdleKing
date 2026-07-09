import { GROUND_TEXTURES } from "./ground-textures.js";
import { SAMPLE_GEOMETRIC_ASSETS } from "./sample-assets.js";
import type { AssetCategory, AssetRegistry, GeometricAsset, GroundTexture } from "./types.js";

export const ASSET_PALETTE_CATEGORIES: readonly AssetCategory[] = [
  "textures",
  "nature",
  "buildings",
  "characters",
  "enemies",
  "objects",
  "puzzle",
  "collisions",
  "triggers",
] as const;

export function createAssetRegistry(input: {
  predefinedAssets?: readonly GeometricAsset[];
  customAssets?: readonly GeometricAsset[];
  textures?: readonly GroundTexture[];
} = {}): AssetRegistry {
  return {
    assets: [...(input.predefinedAssets ?? SAMPLE_GEOMETRIC_ASSETS), ...(input.customAssets ?? [])],
    textures: [...(input.textures ?? GROUND_TEXTURES)],
  };
}

export function getAssetsByCategory(registry: AssetRegistry, category: AssetCategory): readonly GeometricAsset[] {
  return registry.assets.filter((asset) => asset.category === category);
}

export function getRegistryAsset(registry: AssetRegistry, id: string): GeometricAsset | undefined {
  return registry.assets.find((asset) => asset.id === id);
}

export function assertValidAsset(asset: GeometricAsset): void {
  if (!asset.id.trim()) throw new Error("Asset id is required");
  if (!asset.name.trim()) throw new Error(`Asset ${asset.id} name is required`);
  if (asset.style !== "minimal-geometric") throw new Error(`Asset ${asset.id} must use minimal-geometric style`);
  if (asset.parts.length === 0) throw new Error(`Asset ${asset.id} needs at least one part`);
  const partIds = new Set<string>();
  for (const part of asset.parts) {
    if (partIds.has(part.id)) throw new Error(`Asset ${asset.id} has duplicate part id: ${part.id}`);
    partIds.add(part.id);
    if (part.opacity < 0 || part.opacity > 1) throw new Error(`Asset ${asset.id}.${part.id} opacity must be 0..1`);
    if (part.strokeWidth < 0) throw new Error(`Asset ${asset.id}.${part.id} strokeWidth must be positive`);
  }
}

export function assertValidAssetRegistry(registry: AssetRegistry): void {
  const ids = new Set<string>();
  for (const asset of registry.assets) {
    assertValidAsset(asset);
    if (ids.has(asset.id)) throw new Error(`Duplicate asset id: ${asset.id}`);
    ids.add(asset.id);
  }
}
