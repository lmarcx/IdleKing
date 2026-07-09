import type {
  AssetCategory,
  GroundTextureId,
  MapBuilding,
  MapCollision,
  MapEnemy,
  MapNpc,
  MapObject,
  MapSpawn,
  MapTrigger,
} from "@idleking/game-core/level-editor";

export type EditorMode = "level" | "assets" | "kingdom";
export type EditorTool = "brush" | "eraser" | "select";
export type SelectionKind = "spawn" | "object" | "building" | "npc" | "enemy" | "collision" | "trigger";
export type Selection = { kind: SelectionKind; id: string };
export type SelectedEntity = MapObject | MapBuilding | MapNpc | MapEnemy | MapCollision | MapTrigger | MapSpawn;

export type MarkerViewModel = {
  kind: SelectionKind;
  id: string;
  x: number;
  y: number;
  label: string;
  className: string;
};

export const EDITOR_STEPS = [
  "Topographie",
  "Textures",
  "Nature",
  "Batiments",
  "PNJ",
  "Objets",
  "Ennemis",
  "Collisions / Triggers",
] as const;

export const STEP_CATEGORY: Record<number, AssetCategory | null> = {
  0: null,
  1: "textures",
  2: "nature",
  3: "buildings",
  4: "characters",
  5: "objects",
  6: "enemies",
  7: "collisions",
};

export const TEXTURE_BACKGROUNDS: Record<GroundTextureId, string> = {
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

export function isPlacementStep(step: number): boolean {
  return step >= 2 && step <= 7;
}

export function inputClassName(): string {
  return "rounded border border-zinc-800 bg-black px-2 py-2 text-zinc-100";
}

export function getSelectionLabel(selection: Selection | null): string {
  return selection ? `${selection.kind}: ${selection.id}` : "None";
}
