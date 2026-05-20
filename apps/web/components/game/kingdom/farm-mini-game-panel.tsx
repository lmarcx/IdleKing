"use client";

import { useEffect, useRef, useState } from "react";
import { Apple, Bomb, Flag, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import {
  abandonFarmRun,
  getMiniGameWorldEnergyCost,
  hitFarmSpawn,
  startFarmRun,
  tickFarmTimer,
  type ActiveFarmRunState,
  type FarmActionResult,
  type FarmSpawn,
  type FarmTimerResult,
  type ResourceId,
  type ResourceStock,
} from "@idleking/game-core";

type FarmRunFeedback = {
  kind: "success" | "failed" | "info";
  message: string;
  rewards?: ResourceStock;
};

type FarmMiniGamePanelProps = {
  embedded?: boolean;
};

function formatResourceLabel(resourceId: ResourceId) {
  return resourceId.replaceAll("_", " ");
}

function formatRewards(rewards: ResourceStock | undefined) {
  const entries = Object.entries(rewards ?? {}).filter(([, amount]) => Math.max(0, Math.floor(amount ?? 0)) > 0);
  if (entries.length === 0) return "None";
  return entries.map(([resourceId, amount]) => `${formatResourceLabel(resourceId as ResourceId)} x${amount}`).join(", ");
}

function formatTimer(ms: number | undefined) {
  const safeMs = Math.max(0, Math.floor(ms ?? 0));
  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getActiveFarmRun(state: ReturnType<typeof useGameStore.getState>["state"]): ActiveFarmRunState | null {
  const activeRun = state.miniGames.activeRun;
  if (activeRun?.status === "running" && activeRun.kind === "farm" && activeRun.farm) {
    return activeRun as ActiveFarmRunState;
  }
  return null;
}

function getSpawnLabel(spawn: FarmSpawn) {
  if (spawn.kind === "bomb") return "Bomb";
  if (spawn.kind === "golden_fruit") return "Golden Fruit";
  return "Fruit";
}

function getSpawnIcon(spawn: FarmSpawn) {
  if (spawn.kind === "bomb") return <Bomb className="h-5 w-5" />;
  if (spawn.kind === "golden_fruit") return <Sparkles className="h-5 w-5" />;
  return <Apple className="h-5 w-5" />;
}

function getSpawnClassName(spawn: FarmSpawn) {
  if (spawn.hit) return "border-zinc-700 bg-zinc-900/70 text-zinc-400";
  if (spawn.kind === "bomb") return "border-rose-300/50 bg-rose-500/16 text-rose-50 hover:border-rose-200";
  if (spawn.kind === "golden_fruit") return "border-yellow-300/55 bg-yellow-400/18 text-yellow-50 hover:border-yellow-200";
  return "border-emerald-300/45 bg-emerald-500/14 text-emerald-50 hover:border-emerald-200";
}

export function FarmMiniGamePanel({ embedded = false }: FarmMiniGamePanelProps) {
  const state = useGameStore((store) => store.state);
  const hydrated = useGameStore((store) => store.hydrated);
  const dispatch = useGameStore((store) => store.dispatch);
  const [feedback, setFeedback] = useState<FarmRunFeedback | null>(null);
  const lastTickAtRef = useRef<number | null>(null);

  const activeRun = getActiveFarmRun(state);
  const farmCost = getMiniGameWorldEnergyCost("farm");
  const canStart = hydrated && !state.miniGames.activeRun && state.world.energy.current >= farmCost;
  const hp = activeRun?.runResources.hp;
  const runEnergy = activeRun?.runResources.energy;

  function applyTimerResult(result: FarmTimerResult, rewardsBeforeTick: ResourceStock | undefined) {
    if (!result.ok) return;
    dispatch(() => result.next);
    if (result.finished) {
      setFeedback({
        kind: "success",
        message: "Farm timer completed. Rewards committed.",
        rewards: rewardsBeforeTick,
      });
      toast.success(`Farm completed: ${formatRewards(rewardsBeforeTick)}`);
    }
  }

  useEffect(() => {
    if (!hydrated || !activeRun) {
      lastTickAtRef.current = null;
      return;
    }

    lastTickAtRef.current = Date.now();
    const intervalId = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        lastTickAtRef.current = Date.now();
        return;
      }

      const now = Date.now();
      const previous = lastTickAtRef.current ?? now;
      lastTickAtRef.current = now;
      const elapsedMs = now - previous;
      if (elapsedMs <= 0) return;

      const currentState = useGameStore.getState().state;
      const currentRun = getActiveFarmRun(currentState);
      if (!currentRun) return;

      const result = tickFarmTimer(currentState, elapsedMs);
      applyTimerResult(result, currentRun.temporaryRewards);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeRun?.id, hydrated]);

  function startRun() {
    if (!hydrated) {
      const message = "Loading save. Farm actions will be available shortly.";
      setFeedback({ kind: "info", message });
      return;
    }

    const result = startFarmRun(useGameStore.getState().state, { nowMs: Date.now() });
    if (!result.ok) {
      toast.error(`Farm launch failed: ${result.reason}`);
      setFeedback({ kind: "failed", message: `Farm launch failed: ${result.reason}` });
      return;
    }

    dispatch(() => result.next);
    setFeedback({ kind: "info", message: "Farm run started." });
    toast.success("Farm run started");
  }

  function applyFarmAction(result: FarmActionResult) {
    if (!result.ok) {
      toast.error(`Farm action failed: ${result.reason}`);
      setFeedback({ kind: "failed", message: `Farm action failed: ${result.reason}` });
      return;
    }

    dispatch(() => result.next);

    if (result.failed) {
      setFeedback({
        kind: "failed",
        message: "Farm run failed. Temporary rewards were lost.",
        rewards: result.run.temporaryRewards,
      });
      toast.error("Farm run failed. Rewards lost.");
      return;
    }

    if (result.outcome === "bomb") {
      setFeedback({ kind: "info", message: "Bomb hit. Run HP reduced." });
    } else if (result.outcome === "golden_fruit") {
      setFeedback({ kind: "info", message: `Golden fruit collected: ${formatRewards(result.reward)} and timer bonus.` });
    } else {
      setFeedback({ kind: "info", message: `Fruit collected: ${formatRewards(result.reward)}` });
    }
  }

  function hitSpawn(spawn: FarmSpawn) {
    if (!hydrated) {
      setFeedback({ kind: "info", message: "Loading save. Farm actions will be available shortly." });
      return;
    }

    const result = hitFarmSpawn(useGameStore.getState().state, spawn.id);
    applyFarmAction(result);
  }

  function abandonRun() {
    if (!hydrated) {
      setFeedback({ kind: "info", message: "Loading save. Farm actions will be available shortly." });
      return;
    }

    const currentRun = getActiveFarmRun(useGameStore.getState().state);
    const lostRewards = currentRun?.temporaryRewards;
    const result = abandonFarmRun(useGameStore.getState().state);
    if (!result.ok) {
      toast.error(`Abandon failed: ${result.reason}`);
      setFeedback({ kind: "failed", message: `Abandon failed: ${result.reason}` });
      return;
    }

    dispatch(() => result.next);
    setFeedback({
      kind: "failed",
      message: "Farm run abandoned. This counts as failure; rewards were lost.",
      rewards: lostRewards,
    });
    toast.error("Farm run abandoned. Rewards lost.");
  }

  const content = (
    <div className="space-y-4" data-testid="farm-mini-game-panel">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-md border border-emerald-200/15 bg-black/35 p-3">
          <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-emerald-100/70">World Energy</div>
          <div className="mt-1 font-ik-title text-lg text-emerald-50">
            {Math.floor(state.world.energy.current)}/{Math.ceil(state.world.energy.max)}
          </div>
          <div className="font-ik-body text-xs text-muted-foreground">Cost {farmCost}</div>
        </div>
        <div className="rounded-md border border-emerald-200/15 bg-black/35 p-3">
          <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-emerald-100/70">Run Status</div>
          <div className="mt-1 font-ik-title text-lg text-emerald-50">
            {activeRun ? activeRun.status : state.miniGames.lastRun?.kind === "farm" ? state.miniGames.lastRun.status : "idle"}
          </div>
          <div className="font-ik-body text-xs text-muted-foreground">
            {hydrated ? `Score ${activeRun?.farm.score ?? 0}` : "Loading save..."}
          </div>
        </div>
        <div className="rounded-md border border-emerald-200/15 bg-black/35 p-3">
          <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-emerald-100/70">Run HP</div>
          <div className="mt-1 font-ik-title text-lg text-emerald-50">{hp ? `${hp.current}/${hp.max}` : "-"}</div>
        </div>
        <div className="rounded-md border border-emerald-200/15 bg-black/35 p-3">
          <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-emerald-100/70">Run Energy</div>
          <div className="mt-1 font-ik-title text-lg text-emerald-50">
            {runEnergy ? `${runEnergy.current}/${runEnergy.max}` : "-"}
          </div>
        </div>
        <div className="rounded-md border border-emerald-200/15 bg-black/35 p-3">
          <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-emerald-100/70">Timer</div>
          <div className="mt-1 font-ik-title text-lg text-emerald-50">{formatTimer(activeRun?.farm.timerMs)}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button data-testid="farm-start-run" disabled={!canStart} onClick={startRun} type="button">
          <Play className="mr-2 h-4 w-4" />
          Start Farm Run
        </Button>
        <Button disabled={!hydrated || !activeRun} onClick={abandonRun} type="button" variant="destructive">
          <Flag className="mr-2 h-4 w-4" />
          Abandon - Failure
        </Button>
      </div>

      <div className="rounded-md border border-emerald-200/15 bg-black/35 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <div className="font-ik-title text-sm text-emerald-50">Temporary Rewards</div>
            <div className="font-ik-body text-xs text-muted-foreground">Committed when the timer reaches zero.</div>
          </div>
          <div className="font-ik-menu text-sm text-emerald-50">{formatRewards(activeRun?.temporaryRewards)}</div>
        </div>
      </div>

      {feedback ? (
        <div
          className={cn(
            "rounded-md border p-3 font-ik-body text-sm",
            feedback.kind === "success" && "border-emerald-300/30 bg-emerald-500/12 text-emerald-50",
            feedback.kind === "failed" && "border-rose-300/30 bg-rose-500/12 text-rose-50",
            feedback.kind === "info" && "border-cyan-300/30 bg-cyan-500/12 text-cyan-50",
          )}
          data-testid="farm-run-feedback"
          role="status"
        >
          <div>{feedback.message}</div>
          {feedback.rewards ? <div className="mt-1 text-xs opacity-80">Rewards: {formatRewards(feedback.rewards)}</div> : null}
        </div>
      ) : null}

      <div className="rounded-md border border-emerald-200/15 bg-black/35 p-3">
        <div className="mb-3 flex items-center gap-2 font-ik-title text-sm text-emerald-50">
          <Apple className="h-4 w-4" />
          Current Spawns
        </div>
        {activeRun ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" data-testid="farm-spawns">
            {activeRun.farm.spawns.map((spawn) => (
              <button
                aria-label={`Farm spawn ${spawn.id} ${getSpawnLabel(spawn)}`}
                className={cn(
                  "min-h-24 rounded-md border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                  getSpawnClassName(spawn),
                )}
                data-testid={`farm-spawn-${spawn.id}`}
                disabled={!hydrated || spawn.hit}
                key={spawn.id}
                onClick={() => hitSpawn(spawn)}
                type="button"
              >
                <span className="flex items-center gap-2 font-ik-menu text-xs uppercase tracking-[0.12em]">
                  {getSpawnIcon(spawn)}
                  {getSpawnLabel(spawn)}
                </span>
                <span className="mt-2 block font-ik-body text-xs opacity-75">
                  {spawn.hit ? "Hit" : spawn.kind === "bomb" ? "Danger: HP loss" : formatRewards(spawn.reward)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid min-h-40 place-items-center rounded-md border border-dashed border-emerald-200/20 bg-black/25 font-ik-body text-sm text-muted-foreground">
            Start a run to spawn fruit and bombs.
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Farm Mini-Game</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
