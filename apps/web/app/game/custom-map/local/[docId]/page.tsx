"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { CustomMapPixiStage } from "@/components/game/custom-map/custom-map-pixi-stage";
import { loadDocument } from "@/lib/editor-document-store";
import { validatePlayableMap, type PlayableMap } from "@idleking/game-core/level-editor";

type LoadState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "invalid"; errors: readonly string[] }
  | { status: "ready"; map: PlayableMap };

/**
 * Playtest route for locally-saved editor documents (apps/web/lib/editor-document-store.ts).
 * Client-only: reads straight from this browser's localStorage, so it only works for documents
 * saved in the same browser/profile as the editor. Canon maps (e.g. test_map_01) keep using the
 * server-rendered /game/custom-map/[mapId] route instead.
 */
export default function LocalCustomMapPage() {
  const params = useParams<{ docId: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const docId = Array.isArray(params.docId) ? params.docId[0] : params.docId;
    if (!docId) {
      setState({ status: "not-found" });
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
    setState({ status: "ready", map: doc });
  }, [params.docId]);

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

  return <CustomMapPixiStage map={state.map} />;
}
