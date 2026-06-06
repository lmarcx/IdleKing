import type { GameState } from "../game/state.js";
import {
  calculateFinalCharacterStats,
  calculateRingSkillScaling,
  getEquippedRingItems,
  normalizePlayerEquipmentState,
  type FinalCharacterStats,
  type RingEquipmentInstance,
} from "../equipment/index.js";
import { getSkillDefinition } from "../skills/registry.js";
import type { SkillDefinition, SkillId } from "../skills/types.js";

export type CharacterCombatStats = FinalCharacterStats;

export type CombatSkillSlot = 1 | 2 | 3 | 4 | 5;

export type EquippedCombatSkill = {
  slot: CombatSkillSlot;
  skillId: SkillId;
  skillDef: SkillDefinition;
  ring: RingEquipmentInstance;
  ringSkillScaling: number;
};

export type CharacterCombatLoadout = {
  stats: CharacterCombatStats;
  skills: EquippedCombatSkill[];
};

const COMBAT_SKILL_SLOTS: readonly CombatSkillSlot[] = [1, 2, 3, 4, 5] as const;

export function buildCharacterCombatLoadout(gameState: GameState): CharacterCombatLoadout {
  const equippedRingIds = normalizePlayerEquipmentState(gameState.equipment).equipped.rings;
  const equippedRings = getEquippedRingItems(gameState).slice(0, COMBAT_SKILL_SLOTS.length);
  const seenSkillIds = new Set<SkillId>();
  const skills = COMBAT_SKILL_SLOTS.flatMap((slot, index): EquippedCombatSkill[] => {
    const ring = equippedRings[index];
    if (!ring && equippedRingIds[index]) {
      const rawItem = gameState.inventory.items.find((item) => item.id === equippedRingIds[index]);
      if (rawItem && "slot" in rawItem && rawItem.slot === "ring" && rawItem.skillId != null) {
        throw new Error(`Unknown equipped ring skillId: ${rawItem.skillId}`);
      }
    }
    if (!ring || ring.skillId == null) return [];

    const skillDef = getSkillDefinition(ring.skillId);
    if (!skillDef) {
      throw new Error(`Unknown equipped ring skillId: ${ring.skillId}`);
    }
    if (seenSkillIds.has(skillDef.id)) {
      throw new Error(`Duplicate equipped ring skillId: ${skillDef.id}`);
    }
    seenSkillIds.add(skillDef.id);

    return [{
      slot,
      skillId: skillDef.id,
      skillDef,
      ring,
      ringSkillScaling: calculateRingSkillScaling(ring),
    }];
  });

  return {
    stats: calculateFinalCharacterStats(gameState),
    skills,
  };
}
