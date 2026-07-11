import * as PIXI from "pixi.js";
import type { AssetRegistry, MapBuilding, MapNpc, MapObject } from "@idleking/game-core/level-editor";

import { createAssetGraphic } from "./asset-graphics";
import { addEntityBadge, addWorldLabel } from "./world-labels";

/** Resolves `assetId` in the registry and places its graphic at (x, y), with an optional label. */
export function placeAssetGraphic(
  world: PIXI.Container,
  labels: PIXI.Container,
  registry: AssetRegistry,
  assetId: string,
  x: number,
  y: number,
  label?: string,
): void {
  const asset = registry.assets.find((item) => item.id === assetId);
  if (!asset) return;
  const graphic = createAssetGraphic(asset);
  graphic.position.set(x, y);
  graphic.zIndex = y;
  world.addChild(graphic);
  if (label) addWorldLabel(labels, label, x + 32, y - 8);
}

export function renderMapObject(world: PIXI.Container, labels: PIXI.Container, registry: AssetRegistry, object: MapObject): void {
  placeAssetGraphic(world, labels, registry, object.assetId, object.x, object.y, object.interaction?.label ?? object.id);
  addEntityBadge(world, labels, object.kind === "nature" ? "N" : "O", object.x + 8, object.y + 8, object.kind === "nature" ? 0x9ce0a4 : 0xf2f2f2);
}

export function renderMapBuilding(world: PIXI.Container, labels: PIXI.Container, registry: AssetRegistry, building: MapBuilding): void {
  placeAssetGraphic(world, labels, registry, building.assetId, building.x, building.y, building.interaction?.label ?? building.function);
  addEntityBadge(world, labels, "B", building.x + 8, building.y + 8, 0xffffff);
}

export function renderMapNpc(world: PIXI.Container, labels: PIXI.Container, registry: AssetRegistry, npc: MapNpc): void {
  placeAssetGraphic(world, labels, registry, npc.assetId, npc.x, npc.y, npc.name);
  addEntityBadge(world, labels, "P", npc.x + 8, npc.y + 8, 0xa7dcff);
}
