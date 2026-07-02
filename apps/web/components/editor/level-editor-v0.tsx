"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, FileJson, FolderOpen, Grid2X2, Plus, Save, Shapes } from "lucide-react";

import { AssetPreview } from "@/components/editor/asset-preview";
import { Button } from "@/components/ui/button";
import {
  ASSET_CREATOR_PRESETS,
  ASSET_PALETTE_CATEGORIES,
  GROUND_TEXTURES,
  TEST_MAP_01,
  createAssetRegistry,
  getAssetsByCategory,
  getGroundTexture,
  type AssetCategory,
  type GeometricAsset,
  type GeometryShape,
  type GroundTextureId,
  type MapTile,
  type PlayableMap,
  type PrimitivePart,
  type TopographyCellState,
} from "@idleking/game-core/level-editor";

const STORAGE_MAP_KEY = "aworlddreamt:level-editor-v0:map";
const STORAGE_ASSETS_KEY = "aworlddreamt:level-editor-v0:assets";

const steps = [
  "Topography",
  "Tiles",
  "Environment",
  "Buildings",
  "Characters",
  "Objects",
  "Enemies",
  "Collisions",
] as const;

const stepCategory: Record<number, AssetCategory | null> = {
  0: null,
  1: "textures",
  2: "nature",
  3: "buildings",
  4: "characters",
  5: "objects",
  6: "enemies",
  7: "collisions",
};

function createEmptyMap(): PlayableMap {
  return {
    ...TEST_MAP_01,
    id: "draft_map_01",
    name: "Draft Map 01",
    topography: { cells: [] },
    tiles: Array.from({ length: 20 * 14 }, (_, index) => ({
      x: index % 20,
      y: Math.floor(index / 20),
      textureId: "grass" as const,
      walkable: true,
    })),
    objects: [],
    buildings: [],
    npcs: [],
    enemies: [],
    collisions: [],
    triggers: [],
    puzzles: [],
    spawns: [{ id: "player_start", x: 64, y: 64 }],
  };
}

function createAssetDraft(): GeometricAsset {
  return {
    id: `custom_asset_${Date.now()}`,
    name: "Custom Asset",
    category: "objects",
    style: "minimal-geometric",
    parts: [
      {
        id: "part_01",
        shape: "rect",
        x: 24,
        y: 24,
        width: 48,
        height: 32,
        fill: "#202020",
        stroke: "#e2e2e2",
        strokeWidth: 2,
        opacity: 1,
        rotation: 0,
        layer: 1,
      },
    ],
    defaultCollision: { type: "box", x: 24, y: 24, width: 48, height: 32 },
    defaultInteraction: null,
    tags: ["custom"],
  };
}

function downloadJson(name: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getCellState(map: PlayableMap, x: number, y: number): TopographyCellState {
  return map.topography.cells.find((cell) => cell.x === x && cell.y === y)?.state ?? "playable";
}

function cycleCellState(state: TopographyCellState): TopographyCellState {
  if (state === "playable") return "dead";
  if (state === "dead") return "boundary";
  if (state === "boundary") return "void";
  return "playable";
}

function upsertTile(tiles: readonly MapTile[], next: MapTile): readonly MapTile[] {
  const without = tiles.filter((tile) => tile.x !== next.x || tile.y !== next.y);
  return [...without, next];
}

function createPrimitive(shape: GeometryShape, index: number): PrimitivePart {
  return {
    id: `part_${String(index + 1).padStart(2, "0")}`,
    shape,
    x: 20 + index * 6,
    y: 20 + index * 6,
    width: shape === "line" ? 48 : 36,
    height: shape === "line" ? 0 : 30,
    radius: shape === "circle" ? 18 : undefined,
    points: shape === "polygon" ? [{ x: 18, y: 12 }, { x: 48, y: 18 }, { x: 38, y: 52 }, { x: 10, y: 42 }] : undefined,
    fill: "#202020",
    stroke: "#eeeeee",
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
    layer: index + 1,
  };
}

export function LevelEditorV0() {
  const [map, setMap] = useState<PlayableMap>(() => TEST_MAP_01);
  const [customAssets, setCustomAssets] = useState<GeometricAsset[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAssetId, setSelectedAssetId] = useState("tree_simple_01");
  const [selectedTextureId, setSelectedTextureId] = useState<GroundTextureId>("grass");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("player_start");
  const [assetDraft, setAssetDraft] = useState<GeometricAsset>(() => createAssetDraft());
  const [selectedPartId, setSelectedPartId] = useState(assetDraft.parts[0]?.id ?? "");

  const registry = useMemo(() => createAssetRegistry({ customAssets }), [customAssets]);
  const category = stepCategory[activeStep];
  const paletteAssets = category && category !== "textures" && category !== "collisions" ? getAssetsByCategory(registry, category) : registry.assets;
  const selectedAsset = registry.assets.find((asset) => asset.id === selectedAssetId) ?? registry.assets[0];
  const selectedPart = assetDraft.parts.find((part) => part.id === selectedPartId) ?? assetDraft.parts[0];

  function saveMap() {
    localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(map));
  }

  function loadMap() {
    const raw = localStorage.getItem(STORAGE_MAP_KEY);
    if (!raw) return;
    setMap(JSON.parse(raw) as PlayableMap);
  }

  function saveAsset() {
    const next = [...customAssets.filter((asset) => asset.id !== assetDraft.id), assetDraft];
    setCustomAssets(next);
    localStorage.setItem(STORAGE_ASSETS_KEY, JSON.stringify(next));
    setSelectedAssetId(assetDraft.id);
  }

  function loadAssets() {
    const raw = localStorage.getItem(STORAGE_ASSETS_KEY);
    if (!raw) return;
    setCustomAssets(JSON.parse(raw) as GeometricAsset[]);
  }

  function onCellClick(x: number, y: number) {
    const px = x * map.grid.cellSize;
    const py = y * map.grid.cellSize;

    if (activeStep === 0) {
      const nextState = cycleCellState(getCellState(map, x, y));
      setMap((current) => ({
        ...current,
        topography: {
          cells: [
            ...current.topography.cells.filter((cell) => cell.x !== x || cell.y !== y),
            ...(nextState === "playable" ? [] : [{ x, y, state: nextState }]),
          ],
        },
      }));
      return;
    }

    if (activeStep === 1) {
      const texture = getGroundTexture(selectedTextureId) ?? GROUND_TEXTURES[0];
      setMap((current) => ({
        ...current,
        tiles: upsertTile(current.tiles, {
          x,
          y,
          textureId: texture.id,
          walkable: texture.walkable,
          movementModifier: texture.movementModifier,
          damage: texture.damage,
        }),
      }));
      return;
    }

    if (activeStep === 3) {
      setMap((current) => ({
        ...current,
        buildings: [
          ...current.buildings,
          {
            id: `building_${current.buildings.length + 1}`,
            assetId: selectedAsset.id,
            function: "house",
            x: px,
            y: py,
            collision: selectedAsset.defaultCollision,
            interaction: selectedAsset.defaultInteraction,
          },
        ],
      }));
      return;
    }

    if (activeStep === 4) {
      setMap((current) => ({
        ...current,
        npcs: [
          ...current.npcs,
          {
            id: `npc_${current.npcs.length + 1}`,
            assetId: selectedAsset.id,
            name: "New NPC",
            type: "villager",
            behavior: "idle",
            interaction: "dialogue",
            x: px,
            y: py,
          },
        ],
      }));
      return;
    }

    if (activeStep === 6) {
      setMap((current) => ({
        ...current,
        enemies: [
          ...current.enemies,
          {
            id: `enemy_${current.enemies.length + 1}`,
            assetId: selectedAsset.id,
            enemyId: selectedAsset.id,
            name: "New Enemy",
            stats: { hp: 24, attack: 4, defense: 1, speed: 60 },
            behavior: "idle",
            aggroRadius: 96,
            x: px,
            y: py,
          },
        ],
      }));
      return;
    }

    if (activeStep === 7) {
      setMap((current) => ({
        ...current,
        collisions: [
          ...current.collisions,
          { id: `collision_${current.collisions.length + 1}`, type: "box", x: px, y: py, width: map.grid.cellSize, height: map.grid.cellSize },
        ],
      }));
      return;
    }

    setMap((current) => ({
      ...current,
      objects: [
        ...current.objects,
        {
          id: `object_${current.objects.length + 1}`,
          assetId: selectedAsset.id,
          kind: activeStep === 5 ? "object" : "nature",
          x: px,
          y: py,
          rotation: 0,
          interaction: selectedAsset.defaultInteraction,
        },
      ],
    }));
  }

  function updateSelectedPart(patch: Partial<PrimitivePart>) {
    setAssetDraft((current) => ({
      ...current,
      parts: current.parts.map((part) => (part.id === selectedPart?.id ? { ...part, ...patch } : part)),
    }));
  }

  return (
    <div className="min-h-screen bg-[#070707] text-zinc-100">
      <div className="flex min-h-screen flex-col">
        <header className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-black px-3 py-3">
          <Button size="sm" variant="outline" onClick={() => setMap(createEmptyMap())}>
            <Plus className="mr-2 h-4 w-4" /> New Map
          </Button>
          <Button size="sm" variant="outline" onClick={saveMap}>
            <Save className="mr-2 h-4 w-4" /> Save Map
          </Button>
          <Button size="sm" variant="outline" onClick={loadMap}>
            <FolderOpen className="mr-2 h-4 w-4" /> Load Map
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadJson(`${map.id}.map.json`, map)}>
            <Download className="mr-2 h-4 w-4" /> Export JSON
          </Button>
          <Link
            className="font-ik-menu inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            href="/game/custom-map/test_map_01"
          >
            <Grid2X2 className="mr-2 h-4 w-4" /> Play/Test Map
          </Link>
          <Button size="sm" variant="outline" onClick={() => setAssetDraft(createAssetDraft())}>
            <Shapes className="mr-2 h-4 w-4" /> New Asset
          </Button>
          <Button size="sm" variant="outline" onClick={saveAsset}>
            <FileJson className="mr-2 h-4 w-4" /> Save Asset
          </Button>
          <Button size="sm" variant="ghost" onClick={loadAssets}>
            Load Assets
          </Button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-zinc-800 bg-zinc-950 px-3 py-2">
          {steps.map((step, index) => (
            <button
              className={`h-9 shrink-0 rounded-md border px-3 font-ik-menu text-[0.62rem] ${activeStep === index ? "border-zinc-100 bg-zinc-100 text-zinc-950" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}
              key={step}
              onClick={() => setActiveStep(index)}
              type="button"
            >
              {index + 1}. {step}
            </button>
          ))}
        </nav>

        <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
          <aside className="border-r border-zinc-800 bg-zinc-950 p-3">
            <div className="grid gap-2">
              {activeStep === 1 ? (
                GROUND_TEXTURES.map((texture) => (
                  <button
                    className={`flex items-center justify-between rounded-md border p-2 text-left text-sm ${selectedTextureId === texture.id ? "border-zinc-100" : "border-zinc-800"}`}
                    key={texture.id}
                    onClick={() => setSelectedTextureId(texture.id)}
                    type="button"
                  >
                    <span>{texture.name}</span>
                    <span className="h-5 w-8 border border-zinc-700" style={{ backgroundColor: texture.fill }} />
                  </button>
                ))
              ) : (
                paletteAssets.map((asset) => (
                  <button
                    className={`grid grid-cols-[56px_1fr] items-center gap-2 rounded-md border p-2 text-left ${selectedAssetId === asset.id ? "border-zinc-100" : "border-zinc-800"}`}
                    key={asset.id}
                    onClick={() => setSelectedAssetId(asset.id)}
                    type="button"
                  >
                    <AssetPreview asset={asset} className="h-14 w-14 border border-zinc-800" />
                    <span className="text-sm">{asset.name}</span>
                  </button>
                ))
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-1">
              {ASSET_PALETTE_CATEGORIES.map((item) => (
                <span className="rounded border border-zinc-800 px-2 py-1 text-[0.62rem] uppercase text-zinc-500" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </aside>

          <section className="min-h-[560px] overflow-auto bg-[#0b0b0b] p-4">
            <div
              className="grid w-fit border border-zinc-700"
              style={{
                gridTemplateColumns: `repeat(${map.grid.width}, ${map.grid.cellSize}px)`,
              }}
            >
              {Array.from({ length: map.grid.width * map.grid.height }, (_, index) => {
                const x = index % map.grid.width;
                const y = Math.floor(index / map.grid.width);
                const tile = map.tiles.find((item) => item.x === x && item.y === y);
                const texture = getGroundTexture(tile?.textureId ?? "grass") ?? GROUND_TEXTURES[0];
                const state = getCellState(map, x, y);
                return (
                  <button
                    aria-label={`cell ${x} ${y}`}
                    className="relative border border-zinc-800"
                    key={`${x}:${y}`}
                    onClick={() => onCellClick(x, y)}
                    style={{
                      width: map.grid.cellSize,
                      height: map.grid.cellSize,
                      backgroundColor: state === "void" ? "#020202" : state === "dead" ? "#151515" : state === "boundary" ? "#2b2b2b" : texture.fill,
                    }}
                    type="button"
                  >
                    {state !== "playable" ? <span className="absolute inset-0 grid place-items-center text-[0.55rem] text-zinc-500">{state[0]}</span> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="overflow-auto border-l border-zinc-800 bg-zinc-950 p-3">
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs text-zinc-400">
                Map ID
                <input className="rounded border border-zinc-800 bg-black px-2 py-2 text-zinc-100" value={map.id} onChange={(event) => setMap({ ...map, id: event.target.value })} />
              </label>
              <label className="grid gap-1 text-xs text-zinc-400">
                Name
                <input className="rounded border border-zinc-800 bg-black px-2 py-2 text-zinc-100" value={map.name} onChange={(event) => setMap({ ...map, name: event.target.value })} />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="grid gap-1 text-xs text-zinc-400">
                  Width
                  <input className="rounded border border-zinc-800 bg-black px-2 py-2 text-zinc-100" type="number" value={map.grid.width} onChange={(event) => setMap({ ...map, grid: { ...map.grid, width: Number(event.target.value) } })} />
                </label>
                <label className="grid gap-1 text-xs text-zinc-400">
                  Height
                  <input className="rounded border border-zinc-800 bg-black px-2 py-2 text-zinc-100" type="number" value={map.grid.height} onChange={(event) => setMap({ ...map, grid: { ...map.grid, height: Number(event.target.value) } })} />
                </label>
                <label className="grid gap-1 text-xs text-zinc-400">
                  Cell
                  <input className="rounded border border-zinc-800 bg-black px-2 py-2 text-zinc-100" type="number" value={map.grid.cellSize} onChange={(event) => setMap({ ...map, grid: { ...map.grid, cellSize: Number(event.target.value) } })} />
                </label>
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-ik-menu text-xs text-zinc-300">Asset Creator</h2>
                  <Button size="sm" variant="ghost" onClick={() => downloadJson(`${assetDraft.id}.asset.json`, assetDraft)}>
                    Export
                  </Button>
                </div>
                <AssetPreview asset={assetDraft} className="mb-3 h-36 w-full border border-zinc-800" />
                <div className="grid gap-2">
                  <input className="rounded border border-zinc-800 bg-black px-2 py-2 text-sm text-zinc-100" value={assetDraft.name} onChange={(event) => setAssetDraft({ ...assetDraft, name: event.target.value })} />
                  <select className="rounded border border-zinc-800 bg-black px-2 py-2 text-sm text-zinc-100" value={assetDraft.category} onChange={(event) => setAssetDraft({ ...assetDraft, category: event.target.value as AssetCategory })}>
                    {ASSET_PALETTE_CATEGORIES.filter((item) => item !== "textures").map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-5 gap-1">
                    {(["rect", "circle", "triangle", "line", "polygon"] as const).map((shape) => (
                      <Button key={shape} size="sm" variant="outline" onClick={() => {
                        const part = createPrimitive(shape, assetDraft.parts.length);
                        setAssetDraft({ ...assetDraft, parts: [...assetDraft.parts, part] });
                        setSelectedPartId(part.id);
                      }}>
                        {shape.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                  <select className="rounded border border-zinc-800 bg-black px-2 py-2 text-sm text-zinc-100" value={selectedPart?.id} onChange={(event) => setSelectedPartId(event.target.value)}>
                    {assetDraft.parts.map((part) => (
                      <option key={part.id} value={part.id}>{part.id}</option>
                    ))}
                  </select>
                  {selectedPart ? (
                    <div className="grid grid-cols-2 gap-2">
                      {(["x", "y", "width", "height", "rotation", "strokeWidth", "opacity", "layer"] as const).map((field) => (
                        <label className="grid gap-1 text-xs text-zinc-400" key={field}>
                          {field}
                          <input className="rounded border border-zinc-800 bg-black px-2 py-2 text-zinc-100" type="number" step={field === "opacity" ? 0.1 : 1} value={Number(selectedPart[field] ?? 0)} onChange={(event) => updateSelectedPart({ [field]: Number(event.target.value) } as Partial<PrimitivePart>)} />
                        </label>
                      ))}
                      <label className="grid gap-1 text-xs text-zinc-400">
                        Fill
                        <input className="h-10 rounded border border-zinc-800 bg-black p-1" type="color" value={selectedPart.fill} onChange={(event) => updateSelectedPart({ fill: event.target.value })} />
                      </label>
                      <label className="grid gap-1 text-xs text-zinc-400">
                        Stroke
                        <input className="h-10 rounded border border-zinc-800 bg-black p-1" type="color" value={selectedPart.stroke} onChange={(event) => updateSelectedPart({ stroke: event.target.value })} />
                      </label>
                    </div>
                  ) : null}
                  <select className="rounded border border-zinc-800 bg-black px-2 py-2 text-sm text-zinc-100" onChange={(event) => {
                    const preset = ASSET_CREATOR_PRESETS.find((item) => item.id === event.target.value);
                    if (preset) {
                      setAssetDraft({ ...preset, id: `custom_${preset.id}_${Date.now()}` });
                      setSelectedPartId(preset.parts[0]?.id ?? "");
                    }
                  }} value="">
                    <option value="">Preset</option>
                    {ASSET_CREATOR_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>{preset.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3 text-xs text-zinc-400">
                <div>Selected: {selectedEntityId}</div>
                <select className="mt-2 w-full rounded border border-zinc-800 bg-black px-2 py-2 text-sm text-zinc-100" value={selectedEntityId} onChange={(event) => setSelectedEntityId(event.target.value)}>
                  {["player_start", ...map.objects.map((item) => item.id), ...map.buildings.map((item) => item.id), ...map.npcs.map((item) => item.id), ...map.enemies.map((item) => item.id), ...map.collisions.map((item) => item.id)].map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
