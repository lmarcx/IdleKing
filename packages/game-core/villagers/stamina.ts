export type Villager = {
  id: string;
  stamina: number; // 0..100
};

function clampStamina(x: number): number {
  return Math.max(0, Math.min(100, x));
}

export function consumeVillagerPerMinute(v: Villager, costPerMin: number): Villager {
  const cost = Math.max(0, Math.floor(costPerMin));
  return { ...v, stamina: clampStamina(v.stamina - cost) };
}

export function pickUsableVillagers(villagers: Villager[], count: number): string[] {
  const wanted = Math.max(0, Math.floor(count));
  const ids: string[] = [];
  for (const v of villagers) {
    if (ids.length >= wanted) break;
    if (v.stamina > 0) ids.push(v.id);
  }
  return ids;
}