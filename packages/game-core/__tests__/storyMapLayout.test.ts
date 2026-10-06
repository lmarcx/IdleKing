import test from "node:test";
import assert from "node:assert/strict";

import { validatePlayableMap } from "../level-editor/map-loader.js";
import type { PlayableMap } from "../level-editor/types.js";
import { getBuiltInDungeonLayout, getStoryMapRuntimeErrors } from "../story/dungeonLayouts.js";
import { getStoryDungeonDefinition, STORY_DUNGEON_REGISTRY } from "../story/progressionMvp.js";
import { OPEN_ZONE_ID, dungeonLayoutToPlayableMap, playableMapToDungeonLayout } from "../story/storyMapLayout.js";

function emptyStoryMap(overrides: Partial<PlayableMap> = {}): PlayableMap {
  return {
    id: "fixture",
    name: "Fixture",
    version: 1,
    world: "story",
    mode: "story",
    chapter: "prologue",
    grid: { width: 10, height: 5, cellSize: 100 },
    topography: { cells: [] },
    tiles: [],
    objects: [],
    buildings: [],
    npcs: [],
    enemies: [],
    collisions: [],
    triggers: [],
    puzzles: [],
    spawns: [{ id: "player_start", x: 150, y: 250 }],
    metadata: { createdWith: "AWorldDreamtLevelEditor", style: "minimal-geometric" },
    ...overrides,
  };
}

test("every built-in dungeon layout survives a layout → editor map → layout round trip", () => {
  for (const dungeon of STORY_DUNGEON_REGISTRY) {
    const layout = getBuiltInDungeonLayout(dungeon.id);
    assert.ok(layout, dungeon.id);
    const map = dungeonLayoutToPlayableMap(layout, { name: dungeon.title, chapter: dungeon.chapterId });
    assert.deepEqual(validatePlayableMap(map).errors, [], dungeon.id);
    const back = playableMapToDungeonLayout(map, dungeon.id, { theme: layout.theme });
    assert.deepEqual(back, layout, dungeon.id);
  }
});

test("enemies outside every zone fall into the implicit open zone", () => {
  const map = emptyStoryMap({
    enemies: [
      {
        id: "e1",
        assetId: "enemy_shard_01",
        enemyId: "ombre_errante",
        name: "Ombre",
        stats: { hp: 1, attack: 1, defense: 0, speed: 1 },
        behavior: "chase",
        aggroRadius: 200,
        x: 700,
        y: 250,
      },
    ],
  });
  const layout = playableMapToDungeonLayout(map, "fixture");
  assert.equal(layout.zones.length, 1);
  assert.equal(layout.zones[0]?.id, OPEN_ZONE_ID);
  assert.deepEqual(layout.zones[0]?.rect, { x: 0, y: 0, width: 1000, height: 500 });
  assert.deepEqual(layout.zones[0]?.enemies, [{ archetypeId: "ombre_errante", x: 700, y: 250 }]);
});

test("non-walkable cells become merged wall obstacles", () => {
  const map = emptyStoryMap({
    topography: {
      cells: [
        { x: 4, y: 0, state: "dead" },
        { x: 5, y: 0, state: "dead" },
        { x: 4, y: 1, state: "dead" },
        { x: 5, y: 1, state: "dead" },
      ],
    },
  });
  const layout = playableMapToDungeonLayout(map, "fixture");
  assert.deepEqual(layout.obstacles, [{ kind: "wall", x: 400, y: 0, width: 200, height: 200 }]);
});

test("beat anchors are sorted in script order", () => {
  const beat = (beatId: string, x: number) => ({
    id: `beat_${beatId}`,
    type: "dialogue" as const,
    x,
    y: 200,
    width: 80,
    height: 80,
    story: { kind: "beat" as const, beatId },
  });
  const map = emptyStoryMap({ triggers: [beat("second", 600), beat("first", 200)] });
  const layout = playableMapToDungeonLayout(map, "fixture", { beatOrder: ["first", "second"] });
  assert.deepEqual(layout.beats.map((anchor) => anchor.beatId), ["first", "second"]);
});

test("runtime errors flag a Story map that cannot be played", () => {
  const dungeon = getStoryDungeonDefinition("funeral_mausoleum");
  assert.ok(dungeon);
  const empty = playableMapToDungeonLayout(emptyStoryMap(), dungeon.id);
  assert.ok(getStoryMapRuntimeErrors(dungeon.id, empty).some((error) => error.includes("no enemy")));

  const prologue = playableMapToDungeonLayout(emptyStoryMap(), "prologue_wastelands");
  assert.ok(getStoryMapRuntimeErrors("prologue_wastelands", prologue).some((error) => error.includes("script order")));
});
