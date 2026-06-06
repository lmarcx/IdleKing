import type { PublicStoryChapterWithLevels } from "@idleking/game-core";

export type StoryZoneVisual = {
  background: string;
  image: string;
  title: string;
  tone: "ember" | "frost" | "void" | "gold";
};

const STORY_ZONE_VISUALS: Record<string, StoryZoneVisual> = {
  "1": {
    background: "/assets/story-zones/desolated-lands-bg.svg",
    image: "/assets/story-zones/desolated-lands.svg",
    title: "Terres Désolées",
    tone: "ember",
  },
  "2": {
    background: "/assets/story-zones/forgotten-tundra-bg.svg",
    image: "/assets/story-zones/forgotten-tundra.svg",
    title: "Tundra Oubliée",
    tone: "frost",
  },
  "3": {
    background: "/assets/story-zones/nebula-empire-bg.svg",
    image: "/assets/story-zones/nebula-empire.svg",
    title: "Empire Nébuleux",
    tone: "void",
  },
  "4": {
    background: "/assets/story-zones/age-of-gods-bg.svg",
    image: "/assets/story-zones/age-of-gods.svg",
    title: "Temps des Dieux",
    tone: "gold",
  },
};

export function getStoryZoneVisual(chapter: PublicStoryChapterWithLevels): StoryZoneVisual {
  return (
    STORY_ZONE_VISUALS[chapter.chapterId] ?? {
      background: "/assets/story-zones/desolated-lands-bg.svg",
      image: "/assets/story-zones/desolated-lands.svg",
      title: "Zone inconnue",
      tone: "ember",
    }
  );
}

export function getStoryZoneTitle(chapter: PublicStoryChapterWithLevels): string {
  return getStoryZoneVisual(chapter).title;
}

export function getStoryZoneDescription(chapter: PublicStoryChapterWithLevels): string {
  return chapter.levels.find((level) => level.status !== "locked")?.description ?? chapter.levels[0]?.description ?? "Une zone narrative attend d'être explorée.";
}

export function getStoryZoneStatusLabel(status: PublicStoryChapterWithLevels["status"]): string {
  switch (status) {
    case "completed":
      return "Terminée";
    case "available":
      return "Disponible";
    case "locked":
    default:
      return "Verrouillée";
  }
}
