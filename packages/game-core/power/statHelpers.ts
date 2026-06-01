import type { CombatStats, Element } from "./types.js";
import { CRIT_DAMAGE_DEFAULT } from "./constants.js";

export function emptyCombatStats(): CombatStats {
  return {
    hp: 0,
    attack: 0,
    armor: 0,
    resists: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 0 },
    elemental: { FIRE: 0, ICE: 0, LIGHTNING: 0, VOID: 0 },
    critChance: 0,
    critDmg: CRIT_DAMAGE_DEFAULT,
    speedRating: 0,
    pierceRating: 0,
  };
}

function addElementMap(
  target: Record<Element, number>,
  src: Record<Element, number>
) {
  for (const k of Object.keys(src) as Element[]) {
    target[k] = (target[k] ?? 0) + (src[k] ?? 0);
  }
}

export function sumStats(a: CombatStats, b: CombatStats): CombatStats {
  const out: CombatStats = {
    ...a,
    resists: { ...a.resists },
    elemental: { ...a.elemental },
  };

  out.hp += b.hp;
  out.attack += b.attack;
  out.armor += b.armor;

  out.critChance += b.critChance;
  out.critDmg += (b.critDmg - CRIT_DAMAGE_DEFAULT);
  if (out.critDmg < 1.0) out.critDmg = 1.0;

  out.speedRating += b.speedRating;
  out.pierceRating += b.pierceRating;

  addElementMap(out.resists, b.resists);
  addElementMap(out.elemental, b.elemental);

  return out;
}
