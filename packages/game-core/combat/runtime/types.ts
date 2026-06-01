import type { ActiveStatusEffect } from "../core/statuses.js";

export type CombatSecuredReward = Readonly<{
  kind: string;
  id?: string;
  amount?: number;
}>;

export type CombatRuntimePlayer = {
  hpCurrent: number;
  hpMax: number;
  manaCurrent: number;
  manaMax: number;
  staminaCurrent: number;
  staminaMax: number;
  manaRegenPerSecond: number;
  staminaRegenPerSecond: number;
  attack: number;
  critChance: number;
  critDamage: number;
  statuses: readonly ActiveStatusEffect[];
  isDead: boolean;
  respawnRequired: boolean;
};

export type CombatRuntimeEnemy = {
  hpCurrent: number;
  hpMax: number;
  def: number;
  statuses: readonly ActiveStatusEffect[];
  isDead: boolean;
};

export type CombatRuntimeCheckpoint = {
  checkpointIndex: number;
  securedRewards: readonly CombatSecuredReward[];
};

export type CombatRuntimeTimers = {
  dashCooldownRemainingSeconds: number;
};

export type CombatRuntimeState = {
  player: CombatRuntimePlayer;
  enemy: CombatRuntimeEnemy;
  checkpoint: CombatRuntimeCheckpoint;
  timers: CombatRuntimeTimers;
};

export type CreateCombatRuntimeStateInput = {
  player: {
    hpMax: number;
    hpCurrent?: number;
    manaMax: number;
    manaCurrent?: number;
    staminaMax: number;
    staminaCurrent?: number;
    manaRegenPerSecond: number;
    staminaRegenPerSecond: number;
    attack: number;
    critChance?: number;
    critDamage?: number;
    statuses?: readonly ActiveStatusEffect[];
  };
  enemy: {
    hpMax: number;
    hpCurrent?: number;
    def?: number;
    statuses?: readonly ActiveStatusEffect[];
  };
  checkpoint?: {
    checkpointIndex?: number;
    securedRewards?: readonly CombatSecuredReward[];
  };
};
