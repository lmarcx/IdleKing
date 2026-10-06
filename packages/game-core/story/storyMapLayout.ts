import { getEnemyArchetypeOrThrow } from "../enemies/registry.js";
import { createAssetRegistry } from "../level-editor/asset-registry.js";
import type { AssetRegistry, CollisionShape, MapCollision, MapEnemy, MapTrigger, PlayableMap } from "../level-editor/types.js";
import type {
  DungeonLayout,
  LayoutBeatAnchor,
  LayoutDecor,
  LayoutFloor,
  LayoutGate,
  LayoutObstacle,
  LayoutObstacleKind,
  LayoutRect,
  LayoutTheme,
  LayoutZone,
} from "./dungeonLayouts.js";

/**
 * Bridge between the level editor and the Story runtime: a Story dungeon authored in the editor
 * (PlayableMap) is played as a DungeonLayout by the live explorer, and every existing layout can
 * be turned back into an editable PlayableMap.
 *
 * Map → layout conventions:
 * - obstacles: `collisions` (their `kind`, default "wall"); dead topography cells → "wall";
 *   non-walkable ground tiles (water, lava…) → invisible "barrier" (the floor draws them);
 *   decor whose asset has a collision → invisible "barrier" (the decor draws it);
 * - floor: painted ground tiles; decor: objects, buildings and NPCs (drawn, never fight);
 * - zones / gates / beats: triggers carrying a `story` role (see StoryTriggerRole);
 * - enemies: `enemyId` is an enemy archetype id; an enemy belongs to the first zone containing
 *   it, enemies outside every zone go to an implicit "open" zone covering the whole map;
 * - player spawn: the `player_start` spawn (or the first one).
 */

export const OPEN_ZONE_ID = "open";

const BEAT_TRIGGER_SIZE = 80;
const STORY_MAP_CELL_SIZE = 20;
const DEFAULT_ENEMY_ASSET_ID = "enemy_shard_01";

const OBSTACLE_KINDS: readonly LayoutObstacleKind[] = ["wall", "pillar", "ruin", "rock", "tomb", "crystal", "shelf", "coral", "barrier"];

function toObstacleKind(kind: string | undefined): LayoutObstacleKind {
  return OBSTACLE_KINDS.includes(kind as LayoutObstacleKind) ? (kind as LayoutObstacleKind) : "wall";
}

function triggerRect(trigger: MapTrigger): LayoutRect {
  return { x: trigger.x, y: trigger.y, width: trigger.width, height: trigger.height };
}

function containsPoint(area: LayoutRect, point: { x: number; y: number }): boolean {
  return point.x >= area.x && point.x <= area.x + area.width && point.y >= area.y && point.y <= area.y + area.height;
}

type CellBlock = { x0: number; x1: number; y0: number; y1: number };

/** Merges cells into rectangles: horizontal runs per row, then identical runs stacked. */
function mergeCells(cells: ReadonlySet<string>, gridWidth: number, gridHeight: number): CellBlock[] {
  if (cells.size === 0) return [];
  const open = new Map<string, CellBlock>();
  const done: CellBlock[] = [];

  for (let y = 0; y < gridHeight; y += 1) {
    const runs: { x0: number; x1: number }[] = [];
    for (let x = 0; x < gridWidth; x += 1) {
      if (!cells.has(`${x}:${y}`)) continue;
      const last = runs.at(-1);
      if (last && last.x1 === x - 1) last.x1 = x;
      else runs.push({ x0: x, x1: x });
    }
    const seen = new Set<string>();
    for (const run of runs) {
      const key = `${run.x0}:${run.x1}`;
      seen.add(key);
      const current = open.get(key);
      if (current && current.y1 === y - 1) current.y1 = y;
      else {
        if (current) done.push(current);
        open.set(key, { ...run, y0: y, y1: y });
      }
    }
    for (const [key, block] of open) {
      if (!seen.has(key)) {
        done.push(block);
        open.delete(key);
      }
    }
  }
  done.push(...open.values());
  return done;
}

type PaintedTile = { x: number; y: number; textureId: string; walkable: boolean };

/** Last painted tile per cell (the editor paints over earlier tiles). */
function paintedTiles(map: PlayableMap): Map<string, PaintedTile> {
  const tiles = new Map<string, PaintedTile>();
  for (const tile of map.tiles) {
    if (tile.x < 0 || tile.y < 0 || tile.x >= map.grid.width || tile.y >= map.grid.height) continue;
    tiles.set(`${tile.x}:${tile.y}`, { x: tile.x, y: tile.y, textureId: tile.textureId, walkable: tile.walkable });
  }
  return tiles;
}

/** Dead topography cells become walls; non-walkable painted tiles become invisible barriers. */
function blockingCellRects(map: PlayableMap, tiles: ReadonlyMap<string, PaintedTile>): LayoutObstacle[] {
  const walls = new Set<string>();
  for (const cell of map.topography.cells) {
    if (cell.state !== "playable") walls.add(`${cell.x}:${cell.y}`);
  }
  const barriers = new Set<string>();
  for (const [key, tile] of tiles) {
    if (!tile.walkable && !walls.has(key)) barriers.add(key);
  }
  const size = map.grid.cellSize;
  const toObstacles = (cells: ReadonlySet<string>, kind: LayoutObstacleKind): LayoutObstacle[] =>
    mergeCells(cells, map.grid.width, map.grid.height).map((block) => ({
      kind,
      x: block.x0 * size,
      y: block.y0 * size,
      width: (block.x1 - block.x0 + 1) * size,
      height: (block.y1 - block.y0 + 1) * size,
    }));
  return [...toObstacles(walls, "wall"), ...toObstacles(barriers, "barrier")];
}

function collisionRect(shape: CollisionShape | null | undefined, x: number, y: number): LayoutRect | undefined {
  if (!shape || shape.type === "none") return undefined;
  if (shape.type === "circle") {
    const radius = shape.radius ?? 0;
    return radius > 0 ? { x: x + shape.x - radius, y: y + shape.y - radius, width: radius * 2, height: radius * 2 } : undefined;
  }
  const width = shape.width ?? 0;
  const height = shape.height ?? 0;
  return width > 0 && height > 0 ? { x: x + shape.x, y: y + shape.y, width, height } : undefined;
}

function collectDecor(map: PlayableMap, registry: AssetRegistry): { decor: LayoutDecor[]; solids: LayoutObstacle[] } {
  const defaultCollision = (assetId: string) => registry.assets.find((asset) => asset.id === assetId)?.defaultCollision;
  const decor: LayoutDecor[] = [];
  const solids: LayoutObstacle[] = [];
  const addSolid = (area: LayoutRect | undefined) => {
    if (area) solids.push({ kind: "barrier", ...area });
  };
  for (const object of map.objects) {
    decor.push({ id: object.id, assetId: object.assetId, kind: object.kind, x: object.x, y: object.y, rotation: object.rotation });
    addSolid(collisionRect(defaultCollision(object.assetId), object.x, object.y));
  }
  for (const building of map.buildings) {
    decor.push({ id: building.id, assetId: building.assetId, kind: "building", x: building.x, y: building.y, rotation: 0 });
    addSolid(collisionRect(building.collision ?? defaultCollision(building.assetId), building.x, building.y));
  }
  // NPCs are drawn but never block the way.
  for (const npc of map.npcs) {
    decor.push({ id: npc.id, assetId: npc.assetId, kind: "npc", x: npc.x, y: npc.y, rotation: 0 });
  }
  return { decor, solids };
}

export type PlayableMapToLayoutOptions = Readonly<{
  theme?: LayoutTheme;
  /** Assets the decor resolves against (collisions). Defaults to the built-in registry. */
  registry?: AssetRegistry;
  /** LevelScript beat ids: beat anchors are sorted in this order (unknown ids go last). */
  beatOrder?: readonly string[];
}>;

export function playableMapToDungeonLayout(
  map: PlayableMap,
  dungeonId: string,
  options: PlayableMapToLayoutOptions = {},
): DungeonLayout {
  const width = map.grid.width * map.grid.cellSize;
  const height = map.grid.height * map.grid.cellSize;
  const spawn = map.spawns.find((candidate) => candidate.id === "player_start") ?? map.spawns[0];

  const tiles = paintedTiles(map);
  const { decor, solids } = collectDecor(map, options.registry ?? createAssetRegistry());
  const obstacles: LayoutObstacle[] = [
    ...map.collisions.map((collision) => ({
      kind: toObstacleKind(collision.kind),
      x: collision.x,
      y: collision.y,
      width: collision.width,
      height: collision.height,
    })),
    ...blockingCellRects(map, tiles),
    ...solids,
  ];
  const floor: LayoutFloor | undefined =
    tiles.size > 0
      ? { cellSize: map.grid.cellSize, tiles: [...tiles.values()].map(({ x, y, textureId }) => ({ x, y, textureId })) }
      : undefined;

  const gates: LayoutGate[] = [];
  const zoneDefs: { id: string; label: string; rect: LayoutRect; spawnOnBeat?: string }[] = [];
  const beats: LayoutBeatAnchor[] = [];
  for (const trigger of map.triggers) {
    const role = trigger.story;
    if (!role) continue;
    if (role.kind === "zone") {
      zoneDefs.push({
        id: role.zoneId,
        label: role.label ?? role.zoneId,
        rect: triggerRect(trigger),
        ...(role.spawnOnBeat ? { spawnOnBeat: role.spawnOnBeat } : {}),
      });
    } else if (role.kind === "gate") {
      gates.push({ id: trigger.id, rect: triggerRect(trigger), opensWhen: role.opensWhen });
    } else {
      beats.push({
        beatId: role.beatId,
        x: trigger.x + trigger.width / 2,
        y: trigger.y + trigger.height / 2,
        ...(role.requires ? { requires: role.requires } : {}),
      });
    }
  }

  const enemiesByZone = new Map<string, LayoutZone["enemies"][number][]>();
  for (const enemy of map.enemies) {
    const zone = zoneDefs.find((candidate) => containsPoint(candidate.rect, enemy));
    const zoneId = zone?.id ?? OPEN_ZONE_ID;
    const list = enemiesByZone.get(zoneId) ?? [];
    list.push({ archetypeId: enemy.enemyId, x: enemy.x, y: enemy.y });
    enemiesByZone.set(zoneId, list);
  }

  const zones: LayoutZone[] = zoneDefs.map((zone) => ({ ...zone, enemies: enemiesByZone.get(zone.id) ?? [] }));
  const openEnemies = enemiesByZone.get(OPEN_ZONE_ID);
  if (openEnemies && !zoneDefs.some((zone) => zone.id === OPEN_ZONE_ID)) {
    zones.push({ id: OPEN_ZONE_ID, label: map.name, rect: { x: 0, y: 0, width, height }, enemies: openEnemies });
  }

  if (options.beatOrder) {
    const order = options.beatOrder;
    const rank = (beatId: string) => {
      const index = order.indexOf(beatId);
      return index === -1 ? order.length : index;
    };
    beats.sort((left, right) => rank(left.beatId) - rank(right.beatId));
  }

  return {
    dungeonId,
    theme: options.theme ?? "wastelands",
    width,
    height,
    playerSpawn: { x: spawn?.x ?? width / 2, y: spawn?.y ?? height / 2 },
    obstacles,
    gates,
    zones,
    beats,
    ...(floor ? { floor } : {}),
    ...(decor.length > 0 ? { decor } : {}),
  };
}

export type LayoutToPlayableMapMeta = Readonly<{
  name: string;
  chapter: string;
}>;

function toMapEnemy(archetypeId: string, x: number, y: number, index: number): MapEnemy {
  const archetype = getEnemyArchetypeOrThrow(archetypeId);
  const isBoss = archetype.tier === "boss";
  return {
    id: `${archetypeId}_${index + 1}`,
    assetId: DEFAULT_ENEMY_ASSET_ID,
    enemyId: archetypeId,
    name: archetype.name,
    stats: {
      hp: archetype.stats.hp,
      attack: archetype.stats.contactDamage,
      defense: 0,
      speed: archetype.stats.moveSpeed,
    },
    behavior: isBoss ? "boss" : archetype.attack === "ranged" ? "ranged" : "chase",
    aggroRadius: archetype.stats.aggroRadius,
    ...(isBoss ? { isBoss: true } : {}),
    x,
    y,
  };
}

/**
 * Turns a built-in layout into an editor map that converts back to the same layout (used to seed
 * the canonical maps). Built-in layouts have no floor or decor, so none is written.
 */
export function dungeonLayoutToPlayableMap(layout: DungeonLayout, meta: LayoutToPlayableMapMeta): PlayableMap {
  const cellSize = STORY_MAP_CELL_SIZE;
  const collisions: MapCollision[] = layout.obstacles.map((obstacle, index) => ({
    id: `obstacle_${index + 1}`,
    type: "box",
    x: obstacle.x,
    y: obstacle.y,
    width: obstacle.width,
    height: obstacle.height,
    kind: obstacle.kind,
  }));

  const triggers: MapTrigger[] = [
    ...layout.zones.map((zone): MapTrigger => ({
      id: `zone_${zone.id}`,
      type: "event",
      ...zone.rect,
      story: { kind: "zone", zoneId: zone.id, label: zone.label, ...(zone.spawnOnBeat ? { spawnOnBeat: zone.spawnOnBeat } : {}) },
    })),
    ...layout.gates.map((gate): MapTrigger => ({
      id: gate.id,
      type: "event",
      ...gate.rect,
      story: { kind: "gate", opensWhen: gate.opensWhen },
    })),
    ...layout.beats.map((beat): MapTrigger => ({
      id: `beat_${beat.beatId}`,
      type: "dialogue",
      x: beat.x - BEAT_TRIGGER_SIZE / 2,
      y: beat.y - BEAT_TRIGGER_SIZE / 2,
      width: BEAT_TRIGGER_SIZE,
      height: BEAT_TRIGGER_SIZE,
      story: { kind: "beat", beatId: beat.beatId, ...(beat.requires ? { requires: beat.requires } : {}) },
    })),
  ];

  const placements = layout.zones.flatMap((zone) => zone.enemies);
  const enemies = placements.map((placement, index) => toMapEnemy(placement.archetypeId, placement.x, placement.y, index));

  return {
    id: layout.dungeonId,
    name: meta.name,
    version: 1,
    world: "story",
    mode: "story",
    chapter: meta.chapter,
    grid: {
      width: Math.ceil(layout.width / cellSize),
      height: Math.ceil(layout.height / cellSize),
      cellSize,
    },
    topography: { cells: [] },
    tiles: [],
    objects: [],
    buildings: [],
    npcs: [],
    enemies,
    collisions,
    triggers,
    puzzles: [],
    spawns: [{ id: "player_start", x: layout.playerSpawn.x, y: layout.playerSpawn.y }],
    victoryCondition: { kind: "ALL_ENEMIES" },
    metadata: { createdWith: "AWorldDreamtLevelEditor", style: "minimal-geometric" },
  };
}
