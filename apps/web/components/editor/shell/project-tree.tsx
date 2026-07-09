"use client";

import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { EditorMode } from "./editor-shared";

function PlaceholderItem({ label }: { label: string }) {
  return (
    <button
      className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left font-ik-body text-xs text-zinc-600 hover:text-zinc-400"
      onClick={() => toast(`${label} isn't wired in Editor V2 yet — planned for V3.`)}
      type="button"
    >
      <ChevronRight className="h-3 w-3 shrink-0" />
      {label}
    </button>
  );
}

function TreeSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div>
      <p className="mb-1 font-ik-menu text-[0.62rem] uppercase tracking-wide text-zinc-500">{title}</p>
      <div className="grid gap-0.5 pl-1">{children}</div>
    </div>
  );
}

export function ProjectTree({ mode, onModeChange }: { mode: EditorMode; onModeChange: (mode: EditorMode) => void }) {
  return (
    <div className="grid gap-3 border-b border-zinc-800 p-3">
      <p className="font-ik-menu text-[0.65rem] uppercase tracking-wide text-zinc-300">Project</p>

      <TreeSection title="Kingdom">
        <button
          aria-pressed={mode === "kingdom"}
          className={cn(
            "flex items-center gap-1.5 rounded px-2 py-1 text-left font-ik-body text-xs",
            mode === "kingdom" ? "bg-zinc-100 text-zinc-950" : "text-zinc-300 hover:text-zinc-100"
          )}
          onClick={() => onModeChange("kingdom")}
          type="button"
        >
          <ChevronRight className="h-3 w-3 shrink-0" />
          Kingdom Draft
        </button>
      </TreeSection>

      <TreeSection title="Modes">
        <PlaceholderItem label="Story" />
        <PlaceholderItem label="Expedition placeholder" />
      </TreeSection>

      <TreeSection title="Eras">
        <PlaceholderItem label="Era Funèbre" />
        <PlaceholderItem label="Era Glaciaire" />
      </TreeSection>

      <TreeSection title="Levels">
        <button
          aria-pressed={mode === "level"}
          className={cn(
            "flex items-center gap-1.5 rounded px-2 py-1 text-left font-ik-body text-xs",
            mode === "level" ? "bg-zinc-100 text-zinc-950" : "text-zinc-300 hover:text-zinc-100"
          )}
          onClick={() => onModeChange("level")}
          type="button"
        >
          <ChevronRight className="h-3 w-3 shrink-0" />
          Test Map 01
        </button>
      </TreeSection>

      <button
        aria-pressed={mode === "assets"}
        className={cn(
          "flex items-center gap-1.5 rounded px-2 py-1 text-left font-ik-menu text-[0.62rem] uppercase tracking-wide",
          mode === "assets" ? "bg-zinc-100 text-zinc-950" : "text-zinc-300 hover:text-zinc-100"
        )}
        onClick={() => onModeChange("assets")}
        type="button"
      >
        <ChevronRight className="h-3 w-3 shrink-0" />
        Assets
      </button>
    </div>
  );
}
