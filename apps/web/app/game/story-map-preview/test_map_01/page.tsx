"use client";

import { toast } from "sonner";

import { StoryMapStage } from "@/components/game/story-map/story-map-stage";
import { TEST_MAP_01 } from "@idleking/game-core/level-editor";
import type { StoryMapStageResult } from "@idleking/game-core/level-editor";

/**
 * Isolated technical preview for StoryMapStage (Phase G5). Not linked from anywhere in the live
 * game -- no navigation, no Time Gate, no /game/story/levels/[levelId] route reads this.
 * Renders the same canonical TEST_MAP_01 already used by /game/custom-map/test_map_01, so the
 * two can be compared directly. Left-click near an enemy to attack it (HP shown above it).
 *
 * onStageCompleted here only logs a toast -- this page is the "wrapper" in the Stage-detects /
 * Wrapper-decides split, and a dry-run preview wrapper's job is to show the result, never to
 * apply it. Applies no progression: no completeDungeon, no save mutation, no rewards.
 */
export default function StoryMapStagePreviewPage() {
  function handleStageCompleted(result: StoryMapStageResult) {
    toast.success(`Stage completed (dry run) — objective: ${result.objectiveType}. No progression applied.`);
  }

  return (
    <main className="mx-auto w-full max-w-[1800px] p-2 sm:p-3">
      <div className="mb-2 rounded-md border border-sky-200/30 bg-sky-500/10 px-3 py-2 font-ik-menu text-[0.65rem] uppercase tracking-wide text-sky-100">
        StoryMapStage combat preview — no progression or rewards
      </div>
      <StoryMapStage debug dryRun map={TEST_MAP_01} onStageCompleted={handleStageCompleted} />
    </main>
  );
}
