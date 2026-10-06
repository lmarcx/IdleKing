import type { GroundTextureId, MapManifest, PlayableMap } from "./types.js";

export const TEST_MAP_01: PlayableMap = {
  id: "test_map_01",
  name: "Test Map 01",
  version: 1,
  world: "kingdom",
  mode: "story",
  chapter: "chapter_01",
  grid: { width: 20, height: 14, cellSize: 32 },
  topography: {
    cells: [
      ...Array.from({ length: 20 }, (_, x) => ({ x, y: 0, state: "boundary" as const })),
      ...Array.from({ length: 20 }, (_, x) => ({ x, y: 13, state: "boundary" as const })),
      ...Array.from({ length: 12 }, (_, y) => ({ x: 0, y: y + 1, state: "boundary" as const })),
      ...Array.from({ length: 12 }, (_, y) => ({ x: 19, y: y + 1, state: "boundary" as const })),
      { x: 8, y: 6, state: "dead" },
      { x: 9, y: 6, state: "dead" },
      { x: 10, y: 6, state: "dead" },
      { x: 12, y: 4, state: "dead" },
      { x: 13, y: 4, state: "dead" },
      { x: 16, y: 10, state: "void" },
    ],
  },
  tiles: [
    ...Array.from({ length: 20 * 14 }, (_, index) => {
      const x = index % 20;
      const y = Math.floor(index / 20);
      const textureId: GroundTextureId = y === 0 || y === 13 || x === 0 || x === 19 ? "rock" : y > 9 ? "dirt" : x > 14 ? "sand" : "grass";
      return { x, y, textureId, walkable: textureId !== "rock" };
    }),
    { x: 8, y: 6, textureId: "water", walkable: false },
    { x: 9, y: 6, textureId: "water", walkable: false },
    { x: 10, y: 6, textureId: "water", walkable: false },
    { x: 4, y: 9, textureId: "ice", walkable: true, movementModifier: 1.15 },
    { x: 5, y: 9, textureId: "ice", walkable: true, movementModifier: 1.15 },
    { x: 12, y: 4, textureId: "lava", walkable: false, damage: 10 },
    { x: 13, y: 4, textureId: "lava", walkable: false, damage: 10 },
    { x: 16, y: 10, textureId: "stone", walkable: true },
  ],
  objects: [
    { id: "tree_01", assetId: "tree_simple_01", kind: "nature", x: 96, y: 96, rotation: 0, interaction: { type: "inspect", label: "Old tree" } },
    { id: "rock_01", assetId: "rock_simple_01", kind: "nature", x: 460, y: 116, rotation: 0 },
    {
      id: "chest_01",
      assetId: "chest_simple_01",
      kind: "object",
      x: 486,
      y: 326,
      rotation: 0,
      interaction: { type: "inspect", target: "starter_chest", label: "Open chest" },
      systemInteraction: { interactionType: "custom_trigger", interactionTargetId: "starter_chest", promptLabel: "Open chest", radius: 44 },
    },
  ],
  buildings: [
    {
      id: "house_01",
      assetId: "house_small_01",
      function: "quest_location",
      x: 176,
      y: 128,
      collision: { type: "box", x: 176, y: 148, width: 80, height: 60 },
      interaction: { type: "open_menu", target: "house_01_menu", label: "Enter house" },
      systemInteraction: { interactionType: "open_building_modal", interactionTargetId: "house_01_menu", promptLabel: "Enter house", radius: 56 },
    },
  ],
  npcs: [
    {
      id: "npc_mira",
      assetId: "villager_simple_01",
      name: "Mira",
      type: "guide",
      behavior: "dialogue_only",
      interaction: "dialogue",
      x: 246,
      y: 292,
      systemInteraction: { interactionType: "start_dialogue", interactionTargetId: "npc_mira_intro", promptLabel: "Talk to Mira", radius: 52 },
    },
  ],
  enemies: [
    {
      id: "enemy_shard_alpha",
      assetId: "enemy_shard_01",
      enemyId: "shard_alpha",
      name: "Shard Alpha",
      stats: { hp: 30, attack: 5, defense: 1, speed: 70 },
      behavior: "guard_area",
      aggroRadius: 120,
      loot: ["stone"],
      deathEvent: "enemy_group_01_defeated",
      x: 456,
      y: 256,
    },
  ],
  collisions: [
    { id: "manual_wall_01", type: "box", x: 352, y: 64, width: 32, height: 160 },
    { id: "water_block_01", type: "box", x: 256, y: 192, width: 96, height: 32 },
  ],
  triggers: [
    { id: "exit_north", type: "enter_map", x: 288, y: 32, width: 64, height: 24, target: "next_test_map" },
  ],
  puzzles: [
    { id: "lever_01_opens_gate_01", sourceId: "lever_01", action: "opens", targetId: "gate_01", condition: "inspect lever_01" },
    { id: "enemy_group_opens_gate_01", sourceId: "enemy_group_01", action: "opens", targetId: "gate_01", condition: "enemy_group_01 defeated" },
  ],
  spawns: [{ id: "player_start", x: 64, y: 64 }],
  metadata: { createdWith: "AWorldDreamtLevelEditor", style: "minimal-geometric" },
} as const;

export const MAP_MANIFEST: MapManifest = {
  maps: [
    {
      id: "test_map_01",
      name: "Test Map 01",
      path: "custom/test_map_01.map.json",
      world: "kingdom",
      mode: "story",
      chapter: "chapter_01",
      entry: true,
    },
  ],
} as const;

export const CUSTOM_MAPS: readonly PlayableMap[] = [TEST_MAP_01] as const;
