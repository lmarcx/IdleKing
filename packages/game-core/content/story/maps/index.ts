import type { PlayableMap } from "../../../level-editor/types.js";

/**
 * Canonical Story map registry, keyed by dungeonId (the same id as
 * StoryDungeonDefinition.id / STORY_DUNGEON_REGISTRY, not the PlayableMap's own `id` field --
 * mirrors Kingdom's KINGDOM_STAGE_DEFINITION precedent of one canonical constant per surface).
 *
 * Empty in Phase G6: no real Story dungeon has a canonical map yet. prologue_wastelands is
 * planned for a later phase (spatial data only -- the existing narrative script stays in
 * charge of beats/dialogue/ending). test_map_01 is deliberately NOT registered here: it is the
 * technical proof map for StoryMapStage (introduced for the combat/objective preview work), not
 * a real Story dungeon, and has no StoryDungeonDefinition entry to complete against.
 */
export const STORY_CANONICAL_MAPS: Readonly<Record<string, PlayableMap>> = {};

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
