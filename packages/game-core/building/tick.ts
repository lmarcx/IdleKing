import type { GameState } from "../game/state.js";
import type { BuildingModule, BuildingTickResult } from "./types.js";
import { BUILDINGS } from "./registry.js";

export type TickAllBuildingsResult = {
  next: GameState;
  logs: string[];
};

export function tickAllBuildings(
  state: GameState,
  minutes: number
): TickAllBuildingsResult {
  const m = Math.max(0, Math.floor(minutes));
  if (m === 0) return { next: state, logs: [] };

  let next = state;
  const logs: string[] = [];

  // tick minute par minute pour permettre des règles (stamina/stop si épuisé, etc.)
  for (let i = 0; i < m; i++) {
    for (const b of BUILDINGS) {
      if (!b.isUnlocked(next)) continue;
      if (!b.isActive(next)) continue;

      const res: BuildingTickResult = b.tick(next, { minutes: 1 });
      next = res.next;
      if (res.log?.length) logs.push(...res.log);
    }
  }

  return { next, logs };
}