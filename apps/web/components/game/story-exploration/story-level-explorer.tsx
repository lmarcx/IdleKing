"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useGameStore } from "@/store/game-store";
import { STORY_LEVEL_PLACEHOLDER_REWARDS, completeStoryLevelAction, type StoryEventDef } from "@idleking/game-core";
import type { ResourceStock } from "@idleking/game-core/resources/types.js";
import { ExplorationHud, type ExplorerHudLevel, type ExplorerHudPoi } from "./exploration-hud";
import { PixiExplorationStage, type ExplorationStagePoi } from "./pixi-exploration-stage";

type StoryLevelExplorerProps = {
  level: ExplorerHudLevel & {
    events: Array<Pick<StoryEventDef, "id" | "type">>;
  };
};

const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1600;
const DISCOVERY_RADIUS = 86;

type ExplorationPoi = ExplorationStagePoi & {
  label: string;
  required: boolean;
};

function getPoiColor(type: StoryEventDef["type"]): number {
  switch (type) {
    case "dialogue":
    case "return_to_boto":
      return 0x2fd8c8;
    case "cutscene":
    case "unlock":
      return 0x8a5cff;
    default:
      return 0xc9a654;
  }
}

function createExplorationPois(level: StoryLevelExplorerProps["level"]): ExplorationPoi[] {
  const fallbackPositions = [
    { x: 420, y: 360 },
    { x: 1180, y: 520 },
    { x: 1840, y: 980 },
    { x: 720, y: 1260 },
    { x: 1580, y: 1320 },
  ];

  return level.events.map((event, index) => {
    const position = fallbackPositions[index % fallbackPositions.length];
    return {
      color: getPoiColor(event.type),
      id: event.id,
      label: `Point d'interet ${index + 1}`,
      required: true,
      x: position.x,
      y: position.y,
    };
  });
}

function distanceBetween(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function rewardEntries(rewards: ResourceStock): Array<[string, number]> {
  return Object.entries(rewards).filter((entry): entry is [string, number] => typeof entry[1] === "number" && entry[1] > 0);
}

function CompletionPanel({
  alreadyCompleted,
  onReturn,
  rewards,
}: {
  alreadyCompleted: boolean;
  onReturn: () => void;
  rewards: ResourceStock;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 grid place-items-center bg-black/58 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-amber-200/35 bg-zinc-950/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
        <p className="font-ik-menu text-xs uppercase tracking-[0.22em] text-emerald-200">
          {alreadyCompleted ? "Objectifs deja valides" : "Objectifs valides"}
        </p>
        <h2 className="mt-2 font-ik-title text-2xl font-semibold text-amber-50">Niveau complété</h2>
        <div className="mt-5 rounded-md border border-amber-200/18 bg-black/45 p-4 text-left">
          <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-muted-foreground">Rewards placeholder</p>
          <div className="mt-3 grid gap-2 font-ik-body text-sm text-amber-50">
            {rewardEntries(rewards).map(([resourceId, amount]) => (
              <div className="flex items-center justify-between gap-3" key={resourceId}>
                <span>{resourceId}</span>
                <span className="font-ik-menu text-emerald-200">+{amount}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-amber-200/45 bg-amber-500/18 px-4 py-3 font-ik-menu text-sm text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/24"
          onClick={onReturn}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour à la Story
        </button>
      </div>
    </div>
  );
}

export function StoryLevelExplorer({ level }: StoryLevelExplorerProps) {
  const router = useRouter();
  const dispatch = useGameStore((s) => s.dispatch);
  const hasCompletedLevel = useGameStore((s) => s.state.story.completedLevels.has(level.id));
  const [playerPosition, setPlayerPosition] = useState({
    x: MAP_WIDTH / 2,
    y: MAP_HEIGHT / 2,
  });
  const pointsOfInterest = useMemo(() => createExplorationPois(level), [level]);
  const [discoveredPoiIds, setDiscoveredPoiIds] = useState<Set<string>>(() => new Set());
  const [completion, setCompletion] = useState<{
    alreadyCompleted: boolean;
    rewards: ResourceStock;
  } | null>(null);

  useEffect(() => {
    setDiscoveredPoiIds((current) => {
      let next: Set<string> | null = null;

      for (const point of pointsOfInterest) {
        if (current.has(point.id)) continue;
        if (distanceBetween(playerPosition, point) > DISCOVERY_RADIUS) continue;
        next ??= new Set(current);
        next.add(point.id);
      }

      return next ?? current;
    });
  }, [playerPosition, pointsOfInterest]);

  useEffect(() => {
    if (!hasCompletedLevel) return;
    setDiscoveredPoiIds(new Set(pointsOfInterest.map((point) => point.id)));
    setCompletion((current) =>
      current ?? {
        alreadyCompleted: true,
        rewards: STORY_LEVEL_PLACEHOLDER_REWARDS,
      }
    );
  }, [hasCompletedLevel, pointsOfInterest]);

  const hudPointsOfInterest: ExplorerHudPoi[] = useMemo(
    () =>
      pointsOfInterest.map((point) => ({
        discovered: discoveredPoiIds.has(point.id),
        id: point.id,
        label: point.label,
        required: point.required,
      })),
    [discoveredPoiIds, pointsOfInterest]
  );

  const allRequiredPoisDiscovered =
    pointsOfInterest.length > 0 && pointsOfInterest.every((point) => !point.required || discoveredPoiIds.has(point.id));

  useEffect(() => {
    if (!allRequiredPoisDiscovered || completion || hasCompletedLevel) return;

    const result = completeStoryLevelAction(useGameStore.getState().state, level.id);
    dispatch(() => result.next);

    if (result.completed) {
      setCompletion({
        alreadyCompleted: false,
        rewards: result.rewards,
      });
    }
  }, [allRequiredPoisDiscovered, completion, dispatch, hasCompletedLevel, level.id]);

  return (
    <section className="relative h-[calc(100vh-2rem)] min-h-[44rem] overflow-hidden rounded-xl border border-amber-200/25 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.48)]">
      <PixiExplorationStage
        levelId={level.id}
        mapHeight={MAP_HEIGHT}
        mapWidth={MAP_WIDTH}
        onPlayerMove={setPlayerPosition}
        pointsOfInterest={pointsOfInterest}
      />
      <ExplorationHud level={level} playerPosition={playerPosition} pointsOfInterest={hudPointsOfInterest} />
      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 rounded-lg border border-amber-200/18 bg-black/55 px-4 py-2 font-ik-body text-xs text-muted-foreground">
        Deplacement : WASD, ZQSD ou fleches directionnelles.
      </div>
      {completion ? (
        <CompletionPanel
          alreadyCompleted={completion.alreadyCompleted}
          onReturn={() => router.push("/game/worlds")}
          rewards={completion.rewards}
        />
      ) : null}
    </section>
  );
}
