/**
 * Mode-agnostic scripted-sequence primitives. A "scenario" is any ordered sequence of narrative
 * steps gated by conditions — Story dungeons today, and later Kingdom arrival sequences,
 * Tutorial walkthroughs, Quests, or timed Events. This module knows nothing about Story,
 * PixiExplorationStage, or StoryMapStage; it is pure data + pure functions.
 *
 * Story's own LevelBeat/LevelScript (packages/game-core/story/levelScripts.ts) are NOT replaced
 * or renamed by this module — they stay the authored, tested source of truth for Story content.
 * A separate adapter converts a LevelScript into a ScenarioScript for a ScenarioRuntime to
 * consume, so existing Story code/tests are unaffected by this introduction.
 */

/** How a ScenarioStep advances from "pending" to "reached". */
export type ScenarioStepTriggerKind =
  | "manual"
  | "poi_interacted"
  | "trigger_entered"
  | "enemy_defeated"
  | "boss_defeated"
  | "player_died"
  | "victory_condition_met";

export type ScenarioStepTrigger = Readonly<{
  on: ScenarioStepTriggerKind;
  /** Id of the POI/trigger/enemy this step's trigger refers to, when applicable. */
  targetId?: string;
}>;

export type ScenarioStep<TKind extends string = string> = Readonly<{
  id: string;
  kind: TKind;
  text: string;
  speaker?: string;
  /** Defaults to `{ on: "manual" }` (sequential, player/caller-advanced) when omitted. */
  trigger?: ScenarioStepTrigger;
}>;

export type ScenarioScript<TKind extends string = string> = Readonly<{
  id: string;
  steps: readonly ScenarioStep<TKind>[];
}>;
