"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { Check, Droplets, Flame, Lock, Moon, Mountain, Snowflake } from "lucide-react";

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
import { calculateResonanceFromEquipment, getResonanceEligibleSlots } from "@idleking/game-core/resonance";

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

const THEME_ACCENT: Record<EffectSetTheme, { border: string; glow: string; text: string }> = {
  dark: { border: "border-purple-300/70", glow: "shadow-[0_0_18px_rgba(192,132,252,0.22)]", text: "text-purple-200" },
  earth: { border: "border-emerald-300/70", glow: "shadow-[0_0_18px_rgba(110,231,183,0.2)]", text: "text-emerald-200" },
  fire: { border: "border-orange-300/70", glow: "shadow-[0_0_18px_rgba(253,186,116,0.22)]", text: "text-orange-200" },
  ice: { border: "border-sky-300/70", glow: "shadow-[0_0_18px_rgba(125,211,252,0.22)]", text: "text-sky-200" },
  water: { border: "border-blue-300/70", glow: "shadow-[0_0_18px_rgba(147,197,253,0.22)]", text: "text-blue-200" },
};

function formatSlotLabel(slot: string): string {
  return slot.replaceAll("_", " ");
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

function SummaryStat({ label, sub, value }: { label: string; sub?: string; value: string }) {
  return (
    <div className="rounded-lg border border-amber-200/16 bg-black/32 px-4 py-3 text-right">
      <p className="font-ik-menu text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="font-ik-title text-2xl text-amber-50">{value}</p>
      {sub ? <p className="font-ik-body text-[0.65rem] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function FamilyBranch({
  definition,
  onSlot,
  onUnslot,
  reachedTier,
  resonanceTotal,
}: {
  definition: EffectSetDefinition;
  onSlot: (effectSetId: EffectSetId, tier: number) => void;
  onUnslot: (effectSetId: EffectSetId) => void;
  reachedTier: number | null;
  resonanceTotal: number;
}) {
  const state = useGameStore.getState().state;
  const isUnlocked = hasUnlockedEffectSet(state, definition.id);
  const Icon = THEME_ICON[definition.theme];
  const accent = THEME_ACCENT[definition.theme];

  return (
    <GamePanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 bg-black/40",
              isUnlocked ? accent.border : "border-zinc-600/50"
            )}
          >
            <Icon aria-hidden="true" className={cn("h-4.5 w-4.5", isUnlocked ? accent.text : "text-zinc-500")} />
          </span>
          <div>
            <p
              className={cn(
                "font-ik-menu text-[0.62rem] uppercase tracking-[0.16em]",
                isUnlocked ? accent.text : "text-zinc-500"
              )}
            >
              {THEME_LABEL[definition.theme]}
            </p>
            <h3 className="font-ik-title text-xl text-amber-50">{definition.name}</h3>
          </div>
        </div>
        {reachedTier !== null ? (
          <button
            aria-label={`Retirer ${definition.name}`}
            className="shrink-0 rounded-md border border-red-200/30 bg-red-500/10 px-2.5 py-1 font-ik-menu text-[0.62rem] uppercase text-red-100 transition hover:border-red-100"
            onClick={() => onUnslot(definition.id)}
            type="button"
          >
            Retirer
          </button>
        ) : null}
      </div>

      <p className="mt-2 font-ik-body text-xs text-muted-foreground">
        {isUnlocked ? `Source : ${definition.source.label}` : `Verrouillé — ${definition.source.label}`}
      </p>

      <div className="relative mt-4 pl-1">
        <div aria-hidden="true" className="absolute left-[15px] top-3 bottom-3 w-px bg-amber-200/16" />
        <ol className="space-y-2.5">
          {definition.tiers.map((tierDef) => {
            const nodeState = getNodeState({ isUnlocked, reachedTier, tier: tierDef.tier });
            const canInteract = canSlotEffectSet(state, definition.id, tierDef.tier, { totalResonance: resonanceTotal });
            const disabled = !canInteract;
            const roman = TIER_ROMAN[tierDef.tier] ?? `${tierDef.tier}`;

            return (
              <li className="relative pl-9" key={tierDef.tier}>
                <span
                  className={cn(
                    "absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border-2 bg-black/60 font-ik-menu text-xs",
                    nodeState === "locked" && "border-zinc-700 text-zinc-600",
                    nodeState === "available" && "border-amber-200/30 text-amber-100/70",
                    (nodeState === "reached" || nodeState === "active") && cn(accent.border, accent.text, accent.glow)
                  )}
                >
                  {nodeState === "locked" ? (
                    <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                  ) : nodeState === "reached" || nodeState === "active" ? (
                    <Check aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    roman
                  )}
                </span>
                <button
                  aria-label={`${definition.name} palier ${roman}`}
                  className={cn(
                    "ik-card-hover w-full rounded-md border bg-black/28 p-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45",
                    nodeState === "active" ? cn(accent.border, "bg-black/45") : "border-amber-200/14"
                  )}
                  data-ik-tip={getNodeTooltip({ definition, disabled, isUnlocked, nodeState })}
                  disabled={disabled}
                  onClick={() => onSlot(definition.id, tierDef.tier)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-ik-menu text-[0.65rem] uppercase text-amber-100">Palier {roman}</span>
                    <span className="font-ik-menu text-[0.6rem] uppercase text-muted-foreground">
                      {nodeState === "active"
                        ? "Actif"
                        : nodeState === "reached"
                          ? "Atteint"
                          : nodeState === "locked"
                            ? "Verrouillé"
                            : "Disponible"}
                    </span>
                  </div>
                  <p className="mt-1.5 font-ik-body text-xs text-muted-foreground">
                    {tierDef.effects.map(formatEffect).join(", ")}
                  </p>
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
  useMemo(() => getResonanceEligibleSlots(), []);
  const ringCount = state.equipment.equipped.rings.filter((itemId) => itemId !== null).length;
  const artifactId = state.equipment.equipped.artifact ?? null;
  const usedSlots = effectSets.slottedEffects.length;
  const availableSlots = Math.max(0, resonance.effectSlots - usedSlots);
  const slottedTierById = new Map(effectSets.slottedEffects.map((slot) => [slot.effectSetId, slot.tier] as const));
  const nonZeroStats = Object.entries(modifiers.statModifiers).filter(([, value]) => value !== 0);

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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-200/80">Build passif</p>
            <h2 className="font-ik-title text-3xl font-semibold text-amber-50" id="resonance-title">
              Résonance
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <SummaryStat label="Résonance totale" value={`${resonance.totalResonance}`} />
            <SummaryStat label="Effect Slots" sub={`${availableSlots} dispo`} value={`${usedSlots}/${resonance.effectSlots}`} />
            <SummaryStat
              label="Contributeurs"
              value={`${resonance.slots.filter((slot) => slot.itemId !== null).length}/9`}
            />
          </div>
        </div>
      </GamePanel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.9fr)]">
        <div className="grid gap-3 lg:grid-cols-2">
          {EFFECT_SET_REGISTRY.map((definition) => (
            <FamilyBranch
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
            <h3 className="font-ik-title text-lg text-amber-50">Contributeurs</h3>
            <p className="mt-1 font-ik-body text-xs text-muted-foreground">
              Anneaux ({ringCount}/5) et Artefact ({artifactId ? itemById.get(artifactId) ?? artifactId : "vide"}) exclus de
              la Résonance.
            </p>
            <ul className="mt-3 space-y-1.5">
              {resonance.slots.map((slot) => (
                <li
                  className="flex items-center justify-between gap-2 rounded-md border border-amber-200/14 bg-black/28 px-2.5 py-1.5 font-ik-body text-xs"
                  key={slot.slot}
                >
                  <span className="uppercase tracking-wide text-amber-100/80">{formatSlotLabel(slot.slot)}</span>
                  <span className="truncate text-amber-50/90">
                    {slot.itemId ? itemById.get(slot.itemId) ?? slot.itemId : "Vide"}
                  </span>
                  <span className="shrink-0 rounded border border-amber-200/14 px-1.5 py-0.5 text-[0.6rem] text-amber-50">
                    +{slot.value}
                  </span>
                </li>
              ))}
            </ul>
          </GamePanel>

          <GamePanel className="p-4">
            <h3 className="font-ik-title text-lg text-amber-50">Modificateurs actifs</h3>
            <div className="mt-3 flex flex-wrap gap-2 font-ik-body text-xs text-amber-50/85">
              {nonZeroStats.length > 0 ? (
                nonZeroStats.map(([stat, value]) => (
                  <span className="rounded border border-amber-200/14 bg-black/35 px-2 py-1" key={stat}>
                    {stat}: {formatEffectValue(value)}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">Aucun modificateur actif.</span>
              )}
            </div>
          </GamePanel>
        </div>
      </div>
    </section>
  );
}
