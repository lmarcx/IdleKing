"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { Droplets, Flame, Lock, Moon, Mountain, Snowflake } from "lucide-react";

import { GamePanel } from "@/components/ui/game-panel";
import { cn } from "@/lib/utils";
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
  type EffectSetTheme,
  type SimpleEffect,
} from "@idleking/game-core/effectSets";
import { calculateResonanceFromEquipment } from "@idleking/game-core/resonance";

const SLOT_FAILURE_LABELS: Record<string, string> = {
  EFFECT_SET_LOCKED: "Effect Set verrouillé.",
  EFFECT_SET_NOT_FOUND: "Effect Set inconnu.",
  NO_EFFECT_SLOT_AVAILABLE: "Aucun Effect Slot disponible.",
  TIER_NOT_FOUND: "Palier inconnu.",
};

const TIER_ROMAN: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };

const THEME_ICON: Record<EffectSetTheme, typeof Flame> = {
  dark: Moon,
  earth: Mountain,
  fire: Flame,
  ice: Snowflake,
  water: Droplets,
};

const THEME_LABEL: Record<EffectSetTheme, string> = {
  dark: "Ténèbres",
  earth: "Terre",
  fire: "Feu",
  ice: "Glace",
  water: "Eau",
};

function formatSlotLabel(slot: string): string {
  return slot.replaceAll("_", " ");
}

function formatRarityLabel(rarity: string): string {
  return rarity.charAt(0) + rarity.slice(1).toLowerCase();
}

function formatEffectValue(value: number): string {
  if (Math.abs(value) > 0 && Math.abs(value) < 1) return `${Math.round(value * 100)}%`;
  return `${value}`;
}

function formatEffect(effect: SimpleEffect): string {
  switch (effect.type) {
    case "stat":
      return `${effect.stat}: ${formatEffectValue(effect.value)}`;
    case "status_application":
      return `${effect.status}: application ${formatEffectValue(effect.chance)}`;
    case "bonus_vs_status":
      return `vs ${effect.status}: ${formatEffectValue(effect.damageBonus)}`;
  }
}

function pluralize(count: number, word: string): string {
  return count > 1 ? `${word}s` : word;
}

type NodeState = "active" | "available" | "locked" | "reached";

function getNodeState({
  isUnlocked,
  reachedTier,
  tier,
}: {
  isUnlocked: boolean;
  reachedTier: number | null;
  tier: number;
}): NodeState {
  if (!isUnlocked) return "locked";
  if (reachedTier === tier) return "active";
  if (reachedTier !== null && tier < reachedTier) return "reached";
  return "available";
}

function getTierBadgeLabel(nodeState: NodeState, disabled: boolean): string {
  if (nodeState === "locked") return "Verrouillé";
  if (nodeState === "active") return "Actif";
  if (nodeState === "reached") return "Atteint";
  return disabled ? "Slot requis" : "Disponible";
}

function getNodeTooltip({
  definition,
  disabled,
  isUnlocked,
  nodeState,
}: {
  definition: EffectSetDefinition;
  disabled: boolean;
  isUnlocked: boolean;
  nodeState: NodeState;
}): string {
  if (!isUnlocked) return `Débloquer via : ${definition.source.label}`;
  if (nodeState === "active") return "Palier actif — cliquer pour retirer";
  if (nodeState === "reached") return "Cliquer pour redescendre à ce palier";
  if (disabled) return "Aucun Effect Slot disponible";
  return "Cliquer pour investir ce palier";
}

type FamilyState = "active" | "locked" | "unlocked";

function getFamilyState({
  isUnlocked,
  reachedTier,
}: {
  isUnlocked: boolean;
  reachedTier: number | null;
}): FamilyState {
  if (!isUnlocked) return "locked";
  if (reachedTier !== null) return "active";
  return "unlocked";
}

function getFamilyStateLabel(familyState: FamilyState): string {
  if (familyState === "locked") return "Verrouillé";
  if (familyState === "active") return "Actif";
  return "Débloqué";
}

function getFamilyReason({ availableSlots, familyState }: { availableSlots: number; familyState: FamilyState }): string {
  if (familyState === "active") return "Utilise 1 Effect Slot";
  if (familyState === "locked") return "Effect Set verrouillé";
  return availableSlots > 0 ? "Coût : 1 Effect Slot" : "Tous les Effect Slots sont utilisés";
}

function SummaryStat({ label, sub, value }: { label: string; sub?: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/32 px-4 py-3">
      <p className="font-ik-menu text-[0.62rem] uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="mt-1 font-ik-title text-2xl text-neutral-100">{value}</p>
      {sub ? <p className="font-ik-body text-[0.65rem] text-neutral-500">{sub}</p> : null}
    </div>
  );
}

function EffectSlotMarkers({ current, used }: { current: number; used: number }) {
  if (current <= 0) {
    return <p className="font-ik-body text-sm text-neutral-600">—</p>;
  }
  return (
    <div aria-hidden="true" className="flex items-center gap-1">
      {Array.from({ length: current }, (_, index) => (
        <span className={cn("text-base leading-none", index < used ? "text-neutral-100" : "text-neutral-700")} key={index}>
          {index < used ? "●" : "○"}
        </span>
      ))}
    </div>
  );
}

function FamilyBranch({
  availableSlots,
  definition,
  onSlot,
  onUnslot,
  reachedTier,
  resonanceTotal,
}: {
  availableSlots: number;
  definition: EffectSetDefinition;
  onSlot: (effectSetId: EffectSetId, tier: number) => void;
  onUnslot: (effectSetId: EffectSetId) => void;
  reachedTier: number | null;
  resonanceTotal: number;
}) {
  const state = useGameStore.getState().state;
  const isUnlocked = hasUnlockedEffectSet(state, definition.id);
  const Icon = THEME_ICON[definition.theme];
  const familyState = getFamilyState({ isUnlocked, reachedTier });

  return (
    <GamePanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 bg-black/40",
              isUnlocked ? "border-neutral-600" : "border-neutral-800"
            )}
          >
            <Icon aria-hidden="true" className={cn("h-4.5 w-4.5", isUnlocked ? "text-neutral-300" : "text-neutral-700")} />
          </span>
          <div>
            <p
              className={cn(
                "font-ik-menu text-[0.62rem] uppercase tracking-[0.16em]",
                isUnlocked ? "text-neutral-400" : "text-neutral-700"
              )}
            >
              {THEME_LABEL[definition.theme]}
            </p>
            <h3 className="font-ik-title text-xl text-neutral-100">{definition.name}</h3>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={cn(
              "rounded border px-2 py-0.5 font-ik-menu text-[0.6rem] uppercase tracking-wide",
              familyState === "locked" && "border-neutral-800 text-neutral-600",
              familyState === "unlocked" && "border-neutral-600 text-neutral-300",
              familyState === "active" && "border-neutral-100 bg-neutral-100 text-neutral-950"
            )}
          >
            {getFamilyStateLabel(familyState)}
          </span>
          {reachedTier !== null ? (
            <button
              aria-label={`Retirer ${definition.name}`}
              className="rounded-md border border-red-900/50 bg-red-950/20 px-2.5 py-1 font-ik-menu text-[0.6rem] uppercase text-red-300 transition hover:border-red-400/60"
              onClick={() => onUnslot(definition.id)}
              type="button"
            >
              Retirer
            </button>
          ) : null}
        </div>
      </div>

      <p className="mt-2 font-ik-body text-xs text-neutral-500">
        {isUnlocked ? `Source : ${definition.source.label}` : `Verrouillé — ${definition.source.label}`}
      </p>
      <p className="mt-0.5 font-ik-body text-[0.68rem] text-neutral-400">
        {getFamilyReason({ availableSlots, familyState })}
      </p>

      <div className="relative mt-4 pl-1">
        <div aria-hidden="true" className="absolute left-[15px] top-3 bottom-3 w-px bg-white/10" />
        <ol className="space-y-2.5">
          {definition.tiers.map((tierDef) => {
            const nodeState = getNodeState({ isUnlocked, reachedTier, tier: tierDef.tier });
            const canInteract = canSlotEffectSet(state, definition.id, tierDef.tier, { totalResonance: resonanceTotal });
            const disabled = !canInteract;
            const roman = TIER_ROMAN[tierDef.tier] ?? `${tierDef.tier}`;
            const includedRoman =
              tierDef.tier > 1
                ? Array.from({ length: tierDef.tier - 1 }, (_, index) => TIER_ROMAN[index + 1] ?? `${index + 1}`).join(" + ")
                : null;

            return (
              <li className="relative pl-9" key={tierDef.tier}>
                <span
                  className={cn(
                    "absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border-2 bg-black/60 font-ik-menu text-xs",
                    nodeState === "locked" && "border-neutral-800 text-neutral-700",
                    nodeState === "available" && "border-neutral-700 text-neutral-400",
                    nodeState === "reached" && "border-neutral-500 text-neutral-200",
                    nodeState === "active" && "border-neutral-100 bg-neutral-100 text-neutral-950"
                  )}
                >
                  {nodeState === "locked" ? <Lock aria-hidden="true" className="h-3.5 w-3.5" /> : roman}
                </span>
                <button
                  aria-label={`${definition.name} palier ${roman}`}
                  className={cn(
                    "ik-card-hover w-full rounded-md border bg-black/28 p-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                    nodeState === "active" ? "border-neutral-100 bg-neutral-100 text-neutral-950" : "border-white/10"
                  )}
                  data-ik-tip={getNodeTooltip({ definition, disabled, isUnlocked, nodeState })}
                  disabled={disabled}
                  onClick={() => onSlot(definition.id, tierDef.tier)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "font-ik-menu text-[0.65rem] uppercase",
                        nodeState === "active" ? "text-neutral-950" : "text-neutral-200"
                      )}
                    >
                      Palier {roman}
                    </span>
                    <span
                      className={cn(
                        "font-ik-menu text-[0.6rem] uppercase",
                        nodeState === "active" ? "text-neutral-700" : "text-neutral-500"
                      )}
                    >
                      {getTierBadgeLabel(nodeState, disabled)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-1.5 font-ik-body text-xs",
                      nodeState === "active" ? "text-neutral-800" : "text-neutral-500"
                    )}
                  >
                    {tierDef.effects.map(formatEffect).join(", ")}
                  </p>
                  {includedRoman ? (
                    <p
                      className={cn(
                        "mt-1 font-ik-body text-[0.6rem]",
                        nodeState === "active" ? "text-neutral-700" : "text-neutral-600"
                      )}
                    >
                      Inclut {includedRoman}
                    </p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </GamePanel>
  );
}

export function ResonanceTreePanel() {
  const state = useGameStore((store) => store.state);
  const dispatch = useGameStore((store) => store.dispatch);

  const resonance = useMemo(
    () => calculateResonanceFromEquipment({ equipped: state.equipment, items: state.inventory.items }),
    [state.equipment, state.inventory.items]
  );
  const effectSets = normalizeEffectSetsState(state.effectSets);
  const modifiers = useMemo(
    () => calculateEffectSetModifiers(effectSets.slottedEffects),
    [effectSets.slottedEffects]
  );
  const itemById = useMemo(
    () => new Map(state.inventory.items.map((item) => [item.id, item.name] as const)),
    [state.inventory.items]
  );
  const ringCount = state.equipment.equipped.rings.filter((itemId) => itemId !== null).length;
  const artifactId = state.equipment.equipped.artifact ?? null;
  const usedSlots = effectSets.slottedEffects.length;
  const currentSlots = resonance.effectSlots;
  const availableSlots = Math.max(0, currentSlots - usedSlots);
  const nextSlotThreshold = (currentSlots + 1) * 9;
  const pointsToNextSlot = Math.max(0, nextSlotThreshold - resonance.totalResonance);
  const nextSlotProgressPercent = Math.min(100, Math.max(0, (resonance.totalResonance / nextSlotThreshold) * 100));
  const slottedTierById = new Map(effectSets.slottedEffects.map((slot) => [slot.effectSetId, slot.tier] as const));
  const nonZeroStats = Object.entries(modifiers.statModifiers).filter(([, value]) => value !== 0);
  const filledContributors = resonance.slots.filter((slot) => slot.itemId !== null).length;

  function handleSlot(effectSetId: EffectSetId, tier: number) {
    const current = useGameStore.getState().state;
    const currentEffectSets = normalizeEffectSetsState(current.effectSets);
    const currentTier = currentEffectSets.slottedEffects.find((slot) => slot.effectSetId === effectSetId)?.tier ?? null;

    if (currentTier === tier) {
      dispatch((next) => unslotEffectSet(next, effectSetId));
      toast.success("Effect Set retiré", { id: `resonance-slot-${effectSetId}` });
      return;
    }

    const currentResonance = calculateResonanceFromEquipment({
      equipped: current.equipment,
      items: current.inventory.items,
    });
    const result = slotEffectSet(current, effectSetId, tier, { totalResonance: currentResonance.totalResonance });
    if (!result.ok) {
      toast.error(SLOT_FAILURE_LABELS[result.reason] ?? "Action impossible.", { id: `resonance-slot-${effectSetId}` });
      return;
    }

    dispatch(() => result.state);
    toast.success(`Palier ${TIER_ROMAN[tier] ?? tier} activé`, { id: `resonance-slot-${effectSetId}` });
  }

  function handleUnslot(effectSetId: EffectSetId) {
    dispatch((current) => unslotEffectSet(current, effectSetId));
    toast.success("Effect Set retiré", { id: `resonance-slot-${effectSetId}` });
  }

  return (
    <section aria-labelledby="resonance-title" className="ik-anim-fade-in space-y-4">
      <GamePanel className="p-4">
        <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-neutral-500">Build passif</p>
        <h2 className="font-ik-title text-3xl font-semibold text-neutral-100" id="resonance-title">
          Résonance
        </h2>
        <p className="mt-2 max-w-2xl font-ik-body text-xs leading-relaxed text-neutral-400">
          Les équipements génèrent de la Résonance. Tous les 9 points débloquent 1 Effect Slot. Un Effect Slot
          permet d&apos;équiper une famille d&apos;effet. Choisir un palier active aussi les paliers précédents.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat label="Résonance totale" value={`${resonance.totalResonance}`} />
          <div className="rounded-lg border border-white/10 bg-black/32 px-4 py-3">
            <p className="font-ik-menu text-[0.62rem] uppercase tracking-[0.14em] text-neutral-500">Effect Slots</p>
            <div className="mt-1.5">
              <EffectSlotMarkers current={currentSlots} used={usedSlots} />
            </div>
            <p className="mt-1.5 font-ik-body text-[0.65rem] text-neutral-500">
              {usedSlots} {pluralize(usedSlots, "utilisé")} / {availableSlots} {pluralize(availableSlots, "libre")}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/32 px-4 py-3">
            <p className="font-ik-menu text-[0.62rem] uppercase tracking-[0.14em] text-neutral-500">Prochain Effect Slot</p>
            <p className="mt-1 font-ik-title text-xl text-neutral-100">
              {pointsToNextSlot > 0 ? `+${pointsToNextSlot} pts` : "Débloqué"}
            </p>
            <div className="ik-bar mt-2">
              <div className="ik-bar__fill" style={{ width: `${nextSlotProgressPercent}%` }} />
            </div>
            <p className="mt-1 font-ik-body text-[0.6rem] text-neutral-500">
              {resonance.totalResonance} / {nextSlotThreshold}
            </p>
          </div>
          <SummaryStat label="Contributeurs" value={`${filledContributors}/9`} />
        </div>
      </GamePanel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.9fr)]">
        <div className="grid gap-3 lg:grid-cols-2">
          {EFFECT_SET_REGISTRY.map((definition) => (
            <FamilyBranch
              availableSlots={availableSlots}
              definition={definition}
              key={definition.id}
              onSlot={handleSlot}
              onUnslot={handleUnslot}
              reachedTier={slottedTierById.get(definition.id) ?? null}
              resonanceTotal={resonance.totalResonance}
            />
          ))}
        </div>

        <div className="space-y-4">
          <GamePanel className="p-4">
            <h3 className="font-ik-title text-lg text-neutral-100">Contributeurs</h3>
            <p className="mt-1 font-ik-body text-xs text-neutral-500">
              Anneaux ({ringCount}/5) et Artefact ({artifactId ? itemById.get(artifactId) ?? artifactId : "vide"}) exclus de
              la Résonance.
            </p>
            <ul className="mt-3 space-y-1.5">
              {resonance.slots.map((slot) => (
                <li className="rounded-md border border-white/10 bg-black/28 p-2.5" key={slot.slot}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-ik-menu text-[0.6rem] uppercase tracking-wide text-neutral-500">
                      {formatSlotLabel(slot.slot)}
                    </span>
                    <span className="shrink-0 font-ik-menu text-[0.6rem] text-neutral-300">
                      +{slot.value} Résonance
                    </span>
                  </div>
                  <p className="mt-1 truncate font-ik-body text-sm text-neutral-100">
                    {slot.itemId ? itemById.get(slot.itemId) ?? slot.itemId : "Vide"}
                  </p>
                  {slot.rarity ? (
                    <p className="font-ik-body text-[0.65rem] text-neutral-500">{formatRarityLabel(slot.rarity)}</p>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-white/10 pt-2 font-ik-menu text-[0.65rem] uppercase tracking-wide text-neutral-400">
              Total contributeurs : {resonance.totalResonance} Résonance
            </p>
          </GamePanel>

          <GamePanel className="p-4">
            <h3 className="font-ik-title text-lg text-neutral-100">Modificateurs actifs</h3>
            <div className="mt-3 flex flex-wrap gap-2 font-ik-body text-xs text-neutral-300">
              {nonZeroStats.length > 0 ? (
                nonZeroStats.map(([stat, value]) => (
                  <span className="rounded border border-white/10 bg-black/35 px-2 py-1" key={stat}>
                    {stat}: {formatEffectValue(value)}
                  </span>
                ))
              ) : (
                <span className="text-neutral-500">Aucun modificateur actif.</span>
              )}
            </div>
          </GamePanel>
        </div>
      </div>
    </section>
  );
}
