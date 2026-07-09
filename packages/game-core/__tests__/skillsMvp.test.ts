import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { createCombatRuntimeState } from "../combat/runtime/index.js";
import {
  SKILL_CATEGORIES,
  SKILL_ELEMENTS,
  SKILL_IDS,
  SKILL_REGISTRY,
  STORY_SKILL_RUNTIME_PROFILES,
  canCastSkill,
  castSkill,
  getSkillDefinitionOrThrow,
  getStorySkillRuntimeProfile,
  getSkillRemainingCooldownSeconds,
  validateSkillRegistry,
  type SkillDefinition,
} from "../skills/index.js";

function createState(manaCurrent = 100) {
  return createCombatRuntimeState({
    player: {
      hpMax: 100,
      manaMax: 100,
      manaCurrent,
      staminaMax: 100,
      manaRegenPerSecond: 5,
      staminaRegenPerSecond: 10,
      attack: 20,
    },
    enemy: {
      hpMax: 100,
    },
  });
}

test("MVP registry contains exactly SK-001 through SK-016", () => {
  assert.deepEqual(Object.keys(SKILL_REGISTRY), [...SKILL_IDS]);
  assert.equal(Object.values(SKILL_REGISTRY).length, 16);
  assert.doesNotThrow(() => validateSkillRegistry());
});

test("MVP registry supports every locked category and element enum", () => {
  assert.deepEqual(SKILL_CATEGORIES, [
    "attack",
    "movement",
    "defense",
    "utility",
    "summon",
  ]);
  assert.deepEqual(SKILL_ELEMENTS, [
    "neutral",
    "fire",
    "water",
    "ice",
    "wind",
    "electricity",
    "ground",
    "light",
    "dark",
  ]);

  for (const skillDefinition of Object.values(SKILL_REGISTRY)) {
    assert.ok(SKILL_CATEGORIES.includes(skillDefinition.category));
    assert.ok(SKILL_ELEMENTS.includes(skillDefinition.element));
    assert.ok(skillDefinition.manaCost > 0);
    assert.ok(skillDefinition.cooldownSeconds >= 0);
  }
});

test("MVP skill definitions exclude retired progression and backlog systems", () => {
  for (const skillDefinition of Object.values(SKILL_REGISTRY)) {
    assert.equal("level" in skillDefinition, false);
    assert.equal("skillLevel" in skillDefinition, false);
    assert.equal("skillPoints" in skillDefinition, false);
    assert.equal("passive" in skillDefinition, false);
    assert.equal("ultimate" in skillDefinition, false);
    assert.equal("powerStone" in skillDefinition, false);
  }
});

test("registry validation rejects unknown, duplicate, and invalid definitions", () => {
  const base = SKILL_REGISTRY["SK-001"];
  const unknownId = [{ ...base, id: "SK-099" }] as unknown as readonly SkillDefinition[];
  const duplicate = [{ ...base }, { ...base }] as readonly SkillDefinition[];
  const invalidMana = [{ ...base, manaCost: 0 }] as readonly SkillDefinition[];
  const invalidCooldown = [{ ...base, cooldownSeconds: -1 }] as readonly SkillDefinition[];

  assert.throws(() => validateSkillRegistry(unknownId), /Unknown MVP skill id/);
  assert.throws(() => validateSkillRegistry(duplicate), /Duplicate MVP skill id/);
  assert.throws(() => validateSkillRegistry(invalidMana), /Invalid Mana cost/);
  assert.throws(() => validateSkillRegistry(invalidCooldown), /Invalid cooldown/);
});

test("canCastSkill rejects insufficient Mana without mutating state", () => {
  const state = createState(10);
  const result = canCastSkill(state, "SK-001", { nowMs: 1_000 });

  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(result.reason, "not_enough_mana");
  assert.equal(result.updatedState, state);
});

test("castSkill spends Mana and applies a cooldown", () => {
  const state = createState();
  const result = castSkill(state, "SK-001", { nowMs: 10_000 });

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(
    result.updatedState.player.manaCurrent,
    state.player.manaCurrent - result.skillDef.manaCost
  );
  assert.equal(
    result.updatedState.timers.skillCooldowns["SK-001"],
    10_000 + result.skillDef.cooldownSeconds * 1_000
  );
  assert.deepEqual(result.damageInput, {
    skillDamageMultiplier: result.skillDef.basePower,
  });
});

test("skill cannot be recast during cooldown and becomes castable afterward", () => {
  const firstCast = castSkill(createState(), "SK-004", { nowMs: 10_000 });
  assert.equal(firstCast.success, true);
  if (!firstCast.success) return;

  const duringCooldown = castSkill(firstCast.updatedState, "SK-004", {
    nowMs: firstCast.nextAvailableAtMs - 1,
  });
  assert.equal(duringCooldown.success, false);
  if (duringCooldown.success) return;
  assert.equal(duringCooldown.reason, "cooldown");
  assert.ok(duringCooldown.remainingCooldownSeconds > 0);

  assert.equal(
    getSkillRemainingCooldownSeconds(
      "SK-004",
      firstCast.updatedState.timers.skillCooldowns,
      firstCast.nextAvailableAtMs
    ),
    0
  );

  const afterCooldown = castSkill(firstCast.updatedState, "SK-004", {
    nowMs: firstCast.nextAvailableAtMs,
  });
  assert.equal(afterCooldown.success, true);
});

test("unknown MVP skill fails cleanly", () => {
  const state = createState();
  const result = castSkill(state, "SK-999", { nowMs: 10_000 });

  assert.deepEqual(result, {
    success: false,
    reason: "unknown_skill",
    updatedState: state,
    skillDef: null,
    remainingCooldownSeconds: 0,
  });
  assert.throws(() => getSkillDefinitionOrThrow("SK-999"), /Unknown MVP skill/);
});

test("summon cast remains a data-driven runtime stub", () => {
  const result = castSkill(createState(), "SK-015", { nowMs: 10_000 });

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.skillDef.category, "summon");
  assert.equal(result.damageInput, undefined);
});

test("Story runtime profiles differentiate all 16 SK skills without level systems", () => {
  assert.deepEqual(Object.keys(STORY_SKILL_RUNTIME_PROFILES), [...SKILL_IDS]);

  for (const skillId of SKILL_IDS) {
    const skillDefinition = getSkillDefinitionOrThrow(skillId);
    const profile = getStorySkillRuntimeProfile(skillId);

    assert.equal(profile.skillId, skillId);
    assert.equal(profile.targeting, skillDefinition.targeting);

    const behaviorCount = [
      profile.attack,
      profile.movement,
      profile.defense,
      profile.utility,
      profile.summon,
    ].filter(Boolean).length;
    assert.equal(behaviorCount, 1, `${skillId} should expose exactly one Story MVP behavior`);

    assert.equal("level" in profile, false);
    assert.equal("skillPoints" in profile, false);
  }
});

test("Story attack skills cover simple cone, line, aoe, auto target, and enemy cast shapes", () => {
  const attackShapes = Object.values(STORY_SKILL_RUNTIME_PROFILES)
    .map((profile) => profile.attack?.shape)
    .filter(Boolean);

  assert.deepEqual(attackShapes, [
    "cone",
    "aoe",
    "line",
    "auto_target",
    "enemy_cast",
  ]);
});

test("Story movement, defense, utility, and summon profiles remain lightweight MVP stubs", () => {
  assert.deepEqual(
    ["SK-006", "SK-007", "SK-008"].map((skillId) => getStorySkillRuntimeProfile(skillId as typeof SKILL_IDS[number]).movement?.mode),
    ["step", "leap", "dash"]
  );

  assert.deepEqual(
    ["SK-009", "SK-010", "SK-011"].map((skillId) => getStorySkillRuntimeProfile(skillId as typeof SKILL_IDS[number]).defense?.kind),
    ["shield", "barrier", "barrier"]
  );

  assert.deepEqual(
    ["SK-012", "SK-013", "SK-014"].map((skillId) => getStorySkillRuntimeProfile(skillId as typeof SKILL_IDS[number]).utility?.kind),
    ["damage_buff", "mana_regen_buff", "enemy_vulnerability_debuff"]
  );

  assert.deepEqual(
    ["SK-015", "SK-016"].map((skillId) => getStorySkillRuntimeProfile(skillId as typeof SKILL_IDS[number]).summon?.stubId),
    ["spectral_hound", "frozen_wisp"]
  );
});

test("game-core TypeScript source has no rendering-engine imports", () => {
  const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const sourceFiles = listTypeScriptFiles(packageRoot).filter(
    (filePath) => !filePath.includes(`${join(packageRoot, "dist")}`)
  );
  const renderingPackage = `pix${"i"}`;
  const importPattern = new RegExp(
    `(?:from\\s+["']${renderingPackage}(?:\\.js)?["']|import\\s*\\(\\s*["']${renderingPackage}(?:\\.js)?["'])`,
    "i"
  );

  for (const filePath of sourceFiles) {
    assert.doesNotMatch(readFileSync(filePath, "utf8"), importPattern, filePath);
  }
});

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) return listTypeScriptFiles(filePath);
    return extname(entry.name) === ".ts" ? [filePath] : [];
  });
}
