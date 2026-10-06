import { STORY_BOSS_REGISTRY, STORY_DUNGEON_REGISTRY } from "../story/progressionMvp.js";
import { validateDungeonEncounters } from "./encounters.js";
import { validateBossPatterns } from "./patterns.js";

export * from "./registry.js";
export * from "./encounters.js";
export * from "./loot.js";
export * from "./patterns.js";

validateDungeonEncounters(STORY_DUNGEON_REGISTRY);
validateBossPatterns(STORY_BOSS_REGISTRY);
