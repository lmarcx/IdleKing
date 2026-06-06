import { combat, power, random, type CharacterCombatLoadout } from "@idleking/game-core";
import type { SkillCastDamageInput } from "@idleking/game-core/skills";

import type { StoryLevelEnemy } from "./story-level-combat";

type RuntimeEnemySource = Pick<StoryLevelEnemy, "hp" | "maxHp">;

// DEFERRED balancing placeholders for the visual Story slice only.
export const STORY_RUNTIME_VISUAL_PLACEHOLDERS = {
  dashDistance: 104,
  dashFeedbackDurationMs: 1200,
  enemyDef: 0,
  sprintSpeedMultiplier: 1.45,
} as const;

function hashLevelId(levelId: string): number {
  let seed = 0x811c9dc5;
  for (const character of levelId) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 0x01000193);
  }
  return seed >>> 0;
}

function createRuntimeEnemy(enemy: RuntimeEnemySource): combat.CombatRuntimeEnemy {
  return {
    def: STORY_RUNTIME_VISUAL_PLACEHOLDERS.enemyDef,
    hpCurrent: enemy.hp,
    hpMax: enemy.maxHp,
    isDead: enemy.hp <= 0,
    statuses: [],
  };
}

export function createStoryCombatRng(levelId: string): random.SeededRng {
  return random.createSeededRng(hashLevelId(levelId));
}

export function createStoryCombatRuntimeState(
  combatLoadout: CharacterCombatLoadout,
  enemy: RuntimeEnemySource
): combat.CombatRuntimeState {
  const derivedStats = power.deriveStats({
    hp: combatLoadout.stats.hp,
    atk: combatLoadout.stats.attack,
    def: combatLoadout.stats.defense,
    speed: 0,
  });

  return combat.createCombatRuntimeState({
    enemy: createRuntimeEnemy(enemy),
    player: {
      attack: derivedStats.base.atk,
      critChance: derivedStats.advanced.critChance,
      critDamage: derivedStats.advanced.critDamage,
      hpMax: derivedStats.resources.maxHp,
      manaMax: derivedStats.resources.maxMana,
      manaRegenPerSecond: derivedStats.advanced.manaRegen,
      staminaMax: derivedStats.resources.maxStamina,
      staminaRegenPerSecond: derivedStats.advanced.staminaRegen,
    },
  });
}

export function retargetStoryCombatRuntimeEnemy(
  state: combat.CombatRuntimeState,
  enemy: RuntimeEnemySource
): combat.CombatRuntimeState {
  return {
    ...state,
    enemy: createRuntimeEnemy(enemy),
  };
}

/**
 * Skill hit damage for the Story slice. Maps runtime inputs to game-core
 * combat.computeSkillDamage() (the single source of truth). No damage formula
 * lives in apps/web; POWER is never passed in.
 */
export function computeStorySkillDamage(
  state: combat.CombatRuntimeState,
  damageInput: SkillCastDamageInput,
  options?: { buffMultiplier?: number }
): number {
  const result = combat.computeSkillDamage({
    attack: state.player.attack,
    ...damageInput,
    buffMultiplier: options?.buffMultiplier,
    targetDef: STORY_RUNTIME_VISUAL_PLACEHOLDERS.enemyDef,
    attackerStatuses: state.player.statuses,
  });
  return Math.max(0, Math.round(result.damage));
}
