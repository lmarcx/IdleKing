import type { BuildingId, BuildingLevelState } from "./types.js";

export type WorldState = {
  worldLevel: number;
  buildings: Record<BuildingId, number>; // level per building
};

export function createWorldState(params?: Partial<WorldState>): WorldState {
  return {
    worldLevel: params?.worldLevel ?? 1,
    buildings: (params?.buildings ?? {}) as Record<BuildingId, number>,
  };
}

export function getBuildingLevel(world: WorldState, id: BuildingId): number {
  return world.buildings[id] ?? 0;
}

export function setBuildingLevel(world: WorldState, id: BuildingId, level: number): WorldState {
  return {
    ...world,
    buildings: { ...world.buildings, [id]: Math.max(0, Math.floor(level)) },
  };
}

export function upgradeBuilding(world: WorldState, id: BuildingId): WorldState {
  const cur = getBuildingLevel(world, id);
  return setBuildingLevel(world, id, cur + 1);
}
