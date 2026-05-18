"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChefHat, Flag, Play, Target, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEV_MODE } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import {
  failKitchenRun,
  finalizeKitchenRun,
  getMiniGameWorldEnergyCost,
  getQty,
  hasAtLeast,
  hitKitchenResourceTarget,
  KITCHEN_RECIPES,
  startKitchenRun,
  submitKitchenPatternInput,
  type ActiveKitchenRunState,
  type KitchenPatternInput,
  type KitchenRecipe,
  type KitchenRecipeId,
  type KitchenResourceTarget,
  type MiniGameTemporaryItemReward,
  type ResourceId,
  type ResourceStock,
} from "@idleking/game-core";
import { addQty } from "@idleking/game-core/resources/types.js";

type KitchenRunFeedback = {
  kind: "success" | "failed" | "info";
  message: string;
  itemRewards?: MiniGameTemporaryItemReward[];
};

type KitchenMiniGamePanelProps = {
  embedded?: boolean;
};

const PATTERN_INPUTS: KitchenPatternInput[] = ["up", "right", "down", "left"];
const DEV_STARTER_INGREDIENTS: ResourceStock = KITCHEN_RECIPES.reduce<ResourceStock>((stock, recipe) => {
  const next = { ...stock };
  for (const [resourceId, amount] of Object.entries(recipe.ingredientCosts)) {
    const id = resourceId as ResourceId;
    next[id] = Math.max(0, Math.floor(next[id] ?? 0)) + Math.max(0, Math.floor(amount ?? 0));
  }
  return next;
}, {});

function formatResourceLabel(resourceId: ResourceId) {
  return resourceId.replaceAll("_", " ");
}

function formatStock(stock: ResourceStock | undefined) {
  const entries = Object.entries(stock ?? {}).filter(([, amount]) => Math.max(0, Math.floor(amount ?? 0)) > 0);
  if (entries.length === 0) return "None";
  return entries.map(([resourceId, amount]) => `${formatResourceLabel(resourceId as ResourceId)} x${amount}`).join(", ");
}

function formatItemRewards(rewards: MiniGameTemporaryItemReward[] | undefined) {
  if (!rewards || rewards.length === 0) return "None";
  return rewards.map((reward) => `${reward.name} q${reward.quality} x${reward.quantity}`).join(", ");
}

function getActiveKitchenRun(state: ReturnType<typeof useGameStore.getState>["state"]): ActiveKitchenRunState | null {
  const activeRun = state.miniGames.activeRun;
  if (activeRun?.status === "running" && activeRun.kind === "kitchen" && activeRun.kitchen) {
    return activeRun as ActiveKitchenRunState;
  }
  return null;
}

function getLastKitchenRun(state: ReturnType<typeof useGameStore.getState>["state"]): ActiveKitchenRunState | null {
  const lastRun = state.miniGames.lastRun;
  if (lastRun?.kind === "kitchen" && lastRun.kitchen) {
    return lastRun as ActiveKitchenRunState;
  }
  return null;
}

function getPatternLabel(input: KitchenPatternInput) {
  if (input === "up") return "Up";
  if (input === "down") return "Down";
  if (input === "left") return "Left";
  return "Right";
}

function getTargetClassName(target: KitchenResourceTarget) {
  if (target.resolved) return "border-zinc-700 bg-zinc-900/70 text-zinc-400";
  if (target.isRecipeResource) return "border-emerald-300/45 bg-emerald-500/14 text-emerald-50 hover:border-emerald-200";
  return "border-rose-300/45 bg-rose-500/14 text-rose-50 hover:border-rose-200";
}

export function KitchenMiniGamePanel({ embedded = false }: KitchenMiniGamePanelProps) {
  const state = useGameStore((store) => store.state);
  const hydrated = useGameStore((store) => store.hydrated);
  const dispatch = useGameStore((store) => store.dispatch);
  const [selectedRecipeId, setSelectedRecipeId] = useState<KitchenRecipeId>(KITCHEN_RECIPES[0]?.id ?? "STEW");
  const [feedback, setFeedback] = useState<KitchenRunFeedback | null>(null);

  const activeRun = getActiveKitchenRun(state);
  const lastKitchenRun = getLastKitchenRun(state);
  const selectedRecipe = useMemo(
    () => KITCHEN_RECIPES.find((recipe) => recipe.id === selectedRecipeId) ?? KITCHEN_RECIPES[0],
    [selectedRecipeId],
  );
  const kitchenCost = getMiniGameWorldEnergyCost("kitchen");
  const hasIngredients = selectedRecipe ? hasAtLeast(state.resources, selectedRecipe.ingredientCosts) : false;
  const canStart =
    hydrated && Boolean(selectedRecipe) && !state.miniGames.activeRun && state.world.energy.current >= kitchenCost && hasIngredients;
  const currentQuality = activeRun?.kitchen.successPoints ?? lastKitchenRun?.kitchen.quality ?? 0;
  const status = activeRun ? activeRun.status : lastKitchenRun?.status ?? "idle";
  const finalReward = lastKitchenRun?.status === "success" ? lastKitchenRun.temporaryItemRewards : undefined;

  useEffect(() => {
    if (!hydrated || !activeRun) return;

    function handleKeyDown(event: KeyboardEvent) {
      const keyMap: Partial<Record<string, KitchenPatternInput>> = {
        ArrowUp: "up",
        ArrowRight: "right",
        ArrowDown: "down",
        ArrowLeft: "left",
      };
      const input = keyMap[event.key];
      if (!input) return;

      event.preventDefault();
      submitPatternInput(input);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeRun?.id, hydrated]);

  function startRun(recipe: KitchenRecipe) {
    if (!hydrated) {
      setFeedback({ kind: "info", message: "Loading save. Kitchen actions will be available shortly." });
      return;
    }

    const result = startKitchenRun(useGameStore.getState().state, recipe.id, { nowMs: Date.now() });
    if (!result.ok) {
      toast.error(`Kitchen launch failed: ${result.reason}`);
      setFeedback({ kind: "failed", message: `Kitchen launch failed: ${result.reason}` });
      return;
    }

    dispatch(() => result.next);
    setFeedback({ kind: "info", message: `${recipe.name} cooking started.` });
    toast.success(`${recipe.name} cooking started`);
  }

  function submitPatternInput(input: KitchenPatternInput) {
    const result = submitKitchenPatternInput(useGameStore.getState().state, input);
    if (!result.ok) {
      toast.error(`Kitchen pattern failed: ${result.reason}`);
      setFeedback({ kind: "failed", message: `Kitchen pattern failed: ${result.reason}` });
      return;
    }

    dispatch(() => result.next);

    if (result.failed) {
      setFeedback({ kind: "failed", message: "Kitchen run failed. Ingredients and rewards were lost." });
      toast.error("Kitchen run failed. Rewards lost.");
      return;
    }

    setFeedback({
      kind: "info",
      message: result.accepted
        ? result.patternCompleted
          ? "Pattern completed."
          : "Correct input."
        : "Wrong input. Success points reduced.",
    });
  }

  function hitTarget(target: KitchenResourceTarget) {
    const result = hitKitchenResourceTarget(useGameStore.getState().state, target.id);
    if (!result.ok) {
      toast.error(`Kitchen target failed: ${result.reason}`);
      setFeedback({ kind: "failed", message: `Kitchen target failed: ${result.reason}` });
      return;
    }

    dispatch(() => result.next);

    if (result.failed) {
      setFeedback({ kind: "failed", message: "Kitchen run failed. Ingredients and rewards were lost." });
      toast.error("Kitchen run failed. Rewards lost.");
      return;
    }

    setFeedback({
      kind: "info",
      message: result.target.isRecipeResource ? "Recipe resource hit. No quality gain." : "Wrong resource cleared.",
    });
  }

  function finalizeRun() {
    const result = finalizeKitchenRun(useGameStore.getState().state);
    if (!result.ok) {
      toast.error(`Finalize failed: ${result.reason}`);
      setFeedback({ kind: "failed", message: `Finalize failed: ${result.reason}` });
      return;
    }

    dispatch(() => result.next);
    setFeedback({
      kind: "success",
      message: `Cooking finalized at quality ${result.quality}.`,
      itemRewards: result.itemRewardsCommitted,
    });
    toast.success(`Cooking finalized: ${formatItemRewards(result.itemRewardsCommitted)}`);
  }

  function failRun() {
    const result = failKitchenRun(useGameStore.getState().state);
    if (!result.ok) {
      toast.error(`Fail failed: ${result.reason}`);
      setFeedback({ kind: "failed", message: `Fail failed: ${result.reason}` });
      return;
    }

    dispatch(() => result.next);
    setFeedback({ kind: "failed", message: "Kitchen run failed. Ingredients and rewards were lost." });
    toast.error("Kitchen run failed. Rewards lost.");
  }

  function grantDevStarterIngredients() {
    if (!DEV_MODE) return;

    let granted: ResourceStock = {};
    dispatch((current) => {
      let nextResources = current.resources;
      granted = {};

      for (const [resourceId, requiredAmount] of Object.entries(DEV_STARTER_INGREDIENTS)) {
        const id = resourceId as ResourceId;
        const missing = Math.max(0, Math.floor(requiredAmount ?? 0) - getQty(current.resources, id));
        if (missing <= 0) continue;

        nextResources = addQty(nextResources, id, missing);
        granted = addQty(granted, id, missing);
      }

      return {
        ...current,
        resources: nextResources,
      };
    });

    const grantedLabel = formatStock(granted);
    setFeedback({ kind: "info", message: `DEV ONLY: granted Kitchen starter ingredients (${grantedLabel}).` });
    toast.success(`DEV Kitchen ingredients: ${grantedLabel}`);
  }

  const content = (
    <div className="space-y-4" data-testid="kitchen-mini-game-panel">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-orange-200/15 bg-black/35 p-3">
          <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-orange-100/70">World Energy</div>
          <div className="mt-1 font-ik-title text-lg text-orange-50">
            {Math.floor(state.world.energy.current)}/{Math.ceil(state.world.energy.max)}
          </div>
          <div className="font-ik-body text-xs text-muted-foreground">Cost {kitchenCost}</div>
        </div>
        <div className="rounded-md border border-orange-200/15 bg-black/35 p-3">
          <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-orange-100/70">Run Status</div>
          <div className="mt-1 font-ik-title text-lg text-orange-50">{status}</div>
          <div className="font-ik-body text-xs text-muted-foreground">{hydrated ? "Save loaded" : "Loading save..."}</div>
        </div>
        <div className="rounded-md border border-orange-200/15 bg-black/35 p-3">
          <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-orange-100/70">Selected Recipe</div>
          <div className="mt-1 font-ik-title text-lg text-orange-50">{activeRun?.kitchen.recipe.name ?? selectedRecipe?.name ?? "-"}</div>
          <div className="font-ik-body text-xs text-muted-foreground">
            {activeRun?.kitchen.recipe.rarity ?? selectedRecipe?.rarity ?? "-"}
          </div>
        </div>
        <div className="rounded-md border border-orange-200/15 bg-black/35 p-3">
          <div className="font-ik-menu text-xs uppercase tracking-[0.14em] text-orange-100/70">Quality</div>
          <div className="mt-1 font-ik-title text-lg text-orange-50">{currentQuality}</div>
          <div className="font-ik-body text-xs text-muted-foreground">Success points remaining</div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {KITCHEN_RECIPES.map((recipe) => {
          const selected = recipe.id === selectedRecipeId;
          const recipeAvailable = hasAtLeast(state.resources, recipe.ingredientCosts);

          return (
            <button
              className={cn(
                "rounded-md border p-3 text-left transition",
                selected ? "border-orange-200 bg-orange-500/14 text-orange-50" : "border-orange-200/15 bg-black/35 text-orange-50",
              )}
              disabled={Boolean(activeRun)}
              key={recipe.id}
              onClick={() => setSelectedRecipeId(recipe.id)}
              type="button"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-ik-title text-sm">{recipe.name}</span>
                <span className={cn("font-ik-body text-xs", recipeAvailable ? "text-emerald-200" : "text-rose-200")}>
                  {recipeAvailable ? "Ready" : "Missing ingredients"}
                </span>
              </span>
              <span className="mt-2 block font-ik-body text-xs text-muted-foreground">
                Cost: {formatStock(recipe.ingredientCosts)} - Complexity {recipe.patternComplexity}
              </span>
              <span className="mt-1 block font-ik-body text-xs text-muted-foreground">
                Stock:{" "}
                {Object.keys(recipe.ingredientCosts)
                  .map((resourceId) => `${formatResourceLabel(resourceId as ResourceId)} ${getQty(state.resources, resourceId as ResourceId)}`)
                  .join(", ")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button data-testid="kitchen-start-run" disabled={!canStart || !selectedRecipe} onClick={() => selectedRecipe && startRun(selectedRecipe)} type="button">
          <Play className="mr-2 h-4 w-4" />
          Start Kitchen Run
        </Button>
        {DEV_MODE ? (
          <Button data-testid="kitchen-dev-grant-ingredients" onClick={grantDevStarterIngredients} type="button" variant="outline">
            DEV ONLY: Grant Starter Ingredients
          </Button>
        ) : null}
        <Button disabled={!hydrated || !activeRun} onClick={finalizeRun} type="button" variant="secondary">
          <Check className="mr-2 h-4 w-4" />
          Finalize Cooking
        </Button>
        <Button disabled={!hydrated || !activeRun} onClick={failRun} type="button" variant="destructive">
          <Flag className="mr-2 h-4 w-4" />
          Fail - Lose Ingredients
        </Button>
      </div>

      <div className="rounded-md border border-orange-200/15 bg-black/35 p-3">
        <div className="mb-3 flex items-center gap-2 font-ik-title text-sm text-orange-50">
          <ChefHat className="h-4 w-4" />
          Pattern
        </div>
        {activeRun ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2" data-testid="kitchen-pattern">
              {activeRun.kitchen.currentPattern.map((input, index) => (
                <span
                  className={cn(
                    "rounded-md border px-3 py-2 font-ik-menu text-xs uppercase",
                    index < activeRun.kitchen.currentPatternProgress &&
                      "border-emerald-300/40 bg-emerald-500/14 text-emerald-50",
                    index === activeRun.kitchen.currentPatternProgress &&
                      "border-orange-300/55 bg-orange-500/18 text-orange-50",
                    index > activeRun.kitchen.currentPatternProgress && "border-zinc-700 bg-zinc-900/70 text-zinc-300",
                  )}
                  key={`${input}-${index}`}
                >
                  {getPatternLabel(input)}
                </span>
              ))}
            </div>
            <div className="font-ik-body text-xs text-muted-foreground">
              Progress {activeRun.kitchen.currentPatternProgress}/{activeRun.kitchen.currentPattern.length}
            </div>
            <div className="flex flex-wrap gap-2">
              {PATTERN_INPUTS.map((input) => (
                <Button data-testid={`kitchen-pattern-${input}`} key={input} onClick={() => submitPatternInput(input)} type="button" variant="outline">
                  {getPatternLabel(input)}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid min-h-24 place-items-center rounded-md border border-dashed border-orange-200/20 bg-black/25 font-ik-body text-sm text-muted-foreground">
            Start a run to reveal a pattern.
          </div>
        )}
      </div>

      <div className="rounded-md border border-orange-200/15 bg-black/35 p-3">
        <div className="mb-3 flex items-center gap-2 font-ik-title text-sm text-orange-50">
          <Target className="h-4 w-4" />
          Resource Targets
        </div>
        {activeRun?.kitchen.resourceTargets?.length ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="kitchen-resource-targets">
            {activeRun.kitchen.resourceTargets.map((target) => (
              <button
                className={cn("rounded-md border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60", getTargetClassName(target))}
                data-testid={`kitchen-target-${target.id}`}
                disabled={!hydrated || target.resolved}
                key={target.id}
                onClick={() => hitTarget(target)}
                type="button"
              >
                <span className="flex items-center gap-2 font-ik-menu text-xs uppercase tracking-[0.12em]">
                  {target.isRecipeResource ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {formatResourceLabel(target.resourceId)}
                </span>
                <span className="mt-2 block font-ik-body text-xs opacity-75">
                  {target.resolved ? "Resolved" : target.isRecipeResource ? "Recipe resource" : "Wrong resource"}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid min-h-24 place-items-center rounded-md border border-dashed border-orange-200/20 bg-black/25 font-ik-body text-sm text-muted-foreground">
            No active resource targets.
          </div>
        )}
      </div>

      <div className="rounded-md border border-orange-200/15 bg-black/35 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <div className="font-ik-title text-sm text-orange-50">Reward</div>
            <div className="font-ik-body text-xs text-muted-foreground">Consumable effects are not active yet.</div>
          </div>
          <div className="font-ik-menu text-sm text-orange-50">
            {activeRun ? `Potential quality ${activeRun.kitchen.successPoints}` : formatItemRewards(finalReward)}
          </div>
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
          data-testid="kitchen-run-feedback"
          role="status"
        >
          <div>{feedback.message}</div>
          {feedback.itemRewards ? <div className="mt-1 text-xs opacity-80">Reward: {formatItemRewards(feedback.itemRewards)}</div> : null}
        </div>
      ) : null}
    </div>
  );

  if (embedded) return content;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kitchen Mini-Game</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
