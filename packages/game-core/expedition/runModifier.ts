import type { CombatStats, Element } from "../power/types.js";
import type { ChoiceOption, TempStatDelta } from "./types.js";

export type RunModifiers = {
  // cumulative deltas applied for the whole expedition run
  deltas: TempStatDelta[];
};

export function createRunModifiers(): RunModifiers {
  return { deltas: [] };
}

function addElementMap(
  target: Record<Element, number>,
  delta?: Partial<Record<Element, number>>
) {
  if (!delta) return;
  for (const k of Object.keys(delta) as Element[]) {
    target[k] = (target[k] ?? 0) + (delta[k] ?? 0);
  }
}

function applyDelta(base: CombatStats, d: TempStatDelta): CombatStats {
  const out: CombatStats = {
    ...base,
    resists: { ...base.resists },
    elemental: { ...base.elemental },
  };

  if (d.hp) out.hp += d.hp;
  if (d.attack) out.attack += d.attack;
  if (d.armor) out.armor += d.armor;

  if (d.critChance) out.critChance += d.critChance;
  if (d.critDmg) out.critDmg += d.critDmg;

  if (d.speedRating) out.speedRating += d.speedRating;
  if (d.pierceRating) out.pierceRating += d.pierceRating;

  addElementMap(out.resists, d.resists);
  addElementMap(out.elemental, d.elemental);

  return out;
}

export function applyRunModifiers(base: CombatStats, mods: RunModifiers): CombatStats {
  return mods.deltas.reduce((acc, d) => applyDelta(acc, d), base);
}

export function applyChoiceToRun(mods: RunModifiers, choice: ChoiceOption): RunModifiers {
  if (choice.kind === "BUFF") return { deltas: [...mods.deltas, choice.bonus] };
  if (choice.kind === "MALUS") return { deltas: [...mods.deltas, choice.malus] };
  // RESOURCE does not affect combat stats
  return mods;
}
