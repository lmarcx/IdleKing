import test from "node:test";
import assert from "node:assert/strict";

import { buildCharacterCombatLoadout } from "../character/index.js";
import { createInitialGameState } from "../game/state.js";
import {
  equipSkill,
  unlockOrUpgradeSkill,
  type PlayerSkillsState,
} from "../combat/index.js";

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

test("default character combat loadout exposes only royal_strike in slot 1", () => {
  const gameState = createInitialGameState();
  const loadout = buildCharacterCombatLoadout(gameState);

  assert.deepEqual(loadout.stats, {
    hp: 100,
    attack: 25,
    defense: 0,
    power: 25,
  });
  assert.equal(loadout.skills.length, 1);
  assert.equal(loadout.skills[0].slot, 1);
  assert.equal(loadout.skills[0].skillId, "royal_strike");
  assert.equal(loadout.skills[0].level, 1);
});

test("character combat loadout includes unlocked and equipped upgraded royal_beam", () => {
  let gameState = createInitialGameState();
  let skills = withSkillPoints(gameState.skills, 4);

  for (let level = 0; level < 3; level += 1) {
    const result = unlockOrUpgradeSkill(skills, "royal_beam");
    if (!result.ok) assert.fail(`Expected royal_beam upgrade, got ${result.reason}`);
    skills = result.state;
  }

  const equip = equipSkill(skills, "royal_beam", 2);
  if (!equip.ok) assert.fail(`Expected royal_beam equip, got ${equip.reason}`);
  gameState = { ...gameState, skills: equip.state };

  const loadout = buildCharacterCombatLoadout(gameState);
  const royalBeam = loadout.skills.find((skill) => skill.skillId === "royal_beam");

  assert.equal(royalBeam?.slot, 2);
  assert.equal(royalBeam?.level, 3);
  assert.equal(royalBeam?.skillDef.damageMultiplier, 0.495);
  assert.equal(royalBeam?.skillDef.range, 480);
});

test("character combat loadout ignores locked skills even if they are present in loadout", () => {
  const gameState = createInitialGameState();
  const loadout = buildCharacterCombatLoadout({
    ...gameState,
    skills: {
      ...gameState.skills,
      loadout: {
        ...gameState.skills.loadout,
        2: "royal_beam",
      },
    },
  });

  assert.deepEqual(
    loadout.skills.map((skill) => skill.skillId),
    ["royal_strike"],
  );
});

test("character combat loadout ignores empty slots", () => {
  const gameState = createInitialGameState();
  const loadout = buildCharacterCombatLoadout(gameState);

  assert.equal(loadout.skills.some((skill) => skill.slot === 2), false);
  assert.equal(loadout.skills.some((skill) => skill.slot === 3), false);
  assert.equal(loadout.skills.some((skill) => skill.slot === 4), false);
});
