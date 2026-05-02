import test from "node:test";
import assert from "node:assert/strict";

import {
  createDefaultPlayerSkillsState,
  canUnlockOrUpgradeSkill,
  equipSkill,
  getEffectiveSkillDef,
  getEquippedSkillLoadout,
  getSkillProgress,
  isSkillUnlocked,
  respecSkills,
  unequipSkill,
  unlockOrUpgradeSkill,
  type PlayerSkillsState,
  type SkillId,
} from "../combat/index.js";
import { createInitialGameState } from "../game/state.js";

function withSkillPoints(state: PlayerSkillsState, skillPoints: number): PlayerSkillsState {
  return {
    ...state,
    skillPoints,
    skills: {
      royal_beam: { ...state.skills.royal_beam },
      king_aura: { ...state.skills.king_aura },
      royal_strike: { ...state.skills.royal_strike },
      war_cry: { ...state.skills.war_cry },
    },
    loadout: { ...state.loadout },
  };
}

function upgradeToLevel(state: PlayerSkillsState, skillId: SkillId, level: number): PlayerSkillsState {
  let next = state;

  while ((getSkillProgress(next, skillId)?.level ?? 0) < level) {
    const result = unlockOrUpgradeSkill(next, skillId);
    if (!result.ok) assert.fail(`Expected ${skillId} upgrade to level ${level}, got ${result.reason}`);
    next = result.state;
  }

  return next;
}

test("default player skills state starts with royal_strike unlocked and only slot 1 equipped", () => {
  const state = createDefaultPlayerSkillsState();

  assert.equal(state.skillPoints, 0);
  assert.deepEqual(getSkillProgress(state, "royal_strike"), {
    skillId: "royal_strike",
    level: 1,
    unlocked: true,
  });
  assert.equal(isSkillUnlocked(state, "royal_strike"), true);

  for (const skillId of ["royal_beam", "king_aura", "war_cry"] as const) {
    assert.deepEqual(getSkillProgress(state, skillId), {
      skillId,
      level: 0,
      unlocked: false,
    });
    assert.equal(isSkillUnlocked(state, skillId), false);
  }

  assert.deepEqual(state.loadout, {
    1: "royal_strike",
    2: null,
    3: null,
    4: null,
  });
});

test("initial game state includes player skill progression", () => {
  const state = createInitialGameState();

  assert.equal(state.skills.skillPoints, 0);
  assert.equal(state.skills.skills.royal_strike.level, 1);
  assert.deepEqual(state.skills.loadout, {
    1: "royal_strike",
    2: null,
    3: null,
    4: null,
  });
});

test("unlock fails cleanly without enough skill points", () => {
  const state = createDefaultPlayerSkillsState();
  const result = canUnlockOrUpgradeSkill(state, "royal_beam");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "INSUFFICIENT_SKILL_POINTS");
  assert.equal(result.requiredSkillPoints, 1);
  assert.equal(result.skillPoints, 0);
  assert.equal(getSkillProgress(state, "royal_beam")?.level, 0);
});

test("unlocking royal_beam spends the unlock cost without mutating the input state", () => {
  const state = withSkillPoints(createDefaultPlayerSkillsState(), 3);
  const result = unlockOrUpgradeSkill(state, "royal_beam");

  if (!result.ok) assert.fail(`Expected royal_beam unlock, got ${result.reason}`);

  assert.equal(result.previousLevel, 0);
  assert.equal(result.level, 1);
  assert.equal(result.cost, 1);
  assert.equal(result.state.skillPoints, 2);
  assert.deepEqual(getSkillProgress(result.state, "royal_beam"), {
    skillId: "royal_beam",
    level: 1,
    unlocked: true,
  });
  assert.equal(getSkillProgress(state, "royal_beam")?.level, 0);
  assert.equal(state.skillPoints, 3);
});

test("upgrading to level 5 deducts the expected costs and cannot exceed max level", () => {
  let state = withSkillPoints(createDefaultPlayerSkillsState(), 12);
  state = upgradeToLevel(state, "royal_beam", 5);

  assert.equal(getSkillProgress(state, "royal_beam")?.level, 5);
  assert.equal(state.skillPoints, 0);

  const result = unlockOrUpgradeSkill(state, "royal_beam");
  assert.equal(result.ok, false);
  assert.equal(result.reason, "MAX_LEVEL");
  assert.equal(result.currentLevel, 5);
});

test("locked skills cannot be equipped and a skill cannot be equipped twice", () => {
  const initial = createDefaultPlayerSkillsState();
  const locked = equipSkill(initial, "royal_beam", 2);

  assert.equal(locked.ok, false);
  assert.equal(locked.reason, "LOCKED_SKILL");

  const duplicate = equipSkill(initial, "royal_strike", 2);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.reason, "ALREADY_EQUIPPED");
});

test("equipSkill replaces a slot and unequipSkill clears a slot", () => {
  let state = withSkillPoints(createDefaultPlayerSkillsState(), 1);
  const unlock = unlockOrUpgradeSkill(state, "royal_beam");
  if (!unlock.ok) assert.fail(`Expected royal_beam unlock, got ${unlock.reason}`);
  state = unlock.state;

  const equipped = equipSkill(state, "royal_beam", 1);
  if (!equipped.ok) assert.fail(`Expected royal_beam equip, got ${equipped.reason}`);

  assert.deepEqual(getEquippedSkillLoadout(equipped.state), {
    1: "royal_beam",
    2: null,
    3: null,
    4: null,
  });

  const unequipped = unequipSkill(equipped.state, 1);
  if (!unequipped.ok) assert.fail(`Expected slot 1 unequip, got ${unequipped.reason}`);
  assert.deepEqual(getEquippedSkillLoadout(unequipped.state), {
    1: null,
    2: null,
    3: null,
    4: null,
  });
});

test("invalid skill slots fail cleanly", () => {
  const state = createDefaultPlayerSkillsState();

  const equip = equipSkill(state, "royal_strike", 5);
  assert.equal(equip.ok, false);
  assert.equal(equip.reason, "INVALID_SLOT");

  const unequip = unequipSkill(state, 0);
  assert.equal(unequip.ok, false);
  assert.equal(unequip.reason, "INVALID_SLOT");
});

test("respec restores defaults and refunds spent points while preserving total points", () => {
  let state = withSkillPoints(createDefaultPlayerSkillsState(), 20);
  state = upgradeToLevel(state, "royal_beam", 3);
  state = upgradeToLevel(state, "royal_strike", 3);

  const spent = 7;
  assert.equal(state.skillPoints, 20 - spent);

  const result = respecSkills(state);

  assert.equal(result.ok, true);
  assert.equal(result.refundedSkillPoints, spent);
  assert.equal(result.state.skillPoints, 20);
  assert.equal(getSkillProgress(result.state, "royal_beam")?.level, 0);
  assert.equal(getSkillProgress(result.state, "royal_strike")?.level, 1);
  assert.deepEqual(result.state.loadout, {
    1: "royal_strike",
    2: null,
    3: null,
    4: null,
  });
});

test("effective royal_beam upgrades apply damage, range, width, and tick interval", () => {
  const state = upgradeToLevel(withSkillPoints(createDefaultPlayerSkillsState(), 12), "royal_beam", 5);
  const def = getEffectiveSkillDef("royal_beam", state);

  assert.equal(def.damageMultiplier, 0.495);
  assert.equal(def.range, 480);
  assert.equal(def.width, 96);
  assert.equal(def.tickIntervalMs, 200);
});

test("effective king_aura upgrades apply damage, radius, duration, and tick interval", () => {
  const state = upgradeToLevel(withSkillPoints(createDefaultPlayerSkillsState(), 12), "king_aura", 5);
  const def = getEffectiveSkillDef("king_aura", state);

  assert.equal(def.damageMultiplier, 0.66);
  assert.equal(def.radius, 220);
  assert.equal(def.durationMs, 6000);
  assert.equal(def.tickIntervalMs, 800);
});

test("effective royal_strike upgrades apply damage, range, and width", () => {
  const state = upgradeToLevel(withSkillPoints(createDefaultPlayerSkillsState(), 11), "royal_strike", 5);
  const def = getEffectiveSkillDef("royal_strike", state);

  assert.equal(def.damageMultiplier, 2.5875);
  assert.equal(def.range, 200);
  assert.equal(def.width, 160);
});

test("effective war_cry upgrades apply bonus, duration, and cooldown", () => {
  const state = upgradeToLevel(withSkillPoints(createDefaultPlayerSkillsState(), 12), "war_cry", 5);
  const def = getEffectiveSkillDef("war_cry", state);

  assert.equal(def.bonusDamageMultiplier, 0.35);
  assert.equal(def.durationMs, 7000);
  assert.equal(def.cooldownMs, 13000);
});

test("locked skills return their base skill definition", () => {
  const state = createDefaultPlayerSkillsState();
  const def = getEffectiveSkillDef("royal_beam", state);

  assert.equal(def.damageMultiplier, 0.45);
  assert.equal(def.range, 420);
  assert.equal(def.width, 72);
  assert.equal(def.tickIntervalMs, 250);
});
