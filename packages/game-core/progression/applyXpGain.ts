import { applyPlayerXp } from "./xp.js";
import { applyWorldWxp } from "./worldXp.js";
import type { XpGain } from "./sources.js";

export type ProgressionSnapshot = {
  playerLevel: number;
  playerXp: number;
  worldLevel: number;
  worldWxp: number;
};

export type AppliedXpGain = {
  next: ProgressionSnapshot;
  player: ReturnType<typeof applyPlayerXp>;
  world: ReturnType<typeof applyWorldWxp>;
};

export function applyXpGain(
  state: ProgressionSnapshot,
  gain: XpGain
): AppliedXpGain {
  const player = applyPlayerXp(state.playerLevel, state.playerXp, gain.xp);
  const world = applyWorldWxp(state.worldLevel, state.worldWxp, gain.wxp);

  return {
    next: {
      playerLevel: player.newLevel,
      playerXp: player.newXp,
      worldLevel: world.newWorldLevel,
      worldWxp: world.newWorldWxp,
    },
    player,
    world,
  };
}
