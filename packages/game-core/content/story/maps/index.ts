import type { PlayableMap } from "../../../level-editor/types.js";

// scripts/story-map-promote.mjs --apply (apps/web) inserts new
// `import { <DUNGEON_ID>_MAP } from "./<dungeonId>.js";` lines directly below this marker when
// promoting a dungeon's first canonical map. Do not remove this marker.
// STORY_MAP_IMPORTS_MARKER
import { PROLOGUE_WASTELANDS_MAP } from "./prologue_wastelands.js";

/**
 * Canonical Story map registry, keyed by dungeonId (the same id as
 * StoryDungeonDefinition.id / STORY_DUNGEON_REGISTRY, not the PlayableMap's own `id` field --
 * mirrors Kingdom's KINGDOM_STAGE_DEFINITION precedent of one canonical constant per surface).
 *
 * A dungeon appearing here means its spatial data (topography, spawn, enemies, boss, collisions,
 * triggers) has been authored and promoted through the editor/export/promotion pipeline -- it
 * does NOT by itself mean the live player-facing route renders it. See
 * STORY_CANONICAL_RUNTIME_READY_DUNGEON_IDS below for that separate, deliberate gate. Each
 * promoted dungeon gets its own file, packages/game-core/content/story/maps/<dungeonId>.ts,
 * exporting a single `<DUNGEON_ID>_MAP: PlayableMap` const (see scripts/story-map-promote.mjs),
 * imported and added to the object below. test_map_01 is deliberately NOT registered here: it is
 * the technical proof map for StoryMapStage, not a real Story dungeon, and has no
 * StoryDungeonDefinition entry to complete against.
 */
export const STORY_CANONICAL_MAPS: Readonly<Record<string, PlayableMap>> = {
  prologue_wastelands: PROLOGUE_WASTELANDS_MAP,
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
 * Dungeons whose canonical PlayableMap (above) is cleared for the LIVE player-facing route
 * (/game/story/levels/[levelId]) to render via the data-driven StoryMapStage-based runtime
 * (StoryMapLevelRuntime) instead of the legacy StoryLevelExplorer / PixiExplorationStage
 * orchestrator. Deliberately separate from STORY_CANONICAL_MAPS: a dungeon's spatial data can be
 * authored, edited, and dry-run-previewed in the editor long before its live runtime is promoted
 * here.
 *
 * Phase G9 authored prologue_wastelands' canonical map (spatial data only: topography, spawn,
 * enemies, Dark Amalgam boss, no rewards/flags) but deliberately does NOT add it here yet.
 * StoryMapStage is still a combat/movement skeleton -- it has no enemy AI (enemies are static;
 * the live PixiExplorationStage's shadows/boss actively chase and deal contact damage), no
 * spatial POI system, no dialogue queue, no narrative trigger/scripted-sequence support. Flipping
 * the live route before those are built would silently drop Billy, the dialogue beats, and the
 * boss's aggressive behavior -- an unacceptable regression. The next technical priorities before
 * prologue_wastelands (or any dungeon) is added here: enemy AI, spatial POIs, dialogues,
 * narrative triggers, and scripted sequences reaching parity with the legacy runtime. Once that
 * parity is reached for a given dungeon, add its id here -- that single-line change is the only
 * thing needed to flip its live route to the canonical runtime.
 */
export const STORY_CANONICAL_RUNTIME_READY_DUNGEON_IDS: readonly string[] = [];

export function isCanonicalStoryRuntimeReady(dungeonId: string): boolean {
  return STORY_CANONICAL_RUNTIME_READY_DUNGEON_IDS.includes(dungeonId);
}
