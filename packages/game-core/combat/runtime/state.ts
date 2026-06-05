import { CRIT_DAMAGE_DEFAULT } from "../../power/constants.js";
import { capCritChance, getCritDamage } from "../../power/statsModel.js";
import type {
  CombatRuntimeState,
  CreateCombatRuntimeStateInput,
} from "./types.js";

function nonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeCurrent(value: number | undefined, max: number): number {
  return clamp(nonNegative(value ?? max), 0, max);
}

export function createCombatRuntimeState(
  input: CreateCombatRuntimeStateInput
): CombatRuntimeState {
  const playerHpMax = nonNegative(input.player.hpMax);
  const playerHpCurrent = normalizeCurrent(input.player.hpCurrent, playerHpMax);
  const manaMax = nonNegative(input.player.manaMax);
  const staminaMax = nonNegative(input.player.staminaMax);
  const enemyHpMax = nonNegative(input.enemy.hpMax);
  const enemyHpCurrent = normalizeCurrent(input.enemy.hpCurrent, enemyHpMax);

  return {
    player: {
      hpCurrent: playerHpCurrent,
      hpMax: playerHpMax,
      manaCurrent: normalizeCurrent(input.player.manaCurrent, manaMax),
      manaMax,
      staminaCurrent: normalizeCurrent(input.player.staminaCurrent, staminaMax),
      staminaMax,
      manaRegenPerSecond: nonNegative(input.player.manaRegenPerSecond),
      staminaRegenPerSecond: nonNegative(input.player.staminaRegenPerSecond),
      attack: nonNegative(input.player.attack),
      critChance: capCritChance(input.player.critChance ?? 0),
      critDamage: getCritDamage(input.player.critDamage ?? CRIT_DAMAGE_DEFAULT),
      statuses: [...(input.player.statuses ?? [])],
      isDead: playerHpCurrent <= 0,
      respawnRequired: playerHpCurrent <= 0,
    },
    enemy: {
      hpCurrent: enemyHpCurrent,
      hpMax: enemyHpMax,
      def: nonNegative(input.enemy.def ?? 0),
      statuses: [...(input.enemy.statuses ?? [])],
      isDead: enemyHpCurrent <= 0,
    },
    checkpoint: {
      checkpointIndex: Math.max(0, Math.floor(input.checkpoint?.checkpointIndex ?? 0)),
      securedRewards: [...(input.checkpoint?.securedRewards ?? [])],
    },
    timers: {
      dashCooldownRemainingSeconds: 0,
      skillCooldowns: {},
    },
  };
}
