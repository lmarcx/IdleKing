export * from "./types.js";
export * from "./asset-presets.js";
export * from "./asset-registry.js";
export * from "./ground-textures.js";
export * from "./interactions.js";
export * from "./kingdom-stage.js";
export * from "./map-loader.js";
export * from "./sample-assets.js";
export * from "./sample-maps.js";
export * from "./story-map-combat.js";
export * from "./story-map-objectives.js";
export * from "./victory-condition.js";
// Canonical Kingdom Stage data lives under content/ (not level-editor/) since it is meant to
// be read by the live Kingdom runtime, not just editor tooling — re-exported here so the
// editor can still import it via the same @idleking/game-core/level-editor entry point.
export { KINGDOM_STAGE_DEFINITION } from "../content/kingdom/kingdom-stage.js";
// Same rationale for the canonical Story map registry (Phase G6): re-exported here so both the
// editor and the live Story route can read it. isCanonicalStoryRuntimeReady (Phase G9) is the
// separate gate the live route checks before actually rendering a dungeon's canonical map --
// see its doc comment in content/story/maps/index.ts.
export {
  STORY_CANONICAL_MAPS,
  getCanonicalStoryMap,
  hasCanonicalStoryMap,
  isCanonicalStoryRuntimeReady,
} from "../content/story/maps/index.js";
