"use client";

import { AssetPreview } from "@/components/editor/asset-preview";
import { cn } from "@/lib/utils";
import {
  ASSET_PALETTE_CATEGORIES,
  GROUND_TEXTURES,
  type GeometricAsset,
  type GroundTextureId,
  type TopographyCellState,
} from "@idleking/game-core/level-editor";
import { EDITOR_STEPS, TEXTURE_BACKGROUNDS } from "./editor-shared";

export function EditorTree({
  activeStep,
  mapCounts,
  onSelectAsset,
  onSelectTexture,
  onStepChange,
  onTopographyPaintChange,
  paletteAssets,
  registryAssetsCount,
  selectedAssetId,
  selectedTextureId,
  topographyPaint,
}: {
  activeStep: number;
  mapCounts: { enemies: number; npcs: number; objects: number };
  onSelectAsset: (id: string) => void;
  onSelectTexture: (id: GroundTextureId) => void;
  onStepChange: (step: number) => void;
  onTopographyPaintChange: (state: TopographyCellState) => void;
  paletteAssets: readonly GeometricAsset[];
  registryAssetsCount: number;
  selectedAssetId: string;
  selectedTextureId: GroundTextureId;
  topographyPaint: TopographyCellState;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <span className="rounded border border-zinc-800 p-2">Assets {registryAssetsCount}</span>
        <span className="rounded border border-zinc-800 p-2">Objects {mapCounts.objects}</span>
        <span className="rounded border border-zinc-800 p-2">NPC {mapCounts.npcs}</span>
        <span className="rounded border border-zinc-800 p-2">Enemies {mapCounts.enemies}</span>
      </div>

      <div>
        <h2 className="mb-2 font-ik-menu text-[0.65rem] uppercase tracking-wide text-zinc-500">Layers</h2>
        <div className="grid gap-1">
          {EDITOR_STEPS.map((step, index) => (
            <button
              className={cn(
                "rounded-md border px-3 py-2 text-left font-ik-menu text-[0.62rem]",
                activeStep === index ? "border-zinc-100 bg-zinc-100 text-zinc-950" : "border-zinc-800 bg-zinc-950 text-zinc-400"
              )}
              key={step}
              onClick={() => onStepChange(index)}
              type="button"
            >
              {index + 1}. {step}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-ik-menu text-[0.65rem] uppercase tracking-wide text-zinc-500">Assets</h2>
        {activeStep === 0 ? (
          <div className="grid gap-2">
            {(["playable", "dead"] as const).map((state) => (
              <button
                className={cn("rounded-md border p-2 text-left text-sm", topographyPaint === state ? "border-zinc-100" : "border-zinc-800")}
                key={state}
                onClick={() => onTopographyPaintChange(state)}
                type="button"
              >
                {state === "playable" ? "Playable cell" : "Dead / blocked cell"}
              </button>
            ))}
          </div>
        ) : activeStep === 1 ? (
          <div className="grid gap-2">
            {GROUND_TEXTURES.filter((texture) => texture.id !== "void").map((texture) => (
              <button
                className={cn(
                  "flex items-center justify-between rounded-md border p-2 text-left text-sm",
                  selectedTextureId === texture.id ? "border-zinc-100" : "border-zinc-800"
                )}
                key={texture.id}
                onClick={() => onSelectTexture(texture.id)}
                type="button"
              >
                <span>{texture.name}</span>
                <span className="h-6 w-10 border border-zinc-700" style={{ backgroundColor: texture.fill, backgroundImage: TEXTURE_BACKGROUNDS[texture.id] }} />
              </button>
            ))}
          </div>
        ) : activeStep === 7 ? (
          <div className="grid gap-2">
            <button
              className={cn("rounded-md border p-3 text-left text-sm", selectedAssetId === "collision" ? "border-zinc-100" : "border-zinc-800 text-zinc-400")}
              onClick={() => onSelectAsset("collision")}
              type="button"
            >
              Collision box
            </button>
            <button
              className={cn("rounded-md border p-3 text-left text-sm", selectedAssetId === "trigger" ? "border-zinc-100" : "border-zinc-800 text-zinc-400")}
              onClick={() => onSelectAsset("trigger")}
              type="button"
            >
              Trigger marker
            </button>
          </div>
        ) : (
          <div className="grid gap-2">
            {paletteAssets.map((asset) => (
              <button
                className={cn(
                  "grid grid-cols-[56px_1fr] items-center gap-2 rounded-md border p-2 text-left",
                  selectedAssetId === asset.id ? "border-zinc-100" : "border-zinc-800"
                )}
                key={asset.id}
                onClick={() => onSelectAsset(asset.id)}
                type="button"
              >
                <AssetPreview asset={asset} className="h-14 w-14 border border-zinc-800" />
                <span className="text-sm">{asset.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-1 pt-2">
        {ASSET_PALETTE_CATEGORIES.map((item) => (
          <span className="rounded border border-zinc-800 px-2 py-1 text-[0.62rem] uppercase text-zinc-500" key={item}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
