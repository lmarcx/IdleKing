import type { ScenarioScript, ScenarioStep } from "../scenario/index.js";
import type { LevelBeat, LevelBeatKind, LevelScript } from "./levelScripts.js";

/**
 * Bridges Story's authored LevelBeat/LevelScript into the mode-agnostic ScenarioStep/
 * ScenarioScript shape a ScenarioRuntime consumes. LevelBeat/LevelScript stay exactly as
 * authored (dungeonId/beats field names, no trigger data) -- this is a read-only conversion,
 * not a migration, so existing Story code and tests are unaffected.
 *
 * LevelBeat carries no trigger condition today (advancement is purely POI-interaction-order,
 * driven by the caller), so every converted step defaults to `{ on: "manual" }`.
 */
export function levelBeatToScenarioStep(beat: LevelBeat): ScenarioStep<LevelBeatKind> {
  return {
    id: beat.id,
    kind: beat.kind,
    text: beat.text,
    speaker: beat.speaker,
    trigger: { on: "manual" },
  };
}

export function levelScriptToScenarioScript(script: LevelScript): ScenarioScript<LevelBeatKind> {
  return {
    id: script.dungeonId,
    steps: script.beats.map(levelBeatToScenarioStep),
  };
}
