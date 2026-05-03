import type { GameState } from "../game/state.js";
import { calculateFinalCharacterStats } from "../equipment/index.js";
import {
  getEffectiveSkillDef,
  getEquippedSkillLoadout,
  getSkillProgress,
  isSkillUnlocked,
  type SkillDef,
  type SkillId,
  type SkillSlot,
} from "../combat/skills/index.js";

export type CharacterCombatStats = {
  hp: number;
  attack: number;
  defense: number;
  power: number;
};

export type EquippedCombatSkill = {
  slot: SkillSlot;
  skillId: SkillId;
  skillDef: SkillDef;
  level: number;
};

export type CharacterCombatLoadout = {
  stats: CharacterCombatStats;
  skills: EquippedCombatSkill[];
};

const COMBAT_SKILL_SLOTS: readonly SkillSlot[] = [1, 2, 3, 4] as const;

export function buildCharacterCombatLoadout(gameState: GameState): CharacterCombatLoadout {
  const equippedLoadout = getEquippedSkillLoadout(gameState.skills);
  const skills = COMBAT_SKILL_SLOTS.flatMap((slot): EquippedCombatSkill[] => {
    const skillId = equippedLoadout[slot];
    if (!skillId || !isSkillUnlocked(gameState.skills, skillId)) return [];

    const progress = getSkillProgress(gameState.skills, skillId);
    if (!progress || progress.level <= 0) return [];

    return [
      {
        slot,
        skillId,
        skillDef: getEffectiveSkillDef(skillId, gameState.skills),
        level: progress.level,
      },
    ];
  });

  return {
    stats: calculateFinalCharacterStats(gameState),
    skills,
  };
}
