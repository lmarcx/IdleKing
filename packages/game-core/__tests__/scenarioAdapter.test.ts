import assert from "node:assert/strict";
import test from "node:test";

import { levelBeatToScenarioStep, levelScriptToScenarioScript } from "../story/scenarioAdapter.js";
import { PROLOGUE_WASTELANDS_SCRIPT } from "../story/levelScripts.js";

test("levelBeatToScenarioStep preserves id/kind/text/speaker and defaults to a manual trigger", () => {
  const beat = PROLOGUE_WASTELANDS_SCRIPT.beats.find((entry) => entry.id === "billy_joins")!;
  const step = levelBeatToScenarioStep(beat);
  assert.equal(step.id, "billy_joins");
  assert.equal(step.kind, "companion_join");
  assert.equal(step.text, beat.text);
  assert.equal(step.speaker, "Billy");
  assert.deepEqual(step.trigger, { on: "manual" });
});

test("levelBeatToScenarioStep does not carry Story-only fields (bossId/itemId/companionId) onto the generic step", () => {
  const bossBeat = PROLOGUE_WASTELANDS_SCRIPT.beats.find((entry) => entry.kind === "boss")!;
  const step = levelBeatToScenarioStep(bossBeat);
  assert.equal((step as Record<string, unknown>).bossId, undefined);
});

test("levelScriptToScenarioScript maps dungeonId -> id and beats -> steps in order", () => {
  const scenario = levelScriptToScenarioScript(PROLOGUE_WASTELANDS_SCRIPT);
  assert.equal(scenario.id, "prologue_wastelands");
  assert.deepEqual(
    scenario.steps.map((step) => step.id),
    PROLOGUE_WASTELANDS_SCRIPT.beats.map((beat) => beat.id),
  );
  assert.equal(scenario.steps.length, PROLOGUE_WASTELANDS_SCRIPT.beats.length);
});

test("levelScriptToScenarioScript does not mutate the input LevelScript", () => {
  const before = JSON.parse(JSON.stringify(PROLOGUE_WASTELANDS_SCRIPT));
  levelScriptToScenarioScript(PROLOGUE_WASTELANDS_SCRIPT);
  assert.deepEqual(PROLOGUE_WASTELANDS_SCRIPT, before);
});
