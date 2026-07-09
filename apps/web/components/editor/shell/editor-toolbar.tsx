"use client";

import { useRef } from "react";
import Link from "next/link";
import { Download, Eraser, FileJson, FolderOpen, Grid2X2, MousePointer2, Paintbrush, Plus, Save, Shapes, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EditorMode, EditorTool } from "./editor-shared";

const TOOLS = ["brush", "eraser", "select"] as const;
const MODES: readonly { id: EditorMode; label: string }[] = [
  { id: "level", label: "Level" },
  { id: "assets", label: "Assets" },
  { id: "kingdom", label: "Kingdom" },
];

function HiddenFileInput({ accept, label, onFile }: { accept: string; label: string; onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <Button onClick={() => inputRef.current?.click()} size="sm" variant="outline">
        <Upload className="mr-2 h-4 w-4" /> {label}
      </Button>
      <input
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
    </>
  );
}

export function EditorToolbar({
  lastSaveMessage,
  mode,
  onExportMap,
  onImportAsset,
  onImportMap,
  onLoadAssets,
  onLoadMap,
  onModeChange,
  onNewAsset,
  onNewMap,
  onSaveAsset,
  onSaveMap,
  onToolChange,
  tool,
}: {
  lastSaveMessage: string;
  mode: EditorMode;
  onExportMap: () => void;
  onImportAsset: (file: File) => void;
  onImportMap: (file: File) => void;
  onLoadAssets: () => void;
  onLoadMap: () => void;
  onModeChange: (mode: EditorMode) => void;
  onNewAsset: () => void;
  onNewMap: () => void;
  onSaveAsset: () => void;
  onSaveMap: () => void;
  onToolChange: (tool: EditorTool) => void;
  tool: EditorTool;
}) {
  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-black px-3 py-3">
      <div className="flex gap-1 rounded-md border border-zinc-800 p-0.5">
        {MODES.map((item) => (
          <button
            aria-pressed={mode === item.id}
            className={cn(
              "rounded px-3 py-1.5 font-ik-menu text-xs",
              mode === item.id ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-zinc-100"
            )}
            key={item.id}
            onClick={() => onModeChange(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-zinc-800" />

      {mode === "level" ? (
        <>
          <Button onClick={onNewMap} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" /> New Map
          </Button>
          <Button onClick={onSaveMap} size="sm" variant="outline">
            <Save className="mr-2 h-4 w-4" /> Save Map
          </Button>
          <Button onClick={onLoadMap} size="sm" variant="outline">
            <FolderOpen className="mr-2 h-4 w-4" /> Load Map
          </Button>
          <Button onClick={onExportMap} size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export JSON
          </Button>
          <HiddenFileInput accept=".json,.map.json" label="Import Map" onFile={onImportMap} />
          <Link
            className="font-ik-menu inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            href="/game/custom-map/test_map_01"
          >
            <Grid2X2 className="mr-2 h-4 w-4" /> Play/Test Map
          </Link>
        </>
      ) : mode === "assets" ? (
        <>
          <Button onClick={onSaveAsset} size="sm" variant="outline">
            <FileJson className="mr-2 h-4 w-4" /> Save Asset
          </Button>
          <Button onClick={onLoadAssets} size="sm" variant="ghost">
            Load Assets
          </Button>
          <HiddenFileInput accept=".json,.asset.json" label="Import Asset" onFile={onImportAsset} />
        </>
      ) : (
        <span className="font-ik-menu text-xs uppercase tracking-wide text-amber-200/70">
          Kingdom Draft — not used by live runtime yet
        </span>
      )}

      {mode !== "kingdom" ? (
        <Button onClick={onNewAsset} size="sm" variant="outline">
          <Shapes className="mr-2 h-4 w-4" /> New Asset
        </Button>
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        {mode === "level" ? (
          <div className="flex gap-1">
            {TOOLS.map((item) => {
              const Icon = item === "brush" ? Paintbrush : item === "eraser" ? Eraser : MousePointer2;
              return (
                <button
                  aria-label={item}
                  aria-pressed={tool === item}
                  className={cn(
                    "h-8 rounded-md border px-2.5",
                    tool === item ? "border-zinc-100 bg-zinc-100 text-zinc-950" : "border-zinc-800 bg-black text-zinc-400"
                  )}
                  key={item}
                  onClick={() => onToolChange(item)}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        ) : null}
        <span className="text-xs text-zinc-500">{lastSaveMessage}</span>
      </div>
    </header>
  );
}
