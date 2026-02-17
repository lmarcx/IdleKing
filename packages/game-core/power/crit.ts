import { OVERFLOW_RATE } from "./constants";

export function computeCritMultiplier(
  critChance: number,
  critDmgBase: number
) {
  if (critChance < 1) {
    return 1 + critChance * (critDmgBase - 1);
  }

  const overflow = critChance - 1;
  const critDmgEffective = critDmgBase + overflow * OVERFLOW_RATE;

  return critDmgEffective;
}
