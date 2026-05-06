"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type KingdomOverlayProps = {
  children: ReactNode;
  contentClassName?: string;
  keepMounted?: boolean;
  onCloseAction: () => void;
  open: boolean;
  title: string;
};

export function KingdomOverlay({
  children,
  contentClassName,
  keepMounted = false,
  onCloseAction,
  open,
  title,
}: KingdomOverlayProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Escape") return;
      event.preventDefault();
      onCloseAction();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCloseAction, open]);

  if (!open && !keepMounted) return null;

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-[900] bg-black/72 p-3 backdrop-blur-sm",
        open ? "grid" : "hidden",
      )}
      role="presentation"
    >
      <div className="mx-auto flex h-full w-full max-w-7xl min-h-0 flex-col rounded-xl border border-amber-200/25 bg-zinc-950/96 text-amber-50 shadow-[0_26px_90px_rgba(0,0,0,0.62)]">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-amber-200/15 px-4 py-3">
          <h2 className="font-ik-title text-xl font-semibold text-amber-50">{title}</h2>
          <button
            aria-label={`Close ${title}`}
            className="grid h-9 w-9 place-items-center rounded-md border border-amber-200/25 bg-black/35 font-ik-menu text-lg leading-none text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/14"
            onClick={onCloseAction}
            type="button"
          >
            X
          </button>
        </header>

        <div className={cn("min-h-0 flex-1 overflow-y-auto p-4", contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
