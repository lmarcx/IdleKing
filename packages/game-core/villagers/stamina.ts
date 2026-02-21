export type Villager = {
  id: string;
  stamina: number; // 0..100
};

export function clamp01_100(v: number): number {
  return Math.max(0, Math.min(100, v));
}

export function regenStamina(v: Villager, minutes: number, regenPerMin = 2): Villager {
  const m = Math.max(0, Math.floor(minutes));
  return {
    ...v,
    stamina: clamp01_100(v.stamina + m * regenPerMin),
  };
}

export function consumeStamina(v: Villager, seconds: number, costPer5Sec = 1): Villager {
  const s = Math.max(0, Math.floor(seconds));
  const ticks = Math.floor(s / 5);
  const cost = ticks * costPer5Sec;
  return {
    ...v,
    stamina: clamp01_100(v.stamina - cost),
  };
}