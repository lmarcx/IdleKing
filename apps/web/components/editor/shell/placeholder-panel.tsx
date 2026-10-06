"use client";

import type { PlaceholderDocumentInfo } from "./editor-shared";

export function PlaceholderPanel({ doc }: { doc: PlaceholderDocumentInfo | null }) {
  return (
    <section className="grid min-h-0 flex-1 place-items-center bg-[#0b0b0b] p-8">
      <div className="max-w-md space-y-3 rounded-md border border-zinc-800 bg-zinc-950 p-6 text-center">
        <p className="font-ik-menu text-[0.65rem] uppercase tracking-wide text-amber-200/70">Not available in Editor V2</p>
        <h2 className="font-ik-title text-xl text-zinc-100">{doc?.title ?? "Placeholder"}</h2>
        <p className="font-ik-body text-sm text-zinc-400">
          {doc?.note ?? "This section isn't wired in Editor V2 yet."}
        </p>
      </div>
    </section>
  );
}
