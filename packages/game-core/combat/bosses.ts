import type { BossDef } from "./types.js";
import { CRIT_DAMAGE_DEFAULT } from "../power/constants.js";

export const BOSSES: Record<string, BossDef> = {
  // ----------------------------
  // VOLCANIC (Boss 1-2) — FIRE
  // ----------------------------
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
      critDmg: CRIT_DAMAGE_DEFAULT,
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

  BOSS_2: {
    id: "BOSS_2",
    name: "Géant des Fumerolles",
    element: "FIRE",
    baseStats: {
      hp: 2400,
      attack: 34,
      armor: 26,
      resists: { FIRE: 36, ICE: 8, LIGHTNING: 12, VOID: 4 },
      elemental: { FIRE: 14, ICE: 0, LIGHTNING: 0, VOID: 0 },
      critChance: 0.11,
      critDmg: CRIT_DAMAGE_DEFAULT,
      speedRating: 34,
      pierceRating: 24,
    },
    phases: [
      {
        id: 1,
        hpThresholdPct: 1.0,
        pattern: {
          basicIntervalSec: 1.52,
          specialIntervalSec: 5.6,
          special: { name: "Marteau de Cendre", element: "FIRE", multiplier: 2.35 },
        },
      },
      {
        id: 2,
        hpThresholdPct: 0.45,
        pattern: {
          basicIntervalSec: 1.12,
          specialIntervalSec: 4.4,
          special: { name: "Nuee Ardente", element: "FIRE", multiplier: 3.05 },
        },
      },
    ],
  },

  // ----------------------------
  // TUNDRA (Boss 3-4) — ICE
  // ----------------------------
  BOSS_3: {
    id: "BOSS_3",
    name: "Gardien des Glaces Noires",
    element: "ICE",
    baseStats: {
      hp: 3000,
      attack: 42,
      armor: 34,
      resists: { FIRE: 10, ICE: 38, LIGHTNING: 10, VOID: 8 },
      elemental: { FIRE: 0, ICE: 16, LIGHTNING: 0, VOID: 0 },
      critChance: 0.12,
      critDmg: CRIT_DAMAGE_DEFAULT,
      speedRating: 42,
      pierceRating: 32,
    },
    phases: [
      {
        id: 1,
        hpThresholdPct: 1.0,
        pattern: {
          basicIntervalSec: 1.45,
          specialIntervalSec: 5.6,
          special: { name: "Éclat Cryo", element: "ICE", multiplier: 2.35 },
        },
      },
      {
        id: 2,
        hpThresholdPct: 0.45,
        pattern: {
          basicIntervalSec: 1.08,
          specialIntervalSec: 4.4,
          special: { name: "Froid Mordant", element: "ICE", multiplier: 3.0 },
        },
      },
    ],
  },

  BOSS_4: {
    id: "BOSS_4",
    name: "Matriarche du Gel Profond",
    element: "ICE",
    baseStats: {
      hp: 3800,
      attack: 54,
      armor: 44,
      resists: { FIRE: 14, ICE: 44, LIGHTNING: 14, VOID: 12 },
      elemental: { FIRE: 0, ICE: 22, LIGHTNING: 0, VOID: 0 },
      critChance: 0.13,
      critDmg: CRIT_DAMAGE_DEFAULT,
      speedRating: 52,
      pierceRating: 40,
    },
    phases: [
      {
        id: 1,
        hpThresholdPct: 1.0,
        pattern: {
          basicIntervalSec: 1.38,
          specialIntervalSec: 5.2,
          special: { name: "Morsure Polaire", element: "ICE", multiplier: 2.5 },
        },
      },
      {
        id: 2,
        hpThresholdPct: 0.42,
        pattern: {
          basicIntervalSec: 1.02,
          specialIntervalSec: 4.0,
          special: { name: "Nuit Blanche", element: "ICE", multiplier: 3.25 },
        },
      },
    ],
  },

  // ----------------------------
  // COSMIC_WRECK (Boss 5-7) — VOID (cosmic/alien)
  // ----------------------------
  BOSS_5: {
    id: "BOSS_5",
    name: "Survivant du Vide",
    element: "VOID",
    baseStats: {
      hp: 5200,
      attack: 70,
      armor: 58,
      resists: { FIRE: 18, ICE: 18, LIGHTNING: 18, VOID: 52 },
      elemental: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 28 },
      critChance: 0.14,
      critDmg: CRIT_DAMAGE_DEFAULT,
      speedRating: 60,
      pierceRating: 52,
    },
    phases: [
      {
        id: 1,
        hpThresholdPct: 1.0,
        pattern: {
          basicIntervalSec: 1.30,
          specialIntervalSec: 4.4,
          special: { name: "Entaille Astrale", element: "VOID", multiplier: 2.65 },
        },
      },
      {
        id: 2,
        hpThresholdPct: 0.45,
        pattern: {
          basicIntervalSec: 0.98,
          specialIntervalSec: 3.4,
          special: { name: "Déchirure", element: "VOID", multiplier: 3.45 },
        },
      },
    ],
  },

  BOSS_6: {
    id: "BOSS_6",
    name: "Architecte des Ruptures",
    element: "VOID",
    baseStats: {
      hp: 6800,
      attack: 86,
      armor: 74,
      resists: { FIRE: 22, ICE: 22, LIGHTNING: 22, VOID: 58 },
      elemental: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 38 },
      critChance: 0.16,
      critDmg: CRIT_DAMAGE_DEFAULT,
      speedRating: 70,
      pierceRating: 64,
    },
    phases: [
      {
        id: 1,
        hpThresholdPct: 1.0,
        pattern: {
          basicIntervalSec: 1.22,
          specialIntervalSec: 4.2,
          special: { name: "Axe de Singularité", element: "VOID", multiplier: 2.85 },
        },
      },
      {
        id: 2,
        hpThresholdPct: 0.42,
        pattern: {
          basicIntervalSec: 0.92,
          specialIntervalSec: 3.2,
          special: { name: "Compression", element: "VOID", multiplier: 3.7 },
        },
      },
    ],
  },

  BOSS_7: {
    id: "BOSS_7",
    name: "Cuirassé Exogène",
    element: "VOID",
    baseStats: {
      hp: 8600,
      attack: 104,
      armor: 96,
      resists: { FIRE: 26, ICE: 26, LIGHTNING: 26, VOID: 64 },
      elemental: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 52 },
      critChance: 0.18,
      critDmg: CRIT_DAMAGE_DEFAULT,
      speedRating: 86,
      pierceRating: 82,
    },
    phases: [
      {
        id: 1,
        hpThresholdPct: 1.0,
        pattern: {
          basicIntervalSec: 1.15,
          specialIntervalSec: 4.0,
          special: { name: "Rayon Noir", element: "VOID", multiplier: 3.05 },
        },
      },
      {
        id: 2,
        hpThresholdPct: 0.40,
        pattern: {
          basicIntervalSec: 0.88,
          specialIntervalSec: 3.0,
          special: { name: "Orbe de Fracture", element: "VOID", multiplier: 3.95 },
        },
      },
    ],
  },

  // ----------------------------
  // STORM_CITADEL (Boss 8-9) — LIGHTNING (divin/forteresse)
  // ----------------------------
  BOSS_8: {
    id: "BOSS_8",
    name: "Prétorien de la Citadelle d’Orage",
    element: "LIGHTNING",
    baseStats: {
      hp: 10500,
      attack: 122,
      armor: 118,
      resists: { FIRE: 30, ICE: 30, LIGHTNING: 62, VOID: 18 },
      elemental: { FIRE: 0, ICE: 0, LIGHTNING: 44, VOID: 0 },
      critChance: 0.20,
      critDmg: CRIT_DAMAGE_DEFAULT,
      speedRating: 98,
      pierceRating: 98,
    },
    phases: [
      {
        id: 1,
        hpThresholdPct: 1.0,
        pattern: {
          basicIntervalSec: 1.10,
          specialIntervalSec: 4.4,
          special: { name: "Marque d’Éclair", element: "LIGHTNING", multiplier: 3.05 },
        },
      },
      {
        id: 2,
        hpThresholdPct: 0.45,
        pattern: {
          basicIntervalSec: 0.85,
          specialIntervalSec: 3.3,
          special: { name: "Décharge Dominante", element: "LIGHTNING", multiplier: 3.9 },
        },
      },
    ],
  },

  BOSS_9: {
    id: "BOSS_9",
    name: "Archange Foudroyé",
    element: "LIGHTNING",
    baseStats: {
      hp: 12500,
      attack: 142,
      armor: 136,
      resists: { FIRE: 36, ICE: 36, LIGHTNING: 70, VOID: 22 },
      elemental: { FIRE: 0, ICE: 0, LIGHTNING: 58, VOID: 0 },
      critChance: 0.22,
      critDmg: CRIT_DAMAGE_DEFAULT,
      speedRating: 112,
      pierceRating: 110,
    },
    phases: [
      {
        id: 1,
        hpThresholdPct: 1.0,
        pattern: {
          basicIntervalSec: 1.02,
          specialIntervalSec: 4.2,
          special: { name: "Orage Sanctifié", element: "LIGHTNING", multiplier: 3.2 },
        },
      },
      {
        id: 2,
        hpThresholdPct: 0.50,
        pattern: {
          basicIntervalSec: 0.82,
          specialIntervalSec: 3.2,
          special: { name: "Apothéose", element: "LIGHTNING", multiplier: 4.05 },
        },
      },
    ],
  },

  // ----------------------------
  // RIFT (Boss Final) — 100% VOID Cosmic Supremacy
  // ----------------------------
  BOSS_FINAL: {
    id: "BOSS_FINAL",
    name: "Souverain de la Faille",
    element: "VOID",
    baseStats: {
      hp: 16500,
      attack: 170,
      armor: 160,
      resists: { FIRE: 44, ICE: 44, LIGHTNING: 44, VOID: 78 },
      elemental: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 78 },
      critChance: 0.24,
      critDmg: CRIT_DAMAGE_DEFAULT,
      speedRating: 128,
      pierceRating: 132,
    },
    phases: [
      {
        id: 1,
        hpThresholdPct: 1.0,
        pattern: {
          basicIntervalSec: 0.98,
          specialIntervalSec: 4.0,
          special: { name: "Décret du Néant", element: "VOID", multiplier: 3.35 },
        },
      },
      {
        id: 2,
        hpThresholdPct: 0.55,
        pattern: {
          basicIntervalSec: 0.86,
          specialIntervalSec: 3.4,
          special: { name: "Couronne Brisée", element: "VOID", multiplier: 3.95 },
        },
      },
      {
        id: 3,
        hpThresholdPct: 0.25,
        pattern: {
          basicIntervalSec: 0.70,
          specialIntervalSec: 2.4,
          special: { name: "Jugement de la Faille", element: "VOID", multiplier: 4.6 },
        },
      },
    ],
  },
} as const;
