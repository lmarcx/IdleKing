import test from "node:test";
import assert from "node:assert/strict";

import { buildCharacterCombatLoadout } from "../character/index.js";
import { generateEquipmentItem } from "../equipment/index.js";
import { createInitialGameState, type GameState } from "../game/state.js";
import type { SkillId } from "../skills/index.js";

function stateWithEquippedRings(skillIds: readonly SkillId[]): GameState {
  const rings = skillIds.map((skillId, index) =>
    generateEquipmentItem({
      id: `ring-${index + 1}`,
      itemLevel: 10 + index,
      rarity: index === 0 ? "COMMON" : "RARE",
      seed: `ring-${skillId}`,
      skillId,
      slot: "ring",
    })
  );

  return {
    ...createInitialGameState(),
    equipment: {
      equipped: {
        ...createInitialGameState().equipment.equipped,
        rings: [
          rings[0]?.id ?? null,
          rings[1]?.id ?? null,
          rings[2]?.id ?? null,
          rings[3]?.id ?? null,
          rings[4]?.id ?? null,
        ],
      },
    },
    inventory: { items: rings },
  };
}

test("character combat loadout reads five equipped rings as active SK slots", () => {
  const gameState = stateWithEquippedRings(["SK-001", "SK-003", "SK-004", "SK-012", "SK-015"]);
  const loadout = buildCharacterCombatLoadout(gameState);

  assert.ok(loadout.stats.hp >= 100);
  assert.ok(loadout.stats.attack > 25);
  assert.ok(loadout.stats.defense > 0);
  assert.ok(loadout.stats.power > 25);
  assert.deepEqual(
    loadout.skills.map((skill) => [skill.slot, skill.skillId]),
    [
      [1, "SK-001"],
      [2, "SK-003"],
      [3, "SK-004"],
      [4, "SK-012"],
      [5, "SK-015"],
    ]
  );
  assert.ok(loadout.skills.every((skill) => skill.skillDef.id === skill.skillId));
  assert.ok(loadout.skills.every((skill) => skill.ringSkillScaling > 1));
});

test("character combat loadout rejects unknown equipped ring skillId", () => {
  const gameState = stateWithEquippedRings(["SK-001"]);
  const brokenState = {
    ...gameState,
    inventory: {
      items: gameState.inventory.items.map((item) =>
        "slot" in item && item.slot === "ring" ? { ...item, skillId: "SK-999" } : item
      ),
    },
  } as unknown as GameState;

  assert.throws(() => buildCharacterCombatLoadout(brokenState), /Unknown equipped ring skillId/);
});

test("character combat loadout rejects duplicate equipped ring skillIds", () => {
  const gameState = stateWithEquippedRings(["SK-001", "SK-003"]);
  const duplicateState = {
    ...gameState,
    inventory: {
      items: gameState.inventory.items.map((item, index) =>
        index === 1 && "slot" in item && item.slot === "ring" ? { ...item, skillId: "SK-001" } : item
      ),
    },
  } as unknown as GameState;

  assert.throws(() => buildCharacterCombatLoadout(duplicateState), /Duplicate equipped ring skillId/);
});

test("character combat loadout does not require legacy gameState.skills", () => {
  const gameState = stateWithEquippedRings(["SK-004"]);
  const withoutLegacySkills = { ...gameState, skills: undefined } as unknown as GameState;
  const loadout = buildCharacterCombatLoadout(withoutLegacySkills);

  assert.deepEqual(
    loadout.skills.map((skill) => skill.skillId),
    ["SK-004"]
  );
});

test("empty character combat loadout keeps stats and no active skills", () => {
  const loadout = buildCharacterCombatLoadout(createInitialGameState());

  assert.deepEqual(loadout.stats, {
    hp: 100,
    attack: 25,
    defense: 0,
    power: 25,
  });
  assert.deepEqual(loadout.skills, []);
});
