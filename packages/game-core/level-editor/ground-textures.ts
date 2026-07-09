import type { GroundTexture } from "./types.js";

export const GROUND_TEXTURES: readonly GroundTexture[] = [
  { id: "grass", name: "Grass", fill: "#1f2a1f", stroke: "#9ca39c", walkable: true, movementModifier: 1 },
  { id: "dirt", name: "Dirt", fill: "#27211c", stroke: "#9a9186", walkable: true, movementModifier: 0.95 },
  { id: "sand", name: "Sand", fill: "#2d2a20", stroke: "#c8c0a8", walkable: true, movementModifier: 0.85 },
  { id: "water", name: "Water", fill: "#17232b", stroke: "#8fb4c7", walkable: false, movementModifier: 0.5 },
  { id: "rock", name: "Rock", fill: "#202020", stroke: "#a6a6a6", walkable: true, movementModifier: 0.75 },
  { id: "ice", name: "Ice", fill: "#20282b", stroke: "#d6eef2", walkable: true, movementModifier: 1.15 },
  { id: "lava", name: "Lava", fill: "#321515", stroke: "#e6a08c", walkable: false, damage: 10 },
  { id: "stone", name: "Stone", fill: "#242424", stroke: "#d0d0d0", walkable: true, movementModifier: 1 },
  { id: "void", name: "Void", fill: "#050505", stroke: "#333333", walkable: false },
] as const;

export function getGroundTexture(id: string): GroundTexture | undefined {
  return GROUND_TEXTURES.find((texture) => texture.id === id);
}
