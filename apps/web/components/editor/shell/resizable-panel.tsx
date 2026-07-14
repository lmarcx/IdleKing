"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

type PanelSide = "left" | "right";

function storageKey(side: PanelSide): string {
  return `aworlddreamt:editor:panel-width:${side}`;
}

function clampWidth(width: number): number {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));
}

/**
 * Resizable, collapsible side panel shared by the left (Project/Layers) and right (Inspector)
 * columns of the editor shell. Width is persisted to localStorage per side; collapse state is
 * session-only (not persisted -- kept simple per the V4 layout scope). Reads the stored width
 * after mount (not in the useState initializer) so server- and first-client-render markup match;
 * the panel briefly uses defaultWidth then snaps to the stored width, avoiding a hydration
 * mismatch instead of risking one for a slightly smoother first paint.
 */
export function ResizablePanel({
  children,
  collapsedLabel,
  defaultWidth,
  side,
}: {
  children: ReactNode;
  collapsedLabel: string;
  defaultWidth: number;
  side: PanelSide;
}) {
  const [width, setWidth] = useState(defaultWidth);
  const [collapsed, setCollapsed] = useState(false);
  const draggingRef = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey(side));
    const parsed = stored ? Number(stored) : NaN;
    if (Number.isFinite(parsed)) setWidth(clampWidth(parsed));
    // Only ever runs once per mount, to read the persisted value -- not a [side] effect, `side`
    // is fixed per rendered instance (one for "left", one for "right").
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey(side), String(width));
  }, [side, width]);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      if (!draggingRef.current) return;
      const delta = side === "left" ? event.movementX : -event.movementX;
      setWidth((current) => clampWidth(current + delta));
    }
    function onPointerUp() {
      draggingRef.current = false;
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [side]);

  if (collapsed) {
    return (
      <button
        aria-label={`Expand ${collapsedLabel}`}
        className="flex w-6 flex-none flex-col items-center gap-2 border-zinc-800 bg-zinc-950 py-2 text-zinc-500 hover:text-zinc-100"
        onClick={() => setCollapsed(false)}
        style={{ borderLeftWidth: side === "right" ? 1 : 0, borderRightWidth: side === "left" ? 1 : 0 }}
        type="button"
      >
        {side === "left" ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    );
  }

  return (
    <div className="relative flex min-h-0 min-w-0 flex-none" style={{ width }}>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
      <button
        aria-label={`Collapse ${collapsedLabel}`}
        className="absolute top-1 z-10 rounded p-1 text-zinc-600 hover:bg-zinc-900 hover:text-zinc-200"
        onClick={() => setCollapsed(true)}
        style={{ left: side === "left" ? undefined : 4, right: side === "left" ? 4 : undefined }}
        type="button"
      >
        {side === "left" ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      <div
        aria-hidden="true"
        className={cn("absolute top-0 z-10 h-full w-1 cursor-col-resize hover:bg-zinc-700", side === "left" ? "-right-0.5" : "-left-0.5")}
        onPointerDown={(event) => {
          event.preventDefault();
          draggingRef.current = true;
        }}
      />
    </div>
  );
}
