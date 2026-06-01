import {
  CHECKPOINT_HP_RESTORE_RATIO,
  CHECKPOINT_MANA_RESTORE_RATIO,
  CHECKPOINT_STAMINA_RESTORE_RATIO,
} from "./constants.js";
import type { CombatRuntimeState } from "./types.js";

function restoredValue(max: number, ratio: number): number {
  return Math.max(0, Math.min(max, max * ratio));
}

/**
 * Minimal checkpoint respawn placeholder. Secured rewards are deliberately preserved.
 */
export function handlePlayerDeathAtCheckpoint(
  state: CombatRuntimeState
): CombatRuntimeState {
  if (!state.player.isDead && !state.player.respawnRequired) return state;

  return {
    ...state,
    player: {
      ...state.player,
      hpCurrent: restoredValue(state.player.hpMax, CHECKPOINT_HP_RESTORE_RATIO),
      manaCurrent: restoredValue(state.player.manaMax, CHECKPOINT_MANA_RESTORE_RATIO),
      staminaCurrent: restoredValue(state.player.staminaMax, CHECKPOINT_STAMINA_RESTORE_RATIO),
      isDead: false,
      respawnRequired: false,
    },
    timers: {
      ...state.timers,
      dashCooldownRemainingSeconds: 0,
    },
  };
}
