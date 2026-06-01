export type Element = "FIRE" | "ICE" | "LIGHTNING" | "VOID";

export type CombatStats = {
  // Brownfield combat shape: hp/attack/armor map to the MVP HP/ATK/DEF base stats.
  hp: number;
  attack: number;

  armor: number;
  resists: Record<Element, number>;

  elemental: Record<Element, number>;

  critChance: number; // ratio, capped at 1 by the MVP model
  critDmg: number;    // ratio, default 2 = 200%

  speedRating: number;
  pierceRating: number;
};

export type PowerBreakdown = {
  combatScore: number;
  tierMultiplier: number;
  power: number;
};
