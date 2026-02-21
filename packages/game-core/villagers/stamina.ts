export type Villager = {
  id: string;
  stamina: number; // 0..100
};

function clampStamina(x: number): number {
  return Math.max(0, Math.min(100, x));
}

export function regenVillagerPerMinute(v: Villager, regenPerMin = 2): Villager {
  return { ...v, stamina: clampStamina(v.stamina + regenPerMin) };
}

export function consumeVillagerPerMinute(v: Villager, costPerMin = 12): Villager {
  return { ...v, stamina: clampStamina(v.stamina - costPerMin) };
}

/**
 * Renvoie les ids des villageois "utilisables" (stamina > 0), dans l’ordre.
 * MVP : on prend juste les premiers.
 */
export function pickUsableVillagers(villagers: Villager[], count: number): string[] {
  const wanted = Math.max(0, Math.floor(count));
  const ids: string[] = [];

  for (const v of villagers) {
    if (ids.length >= wanted) break;
    if (v.stamina > 0) ids.push(v.id);
  }

  return ids;
}