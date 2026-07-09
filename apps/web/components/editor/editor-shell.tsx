"use client";

import { useEffect, useMemo, useState } from "react";

import { EditorCanvas } from "@/components/editor/shell/editor-canvas";
import { EditorInspector } from "@/components/editor/shell/editor-inspector";
import { EditorToolbar } from "@/components/editor/shell/editor-toolbar";
import { EditorTree } from "@/components/editor/shell/editor-tree";
import {
  STEP_CATEGORY,
  isPlacementStep,
  type EditorTool,
  type MarkerViewModel,
  type Selection,
} from "@/components/editor/shell/editor-shared";
import {
  ASSET_CREATOR_PRESETS,
  GROUND_TEXTURES,
  TEST_MAP_01,
  createAssetRegistry,
  getAssetsByCategory,
  getGroundTexture,
  getMapTile,
  getTopographyCellState,
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

function downloadJson(name: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function setCellState(map: PlayableMap, x: number, y: number, state: TopographyCellState): PlayableMap {
  return {
    ...map,
    topography: {
      cells: [...map.topography.cells.filter((cell) => cell.x !== x || cell.y !== y), ...(state === "playable" ? [] : [{ x, y, state }])],
    },
  };
}

function upsertTile(tiles: readonly MapTile[], next: MapTile): readonly MapTile[] {
  return [...tiles.filter((tile) => tile.x !== next.x || tile.y !== next.y), next];
}

function isCellUsable(map: PlayableMap, x: number, y: number): boolean {
  if (getTopographyCellState(map, x, y) !== "playable") return false;
  return getMapTile(map, x, y)?.walkable ?? true;
}

export function EditorShell() {
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
  const category = STEP_CATEGORY[activeStep];
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
      if (getTopographyCellState(map, x, y) !== "playable") return;
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

  function selectPreset(id: string) {
    const preset = ASSET_CREATOR_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    const next = { ...preset, id: `custom_${preset.id}_${Date.now()}` };
    setAssetDraft(next);
    setSelectedPartId(next.parts[0]?.id ?? "");
  }

  const markers: MarkerViewModel[] = [
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
        <EditorToolbar
          lastSaveMessage={lastSaveMessage}
          onExportMap={() => downloadJson(`${map.id}.map.json`, map)}
          onLoadAssets={loadAssets}
          onLoadMap={loadMap}
          onNewAsset={() => setAssetDraft(createAssetDraft())}
          onNewMap={() => setMap(createEmptyMap())}
          onSaveAsset={saveAsset}
          onSaveMap={saveMap}
          onToolChange={setTool}
          tool={tool}
        />

        <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
          <EditorTree
            activeStep={activeStep}
            mapCounts={{ enemies: map.enemies.length, npcs: map.npcs.length, objects: map.objects.length }}
            onSelectAsset={setSelectedAssetId}
            onSelectTexture={setSelectedTextureId}
            onStepChange={setActiveStep}
            onTopographyPaintChange={setTopographyPaint}
            paletteAssets={paletteAssets}
            registryAssetsCount={registry.assets.length}
            selectedAssetId={selectedAssetId}
            selectedTextureId={selectedTextureId}
            topographyPaint={topographyPaint}
          />

          <EditorCanvas
            isPainting={isPainting}
            map={map}
            markers={markers}
            onCellPointerDown={(x, y) => {
              setIsPainting(true);
              paintCell(x, y);
            }}
            onCellPointerEnter={paintCell}
            onMarkerClick={(marker) => {
              setTool("select");
              setSelection({ kind: marker.kind, id: marker.id });
            }}
            selection={selection}
          />

          <EditorInspector
            assetDraft={assetDraft}
            map={map}
            onAddPart={(shape) => {
              const part = createPrimitive(shape, assetDraft.parts.length);
              setAssetDraft({ ...assetDraft, parts: [...assetDraft.parts, part] });
              setSelectedPartId(part.id);
            }}
            onAssetDraftChange={setAssetDraft}
            onDeletePart={deletePart}
            onDeleteSelection={deleteSelection}
            onDuplicatePart={duplicatePart}
            onExportAsset={() => downloadJson(`${assetDraft.id}.asset.json`, assetDraft)}
            onGridChange={(patch) => setMap({ ...map, grid: { ...map.grid, ...patch } })}
            onMapIdChange={(id) => setMap({ ...map, id })}
            onMapNameChange={(name) => setMap({ ...map, name })}
            onMovePartLayer={movePartLayer}
            onPatchSelection={patchSelection}
            onSelectPart={setSelectedPartId}
            onSelectPreset={selectPreset}
            onUpdateSelectedPart={updateSelectedPart}
            selectedEntity={selectedEntity}
            selectedPart={selectedPart}
            selectedPartId={selectedPartId}
            selection={selection}
          />
        </main>
      </div>
    </div>
  );
}
