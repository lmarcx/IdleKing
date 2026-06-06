"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { GamePanel } from "@/components/ui/game-panel";
import { useGameStore } from "@/store/game-store";
import {
  EFFECT_SET_REGISTRY,
  calculateEffectSetModifiers,
  canSlotEffectSet,
  hasUnlockedEffectSet,
  normalizeEffectSetsState,
  slotEffectSet,
  unslotEffectSet,
  type EffectSetDefinition,
  type EffectSetId,
  type SimpleEffect,
} from "@idleking/game-core/effectSets";
import { calculateResonanceFromEquipment } from "@idleking/game-core/resonance";

const SLOT_FAILURE_LABELS: Record<string, string> = {
  EFFECT_SET_LOCKED: "Effect Set verrouille.",
  EFFECT_SET_NOT_FOUND: "Effect Set inconnu.",
  NO_EFFECT_SLOT_AVAILABLE: "Aucun Effect Slot disponible.",
  TIER_NOT_FOUND: "Tier inconnu.",
};

function formatEffectValue(value: number): string {
  if (Math.abs(value) > 0 && Math.abs(value) < 1) return `${Math.round(value * 100)}%`;
  return `${value}`;
}

function formatEffect(effect: SimpleEffect): string {
  switch (effect.type) {
    case "stat":
      return `${effect.stat}: ${formatEffectValue(effect.value)}`;
    case "status_application":
      return `${effect.status}: apply ${formatEffectValue(effect.chance)}`;
    case "bonus_vs_status":
      return `vs ${effect.status}: ${formatEffectValue(effect.damageBonus)}`;
  }
}

function EffectSetCard({
  availableSlots,
  definition,
  isUnlocked,
  onSlot,
  onUnslot,
  slottedTier,
  totalResonance,
}: {
  availableSlots: number;
  definition: EffectSetDefinition;
  isUnlocked: boolean;
  onSlot: (effectSetId: EffectSetId, tier: number) => void;
  onUnslot: (effectSetId: EffectSetId) => void;
  slottedTier: number | null;
  totalResonance: number;
}) {
  const state = useGameStore.getState().state;
  return (
    <GamePanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.16em] text-cyan-100/75">
            {definition.theme}
          </p>
          <h3 className="mt-1 font-ik-title text-2xl text-amber-50">{definition.name}</h3>
        </div>
        <span className="rounded border border-amber-200/18 bg-black/35 px-2 py-1 font-ik-menu text-[0.65rem] text-amber-50">
          {isUnlocked ? "Unlocked" : "Locked"}
        </span>
      </div>
      <p className="mt-3 font-ik-body text-sm text-muted-foreground">
        Source: {definition.source.label}
      </p>

      <div className="mt-4 grid gap-2">
        {definition.tiers.map((tier) => {
          const canSlot = canSlotEffectSet(state, definition.id, tier.tier, { totalResonance });
          const active = slottedTier === tier.tier;
          return (
            <div className="rounded-md border border-amber-200/14 bg-black/28 p-3" key={tier.tier}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-ik-menu text-xs uppercase text-amber-100">Tier {tier.tier}</span>
                <button
                  className="rounded-md border border-amber-200/24 bg-amber-500/12 px-2.5 py-1 font-ik-menu text-[0.65rem] uppercase text-amber-50 transition hover:border-amber-100 disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!isUnlocked || (!canSlot && !active) || availableSlots <= 0}
                  onClick={() => onSlot(definition.id, tier.tier)}
                  type="button"
                >
                  {active ? "Active" : "Slot"}
                </button>
              </div>
              <p className="mt-2 font-ik-body text-xs text-muted-foreground">
                {tier.effects.map(formatEffect).join(", ")}
              </p>
            </div>
          );
        })}
      </div>

      {slottedTier !== null ? (
        <button
          className="mt-4 w-full rounded-md border border-red-200/30 bg-red-500/10 px-3 py-2 font-ik-menu text-xs uppercase text-red-100 transition hover:border-red-100"
          onClick={() => onUnslot(definition.id)}
          type="button"
        >
          Unslot
        </button>
      ) : null}
    </GamePanel>
  );
}

export function EffectSetsPanel() {
  const state = useGameStore((store) => store.state);
  const dispatch = useGameStore((store) => store.dispatch);
  const effectSets = normalizeEffectSetsState(state.effectSets);
  const resonance = useMemo(
    () => calculateResonanceFromEquipment({ equipped: state.equipment, items: state.inventory.items }),
    [state.equipment, state.inventory.items]
  );
  const modifiers = useMemo(
    () => calculateEffectSetModifiers(effectSets.slottedEffects),
    [effectSets.slottedEffects]
  );
  const usedSlots = effectSets.slottedEffects.length;
  const availableSlots = Math.max(0, resonance.effectSlots - usedSlots);
  const slottedTierById = new Map(effectSets.slottedEffects.map((slot) => [slot.effectSetId, slot.tier] as const));
  const nonZeroStats = Object.entries(modifiers.statModifiers).filter(([, value]) => value !== 0);

  function handleSlot(effectSetId: EffectSetId, tier: number) {
    const current = useGameStore.getState().state;
    const currentResonance = calculateResonanceFromEquipment({
      equipped: current.equipment,
      items: current.inventory.items,
    });
    const result = slotEffectSet(current, effectSetId, tier, { totalResonance: currentResonance.totalResonance });
    if (!result.ok) {
      toast.error(SLOT_FAILURE_LABELS[result.reason] ?? "Slot impossible.");
      return;
    }

    dispatch(() => result.state);
    toast.success("Effect Set slotted");
  }

  function handleUnslot(effectSetId: EffectSetId) {
    dispatch((current) => unslotEffectSet(current, effectSetId));
    toast.success("Effect Set unslotted");
  }

  return (
    <section className="space-y-4">
      <GamePanel className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-200/80">Narrative unlocks</p>
            <h2 className="font-ik-title text-3xl font-semibold text-amber-50">Effect Sets</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-amber-200/16 bg-black/32 px-4 py-3 text-right">
              <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">Slots</p>
              <p className="font-ik-title text-2xl text-amber-50">
                {usedSlots}/{resonance.effectSlots}
              </p>
            </div>
            <div className="rounded-lg border border-amber-200/16 bg-black/32 px-4 py-3 text-right">
              <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                Resonance
              </p>
              <p className="font-ik-title text-2xl text-amber-50">{resonance.totalResonance}</p>
            </div>
            <div className="rounded-lg border border-amber-200/16 bg-black/32 px-4 py-3 text-right">
              <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                Registry
              </p>
              <p className="font-ik-title text-2xl text-amber-50">{EFFECT_SET_REGISTRY.length}</p>
            </div>
          </div>
        </div>
      </GamePanel>

      <div className="grid gap-3 xl:grid-cols-2">
        {EFFECT_SET_REGISTRY.map((definition) => (
          <EffectSetCard
            availableSlots={availableSlots}
            definition={definition}
            isUnlocked={hasUnlockedEffectSet(state, definition.id)}
            key={definition.id}
            onSlot={handleSlot}
            onUnslot={handleUnslot}
            slottedTier={slottedTierById.get(definition.id) ?? null}
            totalResonance={resonance.totalResonance}
          />
        ))}
      </div>

      <GamePanel className="p-4">
        <h3 className="font-ik-title text-xl text-amber-50">Active simple modifiers</h3>
        <div className="mt-3 flex flex-wrap gap-2 font-ik-body text-xs text-amber-50/85">
          {nonZeroStats.length > 0 ? (
            nonZeroStats.map(([stat, value]) => (
              <span className="rounded border border-amber-200/14 bg-black/35 px-2 py-1" key={stat}>
                {stat}: {formatEffectValue(value)}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground">No slotted Effect Set modifiers.</span>
          )}
        </div>
      </GamePanel>
    </section>
  );
}
