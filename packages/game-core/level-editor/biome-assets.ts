import type { AssetCategory, CollisionShape, GeometricAsset, PrimitivePart } from "./types.js";

/**
 * Biome decor packs for the level editor (one pack per Story layout theme: wastelands, funeral,
 * ash, glacial, academy, abyss). Same minimal-geometric B&W grammar as the sample assets: dark
 * fills, light strokes, shape carries identity. Tagged `biome:<theme>` for palette filtering.
 */
type PartInput = Omit<PrimitivePart, "fill" | "stroke" | "strokeWidth" | "opacity" | "rotation" | "layer"> &
  Partial<Pick<PrimitivePart, "fill" | "stroke" | "strokeWidth" | "opacity" | "rotation" | "layer">>;

const DARK = "#1a1a1a";
const MID = "#3a3a3a";
const LIGHT = "#d7d7d7";

function part(input: PartInput, layer: number): PrimitivePart {
  return {
    fill: DARK,
    stroke: LIGHT,
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
    ...input,
    layer: input.layer ?? layer,
  };
}

function asset(
  id: string,
  name: string,
  category: AssetCategory,
  biome: string,
  parts: readonly PartInput[],
  collision: CollisionShape | null,
  tags: readonly string[],
): GeometricAsset {
  return {
    id,
    name,
    category,
    style: "minimal-geometric",
    parts: parts.map((input, index) => part(input, index + 1)),
    defaultCollision: collision,
    defaultInteraction: null,
    tags: [`biome:${biome}`, ...tags],
  };
}

const pts = (...values: number[]) => {
  const points: { x: number; y: number }[] = [];
  for (let index = 0; index < values.length; index += 2) points.push({ x: values[index], y: values[index + 1] });
  return points;
};

export const BIOME_DECOR_ASSETS: readonly GeometricAsset[] = [
  // Wastelands (Prologue)
  asset("wastes_broken_column", "Colonne brisée", "objects", "wastelands", [
    { id: "base", shape: "rect", x: 4, y: 52, width: 40, height: 12, fill: MID },
    { id: "shaft", shape: "polygon", x: 0, y: 0, points: pts(10, 52, 10, 14, 22, 4, 26, 20, 38, 10, 38, 52) },
    { id: "flute", shape: "line", x: 24, y: 22, width: 0, height: 28, stroke: "#9a9a9a" },
  ], { type: "box", x: 4, y: 40, width: 40, height: 24 }, ["ruin", "column"]),
  asset("wastes_dead_tree", "Arbre mort", "nature", "wastelands", [
    { id: "trunk", shape: "polygon", x: 0, y: 0, points: pts(26, 70, 30, 30, 18, 12, 24, 10, 32, 24, 40, 6, 46, 8, 36, 32, 36, 70) },
  ], { type: "circle", x: 31, y: 64, radius: 8 }, ["tree", "dead"]),
  asset("wastes_skull", "Crâne", "objects", "wastelands", [
    { id: "head", shape: "circle", x: 16, y: 14, radius: 12 },
    { id: "jaw", shape: "rect", x: 10, y: 22, width: 12, height: 8 },
    { id: "eye", shape: "circle", x: 12, y: 14, radius: 3, fill: LIGHT },
  ], null, ["bones", "decoration"]),
  asset("wastes_dune", "Dune de cendre", "nature", "wastelands", [
    { id: "dune", shape: "polygon", x: 0, y: 0, points: pts(0, 30, 24, 8, 50, 4, 80, 30), fill: MID, opacity: 0.8 },
  ], null, ["ground", "decoration"]),

  // Funeral (Mausolée, Rive Figée, Vestige)
  asset("funeral_tomb", "Tombe", "objects", "funeral", [
    { id: "stone", shape: "rect", x: 8, y: 4, width: 32, height: 48, fill: MID },
    { id: "cross_v", shape: "line", x: 24, y: 12, width: 0, height: 22 },
    { id: "cross_h", shape: "line", x: 16, y: 20, width: 16, height: 0 },
    { id: "plinth", shape: "rect", x: 2, y: 52, width: 44, height: 10 },
  ], { type: "box", x: 2, y: 40, width: 44, height: 22 }, ["tomb", "grave"]),
  asset("funeral_coffin", "Sarcophage", "objects", "funeral", [
    { id: "lid", shape: "polygon", x: 0, y: 0, points: pts(14, 0, 34, 0, 44, 16, 36, 76, 12, 76, 4, 16), fill: MID },
    { id: "seam", shape: "line", x: 24, y: 6, width: 0, height: 64, stroke: "#9a9a9a" },
  ], { type: "box", x: 4, y: 0, width: 40, height: 76 }, ["coffin", "mausoleum"]),
  asset("funeral_candles", "Cierges", "objects", "funeral", [
    { id: "c1", shape: "rect", x: 4, y: 14, width: 6, height: 20 },
    { id: "c2", shape: "rect", x: 16, y: 8, width: 6, height: 26 },
    { id: "f1", shape: "triangle", x: 7, y: 8, width: 6, height: 8, fill: LIGHT },
    { id: "f2", shape: "triangle", x: 19, y: 2, width: 6, height: 8, fill: LIGHT },
  ], null, ["light", "decoration"]),
  asset("funeral_willow", "Saule pleureur", "nature", "funeral", [
    { id: "trunk", shape: "rect", x: 26, y: 36, width: 10, height: 36 },
    { id: "crown", shape: "polygon", x: 0, y: 0, points: pts(4, 60, 10, 20, 31, 4, 52, 20, 58, 60, 46, 40, 31, 50, 16, 40), fill: MID, opacity: 0.95 },
  ], { type: "circle", x: 31, y: 66, radius: 10 }, ["tree", "river"]),

  // Ash (Pic des Cendres)
  asset("ash_lava_rock", "Roche de lave", "nature", "ash", [
    { id: "rock", shape: "polygon", x: 0, y: 0, points: pts(4, 40, 14, 10, 40, 4, 58, 26, 50, 48, 18, 52) },
    { id: "vein", shape: "line", x: 20, y: 18, width: 22, height: 20, stroke: "#9a9a9a", strokeWidth: 3 },
  ], { type: "circle", x: 30, y: 28, radius: 22 }, ["rock", "lava"]),
  asset("ash_dragon_bone", "Côte de dragon", "objects", "ash", [
    { id: "rib1", shape: "polygon", x: 0, y: 0, points: pts(4, 70, 10, 30, 30, 6, 34, 12, 18, 34, 14, 70), fill: "#c9c9c9", stroke: DARK },
    { id: "rib2", shape: "polygon", x: 0, y: 0, points: pts(30, 70, 34, 34, 52, 12, 56, 18, 42, 38, 40, 70), fill: "#c9c9c9", stroke: DARK },
  ], { type: "box", x: 4, y: 40, width: 52, height: 30 }, ["bones", "dragon"]),
  asset("ash_ember_vent", "Évent de braises", "puzzle", "ash", [
    { id: "ring", shape: "circle", x: 24, y: 24, radius: 20, fill: MID },
    { id: "core", shape: "circle", x: 24, y: 24, radius: 8, fill: LIGHT, opacity: 0.85 },
  ], null, ["hazard", "fire"]),

  // Glacial (Ère Glaciaire)
  asset("glacial_ice_crystal", "Cristal de glace", "nature", "glacial", [
    { id: "big", shape: "polygon", x: 0, y: 0, points: pts(24, 0, 36, 30, 28, 72, 16, 72, 10, 30), fill: MID, stroke: "#f2f2f2" },
    { id: "small", shape: "polygon", x: 0, y: 0, points: pts(42, 28, 52, 48, 46, 72, 36, 72, 34, 48), fill: DARK, stroke: "#f2f2f2" },
  ], { type: "box", x: 10, y: 44, width: 42, height: 28 }, ["ice", "crystal"]),
  asset("glacial_frozen_pine", "Sapin gelé", "nature", "glacial", [
    { id: "crown", shape: "triangle", x: 28, y: 0, width: 52, height: 62, fill: MID, stroke: "#f2f2f2" },
    { id: "trunk", shape: "rect", x: 24, y: 60, width: 8, height: 14 },
  ], { type: "circle", x: 28, y: 66, radius: 10 }, ["tree", "pine", "frostpine"]),
  asset("glacial_snow_mound", "Congère", "nature", "glacial", [
    { id: "mound", shape: "polygon", x: 0, y: 0, points: pts(0, 26, 16, 8, 40, 2, 62, 10, 76, 26), fill: "#9a9a9a", stroke: "#f2f2f2", opacity: 0.85 },
  ], null, ["snow", "decoration"]),
  asset("glacial_frozen_camp", "Tente abandonnée", "buildings", "glacial", [
    { id: "tent", shape: "triangle", x: 36, y: 6, width: 68, height: 50, fill: MID },
    { id: "flap", shape: "triangle", x: 36, y: 26, width: 18, height: 30, fill: DARK },
    { id: "snow", shape: "line", x: 10, y: 22, width: 52, height: 0, stroke: "#f2f2f2", strokeWidth: 3 },
  ], { type: "box", x: 2, y: 20, width: 68, height: 36 }, ["camp", "survivors"]),

  // Academy (Tour de la Chute Blanche, Académie d'Arathas)
  asset("academy_bookshelf", "Bibliothèque", "objects", "academy", [
    { id: "frame", shape: "rect", x: 0, y: 0, width: 56, height: 72 },
    { id: "s1", shape: "line", x: 4, y: 24, width: 48, height: 0 },
    { id: "s2", shape: "line", x: 4, y: 48, width: 48, height: 0 },
    { id: "books", shape: "rect", x: 8, y: 6, width: 20, height: 16, fill: MID },
  ], { type: "box", x: 0, y: 0, width: 56, height: 72 }, ["books", "shelf"]),
  asset("academy_lectern", "Lutrin", "objects", "academy", [
    { id: "top", shape: "polygon", x: 0, y: 0, points: pts(4, 18, 40, 6, 44, 16, 8, 28), fill: MID },
    { id: "foot", shape: "rect", x: 20, y: 22, width: 6, height: 36 },
  ], { type: "circle", x: 23, y: 52, radius: 8 }, ["book", "study"]),
  asset("academy_arcane_circle", "Cercle arcanique", "puzzle", "academy", [
    { id: "outer", shape: "circle", x: 40, y: 40, radius: 36, fill: DARK, opacity: 0.6 },
    { id: "inner", shape: "triangle", x: 40, y: 12, width: 50, height: 48, fill: DARK, opacity: 0.6 },
    { id: "core", shape: "circle", x: 40, y: 42, radius: 5, fill: LIGHT },
  ], null, ["magic", "switch"]),
  asset("academy_broken_vial", "Fiole brisée", "objects", "academy", [
    { id: "glass", shape: "polygon", x: 0, y: 0, points: pts(10, 30, 14, 12, 12, 4, 22, 4, 20, 12, 26, 30), fill: MID },
    { id: "spill", shape: "circle", x: 30, y: 30, radius: 6, fill: "#9a9a9a", opacity: 0.7 },
  ], null, ["experiment", "decoration"]),

  // Abyss (Gouffre Royal)
  asset("abyss_coral", "Corail gelé", "nature", "abyss", [
    { id: "a", shape: "circle", x: 16, y: 34, radius: 14, fill: MID },
    { id: "b", shape: "circle", x: 34, y: 20, radius: 12 },
    { id: "c", shape: "circle", x: 40, y: 42, radius: 10, fill: MID },
  ], { type: "circle", x: 28, y: 34, radius: 20 }, ["coral", "water"]),
  asset("abyss_giant_shell", "Coquille géante", "objects", "abyss", [
    { id: "shell", shape: "polygon", x: 0, y: 0, points: pts(4, 44, 32, 2, 60, 44), fill: MID },
    { id: "r1", shape: "line", x: 32, y: 6, width: -16, height: 36 },
    { id: "r2", shape: "line", x: 32, y: 6, width: 16, height: 36 },
  ], { type: "box", x: 4, y: 20, width: 56, height: 24 }, ["shell", "water"]),
  asset("abyss_frozen_seaweed", "Algues figées", "nature", "abyss", [
    { id: "w1", shape: "polygon", x: 0, y: 0, points: pts(6, 60, 2, 40, 8, 20, 4, 0, 10, 20, 14, 40, 10, 60), fill: MID },
    { id: "w2", shape: "polygon", x: 0, y: 0, points: pts(22, 60, 18, 36, 26, 14, 30, 34, 26, 60), fill: DARK },
  ], null, ["plant", "water"]),
  asset("abyss_sunken_statue", "Statue engloutie", "objects", "abyss", [
    { id: "body", shape: "polygon", x: 0, y: 0, points: pts(10, 80, 14, 30, 6, 24, 24, 8, 42, 24, 34, 30, 38, 80) },
    { id: "head", shape: "circle", x: 24, y: 10, radius: 9, fill: MID },
  ], { type: "box", x: 6, y: 40, width: 36, height: 40 }, ["statue", "noah", "ruin"]),
];
