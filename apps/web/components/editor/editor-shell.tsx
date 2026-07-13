"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AssetModePanel } from "@/components/editor/shell/asset-mode-panel";
import { EditorCanvas } from "@/components/editor/shell/editor-canvas";
import { EditorInspector } from "@/components/editor/shell/editor-inspector";
import { EditorToolbar } from "@/components/editor/shell/editor-toolbar";
import { EditorTree } from "@/components/editor/shell/editor-tree";
import { KingdomStagePanel } from "@/components/editor/shell/kingdom-stage-panel";
import { PlaceholderPanel } from "@/components/editor/shell/placeholder-panel";
import { ProjectTree, type EraOrigin } from "@/components/editor/shell/project-tree";
import { StoryDungeonEmptyPanel } from "@/components/editor/shell/story-dungeon-empty-panel";
import {
  STEP_CATEGORY,
  isPlacementStep,
  type ActiveDocument,
  type EditorMode,
  type EditorTool,
  type MarkerViewModel,
  type PlaceholderDocumentInfo,
  type Selection,
} from "@/components/editor/shell/editor-shared";
import { hasDocument, listDocuments, loadDocument, saveDocument, type EditorDocumentIndexEntry } from "@/lib/editor-document-store";
import { STORY_ERA_GROUPS } from "@/lib/story-era-groups";
import { getStoryBossDefinition, getStoryDungeonDefinition, type StoryDungeonDefinition } from "@idleking/game-core";
import {
  ASSET_CREATOR_PRESETS,
  GROUND_TEXTURES,
  KINGDOM_STAGE_DEFINITION,
  TEST_MAP_01,
  assertValidAsset,
  createAssetRegistry,
  getAssetsByCategory,
  getCanonicalStoryMap,
  getGroundTexture,
  getMapTile,
  getTopographyCellState,
  validateKingdomStageDefinition,
  validatePlayableMap,
  type CollisionShape,
  type GeometricAsset,
  type GeometryShape,
  type GroundTextureId,
  type InteractionDefinition,
  type KingdomBuilding,
  type KingdomCollider,
  type KingdomNpc,
  type KingdomProp,
  type KingdomStageDefinition,
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

function normalizeCollisionShape(collision: CollisionShape | null): CollisionShape | null {
  if (!collision) return null;
  const normalized: { height?: number; radius?: number; type: CollisionShape["type"]; width?: number; x: number; y: number } = {
    type: collision.type,
    x: collision.x,
    y: collision.y,
  };
  if (collision.width !== undefined) normalized.width = collision.width;
  if (collision.height !== undefined) normalized.height = collision.height;
  if (collision.radius !== undefined) normalized.radius = collision.radius;
  return normalized;
}

function normalizeInteractionDefinition(interaction: InteractionDefinition | null): InteractionDefinition | null {
  if (!interaction) return null;
  return {
    interactionType: interaction.interactionType,
    interactionTargetId: interaction.interactionTargetId,
    promptLabel: interaction.promptLabel,
    radius: interaction.radius,
  };
}

function byId(a: { id: string }, b: { id: string }): number {
  return a.id.localeCompare(b.id);
}

/**
 * Produces a deterministic, key-order-stable, diff-friendly snapshot of a Kingdom Stage
 * document -- same semantic content always serializes identically, regardless of the local
 * document's incidental array/object-key order. Used only for the "Export Canonical Kingdom
 * Stage" download; never written to the repo automatically (see Export Canonical Kingdom Stage
 * in EditorToolbar and packages/game-core/content/kingdom/kingdom-stage.ts for the manual
 * promotion this feeds into).
 */
function buildCanonicalKingdomStageExport(stage: KingdomStageDefinition): KingdomStageDefinition {
  const buildings: KingdomBuilding[] = [...stage.buildings].sort(byId).map((building) => ({
    id: building.id,
    assetId: building.assetId,
    x: building.x,
    y: building.y,
    collision: normalizeCollisionShape(building.collision),
    interaction: normalizeInteractionDefinition(building.interaction),
  }));
  const npcs: KingdomNpc[] = [...stage.npcs].sort(byId).map((npc) => ({
    id: npc.id,
    assetId: npc.assetId,
    name: npc.name,
    x: npc.x,
    y: npc.y,
    interaction: normalizeInteractionDefinition(npc.interaction),
  }));
  const props: KingdomProp[] = [...stage.props].sort(byId).map((prop) => ({
    id: prop.id,
    assetId: prop.assetId,
    x: prop.x,
    y: prop.y,
    ...(prop.rotation !== undefined ? { rotation: prop.rotation } : {}),
  }));
  const colliders: KingdomCollider[] = [...stage.colliders].sort(byId).map((collider) => {
    const shape = normalizeCollisionShape(collider);
    // KingdomCollider is `{ id } & CollisionShape` (flat), not `{ id, collision }`.
    return { id: collider.id, ...(shape as CollisionShape) };
  });

  return {
    id: stage.id,
    name: stage.name,
    // Exporting for canonical promotion always targets "canon", regardless of the local
    // document's current status -- that is the entire point of this export.
    status: "canon",
    version: stage.version,
    buildings,
    npcs,
    props,
    colliders,
    spawn: { x: stage.spawn.x, y: stage.spawn.y },
  };
}

function byCoordinate(a: { x: number; y: number }, b: { x: number; y: number }): number {
  if (a.y !== b.y) return a.y - b.y;
  return a.x - b.x;
}

/**
 * Produces a deterministic, key-order-stable, diff-friendly snapshot of a Story-dungeon-linked
 * PlayableMap document -- same semantic content always serializes identically, regardless of the
 * local document's incidental array/object-key order. Used only for the "Export Canonical Story
 * Map" download; never written to the repo automatically (see Export Canonical Story Map in
 * EditorToolbar and scripts/story-map-promote.mjs for the manual promotion this feeds into).
 * Forces id === dungeonId and mode: "story" -- the caller has already checked map.id matches
 * before calling this, this just makes the invariant explicit in the exported document too.
 * PlayableMap has no reward/unlock/storyFlag fields to begin with (spatial data only), so there
 * is nothing of that kind to strip here.
 */
function buildCanonicalStoryMapExport(map: PlayableMap, dungeonId: string): PlayableMap {
  const topography = {
    cells: [...map.topography.cells].sort(byCoordinate).map((cell) => ({ x: cell.x, y: cell.y, state: cell.state })),
  };
  const tiles: MapTile[] = [...map.tiles].sort(byCoordinate).map((tile) => ({
    x: tile.x,
    y: tile.y,
    textureId: tile.textureId,
    walkable: tile.walkable,
    ...(tile.movementModifier !== undefined ? { movementModifier: tile.movementModifier } : {}),
    ...(tile.damage !== undefined ? { damage: tile.damage } : {}),
  }));
  const objects: MapObject[] = [...map.objects].sort(byId).map((object) => ({
    id: object.id,
    assetId: object.assetId,
    kind: object.kind,
    x: object.x,
    y: object.y,
    rotation: object.rotation,
    ...(object.interaction !== undefined ? { interaction: object.interaction } : {}),
    ...(object.systemInteraction !== undefined ? { systemInteraction: object.systemInteraction } : {}),
  }));
  const buildings: MapBuilding[] = [...map.buildings].sort(byId).map((building) => ({
    id: building.id,
    assetId: building.assetId,
    function: building.function,
    x: building.x,
    y: building.y,
    collision: normalizeCollisionShape(building.collision),
    ...(building.interaction !== undefined ? { interaction: building.interaction } : {}),
    ...(building.systemInteraction !== undefined ? { systemInteraction: building.systemInteraction } : {}),
  }));
  const npcs: MapNpc[] = [...map.npcs].sort(byId).map((npc) => ({
    id: npc.id,
    assetId: npc.assetId,
    name: npc.name,
    type: npc.type,
    behavior: npc.behavior,
    interaction: npc.interaction,
    ...(npc.systemInteraction !== undefined ? { systemInteraction: npc.systemInteraction } : {}),
    x: npc.x,
    y: npc.y,
  }));
  const enemies: MapEnemy[] = [...map.enemies].sort(byId).map((enemy) => ({
    id: enemy.id,
    assetId: enemy.assetId,
    enemyId: enemy.enemyId,
    name: enemy.name,
    stats: { hp: enemy.stats.hp, attack: enemy.stats.attack, defense: enemy.stats.defense, speed: enemy.stats.speed },
    behavior: enemy.behavior,
    aggroRadius: enemy.aggroRadius,
    ...(enemy.loot !== undefined ? { loot: [...enemy.loot] } : {}),
    ...(enemy.deathEvent !== undefined ? { deathEvent: enemy.deathEvent } : {}),
    ...(enemy.isBoss !== undefined ? { isBoss: enemy.isBoss } : {}),
    x: enemy.x,
    y: enemy.y,
  }));
  const collisions: MapCollision[] = [...map.collisions].sort(byId).map((collision) => ({
    id: collision.id,
    type: collision.type,
    x: collision.x,
    y: collision.y,
    width: collision.width,
    height: collision.height,
  }));
  const triggers: MapTrigger[] = [...map.triggers].sort(byId).map((trigger) => ({
    id: trigger.id,
    type: trigger.type,
    x: trigger.x,
    y: trigger.y,
    width: trigger.width,
    height: trigger.height,
    ...(trigger.target !== undefined ? { target: trigger.target } : {}),
  }));
  const puzzles = [...map.puzzles].sort(byId).map((puzzle) => ({
    id: puzzle.id,
    sourceId: puzzle.sourceId,
    action: puzzle.action,
    targetId: puzzle.targetId,
    ...(puzzle.condition !== undefined ? { condition: puzzle.condition } : {}),
  }));
  const spawns = [...map.spawns].sort(byId).map((spawn) => ({ id: spawn.id, x: spawn.x, y: spawn.y }));

  return {
    id: dungeonId,
    name: map.name,
    version: map.version,
    world: map.world,
    mode: "story",
    chapter: map.chapter,
    grid: { width: map.grid.width, height: map.grid.height, cellSize: map.grid.cellSize },
    topography,
    tiles,
    objects,
    buildings,
    npcs,
    enemies,
    collisions,
    triggers,
    puzzles,
    spawns,
    metadata: { createdWith: "AWorldDreamtLevelEditor", style: "minimal-geometric" },
  };
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
  const router = useRouter();
  const [mode, setMode] = useState<EditorMode>("level");
  const [placeholderDoc, setPlaceholderDoc] = useState<PlaceholderDocumentInfo | null>(null);
  const [map, setMap] = useState<PlayableMap>(() => TEST_MAP_01);
  const [currentMapOrigin, setCurrentMapOrigin] = useState<string | undefined>(undefined);
  const [activeStoryDungeonId, setActiveStoryDungeonId] = useState<string | null>(null);
  const [activeStoryMapSource, setActiveStoryMapSource] = useState<"local" | "canon" | null>(null);
  const [kingdomStage, setKingdomStage] = useState<KingdomStageDefinition>(() => KINGDOM_STAGE_DEFINITION);
  const [selectedKingdomBuildingId, setSelectedKingdomBuildingId] = useState<string | null>(null);
  const [documentIndex, setDocumentIndex] = useState<EditorDocumentIndexEntry[]>([]);
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

  useEffect(() => {
    setDocumentIndex(listDocuments());
  }, []);

  function refreshDocumentIndex() {
    setDocumentIndex(listDocuments());
  }

  const levelDocuments = useMemo(() => documentIndex.filter((entry) => entry.type === "playable_map"), [documentIndex]);

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

  const activeStoryDungeon = useMemo(
    () => (activeStoryDungeonId ? getStoryDungeonDefinition(activeStoryDungeonId) : undefined),
    [activeStoryDungeonId]
  );
  const activeStoryBoss = useMemo(
    () => (activeStoryDungeon?.bossId ? getStoryBossDefinition(activeStoryDungeon.bossId) : undefined),
    [activeStoryDungeon]
  );
  const activeStoryEraTitle = useMemo(
    () => STORY_ERA_GROUPS.find((group) => activeStoryDungeon && group.dungeonIds.includes(activeStoryDungeon.id))?.title,
    [activeStoryDungeon]
  );

  const activeDocument: ActiveDocument = useMemo(() => {
    if (mode === "level") {
      const status = activeStoryDungeonId
        ? `Story dungeon ${activeStoryDungeonId} — ${activeStoryMapSource === "local" ? "Local (editable)" : "Canon (not yet saved locally)"}`
        : map.id === "test_map_01"
          ? "Level — test map (playable route)"
          : currentMapOrigin
            ? `Level — sandbox (${currentMapOrigin})`
            : "Level — local draft";
      return { type: "playable_map", id: map.id, title: map.name, status };
    }
    if (mode === "story_empty") {
      return {
        type: "placeholder",
        id: activeStoryDungeonId ?? "story_empty",
        title: activeStoryDungeon?.title ?? "Story dungeon",
        status: "No authored map yet",
      };
    }
    if (mode === "assets") {
      return {
        type: "asset_collection",
        id: "asset_library",
        title: "Assets",
        status: `${customAssets.length} custom asset${customAssets.length === 1 ? "" : "s"} in local library`,
      };
    }
    if (mode === "kingdom") {
      return {
        type: "kingdom_stage",
        id: kingdomStage.id,
        title: kingdomStage.name,
        status:
          kingdomStage.status === "canon"
            ? "Canonical — not read by live runtime yet"
            : "Local draft — not read by live runtime yet",
      };
    }
    return {
      type: "placeholder",
      id: placeholderDoc?.id ?? "placeholder",
      title: placeholderDoc?.title ?? "Placeholder",
      status: "Not wired in Editor V2",
      note: placeholderDoc?.note,
    };
  }, [
    mode,
    map.id,
    map.name,
    currentMapOrigin,
    activeStoryDungeonId,
    activeStoryMapSource,
    activeStoryDungeon,
    customAssets.length,
    kingdomStage.id,
    kingdomStage.name,
    kingdomStage.status,
    placeholderDoc,
  ]);

  function selectLevel(id?: string) {
    setActiveStoryDungeonId(null);
    setActiveStoryMapSource(null);
    if (!id || id === "test_map_01") {
      setMap(TEST_MAP_01);
      setCurrentMapOrigin(undefined);
      setSelection({ kind: "spawn", id: "player_start" });
      setMode("level");
      return;
    }
    const doc = loadDocument<PlayableMap>("playable_map", id);
    if (!doc) {
      toast.error(`Local level "${id}" could not be found.`);
      return;
    }
    setMap(doc);
    setCurrentMapOrigin(documentIndex.find((entry) => entry.id === id)?.origin);
    setSelection({ kind: "spawn", id: doc.spawns[0]?.id ?? "player_start" });
    setMode("level");
  }

  function createSandboxLevel(origin: EraOrigin) {
    setActiveStoryDungeonId(null);
    setActiveStoryMapSource(null);
    const label = origin === "era_funebre" ? "Era Funèbre" : "Era Glaciaire";
    const id = `sandbox_${origin}_${Date.now()}`;
    const newSandboxMap: PlayableMap = { ...createEmptyMap(), id, name: `New ${label} Level`, mode: "sandbox", chapter: origin };
    saveDocument({ id, type: "playable_map", title: newSandboxMap.name, origin }, newSandboxMap);
    refreshDocumentIndex();
    setMap(newSandboxMap);
    setCurrentMapOrigin(origin);
    setSelection({ kind: "spawn", id: "player_start" });
    setMode("level");
    toast.success(`Created "${newSandboxMap.name}" (sandbox — not in the story registry).`);
  }

  /**
   * Story dungeon selection (Phase G7): priority is local document (id === dungeonId) > canonical
   * PlayableMap > "no authored map yet" empty state. Loading a canonical map here never writes to
   * localStorage by itself -- only Save/Playtest materializes a local copy, so the canon constant
   * in game-core is never touched from the editor.
   */
  function selectStoryDungeon(dungeonId: string) {
    const localDoc = loadDocument<PlayableMap>("playable_map", dungeonId);
    if (localDoc) {
      setMap(localDoc);
      setCurrentMapOrigin(dungeonId);
      setActiveStoryDungeonId(dungeonId);
      setActiveStoryMapSource("local");
      setSelection({ kind: "spawn", id: localDoc.spawns[0]?.id ?? "player_start" });
      setMode("level");
      return;
    }
    const canonicalMap = getCanonicalStoryMap(dungeonId);
    if (canonicalMap) {
      setMap(canonicalMap);
      setCurrentMapOrigin(dungeonId);
      setActiveStoryDungeonId(dungeonId);
      setActiveStoryMapSource("canon");
      setSelection({ kind: "spawn", id: canonicalMap.spawns[0]?.id ?? "player_start" });
      setMode("level");
      return;
    }
    setActiveStoryDungeonId(dungeonId);
    setActiveStoryMapSource(null);
    setMode("story_empty");
  }

  function createMapForDungeon(dungeon: StoryDungeonDefinition) {
    if (hasDocument("playable_map", dungeon.id)) {
      selectStoryDungeon(dungeon.id);
      return;
    }
    const newStoryMap: PlayableMap = { ...createEmptyMap(), id: dungeon.id, name: dungeon.title, mode: "story" };
    saveDocument({ id: dungeon.id, type: "playable_map", title: newStoryMap.name, origin: dungeon.id }, newStoryMap);
    refreshDocumentIndex();
    setMap(newStoryMap);
    setCurrentMapOrigin(dungeon.id);
    setActiveStoryDungeonId(dungeon.id);
    setActiveStoryMapSource("local");
    setSelection({ kind: "spawn", id: "player_start" });
    setMode("level");
    toast.success(`Created a local map for "${dungeon.title}" (${dungeon.id}).`);
  }

  function selectKingdomStage() {
    setActiveStoryDungeonId(null);
    setActiveStoryMapSource(null);
    const doc = loadDocument<KingdomStageDefinition>("kingdom_stage", "kingdom_stage");
    setKingdomStage(doc ?? KINGDOM_STAGE_DEFINITION);
    setMode("kingdom");
  }

  function selectAssets() {
    setActiveStoryDungeonId(null);
    setActiveStoryMapSource(null);
    setMode("assets");
  }

  function selectPlaceholder(info: PlaceholderDocumentInfo) {
    setActiveStoryDungeonId(null);
    setActiveStoryMapSource(null);
    setPlaceholderDoc(info);
    setMode("placeholder");
  }

  function saveMap() {
    const validation = validatePlayableMap(map);
    if (!validation.ok) {
      const message = `Cannot save: ${validation.errors.join("; ")}`;
      setLastSaveMessage(message);
      toast.error(message);
      return;
    }
    saveDocument({ id: map.id, type: "playable_map", title: map.name, origin: currentMapOrigin }, map);
    refreshDocumentIndex();
    if (activeStoryDungeonId) setActiveStoryMapSource("local");
    setLastSaveMessage(`Map saved locally as ${map.id}.`);
    toast.success(`Map saved locally as ${map.id}.`);
  }

  function loadMap() {
    const doc = loadDocument<PlayableMap>("playable_map", map.id);
    if (!doc) {
      const message = `No local save found for "${map.id}". Save it first, or import a .map.json file.`;
      setLastSaveMessage(message);
      toast.error(message);
      return;
    }
    setMap(doc);
    setLastSaveMessage("Local map loaded.");
    toast.success("Local map loaded.");
  }

  function saveKingdomStage() {
    const validation = validateKingdomStageDefinition(kingdomStage);
    if (!validation.ok) {
      const message = `Cannot save: ${validation.errors.join("; ")}`;
      setLastSaveMessage(message);
      toast.error(message);
      return;
    }
    saveDocument({ id: kingdomStage.id, type: "kingdom_stage", title: kingdomStage.name }, kingdomStage);
    refreshDocumentIndex();
    setLastSaveMessage(`Kingdom Stage saved locally as ${kingdomStage.id}.`);
    toast.success(`Kingdom Stage saved locally as ${kingdomStage.id}.`);
  }

  function loadKingdomStage() {
    const doc = loadDocument<KingdomStageDefinition>("kingdom_stage", kingdomStage.id);
    if (!doc) {
      const message = "No local save found for the Kingdom Stage yet.";
      setLastSaveMessage(message);
      toast.error(message);
      return;
    }
    setKingdomStage(doc);
    setSelectedKingdomBuildingId(null);
    setLastSaveMessage("Kingdom Stage loaded.");
    toast.success("Kingdom Stage loaded.");
  }

  function playtestKingdomStage() {
    const validation = validateKingdomStageDefinition(kingdomStage);
    if (!validation.ok) {
      const message = `Cannot playtest: ${validation.errors.join("; ")}`;
      setLastSaveMessage(message);
      toast.error(message);
      return;
    }
    saveDocument({ id: kingdomStage.id, type: "kingdom_stage", title: kingdomStage.name }, kingdomStage);
    refreshDocumentIndex();
    toast(`Saved "${kingdomStage.name}" and launching Kingdom Stage preview.`);
    router.push("/game/kingdom/preview");
  }

  function applyImportedMap(raw: string, successMessage: string) {
    let parsed: PlayableMap;
    try {
      parsed = JSON.parse(raw) as PlayableMap;
    } catch {
      const message = "Invalid JSON file — could not parse map.";
      setLastSaveMessage(message);
      toast.error(message);
      return;
    }
    const validation = validatePlayableMap(parsed);
    if (!validation.ok) {
      const message = `Invalid map: ${validation.errors.join("; ")}`;
      setLastSaveMessage(message);
      toast.error(message);
      return;
    }
    saveDocument({ id: parsed.id, type: "playable_map", title: parsed.name }, parsed);
    refreshDocumentIndex();
    setMap(parsed);
    setCurrentMapOrigin(undefined);
    setActiveStoryDungeonId(null);
    setActiveStoryMapSource(null);
    setSelection({ kind: "spawn", id: parsed.spawns[0]?.id ?? "player_start" });
    setLastSaveMessage(successMessage);
    toast.success(successMessage);
  }

  function importMap(file: File) {
    file.text().then((raw) => applyImportedMap(raw, `Map "${file.name}" imported.`)).catch(() => {
      const message = "Could not read the selected file.";
      setLastSaveMessage(message);
      toast.error(message);
    });
  }

  function exportKingdomStage() {
    downloadJson(`${kingdomStage.id}.kingdom.json`, kingdomStage);
  }

  function exportCanonicalKingdomStage() {
    const validation = validateKingdomStageDefinition(kingdomStage);
    if (!validation.ok) {
      const message = `Cannot export: ${validation.errors.join("; ")}`;
      setLastSaveMessage(message);
      toast.error(message);
      return;
    }
    downloadJson("kingdom-stage.generated.json", buildCanonicalKingdomStageExport(kingdomStage));
    const message =
      "Exported kingdom-stage.generated.json. This is NOT canon yet -- to promote it: " +
      "1) review the file, 2) replace packages/game-core/content/kingdom/kingdom-stage.ts's data with it " +
      "(e.g. via scripts/kingdom-stage-promote.mjs --apply), 3) run game-core tests, 4) commit.";
    setLastSaveMessage(message);
    toast.success("Exported kingdom-stage.generated.json — review and promote manually (see toolbar tooltip).");
  }

  function exportCanonicalStoryMap() {
    if (!activeStoryDungeonId) return;
    const validation = validatePlayableMap(map);
    if (!validation.ok) {
      const message = `Cannot export: ${validation.errors.join("; ")}`;
      setLastSaveMessage(message);
      toast.error(message);
      return;
    }
    if (map.id !== activeStoryDungeonId) {
      const message = `Cannot export: map.id ("${map.id}") must equal the linked dungeon id ("${activeStoryDungeonId}").`;
      setLastSaveMessage(message);
      toast.error(message);
      return;
    }
    const exported = buildCanonicalStoryMapExport(map, activeStoryDungeonId);
    downloadJson(`${activeStoryDungeonId}.generated.json`, exported);
    const message =
      `Exported ${activeStoryDungeonId}.generated.json. This is NOT canon yet -- to promote it: ` +
      "1) review the file, 2) run node scripts/story-map-promote.mjs <path> (dry run), " +
      "3) re-run with --apply once satisfied, 4) run game-core tests, 5) commit.";
    setLastSaveMessage(message);
    toast.success(`Exported ${activeStoryDungeonId}.generated.json — review and promote manually (see toolbar tooltip).`);
  }

  function importKingdomStage(file: File) {
    file
      .text()
      .then((raw) => {
        let parsed: KingdomStageDefinition;
        try {
          parsed = JSON.parse(raw) as KingdomStageDefinition;
        } catch {
          const message = "Invalid JSON file — could not parse Kingdom Stage.";
          setLastSaveMessage(message);
          toast.error(message);
          return;
        }
        const validation = validateKingdomStageDefinition(parsed);
        if (!validation.ok) {
          const message = `Invalid Kingdom Stage: ${validation.errors.join("; ")}`;
          setLastSaveMessage(message);
          toast.error(message);
          return;
        }
        saveDocument({ id: parsed.id, type: "kingdom_stage", title: parsed.name }, parsed);
        refreshDocumentIndex();
        setKingdomStage(parsed);
        setSelectedKingdomBuildingId(null);
        const message = `Kingdom Stage "${parsed.name}" imported.`;
        setLastSaveMessage(message);
        toast.success(message);
      })
      .catch(() => {
        const message = "Could not read the selected file.";
        setLastSaveMessage(message);
        toast.error(message);
      });
  }

  function saveAsset() {
    const normalized: GeometricAsset = {
      ...assetDraft,
      id: assetDraft.id.trim() || `custom_asset_${Date.now()}`,
      name: assetDraft.name.trim() || "Custom Asset",
      parts: [...assetDraft.parts].sort((a, b) => a.layer - b.layer),
    };
    try {
      assertValidAsset(normalized);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid asset.";
      setLastSaveMessage(message);
      toast.error(message);
      return;
    }
    const next = [...customAssets.filter((asset) => asset.id !== normalized.id), normalized];
    setCustomAssets(next);
    setAssetDraft(normalized);
    localStorage.setItem(STORAGE_ASSETS_KEY, JSON.stringify(next));
    setSelectedAssetId(normalized.id);
    setLastSaveMessage(`Asset ${normalized.name} saved to local library.`);
    toast.success(`Asset ${normalized.name} saved to local library.`);
  }

  function loadAssets() {
    const raw = localStorage.getItem(STORAGE_ASSETS_KEY);
    if (!raw) {
      setLastSaveMessage("No local assets found.");
      toast.error("No local assets found. Save an asset first, or import a .asset.json file.");
      return;
    }
    let loadedAssets: GeometricAsset[];
    try {
      loadedAssets = JSON.parse(raw) as GeometricAsset[];
    } catch {
      const message = "Invalid JSON in local asset library.";
      setLastSaveMessage(message);
      toast.error(message);
      return;
    }
    setCustomAssets(loadedAssets);
    setLastSaveMessage(`${loadedAssets.length} local assets loaded.`);
    toast.success(`${loadedAssets.length} local assets loaded.`);
  }

  function importAsset(file: File) {
    file
      .text()
      .then((raw) => {
        let parsed: GeometricAsset;
        try {
          parsed = JSON.parse(raw) as GeometricAsset;
        } catch {
          const message = "Invalid JSON file — could not parse asset.";
          setLastSaveMessage(message);
          toast.error(message);
          return;
        }
        try {
          assertValidAsset(parsed);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Invalid asset.";
          setLastSaveMessage(message);
          toast.error(message);
          return;
        }
        setCustomAssets((current) => [...current.filter((asset) => asset.id !== parsed.id), parsed]);
        setAssetDraft(parsed);
        setSelectedPartId(parsed.parts[0]?.id ?? "");
        setMode("assets");
        const message = `Asset "${parsed.name}" imported.`;
        setLastSaveMessage(message);
        toast.success(message);
      })
      .catch(() => {
        const message = "Could not read the selected file.";
        setLastSaveMessage(message);
        toast.error(message);
      });
  }

  function editExistingAsset(asset: GeometricAsset) {
    setAssetDraft(asset);
    setSelectedPartId(asset.parts[0]?.id ?? "");
  }

  function patchKingdomBuilding(id: string, patch: { x?: number; y?: number }) {
    setKingdomStage((current) => ({
      ...current,
      buildings: current.buildings.map((building) => (building.id === id ? { ...building, ...patch } : building)),
    }));
  }

  function deleteKingdomBuilding(id: string) {
    setKingdomStage((current) => ({
      ...current,
      buildings: current.buildings.filter((building) => building.id !== id),
    }));
    setSelectedKingdomBuildingId((current) => (current === id ? null : current));
  }

  function newMap() {
    setActiveStoryDungeonId(null);
    setActiveStoryMapSource(null);
    const id = `sandbox_level_${Date.now()}`;
    const newMapDoc: PlayableMap = { ...createEmptyMap(), id, name: "New Level" };
    saveDocument({ id, type: "playable_map", title: newMapDoc.name }, newMapDoc);
    refreshDocumentIndex();
    setMap(newMapDoc);
    setCurrentMapOrigin(undefined);
    setSelection({ kind: "spawn", id: "player_start" });
    toast.success(`Created "${newMapDoc.name}".`);
  }

  function playtestCurrentDocument() {
    if (activeStoryDungeonId) {
      const validation = validatePlayableMap(map);
      if (!validation.ok) {
        toast.error(`Cannot playtest: ${validation.errors.join("; ")}`);
        return;
      }
      saveDocument({ id: map.id, type: "playable_map", title: map.name, origin: currentMapOrigin }, map);
      refreshDocumentIndex();
      setActiveStoryMapSource("local");
      toast(`Saved "${map.name}" and launching the Story Map dry-run preview.`);
      router.push(`/game/story-map-preview/local/${map.id}`);
      return;
    }
    if (map.id === "test_map_01") {
      router.push("/game/custom-map/test_map_01");
      return;
    }
    const validation = validatePlayableMap(map);
    if (!validation.ok) {
      toast.error(`Cannot playtest: ${validation.errors.join("; ")}`);
      return;
    }
    saveDocument({ id: map.id, type: "playable_map", title: map.name, origin: currentMapOrigin }, map);
    refreshDocumentIndex();
    toast(`Saved "${map.name}" and launching it.`);
    router.push(`/game/custom-map/local/${map.id}`);
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

  function patchSelection(patch: Record<string, string | number | boolean | null>) {
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
          activeDocument={activeDocument}
          isStoryDungeonPreview={Boolean(activeStoryDungeonId)}
          lastSaveMessage={lastSaveMessage}
          mode={mode}
          onExportCanonicalKingdomStage={exportCanonicalKingdomStage}
          onExportCanonicalStoryMap={exportCanonicalStoryMap}
          onExportKingdomStage={exportKingdomStage}
          onExportMap={() => downloadJson(`${map.id}.map.json`, map)}
          onImportAsset={importAsset}
          onImportKingdomStage={importKingdomStage}
          onImportMap={importMap}
          onLoadAssets={loadAssets}
          onLoadKingdomStage={loadKingdomStage}
          onLoadMap={loadMap}
          onModeChange={setMode}
          onNewAsset={() => {
            setAssetDraft(createAssetDraft());
            setMode("assets");
          }}
          onNewMap={newMap}
          onPlaytest={playtestCurrentDocument}
          onPlaytestKingdomStage={playtestKingdomStage}
          onSaveAsset={saveAsset}
          onSaveKingdomStage={saveKingdomStage}
          onSaveMap={saveMap}
          onToolChange={setTool}
          tool={tool}
        />

        <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col overflow-auto border-r border-zinc-800 bg-zinc-950">
            <ProjectTree
              activeDocument={activeDocument}
              activeStoryDungeonId={activeStoryDungeonId}
              levelDocuments={levelDocuments}
              onCreateSandboxLevel={createSandboxLevel}
              onSelectAssets={selectAssets}
              onSelectKingdomStage={selectKingdomStage}
              onSelectLevel={selectLevel}
              onSelectPlaceholder={selectPlaceholder}
              onSelectStoryDungeon={selectStoryDungeon}
            />
            {mode === "level" ? (
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
            ) : null}
          </aside>

          {mode === "level" ? (
            <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
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
                map={map}
                onDeleteSelection={deleteSelection}
                onGridChange={(patch) => setMap({ ...map, grid: { ...map.grid, ...patch } })}
                onMapIdChange={(id) => setMap({ ...map, id })}
                onMapNameChange={(name) => setMap({ ...map, name })}
                onPatchSelection={patchSelection}
                selectedEntity={selectedEntity}
                selection={selection}
              />
            </div>
          ) : mode === "assets" ? (
            <AssetModePanel
              assetDraft={assetDraft}
              customAssets={customAssets}
              onAddPart={(shape) => {
                const part = createPrimitive(shape, assetDraft.parts.length);
                setAssetDraft({ ...assetDraft, parts: [...assetDraft.parts, part] });
                setSelectedPartId(part.id);
              }}
              onAssetDraftChange={setAssetDraft}
              onDeletePart={deletePart}
              onDuplicatePart={duplicatePart}
              onEditExistingAsset={editExistingAsset}
              onExportAsset={() => downloadJson(`${assetDraft.id}.asset.json`, assetDraft)}
              onMovePartLayer={movePartLayer}
              onSelectPart={setSelectedPartId}
              onSelectPreset={selectPreset}
              onUpdateSelectedPart={updateSelectedPart}
              selectedPart={selectedPart}
              selectedPartId={selectedPartId}
            />
          ) : mode === "kingdom" ? (
            <KingdomStagePanel
              kingdomStage={kingdomStage}
              onDeleteBuilding={deleteKingdomBuilding}
              onPatchBuilding={patchKingdomBuilding}
              onSelectBuilding={setSelectedKingdomBuildingId}
              selectedBuildingId={selectedKingdomBuildingId}
            />
          ) : mode === "story_empty" && activeStoryDungeon ? (
            <StoryDungeonEmptyPanel
              boss={activeStoryBoss}
              dungeon={activeStoryDungeon}
              eraTitle={activeStoryEraTitle ?? activeStoryDungeon.era}
              onCreateMap={() => createMapForDungeon(activeStoryDungeon)}
            />
          ) : (
            <PlaceholderPanel doc={placeholderDoc} />
          )}
        </main>
      </div>
    </div>
  );
}
