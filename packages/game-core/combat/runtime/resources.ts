import {
  DASH_COOLDOWN_SECONDS,
  DASH_STAMINA_COST,
  SPRINT_STAMINA_COST_PER_SECOND,
} from "./constants.js";
import type { CombatRuntimeState } from "./types.js";

export type ApplyDashCostResult =
  | { ok: true; next: CombatRuntimeState }
  | { ok: false; next: CombatRuntimeState; reason: "PLAYER_DEAD" | "NOT_ENOUGH_STAMINA" | "COOLDOWN" };

function nonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function spendMana(state: CombatRuntimeState, amount: number): CombatRuntimeState {
  return {
    ...state,
    player: {
      ...state.player,
      manaCurrent: clamp(state.player.manaCurrent - nonNegative(amount), 0, state.player.manaMax),
    },
  };
}

export function spendStamina(state: CombatRuntimeState, amount: number): CombatRuntimeState {
  return {
    ...state,
    player: {
      ...state.player,
      staminaCurrent: clamp(
        state.player.staminaCurrent - nonNegative(amount),
        0,
        state.player.staminaMax
      ),
    },
  };
}

export function regenerateResources(
  state: CombatRuntimeState,
  deltaSeconds: number
): CombatRuntimeState {
  const duration = nonNegative(deltaSeconds);
  return {
    ...state,
    player: {
      ...state.player,
      manaCurrent: clamp(
        state.player.manaCurrent + state.player.manaRegenPerSecond * duration,
        0,
        state.player.manaMax
      ),
      staminaCurrent: clamp(
        state.player.staminaCurrent + state.player.staminaRegenPerSecond * duration,
        0,
        state.player.staminaMax
      ),
    },
  };
}

export function tickCombatRuntime(
  state: CombatRuntimeState,
  deltaSeconds: number
): CombatRuntimeState {
  const duration = nonNegative(deltaSeconds);
  const regenerated = regenerateResources(state, duration);
  return {
    ...regenerated,
    timers: {
      ...regenerated.timers,
      dashCooldownRemainingSeconds: Math.max(
        0,
        regenerated.timers.dashCooldownRemainingSeconds - duration
      ),
    },
  };
}

export function canSprint(state: CombatRuntimeState): boolean {
  return !state.player.isDead && state.player.staminaCurrent > 0;
}

export function applySprintCost(
  state: CombatRuntimeState,
  deltaSeconds: number
): CombatRuntimeState {
  if (!canSprint(state)) return state;
  return spendStamina(state, SPRINT_STAMINA_COST_PER_SECOND * nonNegative(deltaSeconds));
}

export function canDash(state: CombatRuntimeState): boolean {
  return (
    !state.player.isDead &&
    state.timers.dashCooldownRemainingSeconds <= 0 &&
    state.player.staminaCurrent >= DASH_STAMINA_COST
  );
}

export function applyDashCost(state: CombatRuntimeState): ApplyDashCostResult {
  if (state.player.isDead) {
    return { ok: false, next: state, reason: "PLAYER_DEAD" };
  }
  if (state.timers.dashCooldownRemainingSeconds > 0) {
    return { ok: false, next: state, reason: "COOLDOWN" };
  }
  if (state.player.staminaCurrent < DASH_STAMINA_COST) {
    return { ok: false, next: state, reason: "NOT_ENOUGH_STAMINA" };
  }

  const next = spendStamina(state, DASH_STAMINA_COST);
  return {
    ok: true,
    next: {
      ...next,
      timers: {
        ...next.timers,
        dashCooldownRemainingSeconds: DASH_COOLDOWN_SECONDS,
      },
    },
  };
}
