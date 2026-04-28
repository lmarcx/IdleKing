import Link from "next/link";

export type ExplorerHudLevel = {
  id: string;
  recommendedPower: number;
  title: string;
};

type ExplorationHudProps = {
  level: ExplorerHudLevel;
  playerPosition: {
    x: number;
    y: number;
  };
};

export function ExplorationHud({ level, playerPosition }: ExplorationHudProps) {
  return (
    <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex flex-wrap items-start justify-between gap-3">
      <div className="pointer-events-auto rounded-lg border border-amber-200/25 bg-black/70 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.38)]">
        <h1 className="font-ik-title text-lg font-semibold tracking-wide text-amber-50">{level.title}</h1>
        <div className="mt-1 flex flex-wrap gap-3 font-ik-body text-xs text-muted-foreground">
          <span>Power {level.recommendedPower}</span>
          <span>
            Position {Math.round(playerPosition.x)}, {Math.round(playerPosition.y)}
          </span>
        </div>
      </div>

      <Link
        className="pointer-events-auto rounded-md border border-amber-200/35 bg-black/70 px-4 py-2 font-ik-menu text-xs text-amber-50 transition hover:border-amber-100"
        href="/game/worlds"
      >
        Quitter
      </Link>
    </div>
  );
}
