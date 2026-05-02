import {
  buildCharacterCombatLoadout,
  type CharacterCombatLoadout,
} from "@idleking/game-core";
import type { GameState } from "@idleking/game-core/game/state.js";

import { useGameStore } from "@/store/game-store";

export function buildCombatLoadoutFromGameState(state: GameState): CharacterCombatLoadout {
  return buildCharacterCombatLoadout(state);
}

export function getCombatLoadoutFromGameStore(): CharacterCombatLoadout {
  return buildCombatLoadoutFromGameState(useGameStore.getState().state);
}
