"use client";

import { Button } from "@/components/ui/button";
import { type PlayableMap } from "@idleking/game-core/level-editor";
import { Trash2 } from "lucide-react";
import { getSelectionLabel, inputClassName, type Selection, type SelectedEntity } from "./editor-shared";

export function EditorInspector({
  map,
  onDeleteSelection,
  onGridChange,
  onMapIdChange,
  onMapNameChange,
  onPatchSelection,
  selectedEntity,
  selection,
}: {
  map: PlayableMap;
  onDeleteSelection: () => void;
  onGridChange: (patch: Partial<PlayableMap["grid"]>) => void;
  onMapIdChange: (id: string) => void;
  onMapNameChange: (name: string) => void;
  onPatchSelection: (patch: Record<string, string | number | null>) => void;
  selectedEntity: SelectedEntity | null;
  selection: Selection | null;
}) {
  return (
    <aside className="min-h-0 overflow-auto border-l border-zinc-800 bg-zinc-950 p-3">
      <div className="grid gap-3">
        <div className="grid gap-2 rounded-md border border-zinc-800 p-3">
          <h2 className="font-ik-menu text-xs text-zinc-300">Map</h2>
          <label className="grid gap-1 text-xs text-zinc-400">
            Map ID
            <input className={inputClassName()} onChange={(event) => onMapIdChange(event.target.value)} value={map.id} />
          </label>
          <label className="grid gap-1 text-xs text-zinc-400">
            Name
            <input className={inputClassName()} onChange={(event) => onMapNameChange(event.target.value)} value={map.name} />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label className="grid gap-1 text-xs text-zinc-400">
              Width
              <input className={inputClassName()} onChange={(event) => onGridChange({ width: Number(event.target.value) })} type="number" value={map.grid.width} />
            </label>
            <label className="grid gap-1 text-xs text-zinc-400">
              Height
              <input className={inputClassName()} onChange={(event) => onGridChange({ height: Number(event.target.value) })} type="number" value={map.grid.height} />
            </label>
            <label className="grid gap-1 text-xs text-zinc-400">
              Cell
              <input className={inputClassName()} onChange={(event) => onGridChange({ cellSize: Number(event.target.value) })} type="number" value={map.grid.cellSize} />
            </label>
          </div>
        </div>

        <div className="grid gap-2 rounded-md border border-zinc-800 p-3">
          <div className="flex items-center justify-between">
            <h2 className="font-ik-menu text-xs text-zinc-300">Selection</h2>
            <Button disabled={!selection || selection.kind === "spawn"} onClick={onDeleteSelection} size="sm" variant="ghost">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-zinc-500">{getSelectionLabel(selection)}</div>
          {selectedEntity && "x" in selectedEntity ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-xs text-zinc-400">
                X
                <input className={inputClassName()} onChange={(event) => onPatchSelection({ x: Number(event.target.value) })} type="number" value={selectedEntity.x} />
              </label>
              <label className="grid gap-1 text-xs text-zinc-400">
                Y
                <input className={inputClassName()} onChange={(event) => onPatchSelection({ y: Number(event.target.value) })} type="number" value={selectedEntity.y} />
              </label>
              {"rotation" in selectedEntity ? (
                <label className="grid gap-1 text-xs text-zinc-400">
                  Rotation
                  <input
                    className={inputClassName()}
                    onChange={(event) => onPatchSelection({ rotation: Number(event.target.value) })}
                    type="number"
                    value={Number(selectedEntity.rotation)}
                  />
                </label>
              ) : null}
              {"width" in selectedEntity ? (
                <label className="grid gap-1 text-xs text-zinc-400">
                  Width
                  <input
                    className={inputClassName()}
                    onChange={(event) => onPatchSelection({ width: Number(event.target.value) })}
                    type="number"
                    value={Number(selectedEntity.width)}
                  />
                </label>
              ) : null}
              {"height" in selectedEntity ? (
                <label className="grid gap-1 text-xs text-zinc-400">
                  Height
                  <input
                    className={inputClassName()}
                    onChange={(event) => onPatchSelection({ height: Number(event.target.value) })}
                    type="number"
                    value={Number(selectedEntity.height)}
                  />
                </label>
              ) : null}
              {"name" in selectedEntity ? (
                <label className="col-span-2 grid gap-1 text-xs text-zinc-400">
                  Name
                  <input className={inputClassName()} onChange={(event) => onPatchSelection({ name: event.target.value })} value={String(selectedEntity.name)} />
                </label>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
