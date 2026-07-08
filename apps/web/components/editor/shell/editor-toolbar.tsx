"use client";

import Link from "next/link";
import { Download, Eraser, FileJson, FolderOpen, Grid2X2, MousePointer2, Paintbrush, Plus, Save, Shapes } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EditorTool } from "./editor-shared";

const TOOLS = ["brush", "eraser", "select"] as const;

export function EditorToolbar({
  lastSaveMessage,
  onExportMap,
  onLoadAssets,
  onLoadMap,
  onNewAsset,
  onNewMap,
  onSaveAsset,
  onSaveMap,
  onToolChange,
  tool,
}: {
  lastSaveMessage: string;
  onExportMap: () => void;
  onLoadAssets: () => void;
  onLoadMap: () => void;
  onNewAsset: () => void;
  onNewMap: () => void;
  onSaveAsset: () => void;
  onSaveMap: () => void;
  onToolChange: (tool: EditorTool) => void;
  tool: EditorTool;
}) {
  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-black px-3 py-3">
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
      <Link
        className="font-ik-menu inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        href="/game/custom-map/test_map_01"
      >
        <Grid2X2 className="mr-2 h-4 w-4" /> Play/Test Map
      </Link>
      <Button onClick={onNewAsset} size="sm" variant="outline">
        <Shapes className="mr-2 h-4 w-4" /> New Asset
      </Button>
      <Button onClick={onSaveAsset} size="sm" variant="outline">
        <FileJson className="mr-2 h-4 w-4" /> Save Asset
      </Button>
      <Button onClick={onLoadAssets} size="sm" variant="ghost">
        Load Assets
      </Button>

      <div className="ml-auto flex items-center gap-3">
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
        <span className="text-xs text-zinc-500">{lastSaveMessage}</span>
      </div>
    </header>
  );
}
