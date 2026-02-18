export type Age = 1 | 2 | 3 | 4 | 5;

export function ageFromWorldLevel(worldLevel: number): Age {
  if (worldLevel <= 10) return 1;
  if (worldLevel <= 20) return 2;
  if (worldLevel <= 30) return 3;
  if (worldLevel <= 40) return 4;
  return 5;
}

export function ageCoeffFromWorldLevel(worldLevel: number): number {
  const age = ageFromWorldLevel(worldLevel);
  switch (age) {
    case 1: return 1.00;
    case 2: return 1.15;
    case 3: return 1.35;
    case 4: return 1.60;
    case 5: return 1.90;
  }
}

// MVP : 20 chapitres, 4 par âge
export function ageRangeChapters(age: Age): { start: number; end: number } {
  const start = (age - 1) * 4 + 1;
  return { start, end: start + 3 };
}
