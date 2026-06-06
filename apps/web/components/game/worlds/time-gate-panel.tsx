"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { GamePanel } from "@/components/ui/game-panel";
import { useGameStore } from "@/store/game-store";
import {
  ERA_REGISTRY,
  canUnlockEraAtTimeGate,
  isEraPlayable,
  isEraUnlocked,
  unlockEraAtTimeGate,
  type EraDefinition,
  type EraId,
} from "@idleking/game-core";

const UNLOCK_FAILURE_LABELS: Record<string, string> = {
  ERA_ALREADY_UNLOCKED: "Ère déjà débloquée.",
  ERA_NOT_FOUND: "Ère inconnue.",
  ERA_NOT_PLAYABLE: "Cette ère reste en teaser et n'est pas jouable dans le MVP.",
  FRAGMENT_DU_TEMPS_REQUIRED: "Fragment du Temps insuffisant.",
  KALEIDOSCOPE_REQUIRED: "Kaléidoscope requis.",
  STORY_FLAG_MISSING: "Progression Story requise.",
  TIME_GATE_LOCKED: "Time Gate verrouillée.",
  TIME_GATE_NOT_BUILT: "Time Gate non construite.",
  WORLD_LEVEL_TOO_LOW: "World Level insuffisant.",
};

function formatEraStatus(state: ReturnType<typeof useGameStore.getState>["state"], era: EraDefinition): string {
  if (isEraUnlocked(state, era.id)) return "Unlocked";
  if (era.teaser || !isEraPlayable(era.id)) return "Teaser locked";
  if (canUnlockEraAtTimeGate(state, era.id)) return "Ready to unlock";
  return "Locked";
}

function getEraTitle(era: EraDefinition): string {
  if (era.id === "era_funebre") return "Era Funèbre";
  if (era.id === "era_glaciaire") return "Era Glaciaire";
  return era.title;
}

function getEraTitleById(eraId: EraId): string {
  const era = ERA_REGISTRY.find((candidate) => candidate.id === eraId);
  return era ? getEraTitle(era) : eraId;
}

function RequirementLine({
  met,
  text,
}: {
  met: boolean;
  text: string;
}) {
  return (
    <span className={met ? "text-emerald-100/90" : "text-amber-100/85"}>
      {met ? "OK" : "Missing"} - {text}
    </span>
  );
}

function RequirementList({
  era,
  state,
}: {
  era: EraDefinition;
  state: ReturnType<typeof useGameStore.getState>["state"];
}) {
  const storyFlagsMet = era.unlockConditions.storyFlags.every((flag) => state.story.completedEvents.has(flag));
  const playable = isEraPlayable(era.id);

  return (
    <div className="mt-3 grid gap-1.5 font-ik-body text-xs text-muted-foreground">
      <RequirementLine met={state.buildings.timeGate.unlocked} text="Time Gate unlocked" />
      <RequirementLine met={state.buildings.timeGate.built} text="Time Gate built" />
      <RequirementLine met={state.specialItems.kaleidoscopeOwned} text="Kaléidoscope owned" />
      <RequirementLine
        met={state.progression.worldLevel >= era.unlockConditions.minWorldLevel}
        text={`World Level ${era.unlockConditions.minWorldLevel}`}
      />
      <RequirementLine
        met={state.specialItems.fragmentDuTemps >= era.unlockConditions.fragmentDuTempsCost}
        text={`Fragment du Temps x${era.unlockConditions.fragmentDuTempsCost}`}
      />
      {era.unlockConditions.storyFlags.length > 0 ? (
        <RequirementLine met={storyFlagsMet} text={`Story: ${era.unlockConditions.storyFlags.join(", ")}`} />
      ) : (
        <RequirementLine met={true} text="Story: none" />
      )}
      <RequirementLine met={playable} text={playable ? "Playable MVP era" : "Teaser only, not playable"} />
    </div>
  );
}

export function TimeGatePanel() {
  const state = useGameStore((store) => store.state);
  const dispatch = useGameStore((store) => store.dispatch);
  const timeGate = state.buildings.timeGate;
  const eraCards = useMemo(
    () =>
      ERA_REGISTRY.map((era) => ({
        canUnlock: canUnlockEraAtTimeGate(state, era.id),
        era,
        status: formatEraStatus(state, era),
        unlocked: isEraUnlocked(state, era.id),
      })),
    [state]
  );

  function handleUnlockEra(eraId: EraId) {
    const result = unlockEraAtTimeGate(useGameStore.getState().state, eraId);
    if (!result.ok) {
      toast.error(UNLOCK_FAILURE_LABELS[result.reason] ?? "Unlock impossible.", { id: `time-gate-${eraId}` });
      return;
    }

    dispatch(() => result.next);
    toast.success(`${getEraTitleById(result.eraId)} unlocked`, {
      id: `time-gate-${eraId}`,
    });
  }

  return (
    <section aria-labelledby="time-gate-title" className="space-y-4">
      <GamePanel className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-200/80">Building</p>
            <h2 id="time-gate-title" className="font-ik-title text-3xl font-semibold text-amber-50">Time Gate</h2>
          </div>
          <div className="grid gap-1.5 text-right font-ik-body text-sm text-amber-50">
            <span>Status: {timeGate.status}</span>
            <span>
              Level {timeGate.level}/{timeGate.maxLevel}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-amber-200/16 bg-black/32 p-3">
            <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
              Kaléidoscope
            </p>
            <p className="mt-2 font-ik-title text-xl text-amber-50">
              {state.specialItems.kaleidoscopeOwned ? "Owned" : "Missing"}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200/16 bg-black/32 p-3">
            <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
              Fragment du Temps
            </p>
            <p className="mt-2 font-ik-title text-xl text-amber-50">{state.specialItems.fragmentDuTemps}</p>
          </div>
          <div className="rounded-lg border border-amber-200/16 bg-black/32 p-3">
            <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
              Canonical building
            </p>
            <p className="mt-2 font-ik-title text-xl text-amber-50">time_gate</p>
          </div>
        </div>
      </GamePanel>

      <div className="grid gap-3 xl:grid-cols-3">
        {eraCards.map(({ canUnlock, era, status, unlocked }) => (
          <GamePanel className="p-4" key={era.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.16em] text-cyan-100/75">{era.id}</p>
                <h3 className="mt-1 font-ik-title text-2xl text-amber-50">{getEraTitle(era)}</h3>
              </div>
              <span className="rounded border border-amber-200/18 bg-black/35 px-2 py-1 font-ik-menu text-[0.65rem] text-amber-50">
                {status}
              </span>
            </div>
            <RequirementList era={era} state={state} />
            {era.id === "era_glaciaire" && !unlocked ? (
              <button
                aria-label="Unlock Era Glaciaire at the Time Gate"
                className="mt-4 w-full rounded-md border border-cyan-200/32 bg-cyan-500/12 px-3 py-2 font-ik-menu text-xs uppercase text-cyan-50 transition hover:border-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!canUnlock}
                onClick={() => handleUnlockEra(era.id)}
                type="button"
              >
                Unlock Era Glaciaire
              </button>
            ) : null}
            {era.teaser ? (
              <p className="mt-4 rounded-md border border-amber-200/14 bg-black/30 px-3 py-2 font-ik-body text-xs text-muted-foreground">
                Teaser locked. Not playable in MVP.
              </p>
            ) : null}
          </GamePanel>
        ))}
      </div>
    </section>
  );
}
