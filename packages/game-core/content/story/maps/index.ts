import type { PlayableMap } from "../../../level-editor/types.js";

// scripts/story-map-promote.mjs --apply (apps/web) inserts new
// `import { <DUNGEON_ID>_MAP } from "./<dungeonId>.js";` lines directly below this marker when
// promoting a dungeon's first canonical map. Do not remove this marker.
// STORY_MAP_IMPORTS_MARKER
import { ARATHAS_ACADEMY_MAP } from "./arathas_academy.js";
import { ASHEN_PEAK_MAP } from "./ashen_peak.js";
import { FROST_SOURCE_MAP } from "./frost_source.js";
import { FROZEN_RIVER_MAP } from "./frozen_river.js";
import { FUNERAL_MAUSOLEUM_MAP } from "./funeral_mausoleum.js";
import { PROLOGUE_WASTELANDS_MAP } from "./prologue_wastelands.js";
import { REFLECTION_CAVERN_MAP } from "./reflection_cavern.js";
import { ROYAL_ABYSS_MAP } from "./royal_abyss.js";
import { SILENT_RETREAT_CAMP_MAP } from "./silent_retreat_camp.js";
import { TIME_VESTIGE_MAP } from "./time_vestige.js";
import { WHITE_FALL_TOWER_MAP } from "./white_fall_tower.js";

/**
 * Canonical Story map registry, keyed by dungeonId (the same id as
 * StoryDungeonDefinition.id / STORY_DUNGEON_REGISTRY, not the PlayableMap's own `id` field --
 * mirrors Kingdom's KINGDOM_STAGE_DEFINITION precedent of one canonical constant per surface).
 *
 * A dungeon appearing here means its spatial data (topography, spawn, enemies, boss, collisions,
 * triggers) has been authored and promoted through the editor/export/promotion pipeline. Whether
 * the live route plays it is the separate STORY_CANONICAL_RUNTIME_READY_DUNGEON_IDS gate below. Each
 * promoted dungeon gets its own file, packages/game-core/content/story/maps/<dungeonId>.ts,
 * exporting a single `<DUNGEON_ID>_MAP: PlayableMap` const (see scripts/story-map-promote.mjs),
 * imported and added to the object below. test_map_01 is deliberately NOT registered here: it is
 * the technical proof map for StoryMapStage, not a real Story dungeon, and has no
 * StoryDungeonDefinition entry to complete against.
 */
export const STORY_CANONICAL_MAPS: Readonly<Record<string, PlayableMap>> = {
  arathas_academy: ARATHAS_ACADEMY_MAP,
  ashen_peak: ASHEN_PEAK_MAP,
  frost_source: FROST_SOURCE_MAP,
  frozen_river: FROZEN_RIVER_MAP,
  funeral_mausoleum: FUNERAL_MAUSOLEUM_MAP,
  prologue_wastelands: PROLOGUE_WASTELANDS_MAP,
  reflection_cavern: REFLECTION_CAVERN_MAP,
  royal_abyss: ROYAL_ABYSS_MAP,
  silent_retreat_camp: SILENT_RETREAT_CAMP_MAP,
  time_vestige: TIME_VESTIGE_MAP,
  white_fall_tower: WHITE_FALL_TOWER_MAP,
  // STORY_MAP_REGISTRY_ENTRIES_MARKER
};

/**
 * Pure lookup helper, parametrized on the registry so it can be exercised against a fixture in
 * tests without mutating the real STORY_CANONICAL_MAPS constant.
 */
export function lookupCanonicalStoryMap(
  registry: Readonly<Record<string, PlayableMap>>,
  dungeonId: string,
): PlayableMap | undefined {
  return registry[dungeonId];
}

export function getCanonicalStoryMap(dungeonId: string): PlayableMap | undefined {
  return lookupCanonicalStoryMap(STORY_CANONICAL_MAPS, dungeonId);
}

export function hasCanonicalStoryMap(dungeonId: string): boolean {
  return getCanonicalStoryMap(dungeonId) !== undefined;
}

/**
 * Dungeons whose canonical PlayableMap (above) drives the LIVE Story route. The map is played by
 * the full Story explorer (combat, skills, boss patterns, Billy, dialogue beats) through
 * story/storyMapLayout.ts: collisions become obstacles, triggers with a `story` role become
 * rooms / gates / beat anchors. Every Story dungeon's map was seeded from its former built-in
 * layout (exact round trip, see storyMapLayout.test), so they are all ready. A dungeon left out
 * of this list falls back to its built-in layout (story/dungeonLayouts.ts) — handy while a map is
 * being reworked in the editor.
 */
export const STORY_CANONICAL_RUNTIME_READY_DUNGEON_IDS: readonly string[] = Object.keys(STORY_CANONICAL_MAPS);

export function isCanonicalStoryRuntimeReady(dungeonId: string): boolean {
  return STORY_CANONICAL_RUNTIME_READY_DUNGEON_IDS.includes(dungeonId);
}
