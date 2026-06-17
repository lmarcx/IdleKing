"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CombatHud } from "@/components/game/combat/combat-hud";
import { useGameHudOverlay } from "@/components/game/hud/game-hud-overlays";
import { useGameStore } from "@/store/game-store";
import {
  STORY_LEVEL_PLACEHOLDER_REWARDS,
  canEnterDungeon,
  completeDungeon,
  completeStoryLevelAction,
  getLevelScript,
  type LevelBeat,
  type RewardBundle,
  type StoryEventDef,
} from "@idleking/game-core";
import type { ResourceStock } from "@idleking/game-core/resources/types.js";
import { KingdomDialogueBox } from "@/components/game/kingdom/kingdom-dialogue-box";
import { ExplorationHud, type ExplorerHudLevel, type ExplorerHudPoi } from "./exploration-hud";
import { PixiExplorationStage, type ExplorationCombatHudState, type ExplorationStagePoi } from "./pixi-exploration-stage";

type StoryLevelExplorerProps = {
  dungeonId?: string;
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
  beat?: LevelBeat;
};

type DisplayRewards = Record<string, number>;

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

function getBeatColor(kind: LevelBeat["kind"]): number {
  switch (kind) {
    case "boss":
      return 0xef4444;
    case "spawn_wave":
      return 0xc9a654;
    case "companion_join":
      return 0x34d399;
    case "acquire_item":
      return 0x8a5cff;
    default:
      return 0x2fd8c8;
  }
}

// Hand-placed path of beats for the prologue, from the spawn toward the boss.
const BEAT_POSITIONS: Record<string, { x: number; y: number }> = {
  ruins: { x: 720, y: 700 },
  find_dog: { x: 520, y: 1060 },
  feed: { x: 780, y: 1290 },
  shadows: { x: 1200, y: 1080 },
  amalgam: { x: 1980, y: 760 },
  drop_of_darkness: { x: 2090, y: 600 },
  billy_joins: { x: 1820, y: 520 },
  kingdom_found: { x: 1480, y: 360 },
};

const BEAT_FALLBACK_POSITIONS = [
  { x: 420, y: 360 },
  { x: 1180, y: 520 },
  { x: 1840, y: 980 },
  { x: 720, y: 1260 },
  { x: 1580, y: 1320 },
];

function createBeatPois(beats: readonly LevelBeat[]): ExplorationPoi[] {
  return beats.map((beat, index) => {
    const position = BEAT_POSITIONS[beat.id] ?? BEAT_FALLBACK_POSITIONS[index % BEAT_FALLBACK_POSITIONS.length];
    return {
      beat,
      color: getBeatColor(beat.kind),
      id: beat.id,
      label: beat.speaker ?? beatLabel(beat.kind),
      required: true,
      x: position.x,
      y: position.y,
    };
  });
}

function beatLabel(kind: LevelBeat["kind"]): string {
  switch (kind) {
    case "boss":
      return "Boss";
    case "spawn_wave":
      return "Combat";
    case "companion_join":
      return "Compagnon";
    case "acquire_item":
      return "Découverte";
    default:
      return "Récit";
  }
}

function createExplorationPois(
  level: StoryLevelExplorerProps["level"],
  dungeonId?: string,
): ExplorationPoi[] {
  const script = dungeonId ? getLevelScript(dungeonId) : undefined;
  if (script) return createBeatPois(script.beats);

  const fallbackPositions = BEAT_FALLBACK_POSITIONS;

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

function rewardEntries(rewards: DisplayRewards): Array<[string, number]> {
  return Object.entries(rewards).filter((entry): entry is [string, number] => typeof entry[1] === "number" && entry[1] > 0);
}

function resourceStockToDisplayRewards(stock: ResourceStock): DisplayRewards {
  const rewards: DisplayRewards = {};
  for (const [resourceId, amount] of Object.entries(stock)) {
    if (typeof amount === "number") rewards[resourceId] = amount;
  }
  return rewards;
}

function rewardBundleToDisplayRewards(rewards: RewardBundle): DisplayRewards {
  const stock: DisplayRewards = {};
  for (const reward of rewards.resources ?? []) {
    stock[reward.resourceId] = (stock[reward.resourceId] ?? 0) + reward.amount;
  }
  for (const reward of rewards.currencies ?? []) {
    stock[reward.currencyId] = (stock[reward.currencyId] ?? 0) + reward.amount;
  }
  return stock;
}

function CompletionPanel({
  alreadyCompleted,
  label,
  onReturn,
  rewards,
}: {
  alreadyCompleted: boolean;
  label: string;
  onReturn: () => void;
  rewards: DisplayRewards;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-black/58 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-amber-200/35 bg-zinc-950/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
        <p className="font-ik-menu text-xs uppercase tracking-[0.22em] text-emerald-200">
          {alreadyCompleted ? "Objectifs deja valides" : "Objectifs valides"}
        </p>
        <h2 className="mt-2 font-ik-title text-2xl font-semibold text-amber-50">{label}</h2>
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
          Retour au Royaume
        </button>
      </div>
    </div>
  );
}

function LockedPanel({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-black/58 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-amber-200/35 bg-zinc-950/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
        <p className="font-ik-menu text-xs uppercase tracking-[0.22em] text-amber-200">Verrouille</p>
        <h2 className="mt-2 font-ik-title text-2xl font-semibold text-amber-50">Donjon indisponible</h2>
        <p className="mt-3 font-ik-body text-sm text-muted-foreground">
          Les prerequis Story ou WorldLevel ne sont pas encore remplis.
        </p>
        <button
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-amber-200/45 bg-amber-500/18 px-4 py-3 font-ik-menu text-sm text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/24"
          onClick={onReturn}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour au Royaume
        </button>
      </div>
    </div>
  );
}

export function StoryLevelExplorer({ dungeonId, level }: StoryLevelExplorerProps) {
  const router = useRouter();
  const dispatch = useGameStore((s) => s.dispatch);
  const gameState = useGameStore((s) => s.state);
  const hasCompletedLevel = dungeonId
    ? gameState.story.completedDungeonIds.has(dungeonId)
    : gameState.story.completedLevels.has(level.id);
  const canCompleteDungeon = dungeonId ? canEnterDungeon(gameState, dungeonId) : true;
  const { isOverlayOpen: isGameHudOverlayOpen } = useGameHudOverlay();
  const [playerPosition, setPlayerPosition] = useState({
    x: MAP_WIDTH / 2,
    y: MAP_HEIGHT / 2,
  });
  const pointsOfInterest = useMemo(() => createExplorationPois(level, dungeonId), [level, dungeonId]);
  const hasBossBeat = useMemo(
    () => pointsOfInterest.some((point) => point.beat?.kind === "boss"),
    [pointsOfInterest]
  );
  const [discoveredPoiIds, setDiscoveredPoiIds] = useState<Set<string>>(() => new Set());
  const [dialogueQueue, setDialogueQueue] = useState<LevelBeat[]>([]);
  const [activeDialogue, setActiveDialogue] = useState<LevelBeat | null>(null);
  const [completion, setCompletion] = useState<{
    alreadyCompleted: boolean;
    rewards: DisplayRewards;
  } | null>(null);
  const [combatHud, setCombatHud] = useState<ExplorationCombatHudState | null>(null);

  useEffect(() => {
    const newlyDiscovered = pointsOfInterest.filter(
      (point) => !discoveredPoiIds.has(point.id) && distanceBetween(playerPosition, point) <= DISCOVERY_RADIUS
    );
    if (newlyDiscovered.length === 0) return;

    setDiscoveredPoiIds((current) => {
      const next = new Set(current);
      for (const point of newlyDiscovered) next.add(point.id);
      return next;
    });

    const beats = newlyDiscovered.flatMap((point) => (point.beat ? [point.beat] : []));
    if (beats.length > 0) setDialogueQueue((queue) => [...queue, ...beats]);
  }, [playerPosition, pointsOfInterest, discoveredPoiIds]);

  // Promote the next queued beat into the active dialogue box.
  useEffect(() => {
    if (activeDialogue || dialogueQueue.length === 0) return;
    setActiveDialogue(dialogueQueue[0]);
    setDialogueQueue((queue) => queue.slice(1));
  }, [activeDialogue, dialogueQueue]);

  // Advance the active dialogue with keyboard (movement is blocked meanwhile).
  useEffect(() => {
    if (!activeDialogue) return;
    const handleKey = (event: KeyboardEvent) => {
      if (["Enter", " ", "Escape", "f", "F"].includes(event.key)) {
        event.preventDefault();
        setActiveDialogue(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeDialogue]);

  useEffect(() => {
    if (!hasCompletedLevel) return;
    setDiscoveredPoiIds(new Set(pointsOfInterest.map((point) => point.id)));
    setCompletion((current) =>
      current ?? {
        alreadyCompleted: true,
        rewards: resourceStockToDisplayRewards(STORY_LEVEL_PLACEHOLDER_REWARDS),
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

  // A scripted boss level only completes once the boss (and Shadows) are down.
  const bossDefeated = !hasBossBeat || (combatHud?.enemiesRemaining ?? 1) === 0;
  const dialoguesDrained = activeDialogue === null && dialogueQueue.length === 0;
  const readyToComplete = allRequiredPoisDiscovered && bossDefeated && dialoguesDrained;

  useEffect(() => {
    if (!readyToComplete || completion || hasCompletedLevel) return;

    if (dungeonId) {
      const result = completeDungeon(useGameStore.getState().state, dungeonId);
      if (!result.ok) return;

      dispatch(() => result.next);
      setCompletion({
        alreadyCompleted: false,
        rewards: rewardBundleToDisplayRewards(result.rewards),
      });
      return;
    }

    const result = completeStoryLevelAction(useGameStore.getState().state, level.id);
    dispatch(() => result.next);

    if (result.completed) {
      setCompletion({
        alreadyCompleted: false,
        rewards: result.rewards,
      });
    }
  }, [readyToComplete, completion, dispatch, dungeonId, hasCompletedLevel, level.id]);

  return (
    <section className="relative h-[calc(100vh-2rem)] min-h-[44rem] overflow-hidden rounded-xl border border-amber-200/25 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.48)]">
      <PixiExplorationStage
        inputBlocked={isGameHudOverlayOpen || completion !== null || !canCompleteDungeon || activeDialogue !== null}
        levelId={level.id}
        mapHeight={MAP_HEIGHT}
        mapWidth={MAP_WIDTH}
        onCombatHudChangeAction={setCombatHud}
        onPlayerMoveAction={setPlayerPosition}
        pointsOfInterest={pointsOfInterest}
      />
      <CombatHud
        mode="story"
        playerHealth={combatHud?.playerHealth}
        playerMana={combatHud?.playerMana}
        playerStamina={combatHud?.playerStamina}
        skillBar={combatHud?.skillBar}
        subtitle={`Power ${level.recommendedPower}`}
        title={level.title}
      />
      <ExplorationHud level={level} playerPosition={playerPosition} pointsOfInterest={hudPointsOfInterest} />
      <div className="pointer-events-none absolute left-4 bottom-24 z-10 max-w-xs rounded-lg border border-amber-200/18 bg-black/55 px-4 py-2 font-ik-body text-xs text-muted-foreground">
        Deplacement : WASD, ZQSD ou fleches. Sprint : Shift. Dash : Espace.
      </div>
      {activeDialogue && !completion ? (
        <KingdomDialogueBox
          name={activeDialogue.speaker ?? beatLabel(activeDialogue.kind)}
          text={activeDialogue.text}
          onClose={() => setActiveDialogue(null)}
        />
      ) : null}
      {completion ? (
        <CompletionPanel
          alreadyCompleted={completion.alreadyCompleted}
          label={dungeonId ? "Donjon complete" : "Niveau complete"}
          onReturn={() => router.push("/game/kingdom")}
          rewards={completion.rewards}
        />
      ) : null}
      {!canCompleteDungeon ? <LockedPanel onReturn={() => router.push("/game/kingdom")} /> : null}
    </section>
  );
}
