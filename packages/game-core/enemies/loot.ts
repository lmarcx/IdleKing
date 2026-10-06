import type { GameState } from "../game/state.js";
import type { EquipmentItem } from "../items/types.js";
import { addItem } from "../items/inventory.js";
import { rollEnemyMaterialDrops, rollEquipmentLoot, type MaterialDrop } from "../loot/mvp.js";
import type { SeededRng } from "../random/index.js";
import { addResourceToStock } from "../resources/index.js";
import { getDungeonEncounter } from "./encounters.js";
import { getEnemyArchetypeOrThrow } from "./registry.js";

export type EnemyKillLoot = Readonly<{
  materials: readonly MaterialDrop[];
  equipment: readonly EquipmentItem[];
}>;

/**
 * Loot rolled when an enemy dies in a Story dungeon: canonical materials from the archetype's
 * table, plus one boss equipment roll (50/25/15/8/2) when a boss falls. Craft > Loot: regular
 * enemies never drop equipment.
 */
export function rollEnemyKillLoot(
  archetypeId: string,
  rng: SeededRng,
  options: Readonly<{ dungeonId?: string; itemLevel?: number }> = {},
): EnemyKillLoot {
  const archetype = getEnemyArchetypeOrThrow(archetypeId);
  const materials = rollEnemyMaterialDrops(archetype.lootTableId, rng);
  if (archetype.tier !== "boss") return { materials, equipment: [] };

  const itemLevel = options.itemLevel ?? (options.dungeonId ? getDungeonEncounter(options.dungeonId)?.itemLevel : undefined) ?? 1;
  return { materials, equipment: [rollEquipmentLoot({ itemLevel, rng })] };
}

/** Adds kill loot to the player's stock and inventory. Equipment ids are made unique. */
export function grantEnemyKillLoot(state: GameState, loot: EnemyKillLoot): GameState {
  let resources = state.resources;
  for (const drop of loot.materials) resources = addResourceToStock(resources, drop.resourceId, drop.amount);

  let inventory = state.inventory;
  for (const item of loot.equipment) {
    const taken = new Set(inventory.items.map((candidate) => candidate.id));
    let id = item.id;
    for (let suffix = 2; taken.has(id); suffix += 1) id = `${item.id}_${suffix}`;
    inventory = addItem(inventory, { ...item, id });
  }

  return { ...state, resources, inventory };
}
