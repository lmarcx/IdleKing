import type { GameState } from "../game/state.js";

export type EraId = "era_funebre" | "era_glaciaire" | "era_deluge";

export type EraDefinition = Readonly<{
  id: EraId;
  title: string;
  playable: boolean;
  teaser: boolean;
  unlockConditions: Readonly<{
    storyFlags: readonly string[];
    minWorldLevel: number;
    fragmentDuTempsCost: number;
  }>;
}>;

export type SpecialItemsState = {
  kaleidoscopeOwned: boolean;
  fragmentDuTemps: number;
  // Era-progression unlocks. Per DATA_MODEL these belong to Time Gate / era-progression state,
  // not to "special items". Co-located here as a brownfield pragmatic choice: there is no
  // dedicated Time Gate state slice yet, and `world` is resource-pools (energy/hp) only.
  // TODO(time-gate-state): migrate unlockedEras to a dedicated timeGate/era slice + save migration.
  unlockedEras: EraId[];
};

export type UnlockEraAtTimeGateResult =
  | Readonly<{ ok: true; next: GameState; eraId: EraId; fragmentDuTempsSpent: number }>
  | Readonly<{
      ok: false;
      next: GameState;
      reason:
        | "ERA_NOT_FOUND"
        | "ERA_NOT_PLAYABLE"
        | "ERA_ALREADY_UNLOCKED"
        | "TIME_GATE_LOCKED"
        | "TIME_GATE_NOT_BUILT"
        | "KALEIDOSCOPE_REQUIRED"
        | "FRAGMENT_DU_TEMPS_REQUIRED"
        | "STORY_FLAG_MISSING"
        | "WORLD_LEVEL_TOO_LOW";
    }>;

export const DEFAULT_UNLOCKED_ERAS: readonly EraId[] = ["era_funebre"] as const;

export const ERA_REGISTRY: readonly EraDefinition[] = [
  {
    id: "era_funebre",
    title: "Era Funebre",
    playable: true,
    teaser: false,
    unlockConditions: {
      storyFlags: [],
      minWorldLevel: 1,
      fragmentDuTempsCost: 0,
    },
  },
  {
    id: "era_glaciaire",
    title: "Era Glaciaire",
    playable: true,
    teaser: false,
    // DEFERRED balancing: WorldLevel 5 mirrors the Chapter II story stability placeholder.
    unlockConditions: {
      storyFlags: ["chapter_i_complete", "kaleidoscope_chapter_i_component_ready"],
      minWorldLevel: 5,
      fragmentDuTempsCost: 1,
    },
  },
  {
    id: "era_deluge",
    title: "Era Deluge",
    playable: false,
    teaser: true,
    unlockConditions: {
      storyFlags: ["chapter_ii_complete", "time_gate_phase_8_ready"],
      minWorldLevel: 10,
      fragmentDuTempsCost: 1,
    },
  },
] as const;

const ERA_BY_ID = new Map<EraId, EraDefinition>(ERA_REGISTRY.map((era) => [era.id, era]));

export function createDefaultSpecialItemsState(): SpecialItemsState {
  return {
    kaleidoscopeOwned: false,
    fragmentDuTemps: 0,
    unlockedEras: [...DEFAULT_UNLOCKED_ERAS],
  };
}

export function normalizeSpecialItemsState(raw: Partial<SpecialItemsState> | undefined): SpecialItemsState {
  const defaults = createDefaultSpecialItemsState();
  const unlocked = new Set<EraId>(defaults.unlockedEras);
  for (const eraId of raw?.unlockedEras ?? []) {
    if (ERA_BY_ID.has(eraId)) unlocked.add(eraId);
  }

  return {
    kaleidoscopeOwned: raw?.kaleidoscopeOwned === true,
    fragmentDuTemps: Math.max(0, Math.floor(raw?.fragmentDuTemps ?? 0)),
    unlockedEras: [...unlocked],
  };
}

export function hasKaleidoscope(state: Pick<GameState, "specialItems">): boolean {
  return state.specialItems.kaleidoscopeOwned;
}

export function grantKaleidoscope<T extends Pick<GameState, "specialItems">>(state: T): T {
  if (state.specialItems.kaleidoscopeOwned) return state;
  return {
    ...state,
    specialItems: {
      ...state.specialItems,
      kaleidoscopeOwned: true,
    },
  };
}

export function grantFragmentDuTemps<T extends Pick<GameState, "specialItems">>(state: T, amount: number): T {
  const gain = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
  if (gain <= 0) return state;
  return {
    ...state,
    specialItems: {
      ...state.specialItems,
      fragmentDuTemps: state.specialItems.fragmentDuTemps + gain,
    },
  };
}

export type SpendFragmentDuTempsResult<T> =
  | Readonly<{ ok: true; next: T; spent: number }>
  | Readonly<{ ok: false; next: T; reason: "INSUFFICIENT_FRAGMENT_DU_TEMPS" | "INVALID_AMOUNT" }>;

export function spendFragmentDuTemps<T extends Pick<GameState, "specialItems">>(
  state: T,
  amount: number,
): SpendFragmentDuTempsResult<T> {
  const spend = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
  if (spend <= 0) return { ok: false, next: state, reason: "INVALID_AMOUNT" };
  if (state.specialItems.fragmentDuTemps < spend) {
    return { ok: false, next: state, reason: "INSUFFICIENT_FRAGMENT_DU_TEMPS" };
  }

  return {
    ok: true,
    spent: spend,
    next: {
      ...state,
      specialItems: {
        ...state.specialItems,
        fragmentDuTemps: state.specialItems.fragmentDuTemps - spend,
      },
    },
  };
}

export function getEraDefinition(eraId: string): EraDefinition | undefined {
  return ERA_BY_ID.get(eraId as EraId);
}

export function isEraUnlocked(state: Pick<GameState, "specialItems">, eraId: EraId): boolean {
  return state.specialItems.unlockedEras.includes(eraId);
}

export function isEraPlayable(eraId: EraId): boolean {
  return ERA_BY_ID.get(eraId)?.playable === true;
}

export function canUnlockEraAtTimeGate(state: GameState, eraId: EraId): boolean {
  return unlockEraAtTimeGate(state, eraId, { dryRun: true }).ok;
}

export function unlockEraAtTimeGate(
  state: GameState,
  eraId: EraId,
  options: Readonly<{ dryRun?: boolean }> = {},
): UnlockEraAtTimeGateResult {
  const era = getEraDefinition(eraId);
  if (!era) return { ok: false, next: state, reason: "ERA_NOT_FOUND" };
  if (!era.playable) return { ok: false, next: state, reason: "ERA_NOT_PLAYABLE" };
  if (isEraUnlocked(state, eraId)) return { ok: false, next: state, reason: "ERA_ALREADY_UNLOCKED" };
  if (!state.buildings.timeGate.unlocked) return { ok: false, next: state, reason: "TIME_GATE_LOCKED" };
  if (!state.buildings.timeGate.built) return { ok: false, next: state, reason: "TIME_GATE_NOT_BUILT" };
  if (!state.specialItems.kaleidoscopeOwned) return { ok: false, next: state, reason: "KALEIDOSCOPE_REQUIRED" };

  for (const flag of era.unlockConditions.storyFlags) {
    if (!state.story.completedEvents.has(flag)) return { ok: false, next: state, reason: "STORY_FLAG_MISSING" };
  }
  if (state.progression.worldLevel < era.unlockConditions.minWorldLevel) {
    return { ok: false, next: state, reason: "WORLD_LEVEL_TOO_LOW" };
  }
  if (state.specialItems.fragmentDuTemps < era.unlockConditions.fragmentDuTempsCost) {
    return { ok: false, next: state, reason: "FRAGMENT_DU_TEMPS_REQUIRED" };
  }

  if (options.dryRun === true) {
    return { ok: true, next: state, eraId, fragmentDuTempsSpent: era.unlockConditions.fragmentDuTempsCost };
  }

  const spent =
    era.unlockConditions.fragmentDuTempsCost > 0
      ? spendFragmentDuTemps(state, era.unlockConditions.fragmentDuTempsCost)
      : { ok: true as const, next: state, spent: 0 };
  if (!spent.ok) return { ok: false, next: state, reason: "FRAGMENT_DU_TEMPS_REQUIRED" };

  return {
    ok: true,
    eraId,
    fragmentDuTempsSpent: spent.spent,
    next: {
      ...spent.next,
      specialItems: {
        ...spent.next.specialItems,
        unlockedEras: [...new Set([...spent.next.specialItems.unlockedEras, eraId])],
      },
    },
  };
}

export function validateSpecialItemsAndEraRegistry(eras: readonly EraDefinition[] = ERA_REGISTRY): void {
  const ids = new Set<string>();
  for (const era of eras) {
    if (ids.has(era.id)) throw new Error(`Duplicate era id: ${era.id}`);
    ids.add(era.id);
    for (const key of Object.keys(era.unlockConditions)) {
      if (key !== "storyFlags" && key !== "minWorldLevel" && key !== "fragmentDuTempsCost") {
        throw new Error(`Invalid era gating key: ${key}`);
      }
    }
    if (era.id === "era_deluge" && era.playable) {
      throw new Error("era_deluge must remain teaser locked in Phase 8");
    }
  }
}

validateSpecialItemsAndEraRegistry();
