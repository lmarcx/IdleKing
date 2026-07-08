"use client";

import { cn } from "@/lib/utils";
import { GROUND_TEXTURES, getGroundTexture, getMapTile, getTopographyCellState, type PlayableMap } from "@idleking/game-core/level-editor";
import { TEXTURE_BACKGROUNDS, type MarkerViewModel, type Selection } from "./editor-shared";

export function EditorCanvas({
  isPainting,
  map,
  markers,
  onCellPointerDown,
  onCellPointerEnter,
  onMarkerClick,
  selection,
}: {
  isPainting: boolean;
  map: PlayableMap;
  markers: readonly MarkerViewModel[];
  onCellPointerDown: (x: number, y: number) => void;
  onCellPointerEnter: (x: number, y: number) => void;
  onMarkerClick: (marker: MarkerViewModel) => void;
  selection: Selection | null;
}) {
  return (
    <section className="min-h-[560px] overflow-auto bg-[#0b0b0b] p-4">
      <div className="relative w-fit">
        <div className="grid w-fit border border-zinc-700" style={{ gridTemplateColumns: `repeat(${map.grid.width}, ${map.grid.cellSize}px)` }}>
          {Array.from({ length: map.grid.width * map.grid.height }, (_, index) => {
            const x = index % map.grid.width;
            const y = Math.floor(index / map.grid.width);
            const tile = getMapTile(map, x, y);
            const texture = getGroundTexture(tile?.textureId ?? "grass") ?? GROUND_TEXTURES[0];
            const state = getTopographyCellState(map, x, y);
            const dead = state !== "playable";
            return (
              <button
                aria-label={`cell ${x} ${y}`}
                className="relative border border-zinc-800"
                key={`${x}:${y}`}
                onPointerDown={() => onCellPointerDown(x, y)}
                onPointerEnter={() => {
                  if (isPainting) onCellPointerEnter(x, y);
                }}
                style={{
                  width: map.grid.cellSize,
                  height: map.grid.cellSize,
                  backgroundColor: dead ? "#050505" : texture.fill,
                  backgroundImage: dead
                    ? "repeating-linear-gradient(45deg, rgba(255,255,255,.28) 0 2px, transparent 2px 7px)"
                    : TEXTURE_BACKGROUNDS[texture.id],
                }}
                type="button"
              >
                {dead ? <span className="absolute inset-0 grid place-items-center text-[0.58rem] font-bold text-zinc-200">X</span> : null}
              </button>
            );
          })}
        </div>
        {markers.map((marker) => (
          <button
            className={cn(
              "absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-sm border bg-black/78 text-[0.62rem] font-bold",
              marker.className,
              selection?.kind === marker.kind && selection.id === marker.id ? "ring-2 ring-white" : ""
            )}
            key={`${marker.kind}:${marker.id}`}
            onClick={(event) => {
              event.stopPropagation();
              onMarkerClick(marker);
            }}
            style={{ left: marker.x + map.grid.cellSize / 2, top: marker.y + map.grid.cellSize / 2 }}
            title={marker.id}
            type="button"
          >
            {marker.label}
          </button>
        ))}
      </div>
    </section>
  );
}
