"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { StoryLevelExplorer } from "@/components/game/story-exploration/story-level-explorer";
import { StoryMapStage } from "@/components/game/story-map/story-map-stage";
import { loadDocument } from "@/lib/editor-document-store";
import {
  getDungeonTheme,
  getLevelScript,
  getStoryDungeonDefinition,
  getStoryMapRuntimeErrors,
  playableMapToDungeonLayout,
  type DungeonLayout,
} from "@idleking/game-core";
import { validatePlayableMap, type PlayableMap, type StoryMapStageResult } from "@idleking/game-core/level-editor";

type LoadState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "invalid"; errors: readonly string[] }
  | { status: "ready"; map: PlayableMap; story?: { dungeonId: string; title: string; layout: DungeonLayout } };

/** A draft linked to a Story dungeon (map.id = dungeonId) is played by the real Story explorer. */
function toStoryPreview(map: PlayableMap): { errors: string[]; story?: { dungeonId: string; title: string; layout: DungeonLayout } } {
  const dungeon = getStoryDungeonDefinition(map.id);
  if (!dungeon) return { errors: [] };
  const layout = playableMapToDungeonLayout(map, dungeon.id, {
    theme: getDungeonTheme(dungeon.id),
    beatOrder: getLevelScript(dungeon.id)?.beats.map((beat) => beat.id),
  });
  const errors = getStoryMapRuntimeErrors(dungeon.id, layout);
  return { errors, story: errors.length === 0 ? { dungeonId: dungeon.id, title: dungeon.title, layout } : undefined };
}

/**
 * Dry-run Story Map preview for locally-saved editor documents: what the editor's Play/Test
 * button launches for a Story-dungeon-linked draft. The draft is played by the same Story
 * explorer as the live route (combat, skills, boss patterns, beats, gates), in dry-run mode:
 * no completeDungeon, no loot written to the save. A map that is not a Story dungeon falls back
 * to the bare StoryMapStage.
 */
export default function LocalStoryMapPreviewPage() {
  const params = useParams<{ docId: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  // React StrictMode double-invokes this effect in dev; loadDocument() parses fresh JSON on every
  // call, so without this cache the second invocation would hand StoryMapStage a structurally
  // identical but reference-different `map`, which -- since its own effect is keyed on [map] --
  // tears down and remounts the PixiJS app a second time before the first mount's async
  // app.init() has settled. Caching by docId keeps `map` identity stable across the double-invoke.
  const loadedMapRef = useRef<Extract<LoadState, { status: "ready" }> & { docId: string } | null>(null);

  useEffect(() => {
    const docId = Array.isArray(params.docId) ? params.docId[0] : params.docId;
    if (!docId) {
      setState({ status: "not-found" });
      return;
    }
    const cached = loadedMapRef.current;
    if (cached && cached.docId === docId) {
      setState(cached);
      return;
    }
    const doc = loadDocument<PlayableMap>("playable_map", docId);
    if (!doc) {
      setState({ status: "not-found" });
      return;
    }
    const validation = validatePlayableMap(doc);
    if (!validation.ok) {
      setState({ status: "invalid", errors: validation.errors });
      return;
    }
    const preview = toStoryPreview(doc);
    if (preview.errors.length > 0) {
      setState({ status: "invalid", errors: preview.errors });
      return;
    }
    const ready = { status: "ready" as const, map: doc, story: preview.story };
    loadedMapRef.current = { ...ready, docId };
    setState(ready);
  }, [params.docId]);

  function handleStageCompleted(result: StoryMapStageResult) {
    toast.success(`Stage completed (dry run) — objective: ${result.objectiveType}. No progression applied.`);
  }

  if (state.status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070707] font-ik-body text-sm text-zinc-500">
        Loading local document…
      </div>
    );
  }

  if (state.status === "not-found") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070707] p-6 text-center text-zinc-300">
        <div>
          <p className="font-ik-title text-lg text-zinc-100">Local document not found</p>
          <p className="mt-2 max-w-sm font-ik-body text-sm text-zinc-500">
            This document isn&apos;t saved in this browser. Open it in the editor and use Save (or Play/Test again) first.
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "invalid") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070707] p-6 text-center text-zinc-300">
        <div>
          <p className="font-ik-title text-lg text-zinc-100">Invalid local document</p>
          <ul className="mt-2 max-w-sm font-ik-body text-sm text-zinc-500">
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (state.story) {
    return (
      <main className="mx-auto w-full max-w-[1800px] p-2 sm:p-3">
        <div className="mb-2 rounded-md border border-sky-200/30 bg-sky-500/10 px-3 py-2 font-ik-menu text-[0.65rem] uppercase tracking-wide text-sky-100">
          Play/Test — {state.story.title} — dry run — no progression or rewards
        </div>
        <StoryLevelExplorer
          dryRunLayout={state.story.layout}
          dungeonId={state.story.dungeonId}
          level={{ id: state.story.dungeonId, recommendedPower: 0, title: state.story.title }}
          returnHref="/editor"
          returnLabel="Retour a l'editeur"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1800px] p-2 sm:p-3">
      <div className="mb-2 rounded-md border border-sky-200/30 bg-sky-500/10 px-3 py-2 font-ik-menu text-[0.65rem] uppercase tracking-wide text-sky-100">
        Play/Test Story Map — dry run — no progression or rewards
      </div>
      <StoryMapStage dryRun map={state.map} onStageCompleted={handleStageCompleted} />
    </main>
  );
}
