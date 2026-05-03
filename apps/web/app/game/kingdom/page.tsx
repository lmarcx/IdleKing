"use client";

import Link from "next/link";

export default function KingdomPage() {
  return (
    <main className="space-y-5 p-6">
      <div>
        <h1 className="font-ik-title text-3xl font-semibold text-foreground">Kingdom</h1>
      </div>

      <div className="grid max-w-lg gap-3 sm:grid-cols-2">
        <span title="Coming soon">
          <button
            className="h-12 w-full rounded-md border border-border/70 bg-muted/35 px-4 font-ik-menu text-sm text-muted-foreground opacity-70"
            disabled
            type="button"
          >
            Online Mode
          </button>
        </span>

        <Link
          className="grid h-12 place-items-center rounded-md border border-amber-300/45 bg-amber-500/18 px-4 font-ik-menu text-sm text-amber-50 transition hover:border-amber-200 hover:bg-amber-500/24 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/50"
          href="/game/kingdom/offline"
          role="button"
        >
          Offline Mode
        </Link>
      </div>
    </main>
  );
}
