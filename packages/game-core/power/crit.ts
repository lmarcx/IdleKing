import { CRIT_DAMAGE_DEFAULT } from "./constants.js";
import { capCritChance, getCritDamage } from "./statsModel.js";

export function computeCritMultiplier(
  critChance: number,
  critDmgBase = CRIT_DAMAGE_DEFAULT
) {
  const cappedCritChance = capCritChance(critChance);
  const critDamage = getCritDamage(critDmgBase);
  return 1 + cappedCritChance * (critDamage - 1);
}
