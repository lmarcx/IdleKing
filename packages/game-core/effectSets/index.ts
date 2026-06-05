import type { GameState } from "../game/state.js";
import { calculateEffectSlotCount } from "../resonance/index.js";

export const EFFECT_SET_IDS = [
  "shadow_veil",
  "lordflame",
  "motherstone",
  "kingfrost",
  "rainmaker",
] as const;

export type EffectSetId = typeof EFFECT_SET_IDS[number];

export type EffectSetTheme = "dark" | "fire" | "earth" | "ice" | "water";

export type EffectSetSource = Readonly<{
  kind: "boss_first_clear" | "story_event";
  id: string;
  label: string;
}>;

export type SimpleEffect =
  | Readonly<{ type: "stat"; stat: keyof EffectSetStatModifiers; value: number }>
  | Readonly<{ type: "status_application"; status: EffectSetStatusId; chance: number }>
  | Readonly<{ type: "bonus_vs_status"; status: EffectSetStatusId; damageBonus: number }>;

export type EffectSetTierDefinition = Readonly<{
  tier: number;
  effects: readonly SimpleEffect[];
}>;

export type EffectSetDefinition = Readonly<{
  id: EffectSetId;
  name: string;
  source: EffectSetSource;
  availability: "narrative";
  theme: EffectSetTheme;
  tiers: readonly EffectSetTierDefinition[];
}>;

export type SlottedEffectSet = Readonly<{
  effectSetId: EffectSetId;
  tier: number;
}>;

export type EffectSetsState = Readonly<{
  unlockedEffectSetIds: readonly EffectSetId[];
  slottedEffects: readonly SlottedEffectSet[];
}>;

export type EffectSetStatusId = "burn" | "freeze" | "frozen" | "drench";

export type EffectSetStatModifiers = {
  critChance: number;
  darkDamage: number;
  sustain: number;
  defense: number;
  hp: number;
  damageReduction: number;
  burnApplicationChance: number;
  damageVsBurning: number;
  freezeApplicationChance: number;
  damageVsFrozen: number;
  manaRegen: number;
  drenchApplicationChance: number;
  damageVsDrenched: number;
};

export type EffectSetStatusModifiers = Partial<Record<EffectSetStatusId, Readonly<{
  applicationChance?: number;
  damageBonus?: number;
}>>>;

export type EffectSetModifiers = Readonly<{
  statModifiers: EffectSetStatModifiers;
  statusModifiers: EffectSetStatusModifiers;
  combatTags: readonly string[];
}>;

export type EffectSetResonanceContext = Readonly<{
  totalResonance?: number;
  effectSlots?: number;
}>;

export type SlotEffectSetResult =
  | Readonly<{ ok: true; state: GameState }>
  | Readonly<{
      ok: false;
      reason: "EFFECT_SET_NOT_FOUND" | "EFFECT_SET_LOCKED" | "TIER_NOT_FOUND" | "NO_EFFECT_SLOT_AVAILABLE";
      state: GameState;
    }>;

// DEFERRED balancing: placeholder values for the Phase 10 simplified Effect Set pass.
export const EFFECT_SET_BALANCING_PLACEHOLDERS = {
  shadow_veil: {
    tier1CritChance: 0.03,
    tier2DarkDamage: 0.06,
    tier3Sustain: 0.02,
  },
  lordflame: {
    tier1BurnApplicationChance: 0.08,
    tier2DamageVsBurning: 0.08,
    tier3BurnApplicationChance: 0.04,
  },
  motherstone: {
    tier1Defense: 8,
    tier2Hp: 40,
    tier3DamageReduction: 0.03,
  },
  kingfrost: {
    tier1FreezeApplicationChance: 0.05,
    tier2DamageVsFrozen: 0.08,
    tier3FreezeApplicationChance: 0.03,
  },
  rainmaker: {
    tier1ManaRegen: 0.4,
    tier2DrenchApplicationChance: 0.08,
    tier3DamageVsDrenched: 0.08,
  },
} as const;

export const EFFECT_SET_REGISTRY: readonly EffectSetDefinition[] = [
  {
    id: "shadow_veil",
    name: "Shadow Veil",
    source: { kind: "boss_first_clear", id: "dark_amalgam", label: "Amalgame des Tenebres" },
    availability: "narrative",
    theme: "dark",
    tiers: [
      { tier: 1, effects: [{ type: "stat", stat: "critChance", value: EFFECT_SET_BALANCING_PLACEHOLDERS.shadow_veil.tier1CritChance }] },
      { tier: 2, effects: [{ type: "stat", stat: "darkDamage", value: EFFECT_SET_BALANCING_PLACEHOLDERS.shadow_veil.tier2DarkDamage }] },
      { tier: 3, effects: [{ type: "stat", stat: "sustain", value: EFFECT_SET_BALANCING_PLACEHOLDERS.shadow_veil.tier3Sustain }] },
    ],
  },
  {
    id: "lordflame",
    name: "Lordflame",
    source: { kind: "boss_first_clear", id: "dragon_shadow", label: "Ombre du Dragon" },
    availability: "narrative",
    theme: "fire",
    tiers: [
      { tier: 1, effects: [{ type: "status_application", status: "burn", chance: EFFECT_SET_BALANCING_PLACEHOLDERS.lordflame.tier1BurnApplicationChance }] },
      { tier: 2, effects: [{ type: "bonus_vs_status", status: "burn", damageBonus: EFFECT_SET_BALANCING_PLACEHOLDERS.lordflame.tier2DamageVsBurning }] },
      { tier: 3, effects: [{ type: "status_application", status: "burn", chance: EFFECT_SET_BALANCING_PLACEHOLDERS.lordflame.tier3BurnApplicationChance }] },
    ],
  },
  {
    id: "motherstone",
    name: "Motherstone",
    source: { kind: "story_event", id: "frozen_river_cleared", label: "Decouverte du Fleuve de Vie" },
    availability: "narrative",
    theme: "earth",
    tiers: [
      { tier: 1, effects: [{ type: "stat", stat: "defense", value: EFFECT_SET_BALANCING_PLACEHOLDERS.motherstone.tier1Defense }] },
      { tier: 2, effects: [{ type: "stat", stat: "hp", value: EFFECT_SET_BALANCING_PLACEHOLDERS.motherstone.tier2Hp }] },
      { tier: 3, effects: [{ type: "stat", stat: "damageReduction", value: EFFECT_SET_BALANCING_PLACEHOLDERS.motherstone.tier3DamageReduction }] },
    ],
  },
  {
    id: "kingfrost",
    name: "Kingfrost",
    source: { kind: "boss_first_clear", id: "corrupted_archmage", label: "Archimage Corrompu" },
    availability: "narrative",
    theme: "ice",
    tiers: [
      { tier: 1, effects: [{ type: "status_application", status: "freeze", chance: EFFECT_SET_BALANCING_PLACEHOLDERS.kingfrost.tier1FreezeApplicationChance }] },
      { tier: 2, effects: [{ type: "bonus_vs_status", status: "frozen", damageBonus: EFFECT_SET_BALANCING_PLACEHOLDERS.kingfrost.tier2DamageVsFrozen }] },
      { tier: 3, effects: [{ type: "status_application", status: "freeze", chance: EFFECT_SET_BALANCING_PLACEHOLDERS.kingfrost.tier3FreezeApplicationChance }] },
    ],
  },
  {
    id: "rainmaker",
    name: "Rainmaker",
    source: { kind: "boss_first_clear", id: "fallen_rain_lord", label: "Seigneur de la Pluie Dechu" },
    availability: "narrative",
    theme: "water",
    tiers: [
      { tier: 1, effects: [{ type: "stat", stat: "manaRegen", value: EFFECT_SET_BALANCING_PLACEHOLDERS.rainmaker.tier1ManaRegen }] },
      { tier: 2, effects: [{ type: "status_application", status: "drench", chance: EFFECT_SET_BALANCING_PLACEHOLDERS.rainmaker.tier2DrenchApplicationChance }] },
      { tier: 3, effects: [{ type: "bonus_vs_status", status: "drench", damageBonus: EFFECT_SET_BALANCING_PLACEHOLDERS.rainmaker.tier3DamageVsDrenched }] },
    ],
  },
] as const;

const NARRATIVE_UNLOCK_EVENT_TO_EFFECT_SET: Readonly<Record<string, EffectSetId>> = {
  dark_amalgam: "shadow_veil",
  dragon_shadow: "lordflame",
  frozen_river: "motherstone",
  frozen_river_cleared: "motherstone",
  life_river_discovered: "motherstone",
  corrupted_archmage: "kingfrost",
  fallen_rain_lord: "rainmaker",
};

const SIMPLE_EFFECT_TYPES = new Set<SimpleEffect["type"]>([
  "stat",
  "status_application",
  "bonus_vs_status",
]);

const FORBIDDEN_EFFECT_TYPE_PATTERNS = [
  "shadow_clone",
  "ice_nova",
  "tidal_wave",
  "explosion",
  "orbital",
  "proc",
] as const;

export function createDefaultEffectSetsState(): EffectSetsState {
  return {
    unlockedEffectSetIds: [],
    slottedEffects: [],
  };
}

export function normalizeEffectSetsState(value: unknown): EffectSetsState {
  if (!value || typeof value !== "object") return createDefaultEffectSetsState();
  const input = value as Partial<EffectSetsState>;
  const unlocked = Array.isArray(input.unlockedEffectSetIds)
    ? normalizeUnlockedIds(input.unlockedEffectSetIds)
    : [];
  const slotted = Array.isArray(input.slottedEffects)
    ? input.slottedEffects.flatMap((slot): SlottedEffectSet[] => {
        if (!slot || typeof slot !== "object") return [];
        const candidate = slot as Partial<SlottedEffectSet>;
        if (!isEffectSetId(candidate.effectSetId)) return [];
        const tier = candidate.tier;
        if (typeof tier !== "number" || !getEffectSetTierDefinition(candidate.effectSetId, tier)) return [];
        return [{ effectSetId: candidate.effectSetId, tier }];
      })
    : [];

  return {
    unlockedEffectSetIds: unlocked,
    slottedEffects: dedupeSlottedEffects(slotted),
  };
}

export function getEffectSetDefinition(effectSetId: string): EffectSetDefinition | undefined {
  return EFFECT_SET_REGISTRY.find((effectSet) => effectSet.id === effectSetId);
}

export function isEffectSetId(effectSetId: unknown): effectSetId is EffectSetId {
  return typeof effectSetId === "string" && (EFFECT_SET_IDS as readonly string[]).includes(effectSetId);
}

export function unlockEffectSet(state: GameState, effectSetId: string): GameState {
  if (!isEffectSetId(effectSetId) || !getEffectSetDefinition(effectSetId)) {
    throw new Error(`Unknown MVP Effect Set id: ${effectSetId}`);
  }

  const effectSets = normalizeEffectSetsState(state.effectSets);
  if (effectSets.unlockedEffectSetIds.includes(effectSetId)) {
    return { ...state, effectSets };
  }

  return {
    ...state,
    effectSets: {
      ...effectSets,
      unlockedEffectSetIds: [...effectSets.unlockedEffectSetIds, effectSetId],
    },
  };
}

export function hasUnlockedEffectSet(state: Pick<GameState, "effectSets">, effectSetId: string): boolean {
  if (!isEffectSetId(effectSetId)) return false;
  return normalizeEffectSetsState(state.effectSets).unlockedEffectSetIds.includes(effectSetId);
}

export function getUnlockedEffectSets(state: Pick<GameState, "effectSets">): EffectSetDefinition[] {
  const effectSets = normalizeEffectSetsState(state.effectSets);
  return effectSets.unlockedEffectSetIds.flatMap((effectSetId): EffectSetDefinition[] => {
    const definition = getEffectSetDefinition(effectSetId);
    return definition ? [definition] : [];
  });
}

export function canSlotEffectSet(
  state: Pick<GameState, "effectSets">,
  effectSetId: string,
  tier: number,
  resonanceContext: EffectSetResonanceContext,
): boolean {
  if (!isEffectSetId(effectSetId)) return false;
  if (!hasUnlockedEffectSet(state, effectSetId)) return false;
  if (!getEffectSetTierDefinition(effectSetId, tier)) return false;

  const effectSets = normalizeEffectSetsState(state.effectSets);
  const alreadySlotted = effectSets.slottedEffects.some((slot) => slot.effectSetId === effectSetId);
  const usedSlots = alreadySlotted ? effectSets.slottedEffects.length : effectSets.slottedEffects.length + 1;
  return usedSlots <= getEffectSlotsFromContext(resonanceContext);
}

export function slotEffectSet(
  state: GameState,
  effectSetId: string,
  tier: number,
  resonanceContext: EffectSetResonanceContext,
): SlotEffectSetResult {
  if (!isEffectSetId(effectSetId)) {
    return { ok: false, reason: "EFFECT_SET_NOT_FOUND", state };
  }
  if (!hasUnlockedEffectSet(state, effectSetId)) {
    return { ok: false, reason: "EFFECT_SET_LOCKED", state };
  }
  if (!getEffectSetTierDefinition(effectSetId, tier)) {
    return { ok: false, reason: "TIER_NOT_FOUND", state };
  }
  if (!canSlotEffectSet(state, effectSetId, tier, resonanceContext)) {
    return { ok: false, reason: "NO_EFFECT_SLOT_AVAILABLE", state };
  }

  const effectSets = normalizeEffectSetsState(state.effectSets);
  const slottedEffects = effectSets.slottedEffects.some((slot) => slot.effectSetId === effectSetId)
    ? effectSets.slottedEffects.map((slot) => slot.effectSetId === effectSetId ? { effectSetId, tier } : slot)
    : [...effectSets.slottedEffects, { effectSetId, tier }];

  return {
    ok: true,
    state: {
      ...state,
      effectSets: {
        ...effectSets,
        slottedEffects,
      },
    },
  };
}

export function unslotEffectSet(state: GameState, effectSetId: string): GameState {
  const effectSets = normalizeEffectSetsState(state.effectSets);
  return {
    ...state,
    effectSets: {
      ...effectSets,
      slottedEffects: effectSets.slottedEffects.filter((slot) => slot.effectSetId !== effectSetId),
    },
  };
}

export function calculateEffectSetModifiers(slottedEffects: readonly SlottedEffectSet[]): EffectSetModifiers {
  const statModifiers = createEmptyEffectSetStatModifiers();
  const statusModifiers: Record<string, { applicationChance?: number; damageBonus?: number }> = {};
  const combatTags = new Set<string>();

  for (const slotted of slottedEffects) {
    const definition = getEffectSetDefinition(slotted.effectSetId);
    if (!definition) throw new Error(`Unknown MVP Effect Set id: ${slotted.effectSetId}`);
    const tiers = definition.tiers.filter((tier) => tier.tier <= slotted.tier);
    if (tiers.length === 0 || !definition.tiers.some((tier) => tier.tier === slotted.tier)) {
      throw new Error(`Unknown tier ${slotted.tier} for Effect Set ${slotted.effectSetId}`);
    }

    combatTags.add(`effect_set:${definition.id}`);
    combatTags.add(`theme:${definition.theme}`);
    for (const tier of tiers) {
      for (const effect of tier.effects) {
        applySimpleEffect(effect, statModifiers, statusModifiers, combatTags);
      }
    }
  }

  return {
    statModifiers,
    statusModifiers,
    combatTags: [...combatTags].sort(),
  };
}

export function applyNarrativeEffectSetUnlock(state: GameState, eventIdOrBossId: string): GameState {
  const effectSetId = NARRATIVE_UNLOCK_EVENT_TO_EFFECT_SET[eventIdOrBossId];
  return effectSetId ? unlockEffectSet(state, effectSetId) : state;
}

export function validateEffectSetRegistry(
  registry: readonly EffectSetDefinition[] = EFFECT_SET_REGISTRY,
): void {
  if (registry.length !== EFFECT_SET_IDS.length) {
    throw new Error(`MVP Effect Set registry must contain exactly ${EFFECT_SET_IDS.length} entries`);
  }

  const ids = new Set<string>();
  for (const definition of registry) {
    if (!isEffectSetId(definition.id)) throw new Error(`Future or unknown Effect Set active: ${definition.id}`);
    if (ids.has(definition.id)) throw new Error(`Duplicate Effect Set id: ${definition.id}`);
    ids.add(definition.id);
    if (definition.availability !== "narrative") throw new Error(`Effect Set must be narrative-only: ${definition.id}`);
    if (!definition.source.id) throw new Error(`Effect Set source is missing: ${definition.id}`);
    if (definition.source.kind !== "boss_first_clear" && definition.source.kind !== "story_event") {
      throw new Error(`Effect Set source must be narrative: ${definition.id}`);
    }
    validateEffectSetTiers(definition);
  }

  for (const effectSetId of EFFECT_SET_IDS) {
    if (!ids.has(effectSetId)) throw new Error(`Missing MVP Effect Set: ${effectSetId}`);
  }
}

function getEffectSlotsFromContext(context: EffectSetResonanceContext): number {
  if (typeof context.totalResonance === "number") return calculateEffectSlotCount(context.totalResonance);
  if (typeof context.effectSlots !== "number" || !Number.isFinite(context.effectSlots)) return 0;
  return Math.max(0, Math.floor(context.effectSlots));
}

function normalizeUnlockedIds(ids: readonly unknown[]): EffectSetId[] {
  const result: EffectSetId[] = [];
  for (const id of ids) {
    if (!isEffectSetId(id) || result.includes(id)) continue;
    result.push(id);
  }
  return result;
}

function dedupeSlottedEffects(slotted: readonly SlottedEffectSet[]): SlottedEffectSet[] {
  const result: SlottedEffectSet[] = [];
  const seen = new Set<EffectSetId>();
  for (const slot of slotted) {
    if (seen.has(slot.effectSetId)) continue;
    seen.add(slot.effectSetId);
    result.push(slot);
  }
  return result;
}

function getEffectSetTierDefinition(effectSetId: string, tier: unknown): EffectSetTierDefinition | undefined {
  if (!isEffectSetId(effectSetId) || typeof tier !== "number" || !Number.isInteger(tier)) return undefined;
  return getEffectSetDefinition(effectSetId)?.tiers.find((definition) => definition.tier === tier);
}

function createEmptyEffectSetStatModifiers(): EffectSetStatModifiers {
  return {
    critChance: 0,
    darkDamage: 0,
    sustain: 0,
    defense: 0,
    hp: 0,
    damageReduction: 0,
    burnApplicationChance: 0,
    damageVsBurning: 0,
    freezeApplicationChance: 0,
    damageVsFrozen: 0,
    manaRegen: 0,
    drenchApplicationChance: 0,
    damageVsDrenched: 0,
  };
}

function applySimpleEffect(
  effect: SimpleEffect,
  statModifiers: EffectSetStatModifiers,
  statusModifiers: Record<string, { applicationChance?: number; damageBonus?: number }>,
  combatTags: Set<string>,
): void {
  switch (effect.type) {
    case "stat": {
      statModifiers[effect.stat] += effect.value;
      combatTags.add(`stat:${effect.stat}`);
      return;
    }
    case "status_application": {
      const status = statusModifiers[effect.status] ?? {};
      status.applicationChance = (status.applicationChance ?? 0) + effect.chance;
      statusModifiers[effect.status] = status;
      statModifiers[statusApplicationStat(effect.status)] += effect.chance;
      combatTags.add(`status:${effect.status}`);
      return;
    }
    case "bonus_vs_status": {
      const status = statusModifiers[effect.status] ?? {};
      status.damageBonus = (status.damageBonus ?? 0) + effect.damageBonus;
      statusModifiers[effect.status] = status;
      statModifiers[statusDamageStat(effect.status)] += effect.damageBonus;
      combatTags.add(`vs_status:${effect.status}`);
      return;
    }
  }
}

function statusApplicationStat(status: EffectSetStatusId): keyof EffectSetStatModifiers {
  if (status === "burn") return "burnApplicationChance";
  if (status === "freeze") return "freezeApplicationChance";
  if (status === "drench") return "drenchApplicationChance";
  throw new Error(`Status does not support application chance: ${status}`);
}

function statusDamageStat(status: EffectSetStatusId): keyof EffectSetStatModifiers {
  if (status === "burn") return "damageVsBurning";
  if (status === "frozen") return "damageVsFrozen";
  if (status === "drench") return "damageVsDrenched";
  throw new Error(`Status does not support damage bonus: ${status}`);
}

function validateEffectSetTiers(definition: EffectSetDefinition): void {
  const tiers = new Set<number>();
  for (const tier of definition.tiers) {
    if (!Number.isInteger(tier.tier) || tier.tier < 1) {
      throw new Error(`Invalid Effect Set tier for ${definition.id}: ${tier.tier}`);
    }
    if (tiers.has(tier.tier)) throw new Error(`Duplicate Effect Set tier ${tier.tier} for ${definition.id}`);
    tiers.add(tier.tier);
    if (tier.effects.length === 0) throw new Error(`Effect Set tier has no effects: ${definition.id} tier ${tier.tier}`);

    for (const effect of tier.effects) {
      if (!SIMPLE_EFFECT_TYPES.has(effect.type)) {
        throw new Error(`Forbidden Effect Set effect type on ${definition.id}: ${(effect as { type: string }).type}`);
      }
      const effectType = String(effect.type).toLowerCase();
      if (FORBIDDEN_EFFECT_TYPE_PATTERNS.some((pattern) => effectType.includes(pattern))) {
        throw new Error(`Forbidden Effect Set proc type on ${definition.id}: ${effect.type}`);
      }
    }
  }
}

validateEffectSetRegistry();
