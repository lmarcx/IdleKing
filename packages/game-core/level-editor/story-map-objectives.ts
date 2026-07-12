import type { PlayableMap } from "./types.js";

export type StoryMapObjective =
  | Readonly<{ type: "boss_defeat"; bossEnemyId: string }>
  | Readonly<{ type: "reach_exit"; triggerId: string }>
  | Readonly<{ type: "defeat_all_enemies" }>;

/**
 * Pure derivation of a Story map's completion objective from its static data, following the
 * priority documented on MapTrigger (packages/game-core/level-editor/types.ts, Phase G1):
 * boss > dungeon_exit trigger > defeat every enemy. Never mutates the input map.
 */
export function deriveStoryMapObjective(map: PlayableMap): StoryMapObjective {
  const boss = map.enemies.find((enemy) => enemy.isBoss);
  if (boss) return { type: "boss_defeat", bossEnemyId: boss.id };

  const exitTrigger = map.triggers.find((trigger) => trigger.type === "event" && trigger.target === "dungeon_exit");
  if (exitTrigger) return { type: "reach_exit", triggerId: exitTrigger.id };

  return { type: "defeat_all_enemies" };
}

export type StoryMapObjectiveEnemyContext = Readonly<{ id: string; isDead: boolean }>;

export type StoryMapObjectiveContext = Readonly<{
  enemies: readonly StoryMapObjectiveEnemyContext[];
  exitReached: boolean;
}>;

/**
 * Pure predicate: is `objective` satisfied given the current runtime state?
 *
 * - boss_defeat only ever looks at the specific boss enemy's id -- other (non-boss) enemies
 *   dying or staying alive never affects it (they must not block completion).
 * - defeat_all_enemies on a map with zero enemies is never satisfied. This deliberately avoids
 *   the vacuous-truth bug of Array.prototype.every() on an empty array silently completing the
 *   stage at mount with no player action; callers should surface that as an explicit "this map
 *   has no way to complete" state rather than treating it as ordinary unfinished progress.
 */
export function isStoryMapObjectiveSatisfied(objective: StoryMapObjective, context: StoryMapObjectiveContext): boolean {
  switch (objective.type) {
    case "boss_defeat": {
      const boss = context.enemies.find((enemy) => enemy.id === objective.bossEnemyId);
      return boss?.isDead ?? false;
    }
    case "reach_exit":
      return context.exitReached;
    case "defeat_all_enemies":
      return context.enemies.length > 0 && context.enemies.every((enemy) => enemy.isDead);
    default:
      return false;
  }
}

/**
 * Neutral result of a Story map stage detecting its win condition. Carries no reward, no story
 * flag, and causes no GameState mutation by itself -- a caller (canonical route wrapper, editor
 * preview, or test) decides what to do with it. See StoryMapStageProps.onStageCompleted's doc
 * comment in apps/web's StoryMapStage for the architecture decision this encodes.
 */
export type StoryMapStageResult = Readonly<{
  mapId: string;
  objectiveType: StoryMapObjective["type"];
  completed: boolean;
  defeatedEnemyIds: readonly string[];
  bossDefeated: boolean;
  exitReached: boolean;
  /** How many times the stage was reset before this result. Bookkeeping only, not reward-bearing. */
  restartCount?: number;
}>;
