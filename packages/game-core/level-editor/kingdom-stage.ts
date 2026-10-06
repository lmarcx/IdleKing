import type { BuildingId } from "../building/types.js";
import type { CollisionShape, InteractionDefinition } from "./types.js";

/**
 * Schema for editing the Kingdom as data instead of hardcoded Pixi/React.
 * Reuses game-core's canonical BuildingId so ids line up with the real building system.
 *
 * "draft" = authored in the editor, not yet promoted. "canon" = the committed definition
 * that the live Kingdom runtime is meant to read (kingdom-hub-stage.tsx migrates to it
 * progressively — see packages/game-core/content/kingdom/kingdom-stage.ts).
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

export type KingdomStageStatus = "draft" | "canon";

export type KingdomStageDefinition = Readonly<{
  id: string;
  name: string;
  status: KingdomStageStatus;
  version: number;
  buildings: readonly KingdomBuilding[];
  npcs: readonly KingdomNpc[];
  props: readonly KingdomProp[];
  colliders: readonly KingdomCollider[];
  spawn: Readonly<{ x: number; y: number }>;
}>;

export type KingdomStageValidationResult = Readonly<{ ok: boolean; errors: readonly string[] }>;

export function validateKingdomStageDefinition(stage: KingdomStageDefinition): KingdomStageValidationResult {
  const errors: string[] = [];
  if (!stage.id.trim()) errors.push("Kingdom stage id is required");
  if (stage.version < 1) errors.push(`Kingdom stage ${stage.id} version must be >= 1`);

  const ids = new Set<string>();
  for (const building of stage.buildings) {
    if (ids.has(building.id)) errors.push(`Duplicate Kingdom entity id: ${building.id}`);
    ids.add(building.id);
  }
  for (const npc of stage.npcs) {
    if (ids.has(npc.id)) errors.push(`Duplicate Kingdom entity id: ${npc.id}`);
    ids.add(npc.id);
  }
  for (const prop of stage.props) {
    if (ids.has(prop.id)) errors.push(`Duplicate Kingdom entity id: ${prop.id}`);
    ids.add(prop.id);
  }

  return { ok: errors.length === 0, errors };
}
