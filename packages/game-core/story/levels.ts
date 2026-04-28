import { CHAPTERS } from "./chapters";
import type {
  ChapterDef,
  ChapterId,
  PublicStoryChapterWithLevels,
  StoryLevelDef,
  StoryLevelStatus,
  UnlockId,
} from "./types";
import type { StoryState } from "./state";

function chapterUnlockId(chapterId: string | number): UnlockId {
  return `CHAPTER_${chapterId}` as UnlockId;
}

function normalizeChapterId(chapterId: string | number): string {
  return String(chapterId);
}

function event(levelId: string, index: number, type: StoryLevelDef["events"][number]["type"]): StoryLevelDef["events"][number] {
  return {
    id: `${levelId}.event.${index}`,
    type,
    title: `Event ${index}`,
    description: "Internal story event. Do not expose in public UI.",
  };
}

export const STORY_LEVELS: StoryLevelDef[] = [
  {
    id: "ch01-lv01",
    chapterId: "1",
    index: 1,
    kind: "standard",
    title: "Arrivee dans les Terres Desolees",
    description: "Le roi decouvre une zone ravagee ou les premiers signes de corruption apparaissent.",
    recommendedPower: 10,
    isRequiredForNarrative: true,
    events: [event("ch01-lv01", 1, "exploration"), event("ch01-lv01", 2, "dialogue"), event("ch01-lv01", 3, "discovery")],
  },
  {
    id: "ch01-lv02",
    chapterId: "1",
    index: 2,
    kind: "standard",
    title: "Retour dans les Terres",
    description: "Une seconde traversee permet de confirmer que le mal gagne du terrain.",
    recommendedPower: 18,
    isRequiredForNarrative: true,
    events: [event("ch01-lv02", 1, "exploration"), event("ch01-lv02", 2, "encounter"), event("ch01-lv02", 3, "return_to_boto")],
  },
  {
    id: "ch01-lv03",
    chapterId: "1",
    index: 3,
    kind: "standard",
    title: "Profondeurs des Terres Desolees",
    description: "Les traces menent plus loin sous la surface, vers une menace encore mal comprise.",
    recommendedPower: 28,
    isRequiredForNarrative: true,
    events: [event("ch01-lv03", 1, "exploration"), event("ch01-lv03", 2, "boss"), event("ch01-lv03", 3, "unlock")],
  },
  {
    id: "ch02-lv01",
    chapterId: "2",
    index: 1,
    kind: "standard",
    title: "Devant la Muraille de Glace",
    description: "La route s'arrete devant une barriere de givre et de ruines anciennes.",
    recommendedPower: 42,
    isRequiredForNarrative: true,
    events: [event("ch02-lv01", 1, "exploration"), event("ch02-lv01", 2, "dialogue"), event("ch02-lv01", 3, "discovery")],
  },
  {
    id: "ch02-lv02",
    chapterId: "2",
    index: 2,
    kind: "standard",
    title: "Embuscade dans la Tundra",
    description: "La progression devient dangereuse dans les plaines blanches.",
    recommendedPower: 55,
    isRequiredForNarrative: true,
    events: [event("ch02-lv02", 1, "exploration"), event("ch02-lv02", 2, "encounter"), event("ch02-lv02", 3, "return_to_boto")],
  },
  {
    id: "ch02-lv03",
    chapterId: "2",
    index: 3,
    kind: "standard",
    title: "Sang Etrange",
    description: "Des signes etranges laissent penser que la tundra cache une presence inconnue.",
    recommendedPower: 70,
    isRequiredForNarrative: true,
    events: [event("ch02-lv03", 1, "discovery"), event("ch02-lv03", 2, "encounter"), event("ch02-lv03", 3, "cutscene")],
  },
  {
    id: "ch02-sp01",
    chapterId: "2",
    index: 4,
    kind: "special",
    title: "Ancienne Cite",
    description: "Un passage secondaire mene a une cite oubliee par les cartes du royaume.",
    recommendedPower: 86,
    isRequiredForNarrative: true,
    events: [event("ch02-sp01", 1, "exploration"), event("ch02-sp01", 2, "boss"), event("ch02-sp01", 3, "unlock")],
  },
  {
    id: "ch03-lv01",
    chapterId: "3",
    index: 1,
    kind: "standard",
    title: "Premiers Pas dans l'Empire Nebuleux",
    description: "Le royaume entre dans une region instable ou la matiere semble flotter.",
    recommendedPower: 105,
    isRequiredForNarrative: true,
    events: [event("ch03-lv01", 1, "exploration"), event("ch03-lv01", 2, "dialogue"), event("ch03-lv01", 3, "discovery")],
  },
  {
    id: "ch03-lv02",
    chapterId: "3",
    index: 2,
    kind: "standard",
    title: "Front de Guerre",
    description: "Les routes se transforment en lignes de conflit ouvertes.",
    recommendedPower: 125,
    isRequiredForNarrative: true,
    events: [event("ch03-lv02", 1, "encounter"), event("ch03-lv02", 2, "dialogue"), event("ch03-lv02", 3, "return_to_boto")],
  },
  {
    id: "ch03-lv03",
    chapterId: "3",
    index: 3,
    kind: "standard",
    title: "Labyrinthe de la Pestilence",
    description: "Un reseau malade bloque la progression vers le coeur de l'empire.",
    recommendedPower: 150,
    isRequiredForNarrative: true,
    events: [event("ch03-lv03", 1, "exploration"), event("ch03-lv03", 2, "boss"), event("ch03-lv03", 3, "cutscene")],
  },
  {
    id: "ch04-lv01",
    chapterId: "4",
    index: 1,
    kind: "standard",
    title: "Chute hors du Temps",
    description: "La route bascule vers une region ou les lois du monde semblent differentes.",
    recommendedPower: 180,
    isRequiredForNarrative: true,
    events: [event("ch04-lv01", 1, "cutscene"), event("ch04-lv01", 2, "exploration"), event("ch04-lv01", 3, "discovery")],
  },
];

export function getStoryLevelsForChapter(chapterId: string | number): StoryLevelDef[] {
  const normalized = normalizeChapterId(chapterId);
  return STORY_LEVELS.filter((level) => level.chapterId === normalized).sort((a, b) => a.index - b.index);
}

export function getStoryLevelDef(levelId: string): StoryLevelDef | undefined {
  return STORY_LEVELS.find((level) => level.id === levelId);
}

export function isStoryLevelCompleted(state: StoryState, levelId: string): boolean {
  return state.completedLevels.has(levelId);
}

function isChapterUnlocked(state: StoryState, chapterId: string): boolean {
  if (chapterId === "1") return true;
  const numericId = Number(chapterId) as ChapterId;
  return (
    state.unlocked.has(chapterId as UnlockId) ||
    state.unlocked.has(chapterUnlockId(chapterId)) ||
    state.completedChapters.has(numericId)
  );
}

export function isStoryLevelAvailable(state: StoryState, levelId: string): boolean {
  const level = getStoryLevelDef(levelId);
  if (!level) return false;
  if (isStoryLevelCompleted(state, levelId)) return false;
  if (!isChapterUnlocked(state, level.chapterId)) return false;

  const chapterLevels = getStoryLevelsForChapter(level.chapterId);

  if (level.kind === "special" && level.isRequiredForNarrative) {
    return chapterLevels
      .filter((candidate) => candidate.kind === "standard")
      .every((candidate) => isStoryLevelCompleted(state, candidate.id));
  }

  const previousStandard = chapterLevels
    .filter((candidate) => candidate.kind === "standard" && candidate.index < level.index)
    .at(-1);

  if (!previousStandard) return true;
  return isStoryLevelCompleted(state, previousStandard.id);
}

export function getStoryLevelStatus(state: StoryState, levelId: string): StoryLevelStatus {
  if (isStoryLevelCompleted(state, levelId)) return "completed";
  if (isStoryLevelAvailable(state, levelId)) return "available";
  return "locked";
}

export function completeStoryLevel(state: StoryState, levelId: string): StoryState {
  if (!isStoryLevelAvailable(state, levelId)) return state;

  return {
    ...state,
    completedLevels: new Set([...state.completedLevels, levelId]),
  };
}

function getChapterStatus(state: StoryState, chapter: ChapterDef): PublicStoryChapterWithLevels["status"] {
  if (state.completedChapters.has(chapter.id)) return "completed";
  if (isChapterUnlocked(state, String(chapter.id))) return "available";
  return "locked";
}

export function getVisibleStoryChaptersWithLevels(state: StoryState): PublicStoryChapterWithLevels[] {
  return CHAPTERS.map((chapter) => {
    const levels = getStoryLevelsForChapter(chapter.id).map(({ events: _events, ...level }) => ({
      ...level,
      status: getStoryLevelStatus(state, level.id),
    }));

    return {
      age: chapter.age,
      chapterId: String(chapter.id),
      id: chapter.id,
      levels,
      status: getChapterStatus(state, chapter),
      title: chapter.title,
    };
  }).filter((chapter) => chapter.levels.length > 0);
}
