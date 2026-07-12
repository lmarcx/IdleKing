import { Skull, Snowflake, Waves } from "lucide-react";
import type { ComponentType } from "react";

import type { EraId } from "@idleking/game-core";

export type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

/**
 * Shared Story era grouping, hand-maintained to match STORY_DUNGEON_REGISTRY (Phase G7). This
 * used to be a private constant inside time-gate-panel.tsx; it now lives here so the Time Gate
 * and the level editor's Project Tree read the exact same era -> dungeon grouping (including the
 * royal_abyss-under-era_funebre quirk) instead of drifting apart with two hand-maintained lists.
 */
export type StoryEraGroup = Readonly<{
  icon: IconType;
  id: EraId;
  title: string;
  subtitle: string;
  dungeonIds: readonly string[];
  teaser?: true;
}>;

export const STORY_ERA_GROUPS: readonly StoryEraGroup[] = [
  {
    icon: Skull,
    id: "era_funebre",
    title: "Ère Funèbre",
    subtitle: "Prologue et ruines cendreuses",
    dungeonIds: ["prologue_wastelands", "funeral_mausoleum", "ashen_peak", "royal_abyss"],
  },
  {
    icon: Snowflake,
    id: "era_glaciaire",
    title: "Ère Glaciaire",
    subtitle: "Rive, reflets et source du givre",
    dungeonIds: ["frozen_river", "reflection_cavern", "arathas_academy", "frost_source"],
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
