import Link from "next/link";

export type ExplorerHudLevel = {
  id: string;
  recommendedPower: number;
  title: string;
};

type ExplorationHudProps = {
  level: ExplorerHudLevel;
  pointsOfInterest: ExplorerHudPoi[];
  playerPosition: {
    x: number;
    y: number;
  };
};

export type ExplorerHudPoi = {
  discovered: boolean;
  id: string;
  label: string;
  required: boolean;
};

export function ExplorationHud({ level, playerPosition, pointsOfInterest }: ExplorationHudProps) {
  const requiredPoints = pointsOfInterest.filter((point) => point.required);
  const discoveredRequiredPoints = requiredPoints.filter((point) => point.discovered);

  return (
    <div className="pointer-events-none absolute inset-x-4 top-24 z-10 flex flex-wrap items-start justify-between gap-3">
      <div className="pointer-events-auto rounded-lg border border-amber-200/25 bg-black/70 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.38)]">
        <h1 className="font-ik-title text-lg font-semibold tracking-wide text-amber-50">{level.title}</h1>
        <div className="mt-1 flex flex-wrap gap-3 font-ik-body text-xs text-muted-foreground">
          <span>Power {level.recommendedPower}</span>
          <span>
            Position {Math.round(playerPosition.x)}, {Math.round(playerPosition.y)}
          </span>
          <span>
            POI {discoveredRequiredPoints.length}/{requiredPoints.length}
          </span>
        </div>
        <div className="mt-3 grid gap-1 font-ik-body text-xs">
          {pointsOfInterest.map((point) => (
            <div className="flex items-center gap-2 text-muted-foreground" key={point.id}>
              <span
                aria-hidden="true"
                className={
                  point.discovered
                    ? "h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.55)]"
                    : "h-2 w-2 rounded-full border border-amber-200/35 bg-black"
                }
              />
              <span className={point.discovered ? "text-amber-50" : undefined}>{point.label}</span>
            </div>
          ))}
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
