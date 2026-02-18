export const PLAYER_MAX_LEVEL = 50;

// XP_to_next(L) = round( 60 * L^2.15 + 15 * 1.07^L )
// L = level actuel (1 → 49)
export function xpNext(level: number): number {
  const L = Math.max(1, Math.floor(level));
  if (L >= PLAYER_MAX_LEVEL) return 0;

  const a = 60 * Math.pow(L, 2.15);
  const b = 15 * Math.pow(1.07, L);
  return Math.round(a + b);
}

// Total XP needed to REACH `level` from level 1 (i.e. sum of previous "to next")
export function xpTotal(level: number): number {
  const L = Math.max(1, Math.floor(level));
  const capped = Math.min(L, PLAYER_MAX_LEVEL);

  let total = 0;
  for (let i = 1; i < capped; i++) total += xpNext(i);
  return total;
}
