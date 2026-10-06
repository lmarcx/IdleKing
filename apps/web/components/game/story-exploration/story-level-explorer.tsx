"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CombatHud } from "@/components/game/combat/combat-hud";
import { useGameHudOverlay } from "@/components/game/hud/game-hud-overlays";
import { useGameStore } from "@/store/game-store";
import {
  STORY_LEVEL_PLACEHOLDER_REWARDS,
  canEnterDungeon,
  completeDungeon,
  completeStoryLevelAction,
  getDungeonLayout,
  getLevelScript,
  type DungeonLayout,
  type DungeonXpReward,
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

const BEAT_FALLBACK_POSITIONS = [
  { x: 420, y: 360 },
  { x: 1180, y: 520 },
  { x: 1840, y: 980 },
  { x: 720, y: 1260 },
  { x: 1580, y: 1320 },
];

function createBeatPois(beats: readonly LevelBeat[], layout?: DungeonLayout): ExplorationPoi[] {
  return beats.map((beat, index) => {
    const anchor = layout?.beats.find((candidate) => candidate.beatId === beat.id);
    const position = anchor ?? BEAT_FALLBACK_POSITIONS[index % BEAT_FALLBACK_POSITIONS.length];
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
  layout?: DungeonLayout,
): ExplorationPoi[] {
  const script = dungeonId ? getLevelScript(dungeonId) : undefined;
  if (script) return createBeatPois(script.beats, layout);
  // Unscripted dungeons have no narrative objective: clearing the rooms is the objective.
  if (dungeonId) return [];

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
  isReplay,
  label,
  onReplay,
  onReturn,
  rewards,
  xp,
}: {
  alreadyCompleted: boolean;
  isReplay: boolean;
  label: string;
  onReplay?: () => void;
  onReturn: () => void;
  rewards: DisplayRewards;
  xp?: DungeonXpReward;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-black/58 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-amber-200/35 bg-zinc-950/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
        <p className="font-ik-menu text-xs uppercase tracking-[0.22em] text-emerald-200">
          {alreadyCompleted ? "Objectifs deja valides" : isReplay ? "Donjon nettoye" : "Objectifs valides"}
        </p>
        <h2 className="mt-2 font-ik-title text-2xl font-semibold text-amber-50">{label}</h2>
        <div className="mt-5 rounded-md border border-amber-200/18 bg-black/45 p-4 text-left">
          <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {isReplay ? "Recompenses de replay" : "Recompenses"}
          </p>
          <div className="mt-3 grid gap-2 font-ik-body text-sm text-amber-50">
            {xp && xp.playerXp > 0 ? (
              <div className="flex items-center justify-between gap-3">
                <span>XP joueur</span>
                <span className="font-ik-menu text-emerald-200">+{xp.playerXp}</span>
              </div>
            ) : null}
            {xp && xp.globalXp > 0 ? (
              <div className="flex items-center justify-between gap-3">
                <span>XP globale (Temple)</span>
                <span className="font-ik-menu text-emerald-200">+{xp.globalXp}</span>
              </div>
            ) : null}
            {rewardEntries(rewards).map(([resourceId, amount]) => (
              <div className="flex items-center justify-between gap-3" key={resourceId}>
                <span>{resourceId}</span>
                <span className="font-ik-menu text-emerald-200">+{amount}</span>
              </div>
            ))}
          </div>
        </div>
        {onReplay ? (
          <button
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-amber-200/25 bg-black/40 px-4 py-3 font-ik-menu text-sm text-amber-50 transition hover:border-amber-100"
            onClick={onReplay}
            type="button"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Rejouer le donjon
          </button>
        ) : null}
        <button
          className={`${onReplay ? "mt-2" : "mt-5"} inline-flex w-full items-center justify-center gap-2 rounded-md border border-amber-200/45 bg-amber-500/18 px-4 py-3 font-ik-menu text-sm text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/24`}
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

/**
 * Story dungeons are replayable (Freeze §12). Each run is a fresh mount of StoryLevelRun; "Rejouer"
 * bumps the key. A run started on an already-cleared dungeon is a replay: per LEVELDESIGN.md it
 * drops objectives and narrative beats and keeps pure combat — clearing the enemies completes it,
 * and completeDungeon() grants the replay rewards.
 */
export function StoryLevelExplorer(props: StoryLevelExplorerProps) {
  const [runIndex, setRunIndex] = useState(0);
  return <StoryLevelRun key={runIndex} {...props} onReplay={() => setRunIndex((index) => index + 1)} />;
}

function StoryLevelRun({ dungeonId, level, onReplay }: StoryLevelExplorerProps & { onReplay: () => void }) {
  const router = useRouter();
  const dispatch = useGameStore((s) => s.dispatch);
  const gameState = useGameStore((s) => s.state);
  const hasCompletedLevel = dungeonId
    ? gameState.story.completedDungeonIds.has(dungeonId)
    : gameState.story.completedLevels.has(level.id);
  // Frozen at mount: completing the first clear mid-run must not turn this run into a replay.
  const [isReplay] = useState(() => Boolean(dungeonId) && hasCompletedLevel);
  const layout = useMemo(() => (dungeonId ? getDungeonLayout(dungeonId) : undefined), [dungeonId]);
  const mapWidth = layout?.width ?? MAP_WIDTH;
  const mapHeight = layout?.height ?? MAP_HEIGHT;
  const canCompleteDungeon = dungeonId ? canEnterDungeon(gameState, dungeonId) : true;
  const { isOverlayOpen: isGameHudOverlayOpen } = useGameHudOverlay();
  const [playerPosition, setPlayerPosition] = useState(() => layout?.playerSpawn ?? { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });
  const pointsOfInterest = useMemo(
    () => (isReplay ? [] : createExplorationPois(level, dungeonId, layout)),
    [isReplay, level, dungeonId, layout]
  );
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
    xp?: DungeonXpReward;
  } | null>(null);
  const [combatHud, setCombatHud] = useState<ExplorationCombatHudState | null>(null);

  // Scripted beats unlock strictly in order, plus their layout condition (zone cleared / boss down).
  const completedBeatIds = useMemo(() => new Set(discoveredPoiIds), [discoveredPoiIds]);
  const clearedZoneKey = combatHud?.clearedZoneIds.join("|") ?? "";
  const bossDefeatedNow = combatHud?.bossDefeated ?? false;
  const interactablePoiIds = useMemo(() => {
    if (!layout || layout.beats.length === 0) return undefined;
    const next = pointsOfInterest.find((point) => !discoveredPoiIds.has(point.id));
    if (!next) return new Set<string>();
    const anchor = layout.beats.find((candidate) => candidate.beatId === next.id);
    const cleared = new Set(clearedZoneKey ? clearedZoneKey.split("|") : []);
    if (anchor?.requires?.zoneCleared && !cleared.has(anchor.requires.zoneCleared)) return new Set<string>();
    if (anchor?.requires?.bossDefeated && !bossDefeatedNow) return new Set<string>();
    return new Set([next.id]);
  }, [bossDefeatedNow, clearedZoneKey, discoveredPoiIds, layout, pointsOfInterest]);

  // POIs and progression-required objects no longer auto-complete on proximity —
  // the player must press F while in range (see PixiExplorationStage's
  // onPoiInteractAction), which calls this handler.
  const handlePoiInteract = useCallback(
    (poiId: string) => {
      if (discoveredPoiIds.has(poiId)) return;
      if (interactablePoiIds && !interactablePoiIds.has(poiId)) return;
      const point = pointsOfInterest.find((candidate) => candidate.id === poiId);
      if (!point) return;

      setDiscoveredPoiIds((current) => {
        const next = new Set(current);
        next.add(poiId);
        return next;
      });

      if (point.beat) setDialogueQueue((queue) => [...queue, point.beat!]);
    },
    [discoveredPoiIds, interactablePoiIds, pointsOfInterest]
  );

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

  // Legacy (non-dungeon) story levels are one-shot: show their completion panel directly.
  useEffect(() => {
    if (dungeonId || !hasCompletedLevel) return;
    setDiscoveredPoiIds(new Set(pointsOfInterest.map((point) => point.id)));
    setCompletion((current) =>
      current ?? {
        alreadyCompleted: true,
        rewards: resourceStockToDisplayRewards(STORY_LEVEL_PLACEHOLDER_REWARDS),
      }
    );
  }, [dungeonId, hasCompletedLevel, pointsOfInterest]);

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

  const allRequiredPoisDiscovered = pointsOfInterest.every((point) => !point.required || discoveredPoiIds.has(point.id));

  // Dungeons complete once every enemy (boss included) is down; legacy levels keep their
  // boss-beat rule. Replays have no POIs, so the enemy clear alone completes them.
  const enemiesCleared = (combatHud?.enemiesRemaining ?? 1) === 0;
  const combatDone = dungeonId ? enemiesCleared : !hasBossBeat || enemiesCleared;
  const dialoguesDrained = activeDialogue === null && dialogueQueue.length === 0;
  const readyToComplete = allRequiredPoisDiscovered && combatDone && dialoguesDrained;

  useEffect(() => {
    if (!readyToComplete || completion) return;
    if (!dungeonId && hasCompletedLevel) return;

    if (dungeonId) {
      const result = completeDungeon(useGameStore.getState().state, dungeonId);
      if (!result.ok) return;

      dispatch(() => result.next);
      setCompletion({
        alreadyCompleted: false,
        rewards: rewardBundleToDisplayRewards(result.rewards),
        xp: result.xp,
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

  // Once a full-screen resolution panel (completion / locked) takes over, the
  // gameplay HUD underneath is hidden — otherwise its own exit link and
  // title/objectives panels stack behind the panel's own "Retour au Royaume".
  const isPlaying = completion === null && canCompleteDungeon;

  return (
    <section className="relative h-[calc(100vh-2rem)] min-h-[44rem] overflow-hidden rounded-xl border border-amber-200/25 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.48)]">
      <PixiExplorationStage
        completedBeatIds={completedBeatIds}
        inputBlocked={isGameHudOverlayOpen || completion !== null || !canCompleteDungeon || activeDialogue !== null}
        interactablePoiIds={interactablePoiIds}
        isReplay={isReplay}
        layout={layout}
        levelId={level.id}
        mapHeight={mapHeight}
        mapWidth={mapWidth}
        onCombatHudChangeAction={setCombatHud}
        onPlayerMoveAction={setPlayerPosition}
        onPoiInteractAction={handlePoiInteract}
        pointsOfInterest={pointsOfInterest}
      />
      {isPlaying ? (
        <>
          <CombatHud
            mode="story"
            playerHealth={combatHud?.playerHealth}
            playerMana={combatHud?.playerMana}
            playerStamina={combatHud?.playerStamina}
            // The dialogue box takes the same bottom-4 strip and already
            // blocks input while open — drop the skill bar instead of
            // letting it render on top of the dialogue text.
            skillBar={activeDialogue ? undefined : combatHud?.skillBar}
            subtitle={`Power ${level.recommendedPower}`}
            title={level.title}
          />
          <ExplorationHud playerPosition={playerPosition} pointsOfInterest={hudPointsOfInterest} />
          <div className="pointer-events-none absolute left-4 bottom-40 z-10 max-w-xs rounded-lg border border-amber-200/18 bg-black/55 px-4 py-2 font-ik-body text-xs text-muted-foreground">
            Deplacement : WASD, ZQSD ou fleches. Sprint : Shift. Dash : Espace. Clic G/D : attaques de l'arme. Interagir : F.
          </div>
        </>
      ) : null}
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
          isReplay={isReplay}
          label={dungeonId ? "Donjon complete" : "Niveau complete"}
          onReplay={dungeonId ? onReplay : undefined}
          onReturn={() => router.push("/game/kingdom")}
          rewards={completion.rewards}
          xp={completion.xp}
        />
      ) : null}
      {!canCompleteDungeon ? <LockedPanel onReturn={() => router.push("/game/kingdom")} /> : null}
    </section>
  );
}
