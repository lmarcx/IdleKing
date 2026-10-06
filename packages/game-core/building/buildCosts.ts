import type { ResourceStock } from "../resources/types.js";
import type { BuildingId } from "./types.js";

/**
 * Returns the construction cost for a building at base tier (MVP).
 *
 * Costs only use canonical resources the player can actually gather by the time the building
 * unlocks (see STORY_DUNGEON_REGISTRY.buildingUnlocks):
 * - Mine / Farm (after the Prologue): Prologue Shadow drops (iron_ore, shadow_residue).
 * - Temple / Forum (after the Mausolee): Mine (iron_ore, quartz) + Farm (old_wood).
 * - Forge / Market / Bank / Kitchen (after Rive Figee): same pool, larger amounts.
 * - Time Gate (needed before Era Glaciaire): adds spectral_dust from Chapter I dungeons.
 *
 * DEFERRED balancing: amounts are placeholders.
 */
export function getBuildCost(buildingId: BuildingId): ResourceStock {
  switch (buildingId) {
    case "MINE":
      return { iron_ore: 4 };

    case "FARM":
      return { iron_ore: 2, shadow_residue: 1 };

    case "TEMPLE":
      return { iron_ore: 8, quartz: 6 };

    case "FORUM":
      return { iron_ore: 6, old_wood: 10 };

    case "FORGE":
      return { iron_ore: 12, old_wood: 8, quartz: 4 };

    case "KITCHEN":
      return { iron_ore: 4, old_wood: 8 };

    case "MARKET":
      return { old_wood: 10, quartz: 4 };

    case "BANK":
      return { iron_ore: 10, quartz: 8 };

    case "TIME_GATE":
    case "WORLD_GATE":
      return { iron_ore: 10, quartz: 10, spectral_dust: 4 };

    default:
      return {};
  }
}
