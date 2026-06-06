"use client";

import { useMemo } from "react";

import { GamePanel } from "@/components/ui/game-panel";
import { useGameStore } from "@/store/game-store";
import {
  calculateResonanceFromEquipment,
  getResonanceEligibleSlots,
  type ResonanceSlotBreakdown,
} from "@idleking/game-core";

function formatSlotLabel(slot: string): string {
  return slot.replaceAll("_", " ");
}

function ResonanceSlotCard({
  itemName,
  slot,
}: {
  itemName: string | null;
  slot: ResonanceSlotBreakdown;
}) {
  return (
    <div className="rounded-lg border border-amber-200/16 bg-black/32 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-ik-menu text-[0.66rem] uppercase tracking-[0.14em] text-amber-100">
          {formatSlotLabel(slot.slot)}
        </span>
        <span className="rounded border border-amber-200/16 bg-black/35 px-2 py-1 font-ik-menu text-xs text-amber-50">
          +{slot.value}
        </span>
      </div>
      <p className="mt-3 min-h-10 font-ik-title text-lg text-amber-50">{itemName ?? "Empty"}</p>
      <p className="font-ik-body text-xs text-muted-foreground">{slot.rarity ?? "No rarity"}</p>
    </div>
  );
}

export function ResonancePanel() {
  const state = useGameStore((store) => store.state);
  const resonance = useMemo(
    () => calculateResonanceFromEquipment({ equipped: state.equipment, items: state.inventory.items }),
    [state.equipment, state.inventory.items]
  );
  const itemById = useMemo(
    () => new Map(state.inventory.items.map((item) => [item.id, item.name] as const)),
    [state.inventory.items]
  );
  const eligibleSlots = useMemo(() => getResonanceEligibleSlots(), []);
  const ringCount = state.equipment.equipped.rings.filter((itemId) => itemId !== null).length;
  const artifactId = state.equipment.equipped.artifact ?? null;

  return (
    <section className="space-y-4">
      <GamePanel className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-200/80">Derived</p>
            <h2 className="font-ik-title text-3xl font-semibold text-amber-50">Resonance</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-amber-200/16 bg-black/32 px-4 py-3 text-right">
              <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">Total</p>
              <p className="font-ik-title text-2xl text-amber-50">{resonance.totalResonance}</p>
            </div>
            <div className="rounded-lg border border-amber-200/16 bg-black/32 px-4 py-3 text-right">
              <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                Effect Slots
              </p>
              <p className="font-ik-title text-2xl text-amber-50">{resonance.effectSlots}</p>
            </div>
          </div>
        </div>
        <p className="mt-4 font-ik-body text-sm text-muted-foreground">
          Eligible slots: {eligibleSlots.map(formatSlotLabel).join(", ")}.
        </p>
      </GamePanel>

      <div className="grid gap-3 md:grid-cols-3">
        {resonance.slots.map((slot) => (
          <ResonanceSlotCard itemName={slot.itemId ? itemById.get(slot.itemId) ?? slot.itemId : null} key={slot.slot} slot={slot} />
        ))}
      </div>

      <GamePanel className="p-4">
        <h3 className="font-ik-title text-xl text-amber-50">Excluded</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-amber-200/16 bg-black/32 p-3">
            <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">Rings</p>
            <p className="mt-2 font-ik-body text-sm text-amber-50">{ringCount}/5 equipped, excluded from Resonance.</p>
          </div>
          <div className="rounded-lg border border-amber-200/16 bg-black/32 p-3">
            <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">Artifact</p>
            <p className="mt-2 font-ik-body text-sm text-amber-50">
              {artifactId ? itemById.get(artifactId) ?? artifactId : "Empty"}, excluded from Resonance.
            </p>
          </div>
        </div>
      </GamePanel>
    </section>
  );
}
