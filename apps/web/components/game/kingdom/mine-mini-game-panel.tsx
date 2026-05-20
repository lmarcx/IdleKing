"use client";

import { useMemo, useState } from "react";
import { DoorOpen, Flag, Hammer, Pickaxe, Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import {
  abandonMineRun,
  breakMineRockTile,
  digMineSoilTile,
  extractMineRun,
  getMiniGameWorldEnergyCost,
  getQty,
  startMineRun,
  type ActiveMineRunState,
  type MineActionResult,
  type MineTile,
  type ResourceId,
  type ResourceStock,
} from "@idleking/game-core";

type MineRunFeedback = {
  kind: "success" | "failed" | "info";
  message: string;
  rewards?: ResourceStock;
};

type MineMiniGamePanelProps = {
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

function getActiveMineRun(state: ReturnType<typeof useGameStore.getState>["state"]): ActiveMineRunState | null {
  const activeRun = state.miniGames.activeRun;
  if (activeRun?.status === "running" && activeRun.kind === "mine" && activeRun.mine) {
    return activeRun as ActiveMineRunState;
  }
  return null;
}

function getTileLabel(tile: MineTile) {
  if (!tile.revealed) return "?";
  if (tile.content === "resource") return tile.dug ? "Loot" : "Ore";
  if (tile.content === "enemy") return "Enemy";
  if (tile.content === "stair") return "Stair";
  return tile.type === "rock" ? "Rock" : "Soil";
}

function getTileDetail(tile: MineTile) {
  if (!tile.revealed) return "Unknown";
  if (tile.content === "resource") return formatRewards(tile.resourceReward);
  if (tile.content === "enemy") return "HP risk";
  if (tile.content === "stair") return "Next floor";
  if (!tile.adjacentHints) return tile.type;
  return `R${tile.adjacentHints.resources} E${tile.adjacentHints.enemies} S${tile.adjacentHints.stairs}`;
}

function getTileClassName(tile: MineTile) {
  if (!tile.revealed) return "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500";
  if (tile.content === "resource") return "border-emerald-300/45 bg-emerald-500/14 text-emerald-50";
  if (tile.content === "enemy") return "border-rose-300/50 bg-rose-500/16 text-rose-50";
  if (tile.content === "stair") return "border-cyan-300/50 bg-cyan-500/16 text-cyan-50";
  if (tile.type === "rock") return "border-stone-300/35 bg-stone-500/14 text-stone-50";
  return "border-amber-300/35 bg-amber-500/12 text-amber-50";
}

function sortTiles(a: MineTile, b: MineTile) {
  return a.y === b.y ? a.x - b.x : a.y - b.y;
}

export function MineMiniGamePanel({ embedded = false }: MineMiniGamePanelProps) {
  const state = useGameStore((store) => store.state);
  const dispatch = useGameStore((store) => store.dispatch);
  const [feedback, setFeedback] = useState<MineRunFeedback | null>(null);

  const activeRun = getActiveMineRun(state);
  const mineCost = getMiniGameWorldEnergyCost("mine");
  const canStart = !state.miniGames.activeRun && state.world.energy.current >= mineCost;
  const tiles = useMemo(() => activeRun?.mine.board.tiles.slice().sort(sortTiles) ?? [], [activeRun?.mine.board.tiles]);
  const hp = activeRun?.runResources.hp;
  const runEnergy = activeRun?.runResources.energy;

  function startRun() {
    const result = startMineRun(useGameStore.getState().state, { nowMs: Date.now() });
    if (!result.ok) {
      toast.error(`Mine launch failed: ${result.reason}`);
      setFeedback({ kind: "failed", message: `Mine launch failed: ${result.reason}` });
      return;
    }

    dispatch(() => result.next);
    setFeedback({ kind: "info", message: "Mine run started." });
    toast.success("Mine run started");
  }

  function applyMineAction(result: MineActionResult) {
    if (!result.ok) {
      toast.error(`Mine action failed: ${result.reason}`);
      setFeedback({ kind: "failed", message: `Mine action failed: ${result.reason}` });
      return;
    }

    dispatch(() => result.next);

    if (result.failed) {
      setFeedback({
        kind: "failed",
        message: "Mine run failed. Temporary rewards were lost.",
        rewards: result.run.temporaryRewards,
      });
      toast.error("Mine run failed. Rewards lost.");
      return;
    }

    if (result.outcome === "resource") {
      setFeedback({ kind: "info", message: `Collected temporary reward: ${formatRewards(result.reward)}` });
    } else if (result.outcome === "enemy") {
      setFeedback({ kind: "info", message: "Enemy hit the run HP." });
    } else if (result.outcome === "stair") {
      setFeedback({ kind: "info", message: `Reached floor ${result.mine.currentFloor}.` });
    }
  }

  function actOnTile(tile: MineTile) {
    const currentState = useGameStore.getState().state;
    const result = tile.type === "rock" ? breakMineRockTile(currentState, tile.x, tile.y) : digMineSoilTile(currentState, tile.x, tile.y);
    applyMineAction(result);
  }

  function extractRun() {
    const result = extractMineRun(useGameStore.getState().state);
    if (!result.ok) {
      toast.error(`Extract failed: ${result.reason}`);
      setFeedback({ kind: "failed", message: `Extract failed: ${result.reason}` });
      return;
    }

    dispatch(() => result.next);
    setFeedback({
      kind: "success",
      message: "Extracted successfully. Rewards committed.",
      rewards: result.rewardsCommitted,
    });
    toast.success(`Extracted: ${formatRewards(result.rewardsCommitted)}`);
  }

  function abandonRun() {
    const currentRun = getActiveMineRun(useGameStore.getState().state);
    const lostRewards = currentRun?.temporaryRewards;
    const result = abandonMineRun(useGameStore.getState().state);
    if (!result.ok) {
      toast.error(`Abandon failed: ${result.reason}`);
      setFeedback({ kind: "failed", message: `Abandon failed: ${result.reason}` });
      return;
    }

    dispatch(() => result.next);
    setFeedback({
      kind: "failed",
      message: "Mine run abandoned. This counts as failure; rewards were lost.",
      rewards: lostRewards,
    });
    toast.error("Mine run abandoned. Rewards lost.");
  }

  const content = (
    <div className="space-y-4" data-testid="mine-mini-game-panel">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-amber-200/15 bg-black/35 p-3">
          <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-amber-100/70">World Energy</div>
          <div className="mt-1 font-ik-title text-lg text-amber-50">
            {Math.floor(state.world.energy.current)}/{Math.ceil(state.world.energy.max)}
          </div>
          <div className="font-ik-body text-xs text-muted-foreground">Cost {mineCost}</div>
        </div>
        <div className="rounded-md border border-amber-200/15 bg-black/35 p-3">
          <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-amber-100/70">Run Status</div>
          <div className="mt-1 font-ik-title text-lg text-amber-50">
            {activeRun ? activeRun.status : state.miniGames.lastRun?.kind === "mine" ? state.miniGames.lastRun.status : "idle"}
          </div>
          <div className="font-ik-body text-xs text-muted-foreground">Floor {activeRun?.mine.currentFloor ?? "-"}</div>
        </div>
        <div className="rounded-md border border-amber-200/15 bg-black/35 p-3">
          <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-amber-100/70">Run HP</div>
          <div className="mt-1 font-ik-title text-lg text-amber-50">{hp ? `${hp.current}/${hp.max}` : "-"}</div>
        </div>
        <div className="rounded-md border border-amber-200/15 bg-black/35 p-3">
          <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-amber-100/70">Run Energy</div>
          <div className="mt-1 font-ik-title text-lg text-amber-50">
            {runEnergy ? `${runEnergy.current}/${runEnergy.max}` : "-"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={!canStart} onClick={startRun} type="button">
          <Play className="mr-2 h-4 w-4" />
          Start Mine Run
        </Button>
        <Button disabled={!activeRun} onClick={extractRun} type="button" variant="secondary">
          <DoorOpen className="mr-2 h-4 w-4" />
          Extract
        </Button>
        <Button disabled={!activeRun} onClick={abandonRun} type="button" variant="destructive">
          <Flag className="mr-2 h-4 w-4" />
          Abandon - Failure
        </Button>
      </div>

      <div className="rounded-md border border-amber-200/15 bg-black/35 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <div className="font-ik-title text-sm text-amber-50">Temporary Rewards</div>
            <div className="font-ik-body text-xs text-muted-foreground">Committed only when extracting.</div>
          </div>
          <div className="font-ik-menu text-sm text-amber-50">{formatRewards(activeRun?.temporaryRewards)}</div>
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
          data-testid="mine-run-feedback"
        >
          <div>{feedback.message}</div>
          {feedback.rewards ? <div className="mt-1 text-xs opacity-80">Rewards: {formatRewards(feedback.rewards)}</div> : null}
        </div>
      ) : null}

      <div className="rounded-md border border-amber-200/15 bg-black/35 p-3">
        <div className="mb-3 flex items-center gap-2 font-ik-title text-sm text-amber-50">
          <Pickaxe className="h-4 w-4" />
          Mine Board
        </div>
        {activeRun ? (
          <div
            className="grid max-w-[30rem] gap-2"
            data-testid="mine-board"
            style={{ gridTemplateColumns: `repeat(${activeRun.mine.board.size}, minmax(0, 1fr))` }}
          >
            {tiles.map((tile) => (
              <button
                aria-label={`Mine tile ${tile.x},${tile.y} ${getTileLabel(tile)}`}
                className={cn(
                  "aspect-square min-h-16 rounded-md border p-1 text-center transition disabled:cursor-not-allowed disabled:opacity-60",
                  getTileClassName(tile),
                )}
                data-testid={`mine-tile-${tile.x}-${tile.y}`}
                disabled={tile.dug}
                key={`${tile.x},${tile.y}`}
                onClick={() => actOnTile(tile)}
                type="button"
              >
                <span className="flex h-full flex-col items-center justify-center gap-1">
                  {tile.type === "rock" ? <Hammer className="h-4 w-4 opacity-80" /> : <Pickaxe className="h-4 w-4 opacity-80" />}
                  <span className="font-ik-menu text-[0.68rem] uppercase leading-tight">{getTileLabel(tile)}</span>
                  <span className="max-w-full truncate font-ik-body text-[0.62rem] opacity-75">{getTileDetail(tile)}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid min-h-48 place-items-center rounded-md border border-dashed border-amber-200/20 bg-black/25 font-ik-body text-sm text-muted-foreground">
            Start a run to generate a board.
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mine Mini-Game</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
