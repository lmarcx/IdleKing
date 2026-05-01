import { WorldsModeShell } from "@/components/game/worlds/worlds-mode-shell";
import type { WorldModeId } from "@/components/game/worlds/world-mode-sidebar";

type WorldsPageProps = {
  searchParams?: Promise<{
    mode?: string;
    opponent?: string;
  }>;
};

function getInitialMode(mode: string | undefined): WorldModeId {
  if (mode === "duel" || mode === "expeditions" || mode === "story") return mode;
  return "story";
}

export default async function WorldsPage({ searchParams }: WorldsPageProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <WorldsModeShell
      initialMode={getInitialMode(resolvedSearchParams?.mode)}
      initialOpponentId={resolvedSearchParams?.opponent ?? null}
    />
  );
}
