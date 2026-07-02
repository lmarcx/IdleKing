"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  Eraser,
  FileJson,
  FolderOpen,
  Grid2X2,
  MousePointer2,
  Paintbrush,
  Plus,
  Save,
  Shapes,
  Trash2,
} from "lucide-react";

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
  type MapBuilding,
  type MapCollision,
  type MapEnemy,
  type MapNpc,
  type MapObject,
  type MapTile,
  type MapTrigger,
  type PlayableMap,
  type PrimitivePart,
  type TopographyCellState,
} from "@idleking/game-core/level-editor";

const STORAGE_MAP_KEY = "aworlddreamt:level-editor-v0:map";
const STORAGE_ASSETS_KEY = "aworlddreamt:level-editor-v0:assets";

type EditorTool = "brush" | "eraser" | "select";
type SelectionKind = "spawn" | "object" | "building" | "npc" | "enemy" | "collision" | "trigger";
type Selection = { kind: SelectionKind; id: string };

const steps = [
  "Topographie",
  "Textures",
  "Nature",
  "Batiments",
  "PNJ",
  "Objets",
  "Ennemis",
  "Collisions / Triggers",
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

const textureBackgrounds: Record<GroundTextureId, string> = {
  grass: "linear-gradient(135deg, rgba(255,255,255,.08) 25%, transparent 25%)",
  dirt: "radial-gradient(circle at 30% 35%, rgba(255,255,255,.12) 0 1px, transparent 2px)",
  sand: "radial-gradient(circle at 70% 35%, rgba(255,255,255,.16) 0 1px, transparent 2px)",
  water: "repeating-linear-gradient(0deg, transparent 0 7px, rgba(180,220,240,.22) 8px 9px)",
  rock: "linear-gradient(45deg, rgba(255,255,255,.08) 0 25%, transparent 25% 50%, rgba(255,255,255,.08) 50% 75%, transparent 75%)",
  ice: "linear-gradient(135deg, rgba(220,245,255,.22), transparent 55%)",
  lava: "repeating-linear-gradient(45deg, rgba(230,160,140,.35) 0 4px, transparent 4px 10px)",
  stone: "linear-gradient(90deg, rgba(255,255,255,.12) 0 1px, transparent 1px 100%), linear-gradient(0deg, rgba(255,255,255,.1) 0 1px, transparent 1px 100%)",
  void: "repeating-linear-gradient(45deg, rgba(255,255,255,.08) 0 1px, transparent 1px 6px)",
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

function setCellState(map: PlayableMap, x: number, y: number, state: TopographyCellState): PlayableMap {
  return {
    ...map,
    topography: {
      cells: [...map.topography.cells.filter((cell) => cell.x !== x || cell.y !== y), ...(state === "playable" ? [] : [{ x, y, state }])],
    },
  };
}

function getTile(map: PlayableMap, x: number, y: number): MapTile | undefined {
  for (let index = map.tiles.length - 1; index >= 0; index -= 1) {
    const tile = map.tiles[index];
    if (tile.x === x && tile.y === y) return tile;
  }
  return undefined;
}

function upsertTile(tiles: readonly MapTile[], next: MapTile): readonly MapTile[] {
  return [...tiles.filter((tile) => tile.x !== next.x || tile.y !== next.y), next];
}

function isCellUsable(map: PlayableMap, x: number, y: number): boolean {
  const state = getCellState(map, x, y);
  if (state !== "playable") return false;
  return getTile(map, x, y)?.walkable ?? true;
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

function isPlacementStep(step: number): boolean {
  return step >= 2 && step <= 7;
}

function inputClassName() {
  return "rounded border border-zinc-800 bg-black px-2 py-2 text-zinc-100";
}

function getSelectionLabel(selection: Selection | null): string {
  return selection ? `${selection.kind}: ${selection.id}` : "None";
}

export function LevelEditorV0() {
  const [map, setMap] = useState<PlayableMap>(() => TEST_MAP_01);
  const [customAssets, setCustomAssets] = useState<GeometricAsset[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [tool, setTool] = useState<EditorTool>("brush");
  const [topographyPaint, setTopographyPaint] = useState<TopographyCellState>("dead");
  const [isPainting, setIsPainting] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("tree_simple_01");
  const [selectedTextureId, setSelectedTextureId] = useState<GroundTextureId>("grass");
  const [selection, setSelection] = useState<Selection | null>({ kind: "spawn", id: "player_start" });
  const [assetDraft, setAssetDraft] = useState<GeometricAsset>(() => createAssetDraft());
  const [selectedPartId, setSelectedPartId] = useState(assetDraft.parts[0]?.id ?? "");
  const [lastSaveMessage, setLastSaveMessage] = useState("No local save yet.");

  useEffect(() => {
    const stopPainting = () => setIsPainting(false);
    window.addEventListener("pointerup", stopPainting);
    return () => window.removeEventListener("pointerup", stopPainting);
  }, []);

  const registry = useMemo(() => createAssetRegistry({ customAssets }), [customAssets]);
  const category = stepCategory[activeStep];
  const paletteAssets = category && category !== "textures" && category !== "collisions" ? getAssetsByCategory(registry, category) : registry.assets;
  const selectedAsset = registry.assets.find((asset) => asset.id === selectedAssetId) ?? registry.assets[0];
  const selectedPart = assetDraft.parts.find((part) => part.id === selectedPartId) ?? assetDraft.parts[0];

  const selectedEntity = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === "spawn") return map.spawns.find((item) => item.id === selection.id) ?? null;
    if (selection.kind === "object") return map.objects.find((item) => item.id === selection.id) ?? null;
    if (selection.kind === "building") return map.buildings.find((item) => item.id === selection.id) ?? null;
    if (selection.kind === "npc") return map.npcs.find((item) => item.id === selection.id) ?? null;
    if (selection.kind === "enemy") return map.enemies.find((item) => item.id === selection.id) ?? null;
    if (selection.kind === "collision") return map.collisions.find((item) => item.id === selection.id) ?? null;
    return map.triggers.find((item) => item.id === selection.id) ?? null;
  }, [map, selection]);

  function saveMap() {
    localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(map));
    setLastSaveMessage(`Map saved locally as ${map.id}.`);
  }

  function loadMap() {
    const raw = localStorage.getItem(STORAGE_MAP_KEY);
    if (!raw) {
      setLastSaveMessage("No local map found.");
      return;
    }
    setMap(JSON.parse(raw) as PlayableMap);
    setLastSaveMessage("Local map loaded.");
  }

  function saveAsset() {
    const normalized: GeometricAsset = {
      ...assetDraft,
      id: assetDraft.id.trim() || `custom_asset_${Date.now()}`,
      name: assetDraft.name.trim() || "Custom Asset",
      parts: [...assetDraft.parts].sort((a, b) => a.layer - b.layer),
    };
    const next = [...customAssets.filter((asset) => asset.id !== normalized.id), normalized];
    setCustomAssets(next);
    setAssetDraft(normalized);
    localStorage.setItem(STORAGE_ASSETS_KEY, JSON.stringify(next));
    setSelectedAssetId(normalized.id);
    setLastSaveMessage(`Asset ${normalized.name} saved to local library.`);
  }

  function loadAssets() {
    const raw = localStorage.getItem(STORAGE_ASSETS_KEY);
    if (!raw) {
      setLastSaveMessage("No local assets found.");
      return;
    }
    const loadedAssets = JSON.parse(raw) as GeometricAsset[];
    setCustomAssets(loadedAssets);
    setLastSaveMessage(`${loadedAssets.length} local assets loaded.`);
  }

  function placeEntityAt(x: number, y: number) {
    if (!isCellUsable(map, x, y)) {
      setLastSaveMessage("Cannot place on a dead or blocked cell.");
      return;
    }
    const px = x * map.grid.cellSize;
    const py = y * map.grid.cellSize;

    if (activeStep === 3) {
      const entity: MapBuilding = {
        id: `building_${map.buildings.length + 1}`,
        assetId: selectedAsset.id,
        function: "house",
        x: px,
        y: py,
        collision: selectedAsset.defaultCollision,
        interaction: selectedAsset.defaultInteraction,
      };
      setMap((current) => ({ ...current, buildings: [...current.buildings, entity] }));
      setSelection({ kind: "building", id: entity.id });
      return;
    }

    if (activeStep === 4) {
      const entity: MapNpc = {
        id: `npc_${map.npcs.length + 1}`,
        assetId: selectedAsset.id,
        name: "New NPC",
        type: "villager",
        behavior: "idle",
        interaction: "dialogue",
        x: px,
        y: py,
      };
      setMap((current) => ({ ...current, npcs: [...current.npcs, entity] }));
      setSelection({ kind: "npc", id: entity.id });
      return;
    }

    if (activeStep === 6) {
      const entity: MapEnemy = {
        id: `enemy_${map.enemies.length + 1}`,
        assetId: selectedAsset.id,
        enemyId: selectedAsset.id,
        name: "New Enemy",
        stats: { hp: 24, attack: 4, defense: 1, speed: 60 },
        behavior: "idle",
        aggroRadius: 96,
        x: px,
        y: py,
      };
      setMap((current) => ({ ...current, enemies: [...current.enemies, entity] }));
      setSelection({ kind: "enemy", id: entity.id });
      return;
    }

    if (activeStep === 7) {
      if (selectedAssetId === "trigger") {
        const entity: MapTrigger = { id: `trigger_${map.triggers.length + 1}`, type: "event", x: px, y: py, width: map.grid.cellSize, height: map.grid.cellSize, target: "debug_event" };
        setMap((current) => ({ ...current, triggers: [...current.triggers, entity] }));
        setSelection({ kind: "trigger", id: entity.id });
        return;
      }
      const entity: MapCollision = { id: `collision_${map.collisions.length + 1}`, type: "box", x: px, y: py, width: map.grid.cellSize, height: map.grid.cellSize };
      setMap((current) => ({ ...current, collisions: [...current.collisions, entity] }));
      setSelection({ kind: "collision", id: entity.id });
      return;
    }

    const entity: MapObject = {
      id: `${activeStep === 5 ? "object" : "nature"}_${map.objects.length + 1}`,
      assetId: selectedAsset.id,
      kind: activeStep === 5 ? "object" : "nature",
      x: px,
      y: py,
      rotation: 0,
      interaction: selectedAsset.defaultInteraction,
    };
    setMap((current) => ({ ...current, objects: [...current.objects, entity] }));
    setSelection({ kind: "object", id: entity.id });
  }

  function eraseAtCell(x: number, y: number) {
    const px = x * map.grid.cellSize;
    const py = y * map.grid.cellSize;
    const within = (entity: { x: number; y: number }) => entity.x >= px && entity.x < px + map.grid.cellSize && entity.y >= py && entity.y < py + map.grid.cellSize;
    setMap((current) => ({
      ...current,
      objects: current.objects.filter((entity) => !within(entity)),
      buildings: current.buildings.filter((entity) => !within(entity)),
      npcs: current.npcs.filter((entity) => !within(entity)),
      enemies: current.enemies.filter((entity) => !within(entity)),
      collisions: current.collisions.filter((entity) => !within(entity)),
      triggers: current.triggers.filter((entity) => !within(entity)),
    }));
  }

  function paintCell(x: number, y: number) {
    if (tool === "select") return;
    if (tool === "eraser") {
      if (activeStep === 0) setMap((current) => setCellState(current, x, y, "playable"));
      else if (activeStep === 1) {
        const texture = getGroundTexture("grass") ?? GROUND_TEXTURES[0];
        setMap((current) => ({ ...current, tiles: upsertTile(current.tiles, { x, y, textureId: texture.id, walkable: texture.walkable }) }));
      } else eraseAtCell(x, y);
      return;
    }

    if (activeStep === 0) {
      setMap((current) => setCellState(current, x, y, topographyPaint));
      return;
    }

    if (activeStep === 1) {
      if (getCellState(map, x, y) !== "playable") return;
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

    if (isPlacementStep(activeStep)) placeEntityAt(x, y);
  }

  function updateSelectedPart(patch: Partial<PrimitivePart>) {
    setAssetDraft((current) => ({
      ...current,
      parts: current.parts.map((part) => (part.id === selectedPart?.id ? { ...part, ...patch } : part)),
    }));
  }

  function deletePart(id: string) {
    setAssetDraft((current) => {
      const parts = current.parts.filter((part) => part.id !== id);
      setSelectedPartId(parts[0]?.id ?? "");
      return { ...current, parts };
    });
  }

  function duplicatePart(part: PrimitivePart) {
    const copy: PrimitivePart = { ...part, id: `${part.id}_copy`, x: part.x + 6, y: part.y + 6, layer: part.layer + 1 };
    setAssetDraft((current) => ({ ...current, parts: [...current.parts, copy] }));
    setSelectedPartId(copy.id);
  }

  function movePartLayer(part: PrimitivePart, direction: -1 | 1) {
    updateSelectedPart({ layer: Math.max(1, part.layer + direction) });
  }

  function deleteSelection() {
    if (!selection || selection.kind === "spawn") return;
    setMap((current) => ({
      ...current,
      objects: selection.kind === "object" ? current.objects.filter((item) => item.id !== selection.id) : current.objects,
      buildings: selection.kind === "building" ? current.buildings.filter((item) => item.id !== selection.id) : current.buildings,
      npcs: selection.kind === "npc" ? current.npcs.filter((item) => item.id !== selection.id) : current.npcs,
      enemies: selection.kind === "enemy" ? current.enemies.filter((item) => item.id !== selection.id) : current.enemies,
      collisions: selection.kind === "collision" ? current.collisions.filter((item) => item.id !== selection.id) : current.collisions,
      triggers: selection.kind === "trigger" ? current.triggers.filter((item) => item.id !== selection.id) : current.triggers,
    }));
    setSelection(null);
  }

  function patchSelection(patch: Record<string, string | number | null>) {
    if (!selection) return;
    setMap((current) => ({
      ...current,
      objects: selection.kind === "object" ? current.objects.map((item) => (item.id === selection.id ? ({ ...item, ...patch } as MapObject) : item)) : current.objects,
      buildings: selection.kind === "building" ? current.buildings.map((item) => (item.id === selection.id ? ({ ...item, ...patch } as MapBuilding) : item)) : current.buildings,
      npcs: selection.kind === "npc" ? current.npcs.map((item) => (item.id === selection.id ? ({ ...item, ...patch } as MapNpc) : item)) : current.npcs,
      enemies: selection.kind === "enemy" ? current.enemies.map((item) => (item.id === selection.id ? ({ ...item, ...patch } as MapEnemy) : item)) : current.enemies,
      collisions: selection.kind === "collision" ? current.collisions.map((item) => (item.id === selection.id ? ({ ...item, ...patch } as MapCollision) : item)) : current.collisions,
      triggers: selection.kind === "trigger" ? current.triggers.map((item) => (item.id === selection.id ? ({ ...item, ...patch } as MapTrigger) : item)) : current.triggers,
      spawns: selection.kind === "spawn" ? current.spawns.map((item) => (item.id === selection.id ? { ...item, ...patch } : item)) : current.spawns,
    }));
  }

  const markers = [
    ...map.objects.map((item) => ({ kind: "object" as const, id: item.id, x: item.x, y: item.y, label: item.kind === "nature" ? "N" : "O", className: "border-emerald-300 text-emerald-100" })),
    ...map.buildings.map((item) => ({ kind: "building" as const, id: item.id, x: item.x, y: item.y, label: "B", className: "border-zinc-100 text-zinc-100" })),
    ...map.npcs.map((item) => ({ kind: "npc" as const, id: item.id, x: item.x, y: item.y, label: "P", className: "border-sky-200 text-sky-100" })),
    ...map.enemies.map((item) => ({ kind: "enemy" as const, id: item.id, x: item.x, y: item.y, label: "E", className: "border-red-200 text-red-100" })),
    ...map.collisions.map((item) => ({ kind: "collision" as const, id: item.id, x: item.x, y: item.y, label: "C", className: "border-zinc-500 text-zinc-300" })),
    ...map.triggers.map((item) => ({ kind: "trigger" as const, id: item.id, x: item.x, y: item.y, label: "T", className: "border-cyan-200 text-cyan-100" })),
    ...map.spawns.map((item) => ({ kind: "spawn" as const, id: item.id, x: item.x, y: item.y, label: "S", className: "border-amber-200 text-amber-100" })),
  ];

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
          <Link className="font-ik-menu inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground" href="/game/custom-map/test_map_01">
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
          <span className="ml-auto text-xs text-zinc-500">{lastSaveMessage}</span>
        </header>

        <nav className="grid gap-2 border-b border-zinc-800 bg-zinc-950 px-3 py-2 xl:grid-cols-[1fr_auto]">
          <div className="flex gap-1 overflow-x-auto">
            {steps.map((step, index) => (
              <button
                className={`h-10 shrink-0 rounded-md border px-3 font-ik-menu text-[0.62rem] ${activeStep === index ? "border-zinc-100 bg-zinc-100 text-zinc-950" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}
                key={step}
                onClick={() => setActiveStep(index)}
                type="button"
              >
                {index + 1}. {step}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(["brush", "eraser", "select"] as const).map((item) => {
              const Icon = item === "brush" ? Paintbrush : item === "eraser" ? Eraser : MousePointer2;
              return (
                <button className={`h-10 rounded-md border px-3 ${tool === item ? "border-zinc-100 bg-zinc-100 text-zinc-950" : "border-zinc-800 bg-black text-zinc-400"}`} key={item} onClick={() => setTool(item)} type="button">
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </nav>

        <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
          <aside className="border-r border-zinc-800 bg-zinc-950 p-3">
            <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
              <span className="rounded border border-zinc-800 p-2">Assets {registry.assets.length}</span>
              <span className="rounded border border-zinc-800 p-2">Objects {map.objects.length}</span>
              <span className="rounded border border-zinc-800 p-2">NPC {map.npcs.length}</span>
              <span className="rounded border border-zinc-800 p-2">Enemies {map.enemies.length}</span>
            </div>

            {activeStep === 0 ? (
              <div className="grid gap-2">
                {(["playable", "dead"] as const).map((state) => (
                  <button className={`rounded-md border p-2 text-left text-sm ${topographyPaint === state ? "border-zinc-100" : "border-zinc-800"}`} key={state} onClick={() => setTopographyPaint(state)} type="button">
                    {state === "playable" ? "Playable cell" : "Dead / blocked cell"}
                  </button>
                ))}
              </div>
            ) : activeStep === 1 ? (
              <div className="grid gap-2">
                {GROUND_TEXTURES.filter((texture) => texture.id !== "void").map((texture) => (
                  <button className={`flex items-center justify-between rounded-md border p-2 text-left text-sm ${selectedTextureId === texture.id ? "border-zinc-100" : "border-zinc-800"}`} key={texture.id} onClick={() => setSelectedTextureId(texture.id)} type="button">
                    <span>{texture.name}</span>
                    <span className="h-6 w-10 border border-zinc-700" style={{ backgroundColor: texture.fill, backgroundImage: textureBackgrounds[texture.id] }} />
                  </button>
                ))}
              </div>
            ) : activeStep === 7 ? (
              <div className="grid gap-2">
                <button className="rounded-md border border-zinc-100 p-3 text-left text-sm" onClick={() => setSelectedAssetId("collision")} type="button">Collision box</button>
                <button className="rounded-md border border-zinc-800 p-3 text-left text-sm text-zinc-400" onClick={() => setSelectedAssetId("trigger")} type="button">Trigger marker</button>
              </div>
            ) : (
              <div className="grid gap-2">
                {paletteAssets.map((asset) => (
                  <button className={`grid grid-cols-[56px_1fr] items-center gap-2 rounded-md border p-2 text-left ${selectedAssetId === asset.id ? "border-zinc-100" : "border-zinc-800"}`} key={asset.id} onClick={() => setSelectedAssetId(asset.id)} type="button">
                    <AssetPreview asset={asset} className="h-14 w-14 border border-zinc-800" />
                    <span className="text-sm">{asset.name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-1">
              {ASSET_PALETTE_CATEGORIES.map((item) => (
                <span className="rounded border border-zinc-800 px-2 py-1 text-[0.62rem] uppercase text-zinc-500" key={item}>{item}</span>
              ))}
            </div>
          </aside>

          <section className="min-h-[560px] overflow-auto bg-[#0b0b0b] p-4">
            <div className="relative w-fit">
              <div className="grid w-fit border border-zinc-700" style={{ gridTemplateColumns: `repeat(${map.grid.width}, ${map.grid.cellSize}px)` }}>
                {Array.from({ length: map.grid.width * map.grid.height }, (_, index) => {
                  const x = index % map.grid.width;
                  const y = Math.floor(index / map.grid.width);
                  const tile = getTile(map, x, y);
                  const texture = getGroundTexture(tile?.textureId ?? "grass") ?? GROUND_TEXTURES[0];
                  const state = getCellState(map, x, y);
                  const dead = state !== "playable";
                  return (
                    <button
                      aria-label={`cell ${x} ${y}`}
                      className="relative border border-zinc-800"
                      key={`${x}:${y}`}
                      onPointerDown={() => {
                        setIsPainting(true);
                        paintCell(x, y);
                      }}
                      onPointerEnter={() => {
                        if (isPainting && (tool === "brush" || tool === "eraser")) paintCell(x, y);
                      }}
                      style={{
                        width: map.grid.cellSize,
                        height: map.grid.cellSize,
                        backgroundColor: dead ? "#050505" : texture.fill,
                        backgroundImage: dead ? "repeating-linear-gradient(45deg, rgba(255,255,255,.28) 0 2px, transparent 2px 7px)" : textureBackgrounds[texture.id],
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
                  className={`absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-sm border bg-black/78 text-[0.62rem] font-bold ${marker.className} ${selection?.kind === marker.kind && selection.id === marker.id ? "ring-2 ring-white" : ""}`}
                  key={`${marker.kind}:${marker.id}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setTool("select");
                    setSelection({ kind: marker.kind, id: marker.id });
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

          <aside className="overflow-auto border-l border-zinc-800 bg-zinc-950 p-3">
            <div className="grid gap-3">
              <div className="grid gap-2 rounded-md border border-zinc-800 p-3">
                <h2 className="font-ik-menu text-xs text-zinc-300">Map</h2>
                <label className="grid gap-1 text-xs text-zinc-400">Map ID<input className={inputClassName()} value={map.id} onChange={(event) => setMap({ ...map, id: event.target.value })} /></label>
                <label className="grid gap-1 text-xs text-zinc-400">Name<input className={inputClassName()} value={map.name} onChange={(event) => setMap({ ...map, name: event.target.value })} /></label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="grid gap-1 text-xs text-zinc-400">Width<input className={inputClassName()} type="number" value={map.grid.width} onChange={(event) => setMap({ ...map, grid: { ...map.grid, width: Number(event.target.value) } })} /></label>
                  <label className="grid gap-1 text-xs text-zinc-400">Height<input className={inputClassName()} type="number" value={map.grid.height} onChange={(event) => setMap({ ...map, grid: { ...map.grid, height: Number(event.target.value) } })} /></label>
                  <label className="grid gap-1 text-xs text-zinc-400">Cell<input className={inputClassName()} type="number" value={map.grid.cellSize} onChange={(event) => setMap({ ...map, grid: { ...map.grid, cellSize: Number(event.target.value) } })} /></label>
                </div>
              </div>

              <div className="grid gap-2 rounded-md border border-zinc-800 p-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-ik-menu text-xs text-zinc-300">Selection</h2>
                  <Button disabled={!selection || selection.kind === "spawn"} size="sm" variant="ghost" onClick={deleteSelection}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="text-xs text-zinc-500">{getSelectionLabel(selection)}</div>
                {selectedEntity && "x" in selectedEntity ? (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1 text-xs text-zinc-400">X<input className={inputClassName()} type="number" value={selectedEntity.x} onChange={(event) => patchSelection({ x: Number(event.target.value) })} /></label>
                    <label className="grid gap-1 text-xs text-zinc-400">Y<input className={inputClassName()} type="number" value={selectedEntity.y} onChange={(event) => patchSelection({ y: Number(event.target.value) })} /></label>
                    {"rotation" in selectedEntity ? <label className="grid gap-1 text-xs text-zinc-400">Rotation<input className={inputClassName()} type="number" value={Number(selectedEntity.rotation)} onChange={(event) => patchSelection({ rotation: Number(event.target.value) })} /></label> : null}
                    {"width" in selectedEntity ? <label className="grid gap-1 text-xs text-zinc-400">Width<input className={inputClassName()} type="number" value={Number(selectedEntity.width)} onChange={(event) => patchSelection({ width: Number(event.target.value) })} /></label> : null}
                    {"height" in selectedEntity ? <label className="grid gap-1 text-xs text-zinc-400">Height<input className={inputClassName()} type="number" value={Number(selectedEntity.height)} onChange={(event) => patchSelection({ height: Number(event.target.value) })} /></label> : null}
                    {"name" in selectedEntity ? <label className="col-span-2 grid gap-1 text-xs text-zinc-400">Name<input className={inputClassName()} value={String(selectedEntity.name)} onChange={(event) => patchSelection({ name: event.target.value })} /></label> : null}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 rounded-md border border-zinc-800 p-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-ik-menu text-xs text-zinc-300">Asset Creator</h2>
                  <Button size="sm" variant="ghost" onClick={() => downloadJson(`${assetDraft.id}.asset.json`, assetDraft)}>Export</Button>
                </div>
                <AssetPreview asset={assetDraft} className="h-44 w-full rounded-md border border-zinc-700 bg-black" />
                <input className={inputClassName()} value={assetDraft.id} onChange={(event) => setAssetDraft({ ...assetDraft, id: event.target.value })} />
                <input className={inputClassName()} value={assetDraft.name} onChange={(event) => setAssetDraft({ ...assetDraft, name: event.target.value })} />
                <select className={inputClassName()} value={assetDraft.category} onChange={(event) => setAssetDraft({ ...assetDraft, category: event.target.value as AssetCategory })}>
                  {ASSET_PALETTE_CATEGORIES.filter((item) => item !== "textures").map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <div className="grid grid-cols-5 gap-1">
                  {(["rect", "circle", "triangle", "line", "polygon"] as const).map((shape) => (
                    <Button key={shape} size="sm" variant="outline" onClick={() => {
                      const part = createPrimitive(shape, assetDraft.parts.length);
                      setAssetDraft({ ...assetDraft, parts: [...assetDraft.parts, part] });
                      setSelectedPartId(part.id);
                    }}>{shape.slice(0, 3)}</Button>
                  ))}
                </div>
                <div className="grid max-h-40 gap-1 overflow-auto">
                  {[...assetDraft.parts].sort((a, b) => a.layer - b.layer).map((part) => (
                    <button className={`grid grid-cols-[1fr_auto] items-center rounded border px-2 py-1 text-left text-xs ${selectedPartId === part.id ? "border-zinc-100" : "border-zinc-800"}`} key={part.id} onClick={() => setSelectedPartId(part.id)} type="button">
                      <span>{part.layer}. {part.id} / {part.shape}</span>
                      <span className="h-3 w-3 border border-zinc-700" style={{ backgroundColor: part.fill }} />
                    </button>
                  ))}
                </div>
                {selectedPart ? (
                  <div className="grid gap-2">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => duplicatePart(selectedPart)}><Copy className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => movePartLayer(selectedPart, -1)}><ArrowUp className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => movePartLayer(selectedPart, 1)}><ArrowDown className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => deletePart(selectedPart.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["x", "y", "width", "height", "radius", "rotation", "strokeWidth", "opacity", "layer"] as const).map((field) => (
                        <label className="grid gap-1 text-xs text-zinc-400" key={field}>{field}<input className={inputClassName()} type="number" step={field === "opacity" ? 0.1 : 1} value={Number(selectedPart[field] ?? 0)} onChange={(event) => updateSelectedPart({ [field]: Number(event.target.value) } as Partial<PrimitivePart>)} /></label>
                      ))}
                      <label className="grid gap-1 text-xs text-zinc-400">Fill<input className="h-10 rounded border border-zinc-800 bg-black p-1" type="color" value={selectedPart.fill} onChange={(event) => updateSelectedPart({ fill: event.target.value })} /></label>
                      <label className="grid gap-1 text-xs text-zinc-400">Stroke<input className="h-10 rounded border border-zinc-800 bg-black p-1" type="color" value={selectedPart.stroke} onChange={(event) => updateSelectedPart({ stroke: event.target.value })} /></label>
                    </div>
                  </div>
                ) : null}
                <select className={inputClassName()} onChange={(event) => {
                  const preset = ASSET_CREATOR_PRESETS.find((item) => item.id === event.target.value);
                  if (preset) {
                    const next = { ...preset, id: `custom_${preset.id}_${Date.now()}` };
                    setAssetDraft(next);
                    setSelectedPartId(next.parts[0]?.id ?? "");
                  }
                }} value="">
                  <option value="">Preset</option>
                  {ASSET_CREATOR_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
                </select>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
