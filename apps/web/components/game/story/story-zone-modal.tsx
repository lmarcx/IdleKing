"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import type { PublicStoryChapterWithLevels, PublicStoryLevel } from "@idleking/game-core";
import { StoryLevelList } from "./story-level-list";
import { getStoryZoneDescription, getStoryZoneVisual } from "./story-zone-data";

type StoryZoneModalProps = {
  chapter: PublicStoryChapterWithLevels | null;
  onClose: () => void;
  onExplore: (levelId: string) => void;
};

function getDefaultSelectedLevel(levels: PublicStoryLevel[]): string | null {
  return levels.find((level) => level.status === "available")?.id ?? levels.find((level) => level.status !== "locked")?.id ?? levels[0]?.id ?? null;
}

function getActionLabel(level: PublicStoryLevel | undefined): string {
  if (!level) return "Selectionnez un niveau";
  if (level.status === "completed") return "Niveau termine";
  if (level.status === "locked") return "Verrouille";
  return "Entrer dans le donjon";
}

export function StoryZoneModal({ chapter, onClose, onExplore }: StoryZoneModalProps) {
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedLevelId(chapter ? getDefaultSelectedLevel(chapter.levels) : null);
  }, [chapter]);

  useEffect(() => {
    if (!chapter) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chapter, onClose]);

  const selectedLevel = useMemo(
    () => chapter?.levels.find((level) => level.id === selectedLevelId),
    [chapter, selectedLevelId]
  );

  if (!chapter) return null;

  const visual = getStoryZoneVisual(chapter);
  const canExplore = selectedLevel?.status === "available";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <div
        className="relative grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl border border-amber-200/30 bg-zinc-950 text-foreground shadow-[0_0_80px_rgba(0,0,0,0.7)] lg:grid-cols-[0.92fr_1fr]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Fermer"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded border border-amber-200/30 bg-black/55 font-ik-menu text-lg text-amber-100 transition hover:border-amber-100/65"
          onClick={onClose}
          type="button"
        >
          X
        </button>

        <div className="relative min-h-[18rem] overflow-hidden border-b border-amber-200/20 bg-black lg:border-b-0 lg:border-r">
          <Image
            alt={`Illustration ${chapter.title}`}
            className="h-full w-full object-cover"
            height={640}
            priority
            src={visual.image}
            width={520}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-black/20" />
          <div className="absolute inset-x-6 bottom-6">
            <h2 className="font-ik-title text-3xl font-semibold tracking-wide text-amber-50">{chapter.title}</h2>
            <p className="mt-3 max-w-xl font-ik-body text-sm leading-relaxed text-amber-50/80">{getStoryZoneDescription(chapter)}</p>
          </div>
        </div>

        <div className="flex min-h-0 flex-col p-5 sm:p-6">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-2 h-px w-full max-w-md bg-gradient-to-r from-transparent via-amber-200/35 to-transparent" />
            <h3 className="font-ik-title text-lg font-semibold tracking-wide text-amber-50">Niveaux disponibles</h3>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <StoryLevelList levels={chapter.levels} selectedLevelId={selectedLevelId} onSelectLevel={setSelectedLevelId} />
          </div>

          <div className="mt-5 border-t border-amber-200/20 pt-4">
            <button
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
              Terminez les niveaux precedents pour debloquer les suivants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
