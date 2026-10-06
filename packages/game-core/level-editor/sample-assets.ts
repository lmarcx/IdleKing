import type { GeometricAsset } from "./types.js";

export const SAMPLE_GEOMETRIC_ASSETS: readonly GeometricAsset[] = [
  {
    id: "house_small_01",
    name: "Small House 01",
    category: "buildings",
    style: "minimal-geometric",
    parts: [
      { id: "wall", shape: "rect", x: 0, y: 20, width: 80, height: 60, fill: "#222222", stroke: "#dddddd", strokeWidth: 2, opacity: 1, rotation: 0, layer: 1 },
      { id: "roof", shape: "triangle", x: 40, y: 0, width: 96, height: 42, fill: "#111111", stroke: "#f0f0f0", strokeWidth: 2, opacity: 1, rotation: 0, layer: 2 },
      { id: "door", shape: "rect", x: 30, y: 45, width: 20, height: 35, fill: "#0f0f0f", stroke: "#cfcfcf", strokeWidth: 1, opacity: 1, rotation: 0, layer: 3 },
    ],
    defaultCollision: { type: "box", x: 0, y: 20, width: 80, height: 60 },
    defaultInteraction: { type: "open_menu", target: "house_menu", label: "Enter" },
    tags: ["building", "village", "house"],
  },
  {
    id: "tree_simple_01",
    name: "Simple Tree 01",
    category: "nature",
    style: "minimal-geometric",
    parts: [
      { id: "trunk", shape: "rect", x: 22, y: 36, width: 12, height: 34, fill: "#191919", stroke: "#bdbdbd", strokeWidth: 1, opacity: 1, rotation: 0, layer: 1 },
      { id: "crown", shape: "circle", x: 28, y: 24, radius: 28, fill: "#232923", stroke: "#dedede", strokeWidth: 2, opacity: 0.95, rotation: 0, layer: 2 },
    ],
    defaultCollision: { type: "circle", x: 28, y: 58, radius: 14 },
    defaultInteraction: { type: "inspect", label: "Tree" },
    tags: ["nature", "tree"],
  },
  {
    id: "rock_simple_01",
    name: "Simple Rock 01",
    category: "nature",
    style: "minimal-geometric",
    parts: [
      { id: "body", shape: "polygon", x: 0, y: 0, points: [{ x: 6, y: 28 }, { x: 24, y: 8 }, { x: 48, y: 14 }, { x: 58, y: 36 }, { x: 36, y: 50 }, { x: 12, y: 44 }], fill: "#202020", stroke: "#cfcfcf", strokeWidth: 2, opacity: 1, rotation: 0, layer: 1 },
    ],
    defaultCollision: { type: "box", x: 8, y: 18, width: 46, height: 30 },
    defaultInteraction: { type: "inspect", label: "Rock" },
    tags: ["nature", "rock"],
  },
  {
    id: "villager_simple_01",
    name: "Simple NPC 01",
    category: "characters",
    style: "minimal-geometric",
    parts: [
      { id: "body", shape: "triangle", x: 24, y: 30, width: 32, height: 42, fill: "#1b1b1b", stroke: "#d7d7d7", strokeWidth: 2, opacity: 1, rotation: 180, layer: 1 },
      { id: "head", shape: "circle", x: 24, y: 14, radius: 12, fill: "#242424", stroke: "#f1f1f1", strokeWidth: 2, opacity: 1, rotation: 0, layer: 2 },
    ],
    defaultCollision: { type: "circle", x: 24, y: 50, radius: 16 },
    defaultInteraction: { type: "dialogue", target: "npc_intro", label: "Talk" },
    tags: ["npc", "character"],
  },
  {
    id: "enemy_shard_01",
    name: "Shard Enemy 01",
    category: "enemies",
    style: "minimal-geometric",
    parts: [
      { id: "body", shape: "polygon", x: 0, y: 0, points: [{ x: 24, y: 0 }, { x: 48, y: 30 }, { x: 24, y: 64 }, { x: 0, y: 30 }], fill: "#070707", stroke: "#f2f2f2", strokeWidth: 3, opacity: 1, rotation: 0, layer: 1 },
      { id: "eye", shape: "line", x: 15, y: 30, width: 18, height: 0, fill: "#f2f2f2", stroke: "#f2f2f2", strokeWidth: 3, opacity: 1, rotation: 0, layer: 2 },
    ],
    defaultCollision: { type: "circle", x: 24, y: 34, radius: 20 },
    defaultInteraction: null,
    tags: ["enemy", "hostile"],
  },
  {
    id: "chest_simple_01",
    name: "Simple Chest 01",
    category: "objects",
    style: "minimal-geometric",
    parts: [
      { id: "box", shape: "rect", x: 0, y: 18, width: 48, height: 28, fill: "#181818", stroke: "#eeeeee", strokeWidth: 2, opacity: 1, rotation: 0, layer: 1 },
      { id: "lid", shape: "line", x: 0, y: 28, width: 48, height: 0, fill: "#eeeeee", stroke: "#eeeeee", strokeWidth: 2, opacity: 1, rotation: 0, layer: 2 },
      { id: "lock", shape: "circle", x: 24, y: 34, radius: 4, fill: "#eeeeee", stroke: "#eeeeee", strokeWidth: 1, opacity: 1, rotation: 0, layer: 3 },
    ],
    defaultCollision: { type: "box", x: 0, y: 18, width: 48, height: 28 },
    defaultInteraction: { type: "inspect", target: "chest_loot", label: "Open" },
    tags: ["object", "loot", "chest"],
  },
] as const;

export function getSampleAsset(id: string): GeometricAsset | undefined {
  return SAMPLE_GEOMETRIC_ASSETS.find((asset) => asset.id === id);
}
