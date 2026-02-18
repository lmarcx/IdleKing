import type { BossDef } from "./types.js";

export const BOSSES: Record<string, BossDef> = {
  BOSS_1: {
    id: "BOSS_1",
    name: "Émissaire du Brasier",
    element: "FIRE",
    baseStats: {
      hp: 1800,
      attack: 28,
      armor: 20,
      resists: { FIRE: 30, ICE: 5, LIGHTNING: 10, VOID: 0 },
      elemental: { FIRE: 10, ICE: 0, LIGHTNING: 0, VOID: 0 },
      critChance: 0.1,
      critDmg: 1.5,
      speedRating: 30,
      pierceRating: 20,
    },
    phases: [
      {
        id: 1,
        hpThresholdPct: 1.0,
        pattern: {
          basicIntervalSec: 1.6,
          specialIntervalSec: 6.0,
          special: { name: "Souffle de Braise", element: "FIRE", multiplier: 2.2 },
        },
      },
      {
        id: 2,
        hpThresholdPct: 0.40,
        pattern: {
          basicIntervalSec: 1.2,
          specialIntervalSec: 4.8,
          special: { name: "Incandescence", element: "FIRE", multiplier: 2.8 },
        },
      },
    ],
  },
} as const;
