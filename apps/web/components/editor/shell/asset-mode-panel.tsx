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
  type PrimitivePart,
} from "@idleking/game-core/level-editor";
import { ArrowDown, ArrowUp, Copy, Trash2 } from "lucide-react";
import { inputClassName } from "./editor-shared";

const PART_SHAPES = ["rect", "circle", "triangle", "line", "polygon"] as const;
const PART_NUMBER_FIELDS = ["x", "y", "width", "height", "radius", "rotation", "strokeWidth", "opacity", "layer"] as const;

export function AssetModePanel({
  assetDraft,
  customAssets,
  onAddPart,
  onAssetDraftChange,
  onDeletePart,
  onDuplicatePart,
  onEditExistingAsset,
  onExportAsset,
  onMovePartLayer,
  onSelectPart,
  onSelectPreset,
  onUpdateSelectedPart,
  selectedPart,
  selectedPartId,
}: {
  assetDraft: GeometricAsset;
  customAssets: readonly GeometricAsset[];
  onAddPart: (shape: GeometryShape) => void;
  onAssetDraftChange: (next: GeometricAsset) => void;
  onDeletePart: (id: string) => void;
  onDuplicatePart: (part: PrimitivePart) => void;
  onEditExistingAsset: (asset: GeometricAsset) => void;
  onExportAsset: () => void;
  onMovePartLayer: (part: PrimitivePart, direction: -1 | 1) => void;
  onSelectPart: (id: string) => void;
  onSelectPreset: (id: string) => void;
  onUpdateSelectedPart: (patch: Partial<PrimitivePart>) => void;
  selectedPart: PrimitivePart | undefined;
  selectedPartId: string;
}) {
  return (
    <section className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-auto bg-[#0b0b0b] p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-3">
        <div className="grid gap-2 rounded-md border border-zinc-800 bg-zinc-950 p-3">
          <div className="flex items-center justify-between">
            <h2 className="font-ik-menu text-xs text-zinc-300">Asset Creator</h2>
            <Button onClick={onExportAsset} size="sm" variant="ghost">
              Export
            </Button>
          </div>
          <AssetPreview asset={assetDraft} className="h-64 w-full rounded-md border border-zinc-700 bg-black" />
          <div className="grid grid-cols-2 gap-2">
            <input className={inputClassName()} onChange={(event) => onAssetDraftChange({ ...assetDraft, id: event.target.value })} value={assetDraft.id} />
            <input className={inputClassName()} onChange={(event) => onAssetDraftChange({ ...assetDraft, name: event.target.value })} value={assetDraft.name} />
          </div>
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
          <select onChange={(event) => onSelectPreset(event.target.value)} className={inputClassName()} value="">
            <option value="">Preset</option>
            {ASSET_CREATOR_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2 rounded-md border border-zinc-800 bg-zinc-950 p-3">
          <h2 className="font-ik-menu text-xs text-zinc-300">Your Assets ({customAssets.length})</h2>
          {customAssets.length === 0 ? (
            <p className="text-xs text-zinc-500">No custom assets saved yet. Save one to see it here.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {customAssets.map((asset) => (
                <button
                  className={cn(
                    "grid gap-1 rounded-md border p-2 text-left",
                    assetDraft.id === asset.id ? "border-zinc-100" : "border-zinc-800"
                  )}
                  key={asset.id}
                  onClick={() => onEditExistingAsset(asset)}
                  type="button"
                >
                  <AssetPreview asset={asset} className="h-14 w-full border border-zinc-800" />
                  <span className="truncate text-[0.65rem] text-zinc-300">{asset.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        <div className="grid max-h-64 gap-1 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-3">
          <h2 className="mb-1 font-ik-menu text-xs text-zinc-300">Parts</h2>
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
          <div className="grid gap-2 rounded-md border border-zinc-800 bg-zinc-950 p-3">
            <h2 className="font-ik-menu text-xs text-zinc-300">Part properties</h2>
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
      </div>
    </section>
  );
}
