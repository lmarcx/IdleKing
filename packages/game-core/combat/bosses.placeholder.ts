import type { BossDef } from "./types.js";
import type { Element } from "../power/types.js";
import { CRIT_DAMAGE_DEFAULT } from "../power/constants.js";

const ELEMENTS: readonly Element[] = ["FIRE", "ICE", "LIGHTNING", "VOID"] as const;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Placeholder scaling:
 * - Boss 1 is "baseline"
 * - Boss 9 is near endgame
 * - Final is special (higher hp/attack, more aggressive)
 */
function makePlaceholderBoss(level: number, id: string, name: string): BossDef {
  const t = clamp((level - 1) / 9, 0, 1); // 1..10 -> 0..1
  const element = ELEMENTS[(level - 1) % ELEMENTS.length];

  // Base stats scaling (controlled)
  const hp = Math.round(lerp(1800, 12000, t));
  const attack = Math.round(lerp(28, 160, t));
  const armor = Math.round(lerp(20, 140, t));

  const baseResistMain = Math.round(lerp(30, 65, t));
  const baseResistOff = Math.round(lerp(5, 28, t));

  const resists = {
    FIRE: element === "FIRE" ? baseResistMain : baseResistOff,
    ICE: element === "ICE" ? baseResistMain : baseResistOff,
    LIGHTNING: element === "LIGHTNING" ? baseResistMain : baseResistOff,
    VOID: element === "VOID" ? baseResistMain : baseResistOff,
  } as const;

  const elemental = {
    FIRE: element === "FIRE" ? Math.round(lerp(10, 55, t)) : 0,
    ICE: element === "ICE" ? Math.round(lerp(10, 55, t)) : 0,
    LIGHTNING: element === "LIGHTNING" ? Math.round(lerp(10, 55, t)) : 0,
    VOID: element === "VOID" ? Math.round(lerp(10, 55, t)) : 0,
  } as const;

  const critChance = lerp(0.10, 0.22, t);
  const speedRating = Math.round(lerp(30, 120, t));
  const pierceRating = Math.round(lerp(20, 110, t));

  // Pattern scaling
  const basic1 = lerp(1.6, 1.15, t);
  const special1 = lerp(6.0, 4.4, t);
  const mult1 = lerp(2.2, 2.9, t);

  const basic2 = lerp(1.2, 0.95, t);
  const special2 = lerp(4.8, 3.6, t);
  const mult2 = lerp(2.8, 3.5, t);

  return {
    id,
    name,
    element,
    baseStats: {
      hp,
      attack,
      armor,
      resists,
      elemental,
      critChance,
      critDmg: CRIT_DAMAGE_DEFAULT,
      speedRating,
      pierceRating,
    },
    phases: [
      {
        id: 1,
        hpThresholdPct: 1.0,
        pattern: {
          basicIntervalSec: Number(basic1.toFixed(2)),
          specialIntervalSec: Number(special1.toFixed(2)),
          special: { name: "Technique spéciale", element, multiplier: Number(mult1.toFixed(2)) },
        },
      },
      {
        id: 2,
        hpThresholdPct: 0.40,
        pattern: {
          basicIntervalSec: Number(basic2.toFixed(2)),
          specialIntervalSec: Number(special2.toFixed(2)),
          special: { name: "Technique déchaînée", element, multiplier: Number(mult2.toFixed(2)) },
        },
      },
    ],
  };
}

export const BOSSES: Record<string, BossDef> = {
  BOSS_1: makePlaceholderBoss(1, "BOSS_1", "Émissaire (Placeholder) I"),
  BOSS_2: makePlaceholderBoss(2, "BOSS_2", "Émissaire (Placeholder) II"),
  BOSS_3: makePlaceholderBoss(3, "BOSS_3", "Émissaire (Placeholder) III"),
  BOSS_4: makePlaceholderBoss(4, "BOSS_4", "Émissaire (Placeholder) IV"),
  BOSS_5: makePlaceholderBoss(5, "BOSS_5", "Émissaire (Placeholder) V"),
  BOSS_6: makePlaceholderBoss(6, "BOSS_6", "Émissaire (Placeholder) VI"),
  BOSS_7: makePlaceholderBoss(7, "BOSS_7", "Émissaire (Placeholder) VII"),
  BOSS_8: makePlaceholderBoss(8, "BOSS_8", "Émissaire (Placeholder) VIII"),
  BOSS_9: makePlaceholderBoss(9, "BOSS_9", "Émissaire (Placeholder) IX"),

  // Final: slightly stronger than level 10 scaling + more aggressive timers
  BOSS_FINAL: (() => {
    const b = makePlaceholderBoss(10, "BOSS_FINAL", "Roi du Mal (Placeholder)");
    return {
      ...b,
      name: "Roi du Mal (Placeholder)",
      baseStats: {
        ...b.baseStats,
        hp: Math.round(b.baseStats.hp * 1.25),
        attack: Math.round(b.baseStats.attack * 1.18),
        armor: Math.round(b.baseStats.armor * 1.12),
      },
      phases: [
        {
          id: 1,
          hpThresholdPct: 1.0,
          pattern: {
            basicIntervalSec: 1.05,
            specialIntervalSec: 4.2,
            special: { name: "Décret du Néant", element: "VOID", multiplier: 3.1 },
          },
        },
        {
          id: 2,
          hpThresholdPct: 0.55,
          pattern: {
            basicIntervalSec: 0.90,
            specialIntervalSec: 3.6,
            special: { name: "Couronne Brisée", element: "VOID", multiplier: 3.6 },
          },
        },
        {
          id: 3,
          hpThresholdPct: 0.25,
          pattern: {
            basicIntervalSec: 0.80,
            specialIntervalSec: 3.0,
            special: { name: "Jugement Final", element: "VOID", multiplier: 4.0 },
          },
        },
      ],
    };
  })(),
} as const;
