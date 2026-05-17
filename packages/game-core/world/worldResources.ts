export type WorldResourcePool = {
  current: number;
  max: number;
  lastRegenAt: number;
};

export type GameWorldResourcesState = {
  energy: WorldResourcePool;
  hp: WorldResourcePool;
};

export const WORLD_ENERGY_BASE_MAX = 100;
export const WORLD_ENERGY_MAX_PER_LEVEL = 10;
export const WORLD_ENERGY_BASE_REGEN_PER_MIN = 1;
export const WORLD_ENERGY_REGEN_PER_LEVEL_PER_MIN = 0.1;

export const WORLD_HP_BASE_MAX = 100;
export const WORLD_HP_MAX_PER_LEVEL = 25;
export const WORLD_HP_BASE_REGEN_PER_MIN = 0.5;
export const WORLD_HP_REGEN_PER_LEVEL_PER_MIN = 0.05;

function normalizeWorldLevel(worldLevel: number): number {
  return Math.max(1, Math.floor(worldLevel));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function maxWorldEnergy(worldLevel: number): number {
  const level = normalizeWorldLevel(worldLevel);
  return WORLD_ENERGY_BASE_MAX + (level - 1) * WORLD_ENERGY_MAX_PER_LEVEL;
}

export function maxWorldHp(worldLevel: number): number {
  const level = normalizeWorldLevel(worldLevel);
  return WORLD_HP_BASE_MAX + (level - 1) * WORLD_HP_MAX_PER_LEVEL;
}

export function worldEnergyRegenPerMinute(worldLevel: number): number {
  const level = normalizeWorldLevel(worldLevel);
  return WORLD_ENERGY_BASE_REGEN_PER_MIN + (level - 1) * WORLD_ENERGY_REGEN_PER_LEVEL_PER_MIN;
}

export function worldHpRegenPerMinute(worldLevel: number): number {
  const level = normalizeWorldLevel(worldLevel);
  return WORLD_HP_BASE_REGEN_PER_MIN + (level - 1) * WORLD_HP_REGEN_PER_LEVEL_PER_MIN;
}

export function createDefaultWorldResourcesState(
  worldLevel: number,
  nowMs = Date.now(),
): GameWorldResourcesState {
  const energyMax = maxWorldEnergy(worldLevel);
  const hpMax = maxWorldHp(worldLevel);

  return {
    energy: {
      current: energyMax,
      max: energyMax,
      lastRegenAt: nowMs,
    },
    hp: {
      current: hpMax,
      max: hpMax,
      lastRegenAt: nowMs,
    },
  };
}

function regenPool(params: {
  current: number;
  elapsedMs: number;
  lastRegenAt: number;
  max: number;
  regenPerMinute: number;
}): WorldResourcePool {
  const elapsedMinutes = Math.max(0, params.elapsedMs) / 60000;
  const gained = elapsedMinutes * params.regenPerMinute;
  const current = clamp(params.current + gained, 0, params.max);

  return {
    current,
    max: params.max,
    lastRegenAt: params.lastRegenAt + Math.max(0, Math.floor(params.elapsedMs)),
  };
}

export function normalizeWorldResourcesState(
  value: Partial<GameWorldResourcesState> | undefined,
  worldLevel: number,
  nowMs = Date.now(),
): GameWorldResourcesState {
  const defaults = createDefaultWorldResourcesState(worldLevel, nowMs);
  const energyMax = maxWorldEnergy(worldLevel);
  const hpMax = maxWorldHp(worldLevel);

  return {
    energy: {
      current: clamp(value?.energy?.current ?? defaults.energy.current, 0, energyMax),
      max: energyMax,
      lastRegenAt: Math.max(0, Math.floor(value?.energy?.lastRegenAt ?? nowMs)),
    },
    hp: {
      current: clamp(value?.hp?.current ?? defaults.hp.current, 0, hpMax),
      max: hpMax,
      lastRegenAt: Math.max(0, Math.floor(value?.hp?.lastRegenAt ?? nowMs)),
    },
  };
}

export function applyWorldResourceRegenForElapsed(
  world: GameWorldResourcesState,
  worldLevel: number,
  elapsedMs: number,
): GameWorldResourcesState {
  const safeElapsedMs = Math.max(0, Math.floor(elapsedMs));
  const energyMax = maxWorldEnergy(worldLevel);
  const hpMax = maxWorldHp(worldLevel);

  return {
    energy: regenPool({
      current: clamp(world.energy.current, 0, energyMax),
      elapsedMs: safeElapsedMs,
      lastRegenAt: world.energy.lastRegenAt,
      max: energyMax,
      regenPerMinute: worldEnergyRegenPerMinute(worldLevel),
    }),
    hp: regenPool({
      current: clamp(world.hp.current, 0, hpMax),
      elapsedMs: safeElapsedMs,
      lastRegenAt: world.hp.lastRegenAt,
      max: hpMax,
      regenPerMinute: worldHpRegenPerMinute(worldLevel),
    }),
  };
}

export function applyWorldResourceRegen(
  world: GameWorldResourcesState,
  worldLevel: number,
  nowMs = Date.now(),
): GameWorldResourcesState {
  const energyMax = maxWorldEnergy(worldLevel);
  const hpMax = maxWorldHp(worldLevel);

  return {
    energy: regenPool({
      current: clamp(world.energy.current, 0, energyMax),
      elapsedMs: Math.max(0, nowMs - world.energy.lastRegenAt),
      lastRegenAt: world.energy.lastRegenAt,
      max: energyMax,
      regenPerMinute: worldEnergyRegenPerMinute(worldLevel),
    }),
    hp: regenPool({
      current: clamp(world.hp.current, 0, hpMax),
      elapsedMs: Math.max(0, nowMs - world.hp.lastRegenAt),
      lastRegenAt: world.hp.lastRegenAt,
      max: hpMax,
      regenPerMinute: worldHpRegenPerMinute(worldLevel),
    }),
  };
}

export function refillWorldResources(
  _world: GameWorldResourcesState,
  worldLevel: number,
  nowMs = Date.now(),
): GameWorldResourcesState {
  return createDefaultWorldResourcesState(worldLevel, nowMs);
}
