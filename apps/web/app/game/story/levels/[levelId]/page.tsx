import Link from "next/link";

import { StoryLevelExplorer } from "@/components/game/story-exploration/story-level-explorer";
import { getStoryBossDefinition, getStoryDungeonDefinition, getStoryLevelDef } from "@idleking/game-core";

type StoryLevelPageProps = {
  params: Promise<{
    levelId: string;
  }>;
};

export default async function StoryLevelPage({ params }: StoryLevelPageProps) {
  const { levelId } = await params;
  const dungeon = getStoryDungeonDefinition(levelId);

  if (dungeon) {
    const boss = dungeon.bossId ? getStoryBossDefinition(dungeon.bossId) : undefined;
    const explorerLevel = {
      chapterId: dungeon.chapterId,
      description: boss ? `Boss: ${boss.name}` : "Donjon narratif MVP.",
      events: [
        { id: `${dungeon.id}.event.1`, type: "exploration" as const },
        { id: `${dungeon.id}.event.2`, type: dungeon.type === "boss" ? ("boss" as const) : ("encounter" as const) },
        { id: `${dungeon.id}.event.3`, type: "unlock" as const },
      ],
      id: dungeon.id,
      index: dungeon.order,
      isRequiredForNarrative: true,
      kind: dungeon.type === "boss" ? ("special" as const) : ("standard" as const),
      recommendedPower: (dungeon.unlockConditions.minWorldLevel ?? 1) * 10,
      title: dungeon.title,
    };

    return <StoryLevelExplorer dungeonId={dungeon.id} level={explorerLevel} />;
  }

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
            href="/game/kingdom"
          >
            Retour au Royaume
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
