"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { PublicStoryChapterWithLevels, PublicStoryLevel } from "@idleking/game-core";
import { StoryLevelList } from "./story-level-list";
import { getStoryZoneDescription, getStoryZoneTitle, getStoryZoneVisual } from "./story-zone-data";

type StoryZoneDetailPanelProps = {
  chapter: PublicStoryChapterWithLevels | null;
  onExplore: (levelId: string) => void;
};

function getDefaultSelectedLevel(levels: PublicStoryLevel[]): string | null {
  return levels.find((level) => level.status === "available")?.id ?? levels.find((level) => level.status !== "locked")?.id ?? levels[0]?.id ?? null;
}

function getActionLabel(level: PublicStoryLevel | undefined): string {
  if (!level) return "Sélectionnez un niveau";
  if (level.status === "completed") return "Niveau terminé";
  if (level.status === "locked") return "Verrouillé";
  return "Entrer dans le donjon";
}

function getActionHelp(level: PublicStoryLevel | undefined): string {
  if (!level) return "Sélectionnez un niveau disponible.";
  if (level.status === "completed") return "Ce niveau est terminé. Les récompenses uniques ne sont pas rejouées.";
  if (level.status === "locked") return "Action verrouillée : terminez les niveaux précédents pour débloquer celui-ci.";
  return "Disponible.";
}

export function StoryZoneDetailPanel({ chapter, onExplore }: StoryZoneDetailPanelProps) {
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedLevelId(chapter ? getDefaultSelectedLevel(chapter.levels) : null);
  }, [chapter]);

  const selectedLevel = useMemo(
    () => chapter?.levels.find((level) => level.id === selectedLevelId),
    [chapter, selectedLevelId]
  );

  if (!chapter) {
    return (
      <section className="ik-story-detail-panel flex min-h-[34rem] items-center justify-center rounded-xl border border-amber-200/20 bg-black/45 p-6">
        <p className="font-ik-body text-sm text-muted-foreground">Sélectionnez une zone.</p>
      </section>
    );
  }

  const visual = getStoryZoneVisual(chapter);
  const title = getStoryZoneTitle(chapter);
  const canExplore = selectedLevel?.status === "available";

  return (
    <section className="ik-story-detail-panel overflow-hidden rounded-xl border border-amber-200/25 bg-zinc-950 shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
      <div className="relative min-h-[18rem] overflow-hidden border-b border-amber-200/20">
        <img alt={`Panorama ${title}`} className="absolute inset-0 h-full w-full object-cover" src={visual.background} />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-center">
          <h2 className="ik-story-heading text-3xl text-amber-50">{title}</h2>
          <p className="mx-auto mt-3 max-w-2xl font-ik-body text-sm leading-relaxed text-amber-50/80">
            {getStoryZoneDescription(chapter)}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 h-px w-full max-w-md bg-gradient-to-r from-transparent via-amber-200/35 to-transparent" />
          <h3 className="ik-story-heading text-lg text-amber-50">Niveaux disponibles</h3>
        </div>

        <StoryLevelList levels={chapter.levels} selectedLevelId={selectedLevelId} onSelectLevel={setSelectedLevelId} />

        <div className="mt-5 border-t border-amber-200/20 pt-4">
          <button
            aria-label={selectedLevel ? `${getActionLabel(selectedLevel)} - ${selectedLevel.title}` : "Sélectionnez un niveau"}
            className={cn(
              "w-full rounded-lg border px-4 py-3 font-ik-menu text-sm transition",
              canExplore && "border-amber-200/55 bg-amber-500/20 text-amber-50 hover:border-amber-100 hover:bg-amber-500/25",
              !canExplore && "cursor-not-allowed border-zinc-500/30 bg-zinc-900/55 text-zinc-500"
            )}
            disabled={!canExplore}
            onClick={() => {
              if (!selectedLevel) return;
              onExplore(selectedLevel.id);
            }}
            type="button"
          >
            {getActionLabel(selectedLevel)}
          </button>
          <p className="mt-3 font-ik-body text-xs text-muted-foreground">
            {getActionHelp(selectedLevel)}
          </p>
        </div>
      </div>
    </section>
  );
}
