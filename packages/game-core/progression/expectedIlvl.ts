export function expectedIlvl(worldLevel: number): number {
  const w = Math.max(1, Math.floor(worldLevel));
  return Math.min(1000, 20 * w);
}
