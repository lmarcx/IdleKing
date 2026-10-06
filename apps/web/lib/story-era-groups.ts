import { Skull, Snowflake, Waves } from "lucide-react";
import type { ComponentType } from "react";

import { STORY_DUNGEON_REGISTRY, type EraId } from "@idleking/game-core";

export type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

/**
 * Shared Story era grouping used by the Time Gate and the level editor's Project Tree. Dungeon ids
 * are derived from STORY_DUNGEON_REGISTRY (era + order) so the grouping can never drift from the
 * story registry; only the presentation (icon, copy) lives here.
 */
export type StoryEraGroup = Readonly<{
  icon: IconType;
  id: EraId;
  title: string;
  subtitle: string;
  dungeonIds: readonly string[];
  teaser?: true;
}>;

function dungeonIdsForEra(era: string): readonly string[] {
  return [...STORY_DUNGEON_REGISTRY]
    .filter((dungeon) => dungeon.era === era)
    .sort((a, b) => a.order - b.order)
    .map((dungeon) => dungeon.id);
}

export const STORY_ERA_GROUPS: readonly StoryEraGroup[] = [
  {
    icon: Skull,
    id: "era_funebre",
    title: "Ère Funèbre",
    subtitle: "Prologue et ruines cendreuses",
    dungeonIds: dungeonIdsForEra("era_funebre"),
  },
  {
    icon: Snowflake,
    id: "era_glaciaire",
    title: "Ère Glaciaire",
    subtitle: "Retraite, chants et source du givre",
    dungeonIds: dungeonIdsForEra("era_glaciaire"),
  },
  {
    icon: Waves,
    id: "era_deluge",
    title: "Déluge",
    subtitle: "Teaser verrouillé",
    dungeonIds: [],
    teaser: true,
  },
];
