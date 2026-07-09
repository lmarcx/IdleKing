import type { BuildingId } from "../building/types.js";
import type { CollisionShape, InteractionDefinition } from "./types.js";

/**
 * Draft/prototype schema for editing the Kingdom as data instead of hardcoded Pixi/React.
 * NOT wired to the live Kingdom runtime (kingdom-hub-stage.tsx) — see KINGDOM_DRAFT_MAP below.
 * Reuses game-core's canonical BuildingId so a future real integration has no id to invent.
 */
export type KingdomBuilding = Readonly<{
  id: BuildingId;
  assetId: string;
  x: number;
  y: number;
  collision: CollisionShape | null;
  interaction: InteractionDefinition | null;
}>;

export type KingdomNpc = Readonly<{
  id: string;
  assetId: string;
  name: string;
  x: number;
  y: number;
  interaction: InteractionDefinition | null;
}>;

export type KingdomProp = Readonly<{
  id: string;
  assetId: string;
  x: number;
  y: number;
  rotation?: number;
}>;

export type KingdomCollider = Readonly<{ id: string } & CollisionShape>;

export type KingdomMapStatus = "draft";

export type KingdomMapDefinition = Readonly<{
  id: string;
  name: string;
  status: KingdomMapStatus;
  version: number;
  buildings: readonly KingdomBuilding[];
  npcs: readonly KingdomNpc[];
  props: readonly KingdomProp[];
  colliders: readonly KingdomCollider[];
  spawn: Readonly<{ x: number; y: number }>;
}>;

export type KingdomMapValidationResult = Readonly<{ ok: boolean; errors: readonly string[] }>;

export function validateKingdomMapDefinition(map: KingdomMapDefinition): KingdomMapValidationResult {
  const errors: string[] = [];
  if (!map.id.trim()) errors.push("Kingdom map id is required");
  if (map.version < 1) errors.push(`Kingdom map ${map.id} version must be >= 1`);

  const ids = new Set<string>();
  for (const building of map.buildings) {
    if (ids.has(building.id)) errors.push(`Duplicate Kingdom entity id: ${building.id}`);
    ids.add(building.id);
  }
  for (const npc of map.npcs) {
    if (ids.has(npc.id)) errors.push(`Duplicate Kingdom entity id: ${npc.id}`);
    ids.add(npc.id);
  }
  for (const prop of map.props) {
    if (ids.has(prop.id)) errors.push(`Duplicate Kingdom entity id: ${prop.id}`);
    ids.add(prop.id);
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Hand-authored prototype layout only — approximate positions around a plaza, NOT extracted
 * from kingdom-hub-stage.tsx. Do not treat these coordinates as the real Kingdom layout.
 */
const PLAZA_CENTER = { x: 600, y: 450 };
const PLAZA_RADIUS = 300;

function pointOnPlazaRing(index: number, total: number): { x: number; y: number } {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.round(PLAZA_CENTER.x + Math.cos(angle) * PLAZA_RADIUS),
    y: Math.round(PLAZA_CENTER.y + Math.sin(angle) * PLAZA_RADIUS),
  };
}

const DRAFT_BUILDING_PLAN: readonly { id: BuildingId; interaction: InteractionDefinition }[] = [
  { id: "FORUM", interaction: { interactionType: "open_building_modal", interactionTargetId: "FORUM", promptLabel: "Enter Forum", radius: 120 } },
  { id: "TEMPLE", interaction: { interactionType: "open_building_modal", interactionTargetId: "TEMPLE", promptLabel: "Enter Temple", radius: 120 } },
  { id: "FARM", interaction: { interactionType: "open_building_modal", interactionTargetId: "FARM", promptLabel: "Visit Farm", radius: 110 } },
  { id: "MINE", interaction: { interactionType: "open_building_modal", interactionTargetId: "MINE", promptLabel: "Enter Mine", radius: 110 } },
  { id: "KITCHEN", interaction: { interactionType: "open_building_modal", interactionTargetId: "KITCHEN", promptLabel: "Enter Kitchen", radius: 110 } },
  { id: "FORGE", interaction: { interactionType: "open_forge", interactionTargetId: "FORGE", promptLabel: "Enter Forge", radius: 112 } },
  { id: "MARKET", interaction: { interactionType: "open_market", interactionTargetId: "MARKET", promptLabel: "Enter Market", radius: 112 } },
  { id: "BANK", interaction: { interactionType: "open_bank", interactionTargetId: "BANK", promptLabel: "Enter Bank", radius: 104 } },
  { id: "CORNUCOPIA", interaction: { interactionType: "custom_trigger", interactionTargetId: "CORNUCOPIA", promptLabel: "Open Cornucopia", radius: 118 } },
  { id: "TIME_GATE", interaction: { interactionType: "open_time_gate", interactionTargetId: "TIME_GATE", promptLabel: "Enter Time Gate", radius: 112 } },
];

function createDraftBuildings(): KingdomBuilding[] {
  return DRAFT_BUILDING_PLAN.map((entry, index) => {
    const position = pointOnPlazaRing(index, DRAFT_BUILDING_PLAN.length);
    return {
      id: entry.id,
      // Placeholder — Kingdom buildings have no dedicated GeometricAsset yet (V3).
      assetId: "house_small_01",
      x: position.x,
      y: position.y,
      collision: { type: "box", x: position.x - 40, y: position.y - 30, width: 80, height: 60 },
      interaction: entry.interaction,
    };
  });
}

export const KINGDOM_DRAFT_MAP: KingdomMapDefinition = {
  id: "kingdom_draft",
  name: "Kingdom Draft",
  status: "draft",
  version: 1,
  buildings: createDraftBuildings(),
  npcs: [
    {
      id: "villager_guide",
      assetId: "villager_simple_01",
      name: "Villager",
      x: PLAZA_CENTER.x - 60,
      y: PLAZA_CENTER.y + 40,
      interaction: { interactionType: "start_dialogue", interactionTargetId: "villager_guide_intro", promptLabel: "Talk to the Villager", radius: 52 },
    },
    {
      id: "boto",
      assetId: "villager_simple_01",
      name: "Boto",
      x: PLAZA_CENTER.x + 60,
      y: PLAZA_CENTER.y + 40,
      interaction: { interactionType: "start_dialogue", interactionTargetId: "boto_intro", promptLabel: "Talk to Boto", radius: 52 },
    },
  ],
  props: [
    { id: "plaza_marker_01", assetId: "rock_simple_01", x: PLAZA_CENTER.x, y: PLAZA_CENTER.y },
  ],
  colliders: [],
  spawn: { x: PLAZA_CENTER.x, y: PLAZA_CENTER.y + 90 },
};
