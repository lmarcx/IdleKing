import type { PublicStoryChapterWithLevels } from "@idleking/game-core";

export type StoryZoneVisual = {
  image: string;
  tone: "ember" | "frost" | "void" | "gold";
};

const STORY_ZONE_VISUALS: Record<string, StoryZoneVisual> = {
  "1": {
    image: "/assets/story-zones/desolated-lands.svg",
    tone: "ember",
  },
  "2": {
    image: "/assets/story-zones/forgotten-tundra.svg",
    tone: "frost",
  },
  "3": {
    image: "/assets/story-zones/nebula-empire.svg",
    tone: "void",
  },
  "4": {
    image: "/assets/story-zones/age-of-gods.svg",
    tone: "gold",
  },
};

export function getStoryZoneVisual(chapter: PublicStoryChapterWithLevels): StoryZoneVisual {
  return (
    STORY_ZONE_VISUALS[chapter.chapterId] ?? {
      image: "/assets/story-zones/desolated-lands.svg",
      tone: "ember",
    }
  );
}

export function getStoryZoneDescription(chapter: PublicStoryChapterWithLevels): string {
  return chapter.levels.find((level) => level.status !== "locked")?.description ?? chapter.levels[0]?.description ?? "Une zone narrative attend d'etre exploree.";
}

export function getStoryZoneStatusLabel(status: PublicStoryChapterWithLevels["status"]): string {
  switch (status) {
    case "completed":
      return "Terminee";
    case "available":
      return "Disponible";
    case "locked":
    default:
      return "Verrouillee";
  }
}
