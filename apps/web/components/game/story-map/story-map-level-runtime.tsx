"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { useGameStore } from "@/store/game-store";
import { completeDungeon, type RewardBundle } from "@idleking/game-core";
import {
  shouldApplyStoryMapCompletion,
  type PlayableMap,
  type StoryMapStageResult,
} from "@idleking/game-core/level-editor";

import { StoryMapStage } from "./story-map-stage";

type DisplayRewards = Array<{ id: string; amount: number }>;

function rewardBundleToDisplayRewards(rewards: RewardBundle): DisplayRewards {
  const entries: DisplayRewards = [];
  for (const reward of rewards.resources ?? []) entries.push({ amount: reward.amount, id: reward.resourceId });
  for (const reward of rewards.currencies ?? []) entries.push({ amount: reward.amount, id: reward.currencyId });
  return entries;
}

function CompletionPanel({
  alreadyCompleted,
  onReturn,
  rewards,
}: {
  alreadyCompleted: boolean;
  onReturn: () => void;
  rewards: DisplayRewards;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-black/58 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-amber-200/35 bg-zinc-950/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
        <p className="font-ik-menu text-xs uppercase tracking-[0.22em] text-emerald-200">
          {alreadyCompleted ? "Objectifs deja valides" : "Objectifs valides"}
        </p>
        <h2 className="mt-2 font-ik-title text-2xl font-semibold text-amber-50">Donjon termine</h2>
        {rewards.length > 0 ? (
          <div className="mt-5 rounded-md border border-amber-200/18 bg-black/45 p-4 text-left">
            <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-muted-foreground">Recompenses</p>
            <div className="mt-3 grid gap-2 font-ik-body text-sm text-amber-50">
              {rewards.map((reward) => (
                <div className="flex items-center justify-between gap-3" key={reward.id}>
                  <span>{reward.id}</span>
                  <span className="font-ik-menu text-emerald-200">+{reward.amount}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
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

export type StoryMapLevelRuntimeProps = {
  dungeonId: string;
  map: PlayableMap;
};

/**
 * Canonical Story runtime wrapper (Phase G6): renders StoryMapStage, which only detects victory,
 * and applies the SAME completeDungeon() flow story-level-explorer.tsx already uses for every
 * other Story dungeon -- no reward/flag/progression logic is computed here or in StoryMapStage.
 * This is the "Wrapper decides" half of the Stage-detects/Wrapper-decides split.
 */
export function StoryMapLevelRuntime({ dungeonId, map }: StoryMapLevelRuntimeProps) {
  const router = useRouter();
  const dispatch = useGameStore((store) => store.dispatch);
  const hasCompletedDungeon = useGameStore((store) => store.state.story.completedDungeonIds.has(dungeonId));
  const [completion, setCompletion] = useState<{ alreadyCompleted: boolean; rewards: DisplayRewards } | null>(() =>
    hasCompletedDungeon ? { alreadyCompleted: true, rewards: [] } : null,
  );
  const appliedRef = useRef(false);

  const handleStageCompleted = useCallback(
    (result: StoryMapStageResult) => {
      if (appliedRef.current) return;
      if (!shouldApplyStoryMapCompletion(result, dungeonId)) return;
      appliedRef.current = true;

      const outcome = completeDungeon(useGameStore.getState().state, dungeonId);
      if (!outcome.ok) return;

      dispatch(() => outcome.next);
      setCompletion({ alreadyCompleted: false, rewards: rewardBundleToDisplayRewards(outcome.rewards) });
    },
    [dispatch, dungeonId],
  );

  return (
    <section className="relative h-[calc(100vh-2rem)] min-h-[44rem] overflow-hidden rounded-xl border border-amber-200/25 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.48)]">
      {/* allowReset is off here: the canonical live wrapper must never let a player instantly
          heal-reset a real dungeon attempt for free (see StoryMapStageProps' doc comment). The
          dry-run previews (editor Play/Test, the test_map_01 technical preview) don't set this
          prop, so they keep the default (true). */}
      <StoryMapStage allowReset={false} map={map} onStageCompleted={handleStageCompleted} />
      {completion ? (
        <CompletionPanel
          alreadyCompleted={completion.alreadyCompleted}
          onReturn={() => router.push("/game/kingdom")}
          rewards={completion.rewards}
        />
      ) : null}
    </section>
  );
}
