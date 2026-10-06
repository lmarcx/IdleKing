"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KingdomBuilding, KingdomStageDefinition } from "@idleking/game-core/level-editor";
import { inputClassName } from "./editor-shared";

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 420;
const CANVAS_PADDING = 40;

function computeBounds(points: readonly { x: number; y: number }[]): { minX: number; minY: number; spanX: number; spanY: number } {
  if (points.length === 0) return { minX: 0, minY: 0, spanX: 1, spanY: 1 };
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, spanX: Math.max(1, maxX - minX), spanY: Math.max(1, maxY - minY) };
}

function projectPoint(
  point: { x: number; y: number },
  bounds: ReturnType<typeof computeBounds>
): { left: number; top: number } {
  const usableWidth = CANVAS_WIDTH - CANVAS_PADDING * 2;
  const usableHeight = CANVAS_HEIGHT - CANVAS_PADDING * 2;
  return {
    left: CANVAS_PADDING + ((point.x - bounds.minX) / bounds.spanX) * usableWidth,
    top: CANVAS_PADDING + ((point.y - bounds.minY) / bounds.spanY) * usableHeight,
  };
}

export function KingdomStagePanel({
  kingdomStage,
  matchesCanon,
  onDeleteBuilding,
  onPatchBuilding,
  onSelectBuilding,
  selectedBuildingId,
}: {
  kingdomStage: KingdomStageDefinition;
  matchesCanon: boolean;
  onDeleteBuilding: (id: string) => void;
  onPatchBuilding: (id: string, patch: { x?: number; y?: number }) => void;
  onSelectBuilding: (id: string | null) => void;
  selectedBuildingId: string | null;
}) {
  const allPoints = [...kingdomStage.buildings, ...kingdomStage.npcs, ...kingdomStage.props];
  const bounds = computeBounds(allPoints);
  const selectedBuilding: KingdomBuilding | undefined = kingdomStage.buildings.find((building) => building.id === selectedBuildingId);

  return (
    <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto bg-[#0b0b0b] p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid min-h-0 gap-3">
        <div
          className={cn(
            "rounded-md border p-3 font-ik-menu text-xs uppercase tracking-wide",
            matchesCanon ? "border-zinc-800 bg-zinc-950 text-zinc-400" : "border-amber-200/30 bg-amber-500/10 text-amber-100"
          )}
        >
          {matchesCanon ? "Matches canonical Kingdom Stage" : "Local changes — not committed as canon"}
        </div>
        <p className="font-ik-body text-xs text-zinc-500">
          v{kingdomStage.version} — kingdom-hub-stage.tsx reads this canonical definition by default; local edits here
          only reach it once exported and manually promoted (Export Canonical → promote --apply → tests → commit).
          Click a building to select and edit it.
        </p>

        <div
          className="relative overflow-hidden rounded-md border border-zinc-800 bg-zinc-950"
          onClick={() => onSelectBuilding(null)}
          style={{ height: CANVAS_HEIGHT, width: "100%", maxWidth: CANVAS_WIDTH }}
        >
          {kingdomStage.props.map((prop) => {
            const position = projectPoint(prop, bounds);
            return (
              <span
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-700"
                key={prop.id}
                style={{ left: position.left, top: position.top }}
                title={prop.id}
              />
            );
          })}
          {kingdomStage.npcs.map((npc) => {
            const position = projectPoint(npc, bounds);
            return (
              <span
                className="absolute grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-sky-300/60 bg-black/80 text-[0.55rem] text-sky-200"
                key={npc.id}
                style={{ left: position.left, top: position.top }}
                title={npc.name}
              >
                P
              </span>
            );
          })}
          {kingdomStage.buildings.map((building) => {
            const position = projectPoint(building, bounds);
            const active = building.id === selectedBuildingId;
            return (
              <button
                aria-label={building.id}
                className={cn(
                  "absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 bg-black/85 font-ik-menu text-[0.55rem]",
                  active ? "border-zinc-100 bg-zinc-100 text-zinc-950" : "border-zinc-500 text-zinc-200 hover:border-zinc-200"
                )}
                key={building.id}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectBuilding(building.id);
                }}
                style={{ left: position.left, top: position.top }}
                type="button"
              >
                {building.id.slice(0, 3)}
              </button>
            );
          })}
        </div>

        <p className="font-ik-body text-[0.65rem] text-zinc-600">
          {kingdomStage.buildings.length} buildings · {kingdomStage.npcs.length} NPCs · {kingdomStage.props.length} props
        </p>
      </div>

      <aside className="grid min-h-0 content-start gap-3 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-3">
        <h2 className="font-ik-menu text-xs text-zinc-300">Kingdom Inspector</h2>
        {!selectedBuilding ? (
          <p className="font-ik-body text-xs text-zinc-500">Select a building on the map to edit its position.</p>
        ) : (
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="font-ik-menu text-sm text-zinc-100">{selectedBuilding.id}</span>
              <Button onClick={() => onDeleteBuilding(selectedBuilding.id)} size="sm" variant="ghost">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-xs text-zinc-400">
                X
                <input
                  className={inputClassName()}
                  onChange={(event) => onPatchBuilding(selectedBuilding.id, { x: Number(event.target.value) })}
                  type="number"
                  value={selectedBuilding.x}
                />
              </label>
              <label className="grid gap-1 text-xs text-zinc-400">
                Y
                <input
                  className={inputClassName()}
                  onChange={(event) => onPatchBuilding(selectedBuilding.id, { y: Number(event.target.value) })}
                  type="number"
                  value={selectedBuilding.y}
                />
              </label>
            </div>
            {selectedBuilding.interaction ? (
              <div className="grid gap-1 rounded border border-zinc-800 p-2 font-ik-body text-[0.65rem] text-zinc-500">
                <span>type: {selectedBuilding.interaction.interactionType}</span>
                <span>target: {selectedBuilding.interaction.interactionTargetId}</span>
                <span>prompt: {selectedBuilding.interaction.promptLabel}</span>
                <span>radius: {selectedBuilding.interaction.radius}</span>
              </div>
            ) : (
              <p className="font-ik-body text-[0.65rem] text-zinc-600">No interaction defined.</p>
            )}
          </div>
        )}

        <div className="mt-2 border-t border-zinc-800 pt-2">
          <h3 className="mb-1 font-ik-menu text-[0.62rem] uppercase tracking-wide text-zinc-500">All buildings</h3>
          <div className="grid gap-0.5">
            {kingdomStage.buildings.map((building) => (
              <button
                className={cn(
                  "rounded px-2 py-1 text-left font-ik-body text-xs",
                  building.id === selectedBuildingId ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-zinc-100"
                )}
                key={building.id}
                onClick={() => onSelectBuilding(building.id)}
                type="button"
              >
                {building.id}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
