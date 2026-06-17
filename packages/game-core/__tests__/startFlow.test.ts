import test from "node:test";
import assert from "node:assert/strict";

import {
  INTRO_SEEN_FLAG,
  completeDungeon,
  getStartFlowStep,
  getCinematicScript,
  hasSeenIntro,
  isPrologueComplete,
  markIntroSeen,
  PROLOGUE_AWAKENING,
} from "../index.js";
import { createInitialGameState } from "../game/state.js";
import { getStoryFlags } from "../story/progressionMvp.js";

test("a fresh game starts on the cinematic step", () => {
  const state = createInitialGameState();
  assert.equal(hasSeenIntro(state), false);
  assert.equal(getStartFlowStep(state), "cinematic");
});

test("markIntroSeen advances to the prologue step and persists via story flags", () => {
  const state = markIntroSeen(createInitialGameState());
  assert.equal(hasSeenIntro(state), true);
  assert.ok(getStoryFlags(state).has(INTRO_SEEN_FLAG));
  assert.equal(getStartFlowStep(state), "prologue");
});

test("markIntroSeen is idempotent and does not duplicate the flag", () => {
  const once = markIntroSeen(createInitialGameState());
  const twice = markIntroSeen(once);
  assert.equal(twice, once, "second call returns the same state reference");
  const introFlags = [...getStoryFlags(twice)].filter((flag) => flag === INTRO_SEEN_FLAG);
  assert.equal(introFlags.length, 1);
});

test("clearing the prologue dungeon advances to the kingdom step", () => {
  let state = markIntroSeen(createInitialGameState());
  assert.equal(getStartFlowStep(state), "prologue");

  const result = completeDungeon(state, "prologue_wastelands");
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("prologue completion should succeed");
  state = result.next;

  assert.equal(isPrologueComplete(state), true);
  assert.equal(getStartFlowStep(state), "kingdom");
});

test("prologue cannot be skipped: completing it without the intro still gates on cinematic", () => {
  // Edge case: if a save somehow has the prologue done but no intro flag, the
  // step machine still surfaces the cinematic first (intro flag is the gate).
  const base = createInitialGameState();
  const result = completeDungeon(base, "prologue_wastelands");
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("prologue completion should succeed");
  assert.equal(getStartFlowStep(result.next), "cinematic");
});

test("the prologue awakening cinematic is registered and non-empty", () => {
  const script = getCinematicScript(PROLOGUE_AWAKENING.id);
  assert.ok(script, "prologue_awakening must be registered");
  assert.ok((script?.slides.length ?? 0) >= 3);
  for (const slide of script?.slides ?? []) {
    assert.ok(slide.text.trim().length > 0, "every slide has text");
  }
});
