import { getDungeonEncounter, type DungeonEncounter } from "../enemies/encounters.js";
import { getEnemyArchetypeOrThrow } from "../enemies/registry.js";
import { getLevelScript } from "./levelScripts.js";
import { STORY_DUNGEON_REGISTRY } from "./progressionMvp.js";

/**
 * Story dungeon layouts — the spatial level design of each dungeon (LEVELDESIGN.md: successive
 * rooms, locked zones, scripted events, boss at the end).
 *
 * A layout is a chain of zones separated by gates. A gate stays closed until its condition is
 * met (the zone before it is cleared, or a narrative beat is done), so the player meets the
 * encounters and the story in order and cannot rush the boss. Geometry is in world pixels.
 *
 * The Prologue is hand-authored around its script; the other dungeons are built from their
 * encounter roster by a deterministic room template (`buildLinearLayout`) until they get
 * bespoke maps from the level editor.
 */

export type LayoutVec = Readonly<{ x: number; y: number }>;
export type LayoutRect = Readonly<{ x: number; y: number; width: number; height: number }>;

export type LayoutTheme = "wastelands" | "funeral" | "ash" | "glacial" | "academy" | "abyss";

export type LayoutObstacleKind = "wall" | "pillar" | "ruin" | "rock" | "tomb" | "crystal" | "shelf" | "coral";

export type LayoutObstacle = LayoutRect & Readonly<{ kind: LayoutObstacleKind }>;

export type GateCondition =
  | Readonly<{ kind: "zone_cleared"; zoneId: string }>
  | Readonly<{ kind: "beat_done"; beatId: string }>;

export type LayoutGate = Readonly<{
  id: string;
  rect: LayoutRect;
  opensWhen: GateCondition;
}>;

export type LayoutEnemyPlacement = Readonly<{
  archetypeId: string;
  x: number;
  y: number;
}>;

export type LayoutZone = Readonly<{
  id: string;
  label: string;
  rect: LayoutRect;
  enemies: readonly LayoutEnemyPlacement[];
  /** Enemies appear only once this beat is done (scripted ambush). Ignored on replays. */
  spawnOnBeat?: string;
}>;

export type LayoutBeatAnchor = Readonly<{
  beatId: string;
  x: number;
  y: number;
  /** Extra condition on top of "previous beat done". */
  requires?: Readonly<{ zoneCleared?: string; bossDefeated?: true }>;
}>;

export type DungeonLayout = Readonly<{
  dungeonId: string;
  theme: LayoutTheme;
  width: number;
  height: number;
  playerSpawn: LayoutVec;
  obstacles: readonly LayoutObstacle[];
  gates: readonly LayoutGate[];
  zones: readonly LayoutZone[];
  /** Ordered narrative beat anchors (LevelScript beats). Empty for unscripted dungeons. */
  beats: readonly LayoutBeatAnchor[];
}>;

const WALL = 60;

function rect(x: number, y: number, width: number, height: number): LayoutRect {
  return { x, y, width, height };
}

function obstacle(kind: LayoutObstacleKind, x: number, y: number, width: number, height: number): LayoutObstacle {
  return { kind, x, y, width, height };
}

/** Outer frame of the map. */
function borderWalls(width: number, height: number): LayoutObstacle[] {
  return [
    obstacle("wall", 0, 0, width, WALL),
    obstacle("wall", 0, height - WALL, width, WALL),
    obstacle("wall", 0, 0, WALL, height),
    obstacle("wall", width - WALL, 0, WALL, height),
  ];
}

/** Vertical wall at `x` with a door gap centred on `doorY`; returns the two wall pieces. */
function wallWithDoor(x: number, height: number, doorY: number, doorHeight: number): LayoutObstacle[] {
  const top = doorY - doorHeight / 2;
  const bottom = doorY + doorHeight / 2;
  return [obstacle("wall", x, WALL, WALL, top - WALL), obstacle("wall", x, bottom, WALL, height - WALL - bottom)];
}

// ---------------------------------------------------------------------------------------------
// Prologue — hand-authored around PROLOGUE_WASTELANDS_SCRIPT (AUDIT_GAMEPLAY §2.3)
// ---------------------------------------------------------------------------------------------
//
//  [A ruins]──door──[C ambush]──gate──[D arena + boss]
//       │ (north alcove)
//  [B the dog]
//
// A: arrival among broken columns (beat "ruins").
// B: dead-end alcove with the dying dog ("find_dog", "feed"); feeding opens the way east.
// C: the Shadows ambush spawns on "shadows"; clearing it opens the arena.
// D: the Amalgame ("amalgam"); after the kill: "drop_of_darkness", "billy_joins", "kingdom_found".

const PROLOGUE_W = 3400;
const PROLOGUE_H = 1500;
const PROLOGUE_LANE_Y = 900;

const PROLOGUE_LAYOUT: DungeonLayout = {
  dungeonId: "prologue_wastelands",
  theme: "wastelands",
  width: PROLOGUE_W,
  height: PROLOGUE_H,
  playerSpawn: { x: 200, y: PROLOGUE_LANE_Y },
  obstacles: [
    ...borderWalls(PROLOGUE_W, PROLOGUE_H),
    // Zone A/B separation: the alcove opens north of the arrival field.
    obstacle("wall", WALL, 560, 520, WALL),
    obstacle("wall", 840, 560, 320, WALL),
    // Broken columns in the arrival field.
    obstacle("ruin", 300, 700, 70, 70),
    obstacle("ruin", 520, 1080, 80, 60),
    obstacle("ruin", 760, 760, 60, 90),
    obstacle("ruin", 980, 1200, 90, 60),
    // Alcove debris.
    obstacle("rock", 260, 200, 90, 70),
    obstacle("rock", 900, 300, 80, 80),
    // A → C wall with a door.
    ...wallWithDoor(1200, PROLOGUE_H, PROLOGUE_LANE_Y, 240),
    // Ambush field cover.
    obstacle("ruin", 1480, 640, 80, 120),
    obstacle("ruin", 1720, 1080, 120, 70),
    obstacle("rock", 1960, 720, 70, 70),
    // C → D wall with the arena gate.
    ...wallWithDoor(2300, PROLOGUE_H, PROLOGUE_LANE_Y, 260),
    // Arena pillars.
    obstacle("pillar", 2560, 420, 60, 60),
    obstacle("pillar", 2560, 1320, 60, 60),
    obstacle("pillar", 3100, 420, 60, 60),
    obstacle("pillar", 3100, 1320, 60, 60),
  ],
  gates: [
    { id: "gate_ruins_to_ambush", rect: rect(1200, PROLOGUE_LANE_Y - 120, WALL, 240), opensWhen: { kind: "beat_done", beatId: "feed" } },
    { id: "gate_ambush_to_arena", rect: rect(2300, PROLOGUE_LANE_Y - 130, WALL, 260), opensWhen: { kind: "zone_cleared", zoneId: "ambush" } },
  ],
  zones: [
    { id: "arrival", label: "Ruines", rect: rect(WALL, 620, 1140, 820), enemies: [] },
    { id: "alcove", label: "Alcôve du chien", rect: rect(WALL, WALL, 1100, 500), enemies: [] },
    {
      id: "ambush",
      label: "Embuscade des Ombres",
      rect: rect(1260, WALL, 1040, PROLOGUE_H - 2 * WALL),
      spawnOnBeat: "shadows",
      enemies: [
        { archetypeId: "ombre_errante", x: 1620, y: 760 },
        { archetypeId: "ombre_errante", x: 1880, y: 1000 },
        { archetypeId: "ombre_errante", x: 2060, y: 820 },
        { archetypeId: "ombre_archer", x: 2160, y: 520 },
        { archetypeId: "ombre_brisee", x: 2100, y: 1200 },
      ],
    },
    {
      id: "arena",
      label: "Arène de l'Amalgame",
      rect: rect(2360, WALL, PROLOGUE_W - 2360 - WALL, PROLOGUE_H - 2 * WALL),
      enemies: [{ archetypeId: "boss_dark_amalgam", x: 2980, y: PROLOGUE_LANE_Y }],
    },
  ],
  beats: [
    { beatId: "ruins", x: 420, y: PROLOGUE_LANE_Y },
    { beatId: "find_dog", x: 620, y: 260 },
    { beatId: "feed", x: 700, y: 360 },
    { beatId: "shadows", x: 1380, y: PROLOGUE_LANE_Y },
    { beatId: "amalgam", x: 2460, y: PROLOGUE_LANE_Y, requires: { zoneCleared: "ambush" } },
    { beatId: "drop_of_darkness", x: 2980, y: PROLOGUE_LANE_Y, requires: { bossDefeated: true } },
    { beatId: "billy_joins", x: 2820, y: 640 },
    { beatId: "kingdom_found", x: 3200, y: PROLOGUE_LANE_Y },
  ],
};

// ---------------------------------------------------------------------------------------------
// Template layouts for the other dungeons
// ---------------------------------------------------------------------------------------------

const ROOM_W = 1000;
const ARENA_W = 1300;
const MAP_H = 1300;
const LANE_Y = MAP_H / 2;
const DOOR_H = 240;

const THEME_BY_DUNGEON: Readonly<Record<string, LayoutTheme>> = {
  funeral_mausoleum: "funeral",
  frozen_river: "funeral",
  time_vestige: "funeral",
  ashen_peak: "ash",
  silent_retreat_camp: "glacial",
  white_fall_tower: "academy",
  reflection_cavern: "glacial",
  arathas_academy: "academy",
  royal_abyss: "abyss",
  frost_source: "glacial",
};

const THEME_OBSTACLES: Readonly<Record<LayoutTheme, readonly LayoutObstacleKind[]>> = {
  wastelands: ["ruin", "rock"],
  funeral: ["tomb", "pillar"],
  ash: ["rock", "ruin"],
  glacial: ["crystal", "rock"],
  academy: ["shelf", "pillar"],
  abyss: ["coral", "rock"],
};

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Splits encounter groups into `roomCount` rooms, keeping their order. */
function splitGroups(encounter: DungeonEncounter, roomCount: number): string[][] {
  const archetypeIds = encounter.groups.flatMap((group) => Array.from({ length: group.count }, () => group.archetypeId));
  const rooms: string[][] = Array.from({ length: roomCount }, () => []);
  archetypeIds.forEach((archetypeId, index) => {
    rooms[Math.min(roomCount - 1, Math.floor((index * roomCount) / archetypeIds.length))].push(archetypeId);
  });
  return rooms;
}

export function buildLinearLayout(dungeonId: string): DungeonLayout | undefined {
  const encounter = getDungeonEncounter(dungeonId);
  if (!encounter) return undefined;
  const theme = THEME_BY_DUNGEON[dungeonId] ?? "wastelands";
  const random = seededRandom(hashSeed(dungeonId));
  const regularCount = encounter.groups.reduce((total, group) => total + group.count, 0);
  const roomCount = regularCount === 0 ? 0 : Math.max(2, Math.min(3, Math.ceil(regularCount / 3)));
  const hasBoss = Boolean(encounter.bossArchetypeId);
  const width = WALL * 2 + roomCount * ROOM_W + (hasBoss ? ARENA_W : 0) + (roomCount === 0 ? 600 : 0);

  const obstacles: LayoutObstacle[] = [...borderWalls(width, MAP_H)];
  const gates: LayoutGate[] = [];
  const zones: LayoutZone[] = [];
  const kinds = THEME_OBSTACLES[theme];
  const rooms = splitGroups(encounter, Math.max(roomCount, 1));

  for (let room = 0; room < roomCount; room += 1) {
    const x0 = WALL + room * ROOM_W;
    const zoneId = `room_${room + 1}`;
    // Cover: two obstacles per room, off the central lane.
    for (let index = 0; index < 2; index += 1) {
      const kind = kinds[index % kinds.length];
      const above = index === 0;
      const ox = x0 + 220 + Math.floor(random() * (ROOM_W - 480));
      // Cover hugs the top/bottom bands so the central lane (and every spawn) stays clear.
      const oy = above ? WALL + 40 + Math.floor(random() * 80) : MAP_H - WALL - 150 - Math.floor(random() * 80);
      obstacles.push(obstacle(kind, ox, oy, 70 + Math.floor(random() * 50), 60 + Math.floor(random() * 50)));
    }
    const ids = rooms[room];
    const enemies = ids.map((archetypeId, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const spreadY = (row % 3) - 1;
      return {
        archetypeId,
        x: x0 + (room === 0 ? 560 : 360) + column * 260 + Math.floor(random() * 60),
        y: LANE_Y + spreadY * 230 + Math.floor(random() * 60) - 30,
      };
    });
    zones.push({ id: zoneId, label: `Salle ${room + 1}`, rect: rect(x0, WALL, ROOM_W, MAP_H - 2 * WALL), enemies });

    const isLastRoom = room === roomCount - 1;
    if (!isLastRoom || hasBoss) {
      const wallX = x0 + ROOM_W - WALL;
      obstacles.push(...wallWithDoor(wallX, MAP_H, LANE_Y, DOOR_H));
      gates.push({
        id: `gate_${zoneId}`,
        rect: rect(wallX, LANE_Y - DOOR_H / 2, WALL, DOOR_H),
        opensWhen: { kind: "zone_cleared", zoneId },
      });
    }
  }

  if (hasBoss) {
    const arenaX = WALL + roomCount * ROOM_W;
    const arenaWidth = (roomCount === 0 ? ARENA_W + 600 : ARENA_W) - WALL;
    for (const [dx, dy] of [[0.25, 0.22], [0.25, 0.78], [0.75, 0.22], [0.75, 0.78]] as const) {
      obstacles.push(obstacle("pillar", arenaX + arenaWidth * dx, MAP_H * dy, 60, 60));
    }
    zones.push({
      id: "arena",
      label: "Arène",
      rect: rect(arenaX, WALL, arenaWidth, MAP_H - 2 * WALL),
      enemies: [{ archetypeId: encounter.bossArchetypeId!, x: arenaX + arenaWidth * 0.62, y: LANE_Y }],
    });
  }

  return {
    dungeonId,
    theme,
    width,
    height: MAP_H,
    playerSpawn: { x: WALL + 140, y: LANE_Y },
    obstacles,
    gates,
    zones,
    beats: [],
  };
}

const AUTHORED_LAYOUTS: Readonly<Record<string, DungeonLayout>> = {
  prologue_wastelands: PROLOGUE_LAYOUT,
};

const LAYOUT_CACHE = new Map<string, DungeonLayout | undefined>();

export function getDungeonLayout(dungeonId: string): DungeonLayout | undefined {
  if (!LAYOUT_CACHE.has(dungeonId)) {
    LAYOUT_CACHE.set(dungeonId, AUTHORED_LAYOUTS[dungeonId] ?? buildLinearLayout(dungeonId));
  }
  return LAYOUT_CACHE.get(dungeonId);
}

function contains(area: LayoutRect, point: LayoutVec, margin = 0): boolean {
  return (
    point.x >= area.x - margin &&
    point.x <= area.x + area.width + margin &&
    point.y >= area.y - margin &&
    point.y <= area.y + area.height + margin
  );
}

function overlapsCircle(area: LayoutRect, point: LayoutVec, radius: number): boolean {
  const nearestX = Math.max(area.x, Math.min(point.x, area.x + area.width));
  const nearestY = Math.max(area.y, Math.min(point.y, area.y + area.height));
  return Math.hypot(point.x - nearestX, point.y - nearestY) < radius;
}

/** Boot/test validation: placements are inside their zones, never inside walls, roster matches. */
export function validateDungeonLayout(layout: DungeonLayout): void {
  const where = `Layout ${layout.dungeonId}`;
  const solid = layout.obstacles;
  if (solid.some((wall) => overlapsCircle(wall, layout.playerSpawn, 24))) throw new Error(`${where}: player spawn inside an obstacle`);

  const zoneIds = new Set(layout.zones.map((zone) => zone.id));
  for (const zone of layout.zones) {
    for (const enemy of zone.enemies) {
      const archetype = getEnemyArchetypeOrThrow(enemy.archetypeId);
      if (!contains(zone.rect, enemy)) throw new Error(`${where}: ${enemy.archetypeId} outside zone ${zone.id}`);
      if (solid.some((wall) => overlapsCircle(wall, enemy, archetype.stats.radius))) {
        throw new Error(`${where}: ${enemy.archetypeId} at ${enemy.x},${enemy.y} overlaps an obstacle`);
      }
    }
  }
  for (const gate of layout.gates) {
    if (gate.opensWhen.kind === "zone_cleared" && !zoneIds.has(gate.opensWhen.zoneId)) {
      throw new Error(`${where}: gate ${gate.id} waits for unknown zone ${gate.opensWhen.zoneId}`);
    }
  }

  const script = getLevelScript(layout.dungeonId);
  const scriptBeatIds = script?.beats.map((beat) => beat.id) ?? [];
  const anchoredIds = layout.beats.map((beat) => beat.beatId);
  if (JSON.stringify(scriptBeatIds) !== JSON.stringify(anchoredIds)) {
    throw new Error(`${where}: beat anchors must follow the level script order`);
  }
  for (const gate of layout.gates) {
    if (gate.opensWhen.kind === "beat_done" && !anchoredIds.includes(gate.opensWhen.beatId)) {
      throw new Error(`${where}: gate ${gate.id} waits for unknown beat ${gate.opensWhen.beatId}`);
    }
  }
  for (const zone of layout.zones) {
    if (zone.spawnOnBeat && !anchoredIds.includes(zone.spawnOnBeat)) {
      throw new Error(`${where}: zone ${zone.id} spawns on unknown beat ${zone.spawnOnBeat}`);
    }
  }

  // The layout must place exactly the dungeon roster.
  const encounter = getDungeonEncounter(layout.dungeonId);
  if (encounter) {
    const expected = [
      ...encounter.groups.flatMap((group) => Array.from({ length: group.count }, () => group.archetypeId)),
      ...(encounter.bossArchetypeId ? [encounter.bossArchetypeId] : []),
    ].sort();
    const placed = layout.zones.flatMap((zone) => zone.enemies.map((enemy) => enemy.archetypeId)).sort();
    if (JSON.stringify(expected) !== JSON.stringify(placed)) throw new Error(`${where}: placements do not match the encounter roster`);
  }
}

export function validateDungeonLayouts(): void {
  for (const dungeon of STORY_DUNGEON_REGISTRY) {
    const layout = getDungeonLayout(dungeon.id);
    if (!layout) throw new Error(`Dungeon ${dungeon.id} has no layout`);
    validateDungeonLayout(layout);
  }
}
