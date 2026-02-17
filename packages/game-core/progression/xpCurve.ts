export function xpTotal(level: number): number {
  const L = Math.max(1, Math.floor(level));
  const A = 120;
  const p = 2.4;
  const B = 25;
  const r = 1.12;
  return Math.round(A * Math.pow(L, p) + B * (Math.pow(r, L) - 1));
}

export function xpNext(level: number): number {
  const L = Math.max(1, Math.floor(level));
  return xpTotal(L + 1) - xpTotal(L);
}
