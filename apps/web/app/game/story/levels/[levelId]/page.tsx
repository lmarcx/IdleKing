import Link from "next/link";

import { StoryLevelExplorer } from "@/components/game/story-exploration/story-level-explorer";
import { StoryMapLevelRuntime } from "@/components/game/story-map/story-map-level-runtime";
import { getStoryDungeonDefinition } from "@idleking/game-core";
import { getCanonicalStoryMap, isCanonicalStoryRuntimeReady } from "@idleking/game-core/level-editor";

type StoryLevelPageProps = {
  params: Promise<{
    levelId: string;
  }>;
};

export default async function StoryLevelPage({ params }: StoryLevelPageProps) {
  const { levelId } = await params;
  const dungeon = getStoryDungeonDefinition(levelId);

  if (!dungeon) {
    return (
      <div className="grid min-h-[36rem] place-items-center text-center">
        <div className="max-w-md rounded-xl border border-amber-200/20 bg-black/40 p-6">
          <h1 className="font-ik-title text-xl font-semibold text-amber-50">Niveau introuvable</h1>
          <p className="mt-2 font-ik-body text-sm text-muted-foreground">
            Ce niveau Story n'existe pas ou n'est pas encore disponible.
          </p>
          <Link
            className="mt-5 inline-flex rounded-md border border-amber-200/35 bg-black/55 px-4 py-2 font-ik-menu text-xs text-amber-50 transition hover:border-amber-100"
            href="/game/kingdom"
          >
            Retour au Royaume
          </Link>
        </div>
      </div>
    );
  }

  const canonicalMap = getCanonicalStoryMap(dungeon.id);
  if (canonicalMap && isCanonicalStoryRuntimeReady(dungeon.id)) {
    return <StoryMapLevelRuntime dungeonId={dungeon.id} map={canonicalMap} />;
  }

  const explorerLevel = {
    id: dungeon.id,
    recommendedPower: (dungeon.unlockConditions.minWorldLevel ?? 1) * 10,
    title: dungeon.title,
  };

  return <StoryLevelExplorer dungeonId={dungeon.id} level={explorerLevel} />;
}
