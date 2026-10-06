"use client";

import { Button } from "@/components/ui/button";
import type { StoryBossDefinition, StoryDungeonDefinition } from "@idleking/game-core";

/**
 * Center panel shown when a real Story dungeon (from STORY_DUNGEON_REGISTRY) has neither a local
 * editor document nor a canonical PlayableMap yet. This is an actionable empty state, distinct
 * from PlaceholderPanel's permanent "not wired yet" stubs (Kingdom/Expedition placeholders).
 */
export function StoryDungeonEmptyPanel({
  boss,
  dungeon,
  eraTitle,
  onCreateMap,
}: {
  boss?: StoryBossDefinition;
  dungeon: StoryDungeonDefinition;
  eraTitle: string;
  onCreateMap: () => void;
}) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center p-6">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-center">
        <p className="font-ik-menu text-[0.65rem] uppercase tracking-wide text-amber-200/80">No authored map yet</p>
        <h2 className="mt-2 font-ik-title text-xl text-zinc-100">{dungeon.title}</h2>
        <dl className="mt-4 grid gap-1.5 text-left font-ik-body text-xs text-zinc-400">
          <div className="flex justify-between gap-3">
            <dt>Dungeon ID</dt>
            <dd className="text-zinc-200">{dungeon.id}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Era</dt>
            <dd className="text-zinc-200">{eraTitle}</dd>
          </div>
          {boss ? (
            <div className="flex justify-between gap-3">
              <dt>Boss</dt>
              <dd className="text-zinc-200">{boss.name}</dd>
            </div>
          ) : null}
        </dl>
        <Button className="mt-5 w-full" onClick={onCreateMap}>
          Create map for this dungeon
        </Button>
      </div>
    </div>
  );
}
