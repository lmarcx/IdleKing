"use client";

import { AssetPreview } from "@/components/editor/asset-preview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ASSET_CREATOR_PRESETS,
  ASSET_PALETTE_CATEGORIES,
  type AssetCategory,
  type GeometricAsset,
  type GeometryShape,
  type PlayableMap,
  type PrimitivePart,
} from "@idleking/game-core/level-editor";
import { ArrowDown, ArrowUp, Copy, Trash2 } from "lucide-react";
import { getSelectionLabel, inputClassName, type Selection, type SelectedEntity } from "./editor-shared";

const PART_SHAPES = ["rect", "circle", "triangle", "line", "polygon"] as const;
const PART_NUMBER_FIELDS = ["x", "y", "width", "height", "radius", "rotation", "strokeWidth", "opacity", "layer"] as const;

export function EditorInspector({
  assetDraft,
  onAddPart,
  onAssetDraftChange,
  onDeletePart,
  onDeleteSelection,
  onDuplicatePart,
  onExportAsset,
  onGridChange,
  onMapIdChange,
  onMapNameChange,
  onMovePartLayer,
  onPatchSelection,
  onSelectPart,
  onSelectPreset,
  onUpdateSelectedPart,
  map,
  selectedEntity,
  selectedPart,
  selectedPartId,
  selection,
}: {
  assetDraft: GeometricAsset;
  onAddPart: (shape: GeometryShape) => void;
  onAssetDraftChange: (next: GeometricAsset) => void;
  onDeletePart: (id: string) => void;
  onDeleteSelection: () => void;
  onDuplicatePart: (part: PrimitivePart) => void;
  onExportAsset: () => void;
  onGridChange: (patch: Partial<PlayableMap["grid"]>) => void;
  onMapIdChange: (id: string) => void;
  onMapNameChange: (name: string) => void;
  onMovePartLayer: (part: PrimitivePart, direction: -1 | 1) => void;
  onPatchSelection: (patch: Record<string, string | number | null>) => void;
  onSelectPart: (id: string) => void;
  onSelectPreset: (id: string) => void;
  onUpdateSelectedPart: (patch: Partial<PrimitivePart>) => void;
  map: PlayableMap;
  selectedEntity: SelectedEntity | null;
  selectedPart: PrimitivePart | undefined;
  selectedPartId: string;
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

        <div className="grid gap-3 rounded-md border border-zinc-800 p-3">
          <div className="flex items-center justify-between">
            <h2 className="font-ik-menu text-xs text-zinc-300">Asset Creator</h2>
            <Button onClick={onExportAsset} size="sm" variant="ghost">
              Export
            </Button>
          </div>
          <AssetPreview asset={assetDraft} className="h-44 w-full rounded-md border border-zinc-700 bg-black" />
          <input className={inputClassName()} onChange={(event) => onAssetDraftChange({ ...assetDraft, id: event.target.value })} value={assetDraft.id} />
          <input className={inputClassName()} onChange={(event) => onAssetDraftChange({ ...assetDraft, name: event.target.value })} value={assetDraft.name} />
          <select
            className={inputClassName()}
            onChange={(event) => onAssetDraftChange({ ...assetDraft, category: event.target.value as AssetCategory })}
            value={assetDraft.category}
          >
            {ASSET_PALETTE_CATEGORIES.filter((item) => item !== "textures").map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-5 gap-1">
            {PART_SHAPES.map((shape) => (
              <Button key={shape} onClick={() => onAddPart(shape)} size="sm" variant="outline">
                {shape.slice(0, 3)}
              </Button>
            ))}
          </div>
          <div className="grid max-h-40 gap-1 overflow-auto">
            {[...assetDraft.parts]
              .sort((a, b) => a.layer - b.layer)
              .map((part) => (
                <button
                  className={cn(
                    "grid grid-cols-[1fr_auto] items-center rounded border px-2 py-1 text-left text-xs",
                    selectedPartId === part.id ? "border-zinc-100" : "border-zinc-800"
                  )}
                  key={part.id}
                  onClick={() => onSelectPart(part.id)}
                  type="button"
                >
                  <span>
                    {part.layer}. {part.id} / {part.shape}
                  </span>
                  <span className="h-3 w-3 border border-zinc-700" style={{ backgroundColor: part.fill }} />
                </button>
              ))}
          </div>
          {selectedPart ? (
            <div className="grid gap-2">
              <div className="flex gap-1">
                <Button onClick={() => onDuplicatePart(selectedPart)} size="sm" variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button onClick={() => onMovePartLayer(selectedPart, -1)} size="sm" variant="outline">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button onClick={() => onMovePartLayer(selectedPart, 1)} size="sm" variant="outline">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button onClick={() => onDeletePart(selectedPart.id)} size="sm" variant="outline">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PART_NUMBER_FIELDS.map((field) => (
                  <label className="grid gap-1 text-xs text-zinc-400" key={field}>
                    {field}
                    <input
                      className={inputClassName()}
                      onChange={(event) => onUpdateSelectedPart({ [field]: Number(event.target.value) } as Partial<PrimitivePart>)}
                      step={field === "opacity" ? 0.1 : 1}
                      type="number"
                      value={Number(selectedPart[field] ?? 0)}
                    />
                  </label>
                ))}
                <label className="grid gap-1 text-xs text-zinc-400">
                  Fill
                  <input
                    className="h-10 rounded border border-zinc-800 bg-black p-1"
                    onChange={(event) => onUpdateSelectedPart({ fill: event.target.value })}
                    type="color"
                    value={selectedPart.fill}
                  />
                </label>
                <label className="grid gap-1 text-xs text-zinc-400">
                  Stroke
                  <input
                    className="h-10 rounded border border-zinc-800 bg-black p-1"
                    onChange={(event) => onUpdateSelectedPart({ stroke: event.target.value })}
                    type="color"
                    value={selectedPart.stroke}
                  />
                </label>
              </div>
            </div>
          ) : null}
          <select
            onChange={(event) => onSelectPreset(event.target.value)}
            className={inputClassName()}
            value=""
          >
            <option value="">Preset</option>
            {ASSET_CREATOR_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}
