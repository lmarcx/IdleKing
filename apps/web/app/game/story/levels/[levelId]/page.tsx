import Link from "next/link";

import { StoryLevelExplorer } from "@/components/game/story-exploration/story-level-explorer";
import { getStoryLevelDef } from "@idleking/game-core";

type StoryLevelPageProps = {
  params: Promise<{
    levelId: string;
  }>;
};

export default async function StoryLevelPage({ params }: StoryLevelPageProps) {
  const { levelId } = await params;
  const level = getStoryLevelDef(levelId);

  if (!level) {
    return (
      <div className="grid min-h-[36rem] place-items-center text-center">
        <div className="max-w-md rounded-xl border border-amber-200/20 bg-black/40 p-6">
          <h1 className="font-ik-title text-xl font-semibold text-amber-50">Niveau introuvable</h1>
          <p className="mt-2 font-ik-body text-sm text-muted-foreground">
            Ce niveau Story n'existe pas ou n'est pas encore disponible.
          </p>
          <Link
            className="mt-5 inline-flex rounded-md border border-amber-200/35 bg-black/55 px-4 py-2 font-ik-menu text-xs text-amber-50 transition hover:border-amber-100"
            href="/game/worlds"
          >
            Retour aux mondes
          </Link>
        </div>
      </div>
    );
  }

  const { events, ...publicLevel } = level;
  const explorerLevel = {
    ...publicLevel,
    events: events.map(({ id, type }) => ({ id, type })),
  };

  return <StoryLevelExplorer level={explorerLevel} />;
}
