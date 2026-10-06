"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type GameOverlayProps = {
  children: ReactNode;
  contentClassName?: string;
  keepMounted?: boolean;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function GameOverlay({ children, contentClassName, keepMounted = false, onClose, open, title }: GameOverlayProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Escape") return;
      event.preventDefault();
      onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open && !keepMounted) return null;

  return (
    <div
      aria-hidden={!open}
      className={cn("ik-overlay-backdrop fixed inset-0 z-[900] bg-black/78 p-3 backdrop-blur-sm", open ? "grid" : "hidden")}
      role="presentation"
    >
      <div className="ik-overlay-panel mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col text-neutral-100">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b-2 border-neutral-800 px-4 py-3">
          <h2 className="font-ik-title text-xl font-semibold uppercase tracking-[0.08em] text-neutral-100">{title}</h2>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="hidden font-ik-menu text-[0.6rem] text-neutral-500 sm:inline">
              ESC
            </span>
            <button aria-label={`Fermer ${title}`} className="ik-overlay-close" onClick={onClose} type="button">
              <X aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={2.4} />
            </button>
          </div>
        </header>

        <div className={cn("min-h-0 flex-1 overflow-y-auto p-4", contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
