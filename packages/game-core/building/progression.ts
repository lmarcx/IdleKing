import type { GameState } from "../game/state.js";
import { hasAtLeast, spend, type ResourceStock } from "../resources/types.js";
import { getBuildCost } from "./buildCosts.js";
import type {
  BuildingId,
  BuildingStatus,
  CanonicalBuildingId,
  CanonicalBuildingState,
} from "./types.js";

export type {
  BuildingStatus,
  CanonicalBuildingId,
  CanonicalBuildingProgress,
  CanonicalBuildingState,
} from "./types.js";

export const BUILDING_MAX_LEVEL = 50;

export const CANONICAL_BUILDING_IDS = [
  "FORGE",
  "MINE",
  "FARM",
  "KITCHEN",
  "TEMPLE",
  "MARKET",
  "TIME_GATE",
  "FORUM",
  "BANK",
] as const satisfies readonly CanonicalBuildingId[];

type BuildingStateKey =
  | "forge"
  | "mine"
  | "farm"
  | "kitchen"
  | "temple"
  | "market"
  | "timeGate"
  | "forum"
  | "worldGate"
  | "bank";

const BUILDING_STATE_KEYS: Record<CanonicalBuildingId, BuildingStateKey> = {
  BANK: "bank",
  FARM: "farm",
  FORGE: "forge",
  FORUM: "forum",
  KITCHEN: "kitchen",
  MARKET: "market",
  MINE: "mine",
  TEMPLE: "temple",
  TIME_GATE: "timeGate",
};

export function isCanonicalBuildingId(buildingId: BuildingId): buildingId is CanonicalBuildingId {
  return (CANONICAL_BUILDING_IDS as readonly string[]).includes(buildingId);
}

export function getBuildingStateKey(buildingId: CanonicalBuildingId): BuildingStateKey {
  return BUILDING_STATE_KEYS[buildingId];
}

function floorNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
}

export function clampBuildingLevel(level: number, worldLevel: number, maxLevel = BUILDING_MAX_LEVEL): number {
  return Math.min(Math.max(0, Math.floor(level)), Math.max(0, Math.floor(worldLevel)), maxLevel);
}

export function getCanonicalBuildingStatus(
  building: Pick<CanonicalBuildingState, "built" | "level" | "maxLevel" | "unlocked">,
  worldLevel: number,
): BuildingStatus {
  if (!building.unlocked) return "locked";
  if (!building.built) return "unlocked";
  if (building.level >= building.maxLevel) return "maxed";
  if (building.level < Math.min(worldLevel, building.maxLevel)) return "upgradeable";
  return "built";
}

export function normalizeBuildingProgress<T extends Partial<CanonicalBuildingState>>(
  rawBuilding: T | undefined,
  defaults: T,
  worldLevel: number,
): T & CanonicalBuildingState {
  const merged = { ...defaults, ...(rawBuilding ?? {}) } as T & Partial<CanonicalBuildingState>;
  const unlocked = merged.unlocked === true;
  const built = merged.built === true;
  const active = merged.active === true;
  const maxLevel = Math.max(1, floorNumber(merged.maxLevel, BUILDING_MAX_LEVEL));
  const fallbackLevel = built ? 1 : 0;
  const level = built ? Math.max(1, clampBuildingLevel(floorNumber(merged.level, fallbackLevel), worldLevel, maxLevel)) : 0;
  const normalized = {
    ...merged,
    active,
    built,
    level,
    maxLevel,
    unlocked,
  } as T & CanonicalBuildingState;

  return {
    ...normalized,
    status: getCanonicalBuildingStatus(normalized, worldLevel),
  };
}

export function refreshCanonicalBuildingStatus<T extends CanonicalBuildingState>(
  building: T,
  worldLevel: number,
): T {
  const normalized = normalizeBuildingProgress(building, building, worldLevel);
  return normalized as T;
}

export function normalizeAllBuildingProgress(
  buildings: GameState["buildings"],
  defaults: GameState["buildings"],
  worldLevel: number,
): GameState["buildings"] {
  return {
    ...defaults,
    ...buildings,
    bank: normalizeBuildingProgress((buildings as any).bank, defaults.bank, worldLevel),
    farm: normalizeBuildingProgress((buildings as any).farm, defaults.farm, worldLevel),
    forge: normalizeBuildingProgress((buildings as any).forge, defaults.forge, worldLevel),
    forum: normalizeBuildingProgress((buildings as any).forum, defaults.forum, worldLevel),
    kitchen: normalizeBuildingProgress((buildings as any).kitchen, defaults.kitchen, worldLevel),
    market: normalizeBuildingProgress((buildings as any).market, defaults.market, worldLevel),
    mine: normalizeBuildingProgress((buildings as any).mine, defaults.mine, worldLevel),
    temple: normalizeBuildingProgress((buildings as any).temple, defaults.temple, worldLevel),
    timeGate: normalizeBuildingProgress((buildings as any).timeGate ?? (buildings as any).worldGate, defaults.timeGate, worldLevel),
    worldGate: normalizeBuildingProgress((buildings as any).worldGate, defaults.worldGate, worldLevel),
    cornucopia: { ...defaults.cornucopia, ...(buildings as any).cornucopia },
  };
}

export function refreshAllBuildingStatuses(state: GameState, worldLevel = state.progression.worldLevel): GameState {
  return {
    ...state,
    buildings: normalizeAllBuildingProgress(state.buildings, state.buildings, worldLevel),
  };
}

export function getBuildingUpgradeCost(buildingId: BuildingId, currentLevel: number): ResourceStock {
  if (!isCanonicalBuildingId(buildingId)) return {};
  const nextLevel = Math.max(2, Math.floor(currentLevel) + 1);

  return {
    GOLD: nextLevel * 5,
    STONE: nextLevel * 10,
    WOOD: nextLevel * 10,
  };
}

export type UpgradeBuildingResult = {
  next: GameState;
  ok: boolean;
  reason?:
    | "UNKNOWN_BUILDING"
    | "BUILDING_LOCKED"
    | "BUILDING_NOT_BUILT"
    | "AT_MAX_LEVEL"
    | "WORLD_LEVEL_TOO_LOW"
    | "NOT_ENOUGH_RESOURCES";
  cost?: ResourceStock;
};

export function upgradeBuilding(state: GameState, buildingId: BuildingId): UpgradeBuildingResult {
  if (!isCanonicalBuildingId(buildingId)) {
    return { next: state, ok: false, reason: "UNKNOWN_BUILDING" };
  }

  const key = getBuildingStateKey(buildingId);
  const building = refreshCanonicalBuildingStatus(state.buildings[key], state.progression.worldLevel);

  if (!building.unlocked) {
    return { next: state, ok: false, reason: "BUILDING_LOCKED" };
  }
  if (!building.built) {
    return { next: state, ok: false, reason: "BUILDING_NOT_BUILT" };
  }
  if (building.level >= building.maxLevel) {
    return { next: state, ok: false, reason: "AT_MAX_LEVEL" };
  }
  if (building.level >= state.progression.worldLevel) {
    return { next: state, ok: false, reason: "WORLD_LEVEL_TOO_LOW" };
  }

  const cost = getBuildingUpgradeCost(buildingId, building.level);
  if (!hasAtLeast(state.resources, cost)) {
    return { next: state, ok: false, reason: "NOT_ENOUGH_RESOURCES", cost };
  }

  const upgraded = refreshCanonicalBuildingStatus(
    {
      ...building,
      level: building.level + 1,
    },
    state.progression.worldLevel,
  );

  return {
    cost,
    next: {
      ...state,
      buildings: {
        ...state.buildings,
        [key]: upgraded,
      },
      resources: spend(state.resources, cost),
    },
    ok: true,
  };
}

export function applyBuiltCanonicalState<T extends CanonicalBuildingState>(
  building: T,
  worldLevel: number,
): T {
  return refreshCanonicalBuildingStatus(
    {
      ...building,
      active: true,
      built: true,
      level: Math.max(1, building.level),
    },
    worldLevel,
  );
}

export function getBuildingState(state: GameState, buildingId: CanonicalBuildingId): CanonicalBuildingState {
  return state.buildings[getBuildingStateKey(buildingId)];
}

export function getBuildingBuildCost(buildingId: BuildingId): ResourceStock {
  return getBuildCost(buildingId);
}
