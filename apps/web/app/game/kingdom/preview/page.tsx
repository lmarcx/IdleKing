"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { KingdomHubStage } from "@/components/game/kingdom/kingdom-hub-stage";
import { loadDocument } from "@/lib/editor-document-store";
import { validateKingdomStageDefinition, type KingdomStageDefinition } from "@idleking/game-core/level-editor";

const KINGDOM_STAGE_DOCUMENT_ID = "kingdom_stage";

type LoadState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "invalid"; errors: readonly string[] }
  | { status: "ready"; stage: KingdomStageDefinition };

/**
 * Play/Test route for the locally-saved Kingdom Stage document (apps/web/lib/editor-document-store.ts).
 * Client-only: reads straight from this browser's localStorage, so it only works for a document
 * saved in the same browser/profile as the editor. Reuses KingdomHubStage as-is via stageOverride --
 * no separate preview component, no duplicated Kingdom rendering/interaction logic.
 * /game/kingdom is untouched and always reads the canonical KINGDOM_STAGE_DEFINITION.
 */
export default function KingdomStagePreviewPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const doc = loadDocument<KingdomStageDefinition>("kingdom_stage", KINGDOM_STAGE_DOCUMENT_ID);
    if (!doc) {
      setState({ status: "not-found" });
      return;
    }
    let validation;
    try {
      validation = validateKingdomStageDefinition(doc);
    } catch (error) {
      setState({
        status: "invalid",
        errors: [error instanceof Error ? error.message : "Unknown validation error"],
      });
      return;
    }
    if (!validation.ok) {
      setState({ status: "invalid", errors: validation.errors });
      return;
    }
    setState({ status: "ready", stage: doc });
  }, []);

  if (state.status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070707] font-ik-body text-sm text-zinc-500">
        Loading local Kingdom Stage…
      </div>
    );
  }

  if (state.status === "not-found") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070707] p-6 text-center text-zinc-300">
        <div>
          <p className="font-ik-title text-lg text-zinc-100">No local Kingdom Stage document found</p>
          <p className="mt-2 max-w-sm font-ik-body text-sm text-zinc-500">
            This browser has no saved Kingdom Stage document. Open the editor, select Kingdom Stage, and use Save
            (or Play/Test again) first.
          </p>
          <Link className="mt-4 inline-block rounded-md border border-zinc-800 px-3 py-2 text-sm hover:border-zinc-200" href="/editor">
            Back to editor
          </Link>
        </div>
      </div>
    );
  }

  if (state.status === "invalid") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070707] p-6 text-center text-zinc-300">
        <div>
          <p className="font-ik-title text-lg text-zinc-100">Invalid local Kingdom Stage document</p>
          <ul className="mt-2 max-w-sm font-ik-body text-sm text-zinc-500">
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          <Link className="mt-4 inline-block rounded-md border border-zinc-800 px-3 py-2 text-sm hover:border-zinc-200" href="/editor">
            Back to editor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1800px] p-2 sm:p-3">
      <div className="mb-2 flex items-center justify-between rounded-md border border-amber-200/30 bg-amber-500/10 px-3 py-2 font-ik-menu text-[0.65rem] uppercase tracking-wide text-amber-100">
        <span>Previewing local Kingdom Stage — not committed as canon</span>
        <Link className="rounded border border-amber-200/40 px-2 py-1 text-amber-100 hover:bg-amber-500/10" href="/editor">
          Back to editor
        </Link>
      </div>
      <KingdomHubStage stageOverride={state.stage} />
    </main>
  );
}
