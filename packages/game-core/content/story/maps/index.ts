import type { PlayableMap } from "../../../level-editor/types.js";

// scripts/story-map-promote.mjs --apply (apps/web) inserts new
// `import { <DUNGEON_ID>_MAP } from "./<dungeonId>.js";` lines directly below this marker when
// promoting a dungeon's first canonical map. Do not remove this marker.
// STORY_MAP_IMPORTS_MARKER

/**
 * Canonical Story map registry, keyed by dungeonId (the same id as
 * StoryDungeonDefinition.id / STORY_DUNGEON_REGISTRY, not the PlayableMap's own `id` field --
 * mirrors Kingdom's KINGDOM_STAGE_DEFINITION precedent of one canonical constant per surface).
 *
 * Still empty as of Phase G8: the export/promotion pipeline (editor's "Export Canonical Story
 * Map" button + scripts/story-map-promote.mjs) is wired up, but no real dungeon has been
 * migrated yet -- prologue_wastelands remains planned for a later phase (spatial data only, the
 * existing narrative script stays in charge of beats/dialogue/ending). Each promoted dungeon
 * gets its own file, packages/game-core/content/story/maps/<dungeonId>.ts, exporting a single
 * `<DUNGEON_ID>_MAP: PlayableMap` const (see scripts/story-map-promote.mjs), imported and added
 * to the object below. test_map_01 is deliberately NOT registered here: it is the technical
 * proof map for StoryMapStage, not a real Story dungeon, and has no StoryDungeonDefinition entry
 * to complete against.
 */
export const STORY_CANONICAL_MAPS: Readonly<Record<string, PlayableMap>> = {
  // STORY_MAP_REGISTRY_ENTRIES_MARKER
};

/**
 * Pure lookup helper, parametrized on the registry so it can be exercised against a fixture in
 * tests without mutating the real (currently empty) STORY_CANONICAL_MAPS constant.
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
