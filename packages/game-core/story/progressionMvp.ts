import type { GameState } from "../game/state.js";
import { grantRewardBundle, type RewardBundle } from "../rewards/index.js";
import { grantDropOfDarkness, grantFragmentDuTemps, grantKaleidoscope } from "../specialItems/index.js";
import { applyNarrativeEffectSetUnlock } from "../effectSets/index.js";
import type { StoryState } from "./state.js";

export type MvpStoryChapterId = "prologue" | "chapter_i_funebre" | "chapter_ii_glaciaire";

export type MvpStoryEra = "prologue" | "era_funebre" | "era_glaciaire";

export type StoryUnlockConditions = Readonly<{
  storyFlags?: readonly string[];
  minWorldLevel?: number;
}>;

export type StoryUnlockRequirementStatus =
  | Readonly<{
      kind: "storyFlag";
      flag: string;
      met: boolean;
    }>
  | Readonly<{
      kind: "worldLevel";
      required: number;
      current: number;
      met: boolean;
    }>;

export type StoryChapterDefinition = Readonly<{
  chapterId: MvpStoryChapterId;
  title: string;
  era: MvpStoryEra;
  order: number;
  unlockConditions: StoryUnlockConditions;
  dungeonIds: readonly string[];
  bossIds: readonly string[];
  storyFlagsProduced: readonly string[];
}>;

export type StoryDungeonDefinition = Readonly<{
  id: string;
  title: string;
  era: MvpStoryEra;
  chapterId: MvpStoryChapterId;
  order: number;
  type: "story" | "boss";
  replayable: true;
  bossId: string | null;
  unlockConditions: StoryUnlockConditions;
  firstClearRewards: RewardBundle;
  replayRewards: RewardBundle;
  storyFlagsProduced: readonly string[];
}>;

export type StoryBossDefinition = Readonly<{
  id: string;
  name: string;
  chapterId: MvpStoryChapterId;
  dungeonId: string;
  phases: number;
  storyFlagsProduced: readonly string[];
}>;

export type DungeonCompletionResult =
  | Readonly<{
      ok: true;
      firstClear: boolean;
      bossDefeatedId?: string;
      rewards: RewardBundle;
      next: GameState;
    }>
  | Readonly<{
      ok: false;
      reason: "DUNGEON_NOT_FOUND" | "STORY_FLAG_MISSING" | "WORLD_LEVEL_TOO_LOW";
      next: GameState;
    }>;

export type CompleteDungeonOptions = Readonly<{
  forceReplay?: boolean;
}>;

const BOSS_FIRST_CLEAR_SPECIAL_REWARDS: Readonly<
  Record<string, Readonly<{ kaleidoscope?: true; dropOfDarkness?: true; fragmentDuTemps?: number }>>
> = {
  // Prologue: the Amalgame des Ténèbres drops the Drop of Darkness (canon).
  dark_amalgam: { dropOfDarkness: true },
  // Chapter I: the Ombre du Dragon yields the Kaléidoscope + first Fragment du Temps (era traversal).
  dragon_shadow: { kaleidoscope: true, fragmentDuTemps: 1 },
  allaeva: { fragmentDuTemps: 1 },
};

const firstClear = (dungeonId: string) => `first_clear:${dungeonId}`;
const completedDungeon = (dungeonId: string) => `dungeon:${dungeonId}:completed`;
const bossDefeated = (bossId: string) => `boss:${bossId}:defeated`;

const COMMON_REPLAY_REWARDS: RewardBundle = {
  currencies: [{ currencyId: "ECU", amount: 5 }],
};

const COMMON_FIRST_CLEAR_REWARDS: RewardBundle = {
  currencies: [{ currencyId: "ECU", amount: 25 }],
};

/**
 * DEFERRED balancing — centralised story WorldLevel gates (placeholder values).
 * Single source of truth so the Chapter II gate is not duplicated across the chapter
 * and its dungeons. Tune here, not inline.
 */
export const STORY_MIN_WORLD_LEVEL = {
  chapter_ii_glaciaire: 5,
} as const;

export const STORY_CHAPTER_REGISTRY: readonly StoryChapterDefinition[] = [
  {
    chapterId: "prologue",
    title: "Prologue",
    era: "prologue",
    order: 0,
    unlockConditions: {},
    dungeonIds: ["prologue_wastelands"],
    bossIds: ["dark_amalgam"],
    storyFlagsProduced: ["kingdom_discovered", "prologue_complete"],
  },
  {
    chapterId: "chapter_i_funebre",
    title: "Chapter I — Era Funebre",
    era: "era_funebre",
    order: 1,
    unlockConditions: { storyFlags: ["prologue_complete"], minWorldLevel: 1 },
    dungeonIds: ["funeral_mausoleum", "ashen_peak"],
    bossIds: ["dragon_shadow"],
    storyFlagsProduced: ["chapter_i_complete", "kaleidoscope_chapter_i_component_ready"],
  },
  {
    chapterId: "chapter_ii_glaciaire",
    title: "Chapter II — Era Glaciaire",
    era: "era_glaciaire",
    order: 2,
    // DEFERRED balancing: WorldLevel gate is a placeholder for the Ch II stability requirement.
    unlockConditions: { storyFlags: ["chapter_i_complete"], minWorldLevel: STORY_MIN_WORLD_LEVEL.chapter_ii_glaciaire },
    dungeonIds: [
      "frozen_river",
      "reflection_cavern",
      "royal_abyss",
      "arathas_academy",
      "frost_source",
    ],
    bossIds: ["frost_amalgam", "fallen_rain_lord", "corrupted_archmage", "allaeva"],
    storyFlagsProduced: ["chapter_ii_complete", "time_gate_phase_8_ready"],
  },
] as const;

export const STORY_BOSS_REGISTRY: readonly StoryBossDefinition[] = [
  {
    id: "dark_amalgam",
    name: "Amalgame des Tenebres",
    chapterId: "prologue",
    dungeonId: "prologue_wastelands",
    phases: 1,
    storyFlagsProduced: ["dark_amalgam_defeated", bossDefeated("dark_amalgam")],
  },
  {
    id: "dragon_shadow",
    name: "Ombre du Dragon",
    chapterId: "chapter_i_funebre",
    dungeonId: "ashen_peak",
    phases: 2,
    storyFlagsProduced: ["dragon_shadow_defeated", "kaleidoscope_chapter_i_component_ready", bossDefeated("dragon_shadow")],
  },
  {
    id: "frost_amalgam",
    name: "Amalgame du Givre",
    chapterId: "chapter_ii_glaciaire",
    dungeonId: "reflection_cavern",
    phases: 1,
    storyFlagsProduced: ["frost_amalgam_defeated", bossDefeated("frost_amalgam")],
  },
  {
    id: "fallen_rain_lord",
    name: "Seigneur de la Pluie Dechu",
    chapterId: "chapter_ii_glaciaire",
    dungeonId: "royal_abyss",
    phases: 2,
    storyFlagsProduced: ["fallen_rain_lord_defeated", bossDefeated("fallen_rain_lord")],
  },
  {
    id: "corrupted_archmage",
    name: "Archimage Corrompu",
    chapterId: "chapter_ii_glaciaire",
    dungeonId: "arathas_academy",
    phases: 2,
    storyFlagsProduced: ["corrupted_archmage_defeated", bossDefeated("corrupted_archmage")],
  },
  {
    id: "allaeva",
    name: "Allaeva, Reine de Glace",
    chapterId: "chapter_ii_glaciaire",
    dungeonId: "frost_source",
    phases: 2,
    storyFlagsProduced: ["allaeva_defeated", "chapter_ii_complete", "time_gate_phase_8_ready", bossDefeated("allaeva")],
  },
] as const;

export const STORY_DUNGEON_REGISTRY: readonly StoryDungeonDefinition[] = [
  {
    id: "prologue_wastelands",
    title: "Terres Desolees",
    era: "era_funebre",
    chapterId: "prologue",
    order: 0,
    type: "boss",
    replayable: true,
    bossId: "dark_amalgam",
    unlockConditions: { minWorldLevel: 1 },
    firstClearRewards: {
      resources: [{ resourceId: "dark_amalgam_core", amount: 1 }],
      currencies: [{ currencyId: "BOSS_TOKEN", amount: 1 }],
    },
    replayRewards: {
      resources: [{ resourceId: "shadow_residue", amount: 2 }],
      currencies: [{ currencyId: "ECU", amount: 5 }],
    },
    storyFlagsProduced: ["kingdom_discovered", "prologue_complete", completedDungeon("prologue_wastelands")],
  },
  {
    id: "funeral_mausoleum",
    title: "Mausolee Funebre",
    era: "era_funebre",
    chapterId: "chapter_i_funebre",
    order: 1,
    type: "story",
    replayable: true,
    bossId: null,
    unlockConditions: { storyFlags: ["prologue_complete"], minWorldLevel: 1 },
    firstClearRewards: COMMON_FIRST_CLEAR_REWARDS,
    replayRewards: COMMON_REPLAY_REWARDS,
    storyFlagsProduced: ["funeral_mausoleum_cleared", completedDungeon("funeral_mausoleum")],
  },
  {
    id: "ashen_peak",
    title: "Pic des Cendres",
    era: "era_funebre",
    chapterId: "chapter_i_funebre",
    order: 2,
    type: "boss",
    replayable: true,
    bossId: "dragon_shadow",
    unlockConditions: { storyFlags: ["funeral_mausoleum_cleared"], minWorldLevel: 1 },
    firstClearRewards: {
      resources: [{ resourceId: "dragon_ash_core", amount: 1 }],
      currencies: [{ currencyId: "BOSS_TOKEN", amount: 1 }],
    },
    replayRewards: {
      resources: [{ resourceId: "ashwood", amount: 2 }],
      currencies: [{ currencyId: "ECU", amount: 10 }],
    },
    storyFlagsProduced: ["chapter_i_complete", completedDungeon("ashen_peak")],
  },
  {
    id: "frozen_river",
    title: "Rive Figee",
    era: "era_glaciaire",
    chapterId: "chapter_ii_glaciaire",
    order: 3,
    type: "story",
    replayable: true,
    bossId: null,
    unlockConditions: { storyFlags: ["chapter_i_complete"], minWorldLevel: STORY_MIN_WORLD_LEVEL.chapter_ii_glaciaire },
    firstClearRewards: COMMON_FIRST_CLEAR_REWARDS,
    replayRewards: COMMON_REPLAY_REWARDS,
    storyFlagsProduced: ["frozen_river_cleared", completedDungeon("frozen_river")],
  },
  {
    id: "reflection_cavern",
    title: "Caverne aux Reflets",
    era: "era_glaciaire",
    chapterId: "chapter_ii_glaciaire",
    order: 4,
    type: "boss",
    replayable: true,
    bossId: "frost_amalgam",
    unlockConditions: { storyFlags: ["frozen_river_cleared"], minWorldLevel: STORY_MIN_WORLD_LEVEL.chapter_ii_glaciaire },
    firstClearRewards: {
      resources: [{ resourceId: "frost_amalgam_core", amount: 1 }],
      currencies: [{ currencyId: "BOSS_TOKEN", amount: 1 }],
    },
    replayRewards: {
      resources: [{ resourceId: "frozen_echo", amount: 2 }],
      currencies: [{ currencyId: "ECU", amount: 10 }],
    },
    storyFlagsProduced: ["reflection_cavern_cleared", completedDungeon("reflection_cavern")],
  },
  {
    id: "royal_abyss",
    title: "Gouffre Royal",
    era: "era_funebre",
    chapterId: "chapter_ii_glaciaire",
    order: 5,
    type: "boss",
    replayable: true,
    bossId: "fallen_rain_lord",
    unlockConditions: { storyFlags: ["reflection_cavern_cleared"], minWorldLevel: STORY_MIN_WORLD_LEVEL.chapter_ii_glaciaire },
    firstClearRewards: {
      resources: [{ resourceId: "pearlescent_scale", amount: 1 }],
      currencies: [{ currencyId: "BOSS_TOKEN", amount: 1 }],
    },
    replayRewards: {
      resources: [{ resourceId: "cold_shell_fragment", amount: 2 }],
      currencies: [{ currencyId: "ECU", amount: 10 }],
    },
    storyFlagsProduced: ["royal_abyss_cleared", completedDungeon("royal_abyss")],
  },
  {
    id: "arathas_academy",
    title: "Academie d'Arathas",
    era: "era_glaciaire",
    chapterId: "chapter_ii_glaciaire",
    order: 6,
    type: "boss",
    replayable: true,
    bossId: "corrupted_archmage",
    unlockConditions: { storyFlags: ["royal_abyss_cleared"], minWorldLevel: STORY_MIN_WORLD_LEVEL.chapter_ii_glaciaire },
    firstClearRewards: {
      resources: [{ resourceId: "archmage_sigil", amount: 1 }],
      currencies: [{ currencyId: "BOSS_TOKEN", amount: 1 }],
    },
    replayRewards: {
      resources: [{ resourceId: "archival_fragment", amount: 2 }],
      currencies: [{ currencyId: "ECU", amount: 10 }],
    },
    storyFlagsProduced: ["arathas_academy_cleared", completedDungeon("arathas_academy")],
  },
  {
    id: "frost_source",
    title: "Source du Givre",
    era: "era_glaciaire",
    chapterId: "chapter_ii_glaciaire",
    order: 7,
    type: "boss",
    replayable: true,
    bossId: "allaeva",
    unlockConditions: { storyFlags: ["arathas_academy_cleared"], minWorldLevel: STORY_MIN_WORLD_LEVEL.chapter_ii_glaciaire },
    firstClearRewards: {
      resources: [{ resourceId: "frozen_queen_tear", amount: 1 }],
      currencies: [{ currencyId: "BOSS_TOKEN", amount: 1 }],
    },
    replayRewards: {
      resources: [{ resourceId: "frozen_echo", amount: 3 }],
      currencies: [{ currencyId: "ECU", amount: 15 }],
    },
    storyFlagsProduced: ["chapter_ii_complete", "time_gate_phase_8_ready", completedDungeon("frost_source")],
  },
] as const;

export function getStoryFlags(state: Pick<GameState, "story"> | { story: StoryState }): Set<string> {
  return new Set([
    ...state.story.completedEvents,
    ...state.story.discoveredEvents,
    ...state.story.unlocked,
    ...state.story.completedLevels,
    ...state.story.completedDungeonIds,
    ...state.story.firstClearFlags,
    ...[...state.story.completedChapters].map((chapterId) => `legacy_chapter:${chapterId}`),
  ]);
}

export function getStoryChapterDefinition(chapterId: string): StoryChapterDefinition | undefined {
  return STORY_CHAPTER_REGISTRY.find((chapter) => chapter.chapterId === chapterId);
}

export function getStoryDungeonDefinition(dungeonId: string): StoryDungeonDefinition | undefined {
  return STORY_DUNGEON_REGISTRY.find((dungeon) => dungeon.id === dungeonId);
}

export function getStoryBossDefinition(bossId: string): StoryBossDefinition | undefined {
  return STORY_BOSS_REGISTRY.find((boss) => boss.id === bossId);
}

export function getStoryUnlockRequirementStatuses(
  state: GameState,
  conditions: StoryUnlockConditions,
): StoryUnlockRequirementStatus[] {
  const statuses: StoryUnlockRequirementStatus[] = [];
  const flags = getStoryFlags(state);

  if (conditions.minWorldLevel !== undefined) {
    statuses.push({
      kind: "worldLevel",
      required: conditions.minWorldLevel,
      current: state.progression.worldLevel,
      met: state.progression.worldLevel >= conditions.minWorldLevel,
    });
  }

  for (const flag of conditions.storyFlags ?? []) {
    statuses.push({
      kind: "storyFlag",
      flag,
      met: flags.has(flag),
    });
  }

  return statuses;
}

export function getStoryDungeonLockReasons(state: GameState, dungeonId: string): StoryUnlockRequirementStatus[] {
  const dungeon = getStoryDungeonDefinition(dungeonId);
  if (!dungeon) return [];
  return getStoryUnlockRequirementStatuses(state, dungeon.unlockConditions).filter((requirement) => !requirement.met);
}

function checkUnlockConditions(state: GameState, conditions: StoryUnlockConditions): "STORY_FLAG_MISSING" | "WORLD_LEVEL_TOO_LOW" | null {
  if (conditions.minWorldLevel !== undefined && state.progression.worldLevel < conditions.minWorldLevel) {
    return "WORLD_LEVEL_TOO_LOW";
  }

  const flags = getStoryFlags(state);
  for (const requiredFlag of conditions.storyFlags ?? []) {
    if (!flags.has(requiredFlag)) return "STORY_FLAG_MISSING";
  }

  return null;
}

export function getAvailableChapters(state: GameState): StoryChapterDefinition[] {
  return STORY_CHAPTER_REGISTRY.filter((chapter) => checkUnlockConditions(state, chapter.unlockConditions) === null);
}

export function canEnterDungeon(state: GameState, dungeonId: string): boolean {
  const dungeon = getStoryDungeonDefinition(dungeonId);
  if (!dungeon) return false;
  return checkUnlockConditions(state, dungeon.unlockConditions) === null;
}

export function getAvailableDungeons(state: GameState): StoryDungeonDefinition[] {
  return STORY_DUNGEON_REGISTRY.filter((dungeon) => canEnterDungeon(state, dungeon.id));
}

function cloneStoryWithDungeonProgress(story: StoryState): StoryState {
  return {
    ...story,
    completedChapters: new Set(story.completedChapters),
    completedDungeonIds: new Set(story.completedDungeonIds),
    completedEvents: new Set(story.completedEvents),
    completedLevels: new Set(story.completedLevels),
    discoveredEvents: new Set(story.discoveredEvents),
    firstClearFlags: new Set(story.firstClearFlags),
    unlocked: new Set(story.unlocked),
  };
}

export function completeStoryEvent(state: GameState, eventId: string): GameState {
  const nextStory = cloneStoryWithDungeonProgress(state.story);
  nextStory.completedEvents.add(eventId);
  return { ...state, story: nextStory };
}

export function applyFirstClearRewards(state: GameState, dungeonId: string): GameState {
  const dungeon = getStoryDungeonDefinition(dungeonId);
  if (!dungeon) return state;
  const flag = firstClear(dungeonId);
  if (state.story.firstClearFlags.has(flag)) return state;
  return grantRewardBundle(state, dungeon.firstClearRewards);
}

export function applyReplayRewards(state: GameState, dungeonId: string): GameState {
  const dungeon = getStoryDungeonDefinition(dungeonId);
  if (!dungeon) return state;
  return grantRewardBundle(state, dungeon.replayRewards);
}

export function applyBossFirstClearSpecialRewards(state: GameState, bossId: string): GameState {
  const rewards = BOSS_FIRST_CLEAR_SPECIAL_REWARDS[bossId];
  if (!rewards) return state;

  let next = state;
  if (rewards.kaleidoscope) next = grantKaleidoscope(next);
  if (rewards.dropOfDarkness) next = grantDropOfDarkness(next);
  if (rewards.fragmentDuTemps) next = grantFragmentDuTemps(next, rewards.fragmentDuTemps);
  return next;
}

export function completeDungeon(
  state: GameState,
  dungeonId: string,
  options: CompleteDungeonOptions = {},
): DungeonCompletionResult {
  const dungeon = getStoryDungeonDefinition(dungeonId);
  if (!dungeon) return { ok: false, reason: "DUNGEON_NOT_FOUND", next: state };

  const lockReason = checkUnlockConditions(state, dungeon.unlockConditions);
  if (lockReason) return { ok: false, reason: lockReason, next: state };

  const firstClearFlag = firstClear(dungeonId);
  const shouldFirstClear = options.forceReplay !== true && !state.story.firstClearFlags.has(firstClearFlag);
  let rewarded = shouldFirstClear ? applyFirstClearRewards(state, dungeonId) : applyReplayRewards(state, dungeonId);
  const nextStory = cloneStoryWithDungeonProgress(rewarded.story);
  const boss = dungeon.bossId ? getStoryBossDefinition(dungeon.bossId) : undefined;

  if (shouldFirstClear && boss) {
    rewarded = applyBossFirstClearSpecialRewards(rewarded, boss.id);
    rewarded = applyNarrativeEffectSetUnlock(rewarded, boss.id);
  }
  if (shouldFirstClear) {
    rewarded = applyNarrativeEffectSetUnlock(rewarded, dungeon.id);
  }

  nextStory.completedDungeonIds.add(dungeon.id);
  nextStory.completedEvents.add(completedDungeon(dungeon.id));
  for (const flag of dungeon.storyFlagsProduced) nextStory.completedEvents.add(flag);

  if (shouldFirstClear) nextStory.firstClearFlags.add(firstClearFlag);

  if (boss) {
    nextStory.completedEvents.add(boss.id);
    nextStory.completedEvents.add(bossDefeated(boss.id));
    for (const flag of boss.storyFlagsProduced) nextStory.completedEvents.add(flag);
  }

  const chapter = getStoryChapterDefinition(dungeon.chapterId);
  if (chapter && chapter.dungeonIds.every((id) => nextStory.completedDungeonIds.has(id))) {
    for (const flag of chapter.storyFlagsProduced) nextStory.completedEvents.add(flag);
  }

  return {
    ok: true,
    firstClear: shouldFirstClear,
    bossDefeatedId: boss?.id,
    rewards: shouldFirstClear ? dungeon.firstClearRewards : dungeon.replayRewards,
    next: {
      ...rewarded,
      story: nextStory,
    },
  };
}

export function validateStoryProgressionRegistry(
  chapters: readonly StoryChapterDefinition[] = STORY_CHAPTER_REGISTRY,
  dungeons: readonly StoryDungeonDefinition[] = STORY_DUNGEON_REGISTRY,
  bosses: readonly StoryBossDefinition[] = STORY_BOSS_REGISTRY,
): void {
  const chapterIds = new Set<string>();
  const dungeonIds = new Set<string>();
  const bossIds = new Set<string>();
  const producedFlags = new Set<string>();
  const allowedBossIds = new Set(["dark_amalgam", "dragon_shadow", "frost_amalgam", "fallen_rain_lord", "corrupted_archmage", "allaeva"]);
  const allowedChapterIds = new Set<MvpStoryChapterId>(["prologue", "chapter_i_funebre", "chapter_ii_glaciaire"]);

  for (const chapter of chapters) {
    if (chapterIds.has(chapter.chapterId)) throw new Error(`Duplicate story chapter id: ${chapter.chapterId}`);
    chapterIds.add(chapter.chapterId);
    if (!allowedChapterIds.has(chapter.chapterId)) throw new Error(`Non-MVP story chapter active: ${chapter.chapterId}`);
    for (const flag of chapter.storyFlagsProduced) producedFlags.add(flag);
    validateUnlockConditionShape(chapter.unlockConditions, `chapter ${chapter.chapterId}`);
  }

  for (const dungeon of dungeons) {
    if (dungeonIds.has(dungeon.id)) throw new Error(`Duplicate story dungeon id: ${dungeon.id}`);
    dungeonIds.add(dungeon.id);
    if (!allowedChapterIds.has(dungeon.chapterId)) throw new Error(`Chapter III+ dungeon is active: ${dungeon.id}`);
    if (dungeon.replayable !== true) throw new Error(`Story dungeon must be replayable: ${dungeon.id}`);
    if (dungeon.bossId !== null && !allowedBossIds.has(dungeon.bossId)) throw new Error(`Non-MVP boss id on dungeon ${dungeon.id}: ${dungeon.bossId}`);
    for (const flag of dungeon.storyFlagsProduced) producedFlags.add(flag);
    producedFlags.add(completedDungeon(dungeon.id));
    producedFlags.add(firstClear(dungeon.id));
    validateUnlockConditionShape(dungeon.unlockConditions, `dungeon ${dungeon.id}`);
  }

  for (const boss of bosses) {
    if (bossIds.has(boss.id)) throw new Error(`Duplicate story boss id: ${boss.id}`);
    bossIds.add(boss.id);
    if (!allowedBossIds.has(boss.id)) throw new Error(`Non-MVP boss active: ${boss.id}`);
    if (!dungeonIds.has(boss.dungeonId)) throw new Error(`Boss ${boss.id} references unknown dungeonId: ${boss.dungeonId}`);
    for (const flag of boss.storyFlagsProduced) producedFlags.add(flag);
    producedFlags.add(boss.id);
    producedFlags.add(bossDefeated(boss.id));
  }

  for (const dungeon of dungeons) {
    if (dungeon.bossId !== null && !bossIds.has(dungeon.bossId)) {
      throw new Error(`Dungeon ${dungeon.id} references unknown bossId: ${dungeon.bossId}`);
    }
  }

  for (const boss of bosses) {
    const dungeon = dungeons.find((candidate) => candidate.id === boss.dungeonId);
    if (!dungeon || dungeon.bossId !== boss.id) {
      throw new Error(`Boss ${boss.id} dungeonId back-reference is invalid`);
    }
  }

  for (const chapter of chapters) {
    for (const dungeonId of chapter.dungeonIds) {
      if (!dungeonIds.has(dungeonId)) throw new Error(`Chapter ${chapter.chapterId} references unknown dungeonId: ${dungeonId}`);
    }
    for (const bossId of chapter.bossIds) {
      if (!bossIds.has(bossId)) throw new Error(`Chapter ${chapter.chapterId} references unknown bossId: ${bossId}`);
    }
    validateStoryFlagRefs(chapter.unlockConditions.storyFlags ?? [], producedFlags, `chapter ${chapter.chapterId}`);
  }

  for (const dungeon of dungeons) {
    validateStoryFlagRefs(dungeon.unlockConditions.storyFlags ?? [], producedFlags, `dungeon ${dungeon.id}`);
  }
}

function validateUnlockConditionShape(conditions: StoryUnlockConditions, owner: string): void {
  const keys = Object.keys(conditions);
  for (const key of keys) {
    if (key !== "storyFlags" && key !== "minWorldLevel") {
      throw new Error(`Invalid ${owner} gating key: ${key}`);
    }
  }
  if (conditions.minWorldLevel !== undefined && conditions.minWorldLevel < 1) {
    throw new Error(`Invalid ${owner} minWorldLevel: ${conditions.minWorldLevel}`);
  }
}

function validateStoryFlagRefs(flags: readonly string[], producedFlags: Set<string>, owner: string): void {
  for (const flag of flags) {
    if (!producedFlags.has(flag)) throw new Error(`Unknown storyFlag reference on ${owner}: ${flag}`);
  }
}

validateStoryProgressionRegistry();
