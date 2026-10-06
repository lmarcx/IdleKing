import assert from "node:assert/strict";
import test from "node:test";

import type { ScenarioScript, ScenarioStep } from "../scenario/index.js";

test("ScenarioStep accepts a domain-specific kind union via its type parameter", () => {
  type KingdomStepKind = "arrival" | "reveal";
  const step: ScenarioStep<KingdomStepKind> = {
    id: "arrival_1",
    kind: "arrival",
    text: "The king arrives.",
  };
  assert.equal(step.kind, "arrival");
  assert.equal(step.trigger, undefined);
});

test("ScenarioStep.trigger is optional and defaults are the caller's responsibility (no implicit value)", () => {
  const step: ScenarioStep = {
    id: "step_1",
    kind: "dialogue",
    text: "...",
    trigger: { on: "poi_interacted", targetId: "poi_1" },
  };
  assert.equal(step.trigger?.on, "poi_interacted");
  assert.equal(step.trigger?.targetId, "poi_1");
});

test("ScenarioScript is a flat ordered list of steps under one id", () => {
  const script: ScenarioScript = {
    id: "some_scenario",
    steps: [
      { id: "a", kind: "dialogue", text: "first" },
      { id: "b", kind: "dialogue", text: "second" },
    ],
  };
  assert.equal(script.steps.length, 2);
  assert.deepEqual(
    script.steps.map((step) => step.id),
    ["a", "b"],
  );
});
