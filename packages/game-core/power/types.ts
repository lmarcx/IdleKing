export type Element = "FIRE" | "ICE" | "LIGHTNING" | "VOID";

export type CombatStats = {
  hp: number;
  attack: number;

  armor: number;
  resists: Record<Element, number>;

  elemental: Record<Element, number>;

  critChance: number; // ex: 1.35 = 135%
  critDmg: number;    // ex: 1.5

  speedRating: number;
  pierceRating: number;
};

export type PowerBreakdown = {
  combatScore: number;
  tierMultiplier: number;
  power: number;
};
