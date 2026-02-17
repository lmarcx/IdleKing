import type { Element } from "../power/types.js";
import type { CombatStats } from "../power/types.js";

export function baseStats(level: number): CombatStats {
  const L = Math.max(1, Math.floor(level));
  const x = L - 1;

  const hp = 120 + 18 * x + 2 * Math.pow(x, 1.35);
  const attack = 10 + 1.2 * x + 0.08 * Math.pow(x, 1.35);
  const armor = 5 + 0.55 * x + 0.05 * Math.pow(x, 1.25);

  const resistEach = Math.floor(x / 10) * 3;

  const resists: Record<Element, number> = {
    FIRE: resistEach,
    ICE: resistEach,
    LIGHTNING: resistEach,
    VOID: resistEach,
  };

  const elemental: Record<Element, number> = {
    FIRE: 0,
    ICE: 0,
    LIGHTNING: 0,
    VOID: 0,
  };

  return {
    hp: Math.round(hp),
    attack: Number(attack.toFixed(2)),
    armor: Number(armor.toFixed(2)),
    resists,
    elemental,
    critChance: 0.05,
    critDmg: 1.5,
    speedRating: 0,
    pierceRating: 0,
  };
}
