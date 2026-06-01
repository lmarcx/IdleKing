import type { SeededRng } from "../../random/rng.js";
import { calculateDamage, type DamageResult } from "../core/damage.js";
import { BASIC_ATTACK_BASE_DAMAGE, BASIC_ATTACK_WEAPON_COEFFICIENT } from "./constants.js";
import type { CombatRuntimeState } from "./types.js";

export type BasicAttackResult =
  | { ok: true; next: CombatRuntimeState; damage: DamageResult }
  | { ok: false; next: CombatRuntimeState; reason: "PLAYER_DEAD" | "ENEMY_DEAD" };

function nonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

export function applyDamageToPlayer(
  state: CombatRuntimeState,
  damage: number
): CombatRuntimeState {
  const hpCurrent = Math.max(0, state.player.hpCurrent - nonNegative(damage));
  const isDead = hpCurrent <= 0;

  return {
    ...state,
    player: {
      ...state.player,
      hpCurrent,
      isDead,
      respawnRequired: isDead,
    },
  };
}

export function applyDamageToEnemy(
  state: CombatRuntimeState,
  damage: number
): CombatRuntimeState {
  const hpCurrent = Math.max(0, state.enemy.hpCurrent - nonNegative(damage));
  return {
    ...state,
    enemy: {
      ...state.enemy,
      hpCurrent,
      isDead: hpCurrent <= 0,
    },
  };
}

export function isPlayerDead(state: CombatRuntimeState): boolean {
  return state.player.isDead || state.player.hpCurrent <= 0;
}

export function performBasicAttack(
  state: CombatRuntimeState,
  rng?: Pick<SeededRng, "nextFloat">
): BasicAttackResult {
  if (isPlayerDead(state)) {
    return { ok: false, next: state, reason: "PLAYER_DEAD" };
  }
  if (state.enemy.isDead || state.enemy.hpCurrent <= 0) {
    return { ok: false, next: state, reason: "ENEMY_DEAD" };
  }

  const damage = calculateDamage(
    {
      baseDamage: BASIC_ATTACK_BASE_DAMAGE,
      attack: state.player.attack,
      weaponCoefficient: BASIC_ATTACK_WEAPON_COEFFICIENT,
      targetDef: state.enemy.def,
      critChance: state.player.critChance,
      critDamage: state.player.critDamage,
      attackerStatuses: state.player.statuses,
      targetStatuses: state.enemy.statuses,
    },
    rng
  );

  return {
    ok: true,
    next: applyDamageToEnemy(state, damage.damage),
    damage,
  };
}
