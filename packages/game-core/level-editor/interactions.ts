import type { InteractionDefinition, PlayableMap } from "./types.js";

export type InteractableEntityKind = "building" | "npc" | "object";

export type ResolvedInteractable = Readonly<{
  kind: InteractableEntityKind;
  id: string;
  x: number;
  y: number;
  interaction: InteractionDefinition;
}>;

/** Flattens every entity carrying a `systemInteraction` into one proximity-checkable list. Pure data, no Pixi. */
export function collectMapInteractables(map: PlayableMap): ResolvedInteractable[] {
  const results: ResolvedInteractable[] = [];

  for (const building of map.buildings) {
    if (building.systemInteraction) {
      results.push({ kind: "building", id: building.id, x: building.x, y: building.y, interaction: building.systemInteraction });
    }
  }
  for (const npc of map.npcs) {
    if (npc.systemInteraction) {
      results.push({ kind: "npc", id: npc.id, x: npc.x, y: npc.y, interaction: npc.systemInteraction });
    }
  }
  for (const object of map.objects) {
    if (object.systemInteraction) {
      results.push({ kind: "object", id: object.id, x: object.x, y: object.y, interaction: object.systemInteraction });
    }
  }

  return results;
}

/** Nearest interactable within its own radius, or null. Ties broken by first-found order. */
export function findNearestInteractable(
  interactables: readonly ResolvedInteractable[],
  point: Readonly<{ x: number; y: number }>
): ResolvedInteractable | null {
  let nearest: ResolvedInteractable | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const interactable of interactables) {
    const distance = Math.hypot(interactable.x - point.x, interactable.y - point.y);
    if (distance <= interactable.interaction.radius && distance < nearestDistance) {
      nearest = interactable;
      nearestDistance = distance;
    }
  }

  return nearest;
}

const INTERACTION_TYPE_LABEL: Record<InteractionDefinition["interactionType"], string> = {
  open_building_modal: "Building",
  open_time_gate: "Time Gate",
  open_market: "Market",
  open_bank: "Bank",
  open_forge: "Forge",
  start_dialogue: "Dialogue",
  start_level: "Level",
  custom_trigger: "Trigger",
};

/** Human-readable feedback for a resolved interaction — what a UI layer should show on interact. */
export function describeInteractionFeedback(interaction: InteractionDefinition): string {
  return `${interaction.promptLabel} — ${INTERACTION_TYPE_LABEL[interaction.interactionType]} (${interaction.interactionTargetId})`;
}
