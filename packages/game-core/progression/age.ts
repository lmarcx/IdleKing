export type Age = 1 | 2 | 3 | 4 | 5;

export function ageFromWorldLevel(worldLevel: number): Age {
  const w = Math.max(1, Math.floor(worldLevel));
  if (w <= 10) return 1;
  if (w <= 20) return 2;
  if (w <= 30) return 3;
  if (w <= 40) return 4;
  return 5;
}

export function ageCoeffFromWorldLevel(worldLevel: number): number {
  const age = ageFromWorldLevel(worldLevel);
  switch (age) {
    case 1: return 1.0;
    case 2: return 1.15;
    case 3: return 1.35;
    case 4: return 1.6;
    case 5: return 1.9;
  }
}

// 20 chapitres, 4 par Age
export function chaptersRangeForAge(age: Age): { start: number; end: number } {
  const start = (age - 1) * 4 + 1;
  return { start, end: start + 3 };
}
