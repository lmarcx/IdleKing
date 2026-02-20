import type { ChapterDef } from "./types.js";

// 20 chapitres, 4 par Age
function ageFromChapter(chapterId: number): 1 | 2 | 3 | 4 | 5 {
  if (chapterId <= 4) return 1;
  if (chapterId <= 8) return 2;
  if (chapterId <= 12) return 3;
  if (chapterId <= 16) return 4;
  return 5;
}

export const CHAPTERS: ChapterDef[] = Array.from({ length: 20 }, (_, i) => {
  const id = i + 1;
  const age = ageFromChapter(id);
  const ch = String(id).padStart(2, "0");

  // unlock list (MVP) à ajuster par chapitre, ici juste à titre d'exemple
  const unlocks =
    id === 1
      ? [
          { id: "FARM", kind: "BUILDING" as const },
          { id: "MINE", kind: "BUILDING" as const },
          { id: "KITCHEN", kind: "BUILDING" as const },
        ]
      : id === 2
      ? [{ id: "TEMPLE", kind: "BUILDING" as const }]
      : id === 3
      ? [
          { id: "REPEATABLE_QUESTS", kind: "FEATURE" as const },
          { id: "TAVERN", kind: "BUILDING" as const },
        ]
      : id === 4
      ? [
          { id: "DUNGEONS", kind: "FEATURE" as const },
          { id: "FORGE", kind: "BUILDING" as const },
        ]
      : id === 5
      ? [{ id: "LABORATORY", kind: "BUILDING" as const }]
      : id === 6
      ? [{ id: "FORTRESS", kind: "BUILDING" as const }]
      : id === 7
      ? [{ id: "MARKET", kind: "BUILDING" as const }]
      : id === 8
      ? [{ id: "ROYAL_CASTLE", kind: "BUILDING" as const }]
      : [];

  return {
    id,
    age,
    title: `Chapitre ${id}`,
    scriptIds: [`ch${ch}.intro`], // extensible: ajoute `ch${id}.outro`, etc.
    unlocks,
  } satisfies ChapterDef;
});