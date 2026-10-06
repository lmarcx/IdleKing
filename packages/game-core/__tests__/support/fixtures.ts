import type { GameState } from "../../game/state.js";
import { applyUnlocks } from "../../game/unlocks.js";
import { addQty, getQty, type ResourceId, type ResourceStock } from "../../resources/types.js";

type BuildingKey = "forum" | "temple" | "farm" | "mine" | "kitchen" | "forge" | "market" | "timeGate" | "bank";

/** Grants exactly the resources of a cost stock (any vocabulary). */
export function grantStock(stock: ResourceStock, cost: ResourceStock): ResourceStock {
  let next = stock;
  for (const [resourceId, amount] of Object.entries(cost) as Array<[ResourceId, number | undefined]>) {
    next = addQty(next, resourceId, amount ?? 0);
  }
  return next;
}

/** True when none of the cost's resources remain in the stock. */
export function isStockDrained(stock: ResourceStock, cost: ResourceStock): boolean {
  return (Object.keys(cost) as ResourceId[]).every((resourceId) => getQty(stock, resourceId) === 0);
}

/** Marks Kingdom buildings unlocked + built (level 1), as the story and the build action would. */
export function withBuiltBuildings(state: GameState, keys: readonly BuildingKey[]): GameState {
  const buildings = { ...state.buildings };
  for (const key of keys) {
    buildings[key] = {
      ...buildings[key],
      active: true,
      built: true,
      level: Math.max(1, buildings[key].level),
      status: "built",
      unlocked: true,
    } as never;
  }
  return { ...state, buildings };
}

/** Unlocks Kingdom buildings exactly as a Story dungeon first clear does (not built yet). */
export function withUnlockedBuildings(state: GameState, buildingIds: readonly string[]): GameState {
  return applyUnlocks(state, [...buildingIds]);
}
