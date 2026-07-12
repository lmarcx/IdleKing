"use client";

import { StoryMapStage } from "@/components/game/story-map/story-map-stage";
import { TEST_MAP_01 } from "@idleking/game-core/level-editor";

/**
 * Isolated technical preview for StoryMapStage (Phase G4). Not linked from anywhere in the live
 * game -- no navigation, no Time Gate, no /game/story/levels/[levelId] route reads this.
 * Renders the same canonical TEST_MAP_01 already used by /game/custom-map/test_map_01, so the
 * two can be compared directly. Left-click near an enemy to attack it (HP shown above it).
 * Applies no progression: no completeDungeon, no save mutation, no rewards.
 */
export default function StoryMapStagePreviewPage() {
  return (
    <main className="mx-auto w-full max-w-[1800px] p-2 sm:p-3">
      <div className="mb-2 rounded-md border border-sky-200/30 bg-sky-500/10 px-3 py-2 font-ik-menu text-[0.65rem] uppercase tracking-wide text-sky-100">
        StoryMapStage combat preview — no progression or rewards
      </div>
      <StoryMapStage debug map={TEST_MAP_01} />
    </main>
  );
}
