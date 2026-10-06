export type ExplorerHudLevel = {
  id: string;
  recommendedPower: number;
  title: string;
};

type ExplorationHudProps = {
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

/**
 * Objectives-only panel. Title/subtitle and the exit link already live in
 * CombatHud (top-24) — this panel starts lower (top-44) and never repeats
 * them, it only adds what CombatHud doesn't show: POI checklist + position.
 */
export function ExplorationHud({ playerPosition, pointsOfInterest }: ExplorationHudProps) {
  const requiredPoints = pointsOfInterest.filter((point) => point.required);
  const discoveredRequiredPoints = requiredPoints.filter((point) => point.discovered);

  return (
    <div className="pointer-events-none absolute left-4 top-44 z-10">
      <div className="pointer-events-auto rounded-lg border border-amber-200/25 bg-black/70 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.38)]">
        <div className="flex flex-wrap gap-3 font-ik-body text-xs text-muted-foreground">
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
                    ? "h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(242,242,242,0.55)]"
                    : "h-2 w-2 rounded-full border border-amber-200/35 bg-black"
                }
              />
              <span className={point.discovered ? "text-amber-50" : undefined}>{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
