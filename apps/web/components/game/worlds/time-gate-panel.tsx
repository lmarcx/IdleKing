"use client";

import { useMemo, useState } from "react";
import { DoorOpen, FlaskConical, LockKeyhole, Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { GamePanel } from "@/components/ui/game-panel";
import { cn } from "@/lib/utils";
import { DUEL_OPPONENTS, type DuelOpponent } from "@/lib/duel-data";
import { useGameStore } from "@/store/game-store";
import {
  ERA_REGISTRY,
  STORY_DUNGEON_REGISTRY,
  canEnterDungeon,
  canUnlockEraAtTimeGate,
  getStoryBossDefinition,
  getStoryDungeonLockReasons,
  isEraPlayable,
  isEraUnlocked,
  unlockEraAtTimeGate,
  type EraDefinition,
  type EraId,
  type StoryDungeonDefinition,
  type StoryUnlockRequirementStatus,
} from "@idleking/game-core";

const UNLOCK_FAILURE_LABELS: Record<string, string> = {
  ERA_ALREADY_UNLOCKED: "Ere deja debloquee.",
  ERA_NOT_FOUND: "Ere inconnue.",
  ERA_NOT_PLAYABLE: "Cette ere reste en teaser et n'est pas jouable dans le MVP.",
  FRAGMENT_DU_TEMPS_REQUIRED: "Fragment du Temps insuffisant.",
  KALEIDOSCOPE_REQUIRED: "Kaleidoscope requis.",
  STORY_FLAG_MISSING: "Progression Story requise.",
  TIME_GATE_LOCKED: "Time Gate verrouillee.",
  TIME_GATE_NOT_BUILT: "Time Gate non construite.",
  WORLD_LEVEL_TOO_LOW: "World Level insuffisant.",
};

const STORY_FLAG_LABELS: Record<string, string> = {
  arathas_academy_cleared: "Academie d'Arathas terminee",
  chapter_i_complete: "Chapitre I termine",
  frozen_river_cleared: "Rive Figee terminee",
  funeral_mausoleum_cleared: "Mausolee Funebre termine",
  prologue_complete: "Prologue termine",
  reflection_cavern_cleared: "Caverne aux Reflets terminee",
  royal_abyss_cleared: "Gouffre Royal termine",
};

type StoryEraGroup = Readonly<{
  id: EraId;
  title: string;
  subtitle: string;
  dungeonIds: readonly string[];
  teaser?: true;
}>;

type TimeGateSection = "story" | "duel";

type DuelTestEntry = Readonly<{
  id: string;
  title: string;
  detail: string;
}>;

const STORY_ERA_GROUPS: readonly StoryEraGroup[] = [
  {
    id: "era_funebre",
    title: "Ere Funebre",
    subtitle: "Prologue et ruines cendreuses",
    dungeonIds: ["prologue_wastelands", "funeral_mausoleum", "ashen_peak", "royal_abyss"],
  },
  {
    id: "era_glaciaire",
    title: "Ere Glaciaire",
    subtitle: "Rive, reflets et source du givre",
    dungeonIds: ["frozen_river", "reflection_cavern", "arathas_academy", "frost_source"],
  },
  {
    id: "era_deluge",
    title: "Deluge",
    subtitle: "Teaser verrouille",
    dungeonIds: [],
    teaser: true,
  },
];

const DUEL_TEST_ENTRIES: readonly DuelTestEntry[] = [
  {
    id: "enemy-test",
    title: "Enemy Test",
    detail: "Movement, contact damage, player survival loop.",
  },
  {
    id: "boss-test",
    title: "Boss Test",
    detail: "Boss HP, specials, telegraphs, defeat conditions.",
  },
  {
    id: "skill-pattern-test",
    title: "Skill Pattern Test",
    detail: "Skill casts, cooldowns, mana, hit patterns.",
  },
];

function getEraDefinitionById(eraId: EraId): EraDefinition {
  const era = ERA_REGISTRY.find((candidate) => candidate.id === eraId);
  if (!era) throw new Error(`Missing era definition: ${eraId}`);
  return era;
}

function getEraStatus(state: ReturnType<typeof useGameStore.getState>["state"], group: StoryEraGroup): string {
  if (group.teaser || !isEraPlayable(group.id)) return "Teaser locked";
  if (isEraUnlocked(state, group.id)) return "Disponible";
  if (canUnlockEraAtTimeGate(state, group.id)) return "Pret";
  return "Locked";
}

function getDungeonTitle(dungeon: StoryDungeonDefinition): string {
  if (dungeon.id === "prologue_wastelands") return "Prologue / Terres Desolees";
  return dungeon.title;
}

function getChapterLabel(chapterId: StoryDungeonDefinition["chapterId"]): string {
  if (chapterId === "prologue") return "Prologue";
  if (chapterId === "chapter_i_funebre") return "Chapitre I";
  return "Chapitre II";
}

function formatRequirement(requirement: StoryUnlockRequirementStatus): string {
  if (requirement.kind === "worldLevel") {
    return `World Level ${requirement.current}/${requirement.required}`;
  }

  return STORY_FLAG_LABELS[requirement.flag] ?? `Story flag: ${requirement.flag}`;
}

function RequirementLine({ met, text }: { met: boolean; text: string }) {
  return (
    <span className={met ? "text-emerald-100/90" : "text-amber-100/85"}>
      {met ? "OK" : "Missing"} - {text}
    </span>
  );
}

function TimeGateRequirementList({
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
      <RequirementLine met={state.specialItems.kaleidoscopeOwned} text="Kaleidoscope owned" />
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
      <RequirementLine met={playable} text={playable ? "Playable MVP era" : "Teaser only"} />
    </div>
  );
}

type DungeonRowProps = {
  dungeon: StoryDungeonDefinition;
  eraUnlocked: boolean;
  onEnter: (dungeonId: string) => void;
  state: ReturnType<typeof useGameStore.getState>["state"];
};

function DungeonRow({ dungeon, eraUnlocked, onEnter, state }: DungeonRowProps) {
  const storyUnlocked = canEnterDungeon(state, dungeon.id);
  const completed = state.story.completedDungeonIds.has(dungeon.id);
  const lockReasons = getStoryDungeonLockReasons(state, dungeon.id);
  const boss = dungeon.bossId ? getStoryBossDefinition(dungeon.bossId) : undefined;
  const canEnter = eraUnlocked && storyUnlocked;

  return (
    <article className="rounded-lg border border-amber-200/16 bg-black/28 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-ik-title text-xl text-amber-50">{getDungeonTitle(dungeon)}</h4>
            <span className="rounded border border-amber-200/18 bg-black/35 px-2 py-0.5 font-ik-menu text-[0.65rem] text-amber-50">
              {getChapterLabel(dungeon.chapterId)}
            </span>
            {completed ? (
              <span className="rounded border border-emerald-200/24 bg-emerald-500/10 px-2 py-0.5 font-ik-menu text-[0.65rem] text-emerald-100">
                Cleared
              </span>
            ) : null}
          </div>
          <p className="mt-2 font-ik-body text-xs text-muted-foreground">
            {boss ? `Boss: ${boss.name}` : "Donjon narratif"}
          </p>
        </div>

        <button
          aria-label={`Entrer dans le donjon ${dungeon.title}`}
          className={cn(
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 font-ik-menu text-xs uppercase transition",
            canEnter && "border-amber-200/55 bg-amber-500/18 text-amber-50 hover:border-amber-100 hover:bg-amber-500/24",
            !canEnter && "cursor-not-allowed border-zinc-500/30 bg-zinc-900/55 text-zinc-500"
          )}
          disabled={!canEnter}
          onClick={() => onEnter(dungeon.id)}
          type="button"
        >
          {canEnter ? <DoorOpen className="h-4 w-4" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}
          Entrer dans le donjon
        </button>
      </div>

      {!canEnter ? (
        <div className="mt-3 grid gap-1 font-ik-body text-xs text-amber-100/85">
          {!eraUnlocked ? <span>Missing - Ere non debloquee au Time Gate</span> : null}
          {lockReasons.map((reason) => (
            <span key={`${reason.kind}-${formatRequirement(reason)}`}>Missing - {formatRequirement(reason)}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

type DuelTestArenaPanelProps = {
  onOpenArena: (href: string) => void;
};

function DuelTestArenaPanel({ onOpenArena }: DuelTestArenaPanelProps) {
  const opponent = DUEL_OPPONENTS.find((candidate) => candidate.available) ?? null;

  return (
    <div className="grid gap-4">
      <GamePanel className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.16em] text-cyan-100/75">DEV TEST</p>
            <h3 className="mt-1 font-ik-title text-2xl text-amber-50">Duel / Test Arena</h3>
          </div>
          <span className="rounded border border-cyan-200/24 bg-cyan-500/10 px-2 py-1 font-ik-menu text-[0.65rem] text-cyan-50">
            Gameplay sandbox
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 font-ik-menu text-[0.65rem] uppercase tracking-[0.14em]">
          <span className="rounded border border-amber-200/18 bg-black/35 px-2 py-1 text-amber-100">Hors progression MVP</span>
          <span className="rounded border border-amber-200/18 bg-black/35 px-2 py-1 text-amber-100">No progression rewards</span>
          <span className="rounded border border-amber-200/18 bg-black/35 px-2 py-1 text-amber-100">No Duel currency</span>
        </div>
      </GamePanel>

      <div className="grid gap-3">
        {DUEL_TEST_ENTRIES.map((entry) => (
          <DuelTestEntryRow entry={entry} key={entry.id} onOpenArena={onOpenArena} opponent={opponent} />
        ))}
      </div>
    </div>
  );
}

function DuelTestEntryRow({
  entry,
  onOpenArena,
  opponent,
}: {
  entry: DuelTestEntry;
  onOpenArena: (href: string) => void;
  opponent: DuelOpponent | null;
}) {
  const canOpen = Boolean(opponent);

  return (
    <article className="rounded-lg border border-cyan-200/16 bg-black/28 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-ik-title text-xl text-amber-50">{entry.title}</h4>
            <span className="rounded border border-cyan-200/24 bg-cyan-500/10 px-2 py-0.5 font-ik-menu text-[0.65rem] text-cyan-50">
              DEV TEST
            </span>
          </div>
          <p className="mt-2 font-ik-body text-xs text-muted-foreground">{entry.detail}</p>
          {opponent ? (
            <p className="mt-2 font-ik-menu text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Route: {opponent.fightHref}
            </p>
          ) : null}
        </div>

        <button
          aria-label={`Entrer dans l'arene de test ${entry.title}`}
          className={cn(
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 font-ik-menu text-xs uppercase transition",
            canOpen && "border-cyan-200/45 bg-cyan-500/12 text-cyan-50 hover:border-cyan-100 hover:bg-cyan-500/18",
            !canOpen && "cursor-not-allowed border-zinc-500/30 bg-zinc-900/55 text-zinc-500"
          )}
          disabled={!canOpen}
          onClick={() => {
            if (!opponent) return;
            onOpenArena(opponent.fightHref);
          }}
          type="button"
        >
          <DoorOpen className="h-4 w-4" aria-hidden="true" />
          Entrer dans l'arene de test
        </button>
      </div>
    </article>
  );
}

export function TimeGatePanel() {
  const router = useRouter();
  const state = useGameStore((store) => store.state);
  const dispatch = useGameStore((store) => store.dispatch);
  const [activeSection, setActiveSection] = useState<TimeGateSection>("story");
  const [selectedEraId, setSelectedEraId] = useState<EraId>("era_funebre");
  const timeGate = state.buildings.timeGate;
  const selectedGroup = STORY_ERA_GROUPS.find((group) => group.id === selectedEraId) ?? STORY_ERA_GROUPS[0];
  const selectedEra = getEraDefinitionById(selectedGroup.id);
  const selectedDungeons = useMemo(
    () =>
      selectedGroup.dungeonIds
        .map((dungeonId) => STORY_DUNGEON_REGISTRY.find((dungeon) => dungeon.id === dungeonId))
        .filter((dungeon): dungeon is StoryDungeonDefinition => Boolean(dungeon)),
    [selectedGroup]
  );
  const selectedEraUnlocked = !selectedGroup.teaser && isEraPlayable(selectedGroup.id) && isEraUnlocked(state, selectedGroup.id);
  const canUnlockSelectedEra = canUnlockEraAtTimeGate(state, selectedGroup.id);

  function handleUnlockEra(eraId: EraId) {
    const result = unlockEraAtTimeGate(useGameStore.getState().state, eraId);
    if (!result.ok) {
      toast.error(UNLOCK_FAILURE_LABELS[result.reason] ?? "Unlock impossible.", { id: `time-gate-${eraId}` });
      return;
    }

    dispatch(() => result.next);
    toast.success(`${selectedGroup.title} unlocked`, {
      id: `time-gate-${eraId}`,
    });
  }

  function handleEnterDungeon(dungeonId: string) {
    router.push(`/game/story/levels/${dungeonId}`);
  }

  function handleOpenTestArena(href: string) {
    router.push(href);
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
              Kaleidoscope
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
              World Level
            </p>
            <p className="mt-2 font-ik-title text-xl text-amber-50">{state.progression.worldLevel}</p>
          </div>
        </div>
      </GamePanel>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(220px,0.45fr)_minmax(0,1fr)]">
        <GamePanel className="p-4">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-amber-100" aria-hidden="true" />
            <h3 className="font-ik-title text-xl text-amber-50">Story / Eres</h3>
          </div>
          <div className="mt-4 grid gap-2">
            {STORY_ERA_GROUPS.map((group) => {
              const selected = activeSection === "story" && group.id === selectedGroup.id;
              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "rounded-lg border p-3 text-left transition",
                    selected && "border-amber-200/65 bg-amber-500/[0.08]",
                    !selected && "border-amber-200/16 bg-black/25 hover:border-amber-200/42"
                  )}
                  key={group.id}
                  onClick={() => {
                    setActiveSection("story");
                    setSelectedEraId(group.id);
                  }}
                  type="button"
                >
                  <span className="block font-ik-title text-lg text-amber-50">{group.title}</span>
                  <span className="mt-1 block font-ik-body text-xs text-muted-foreground">{group.subtitle}</span>
                  <span className="mt-2 inline-flex rounded border border-amber-200/18 bg-black/35 px-2 py-0.5 font-ik-menu text-[0.65rem] text-amber-50">
                    {getEraStatus(state, group)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 border-t border-amber-200/14 pt-4">
            <button
              aria-pressed={activeSection === "duel"}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition",
                activeSection === "duel" && "border-cyan-200/65 bg-cyan-500/[0.08]",
                activeSection !== "duel" && "border-cyan-200/16 bg-black/25 hover:border-cyan-200/42"
              )}
              onClick={() => setActiveSection("duel")}
              type="button"
            >
              <span className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-cyan-100" aria-hidden="true" />
                <span className="font-ik-title text-lg text-amber-50">Duel / Test Arena</span>
              </span>
              <span className="mt-1 block font-ik-body text-xs text-muted-foreground">Gameplay sandbox, no rewards</span>
              <span className="mt-2 inline-flex rounded border border-cyan-200/24 bg-cyan-500/10 px-2 py-0.5 font-ik-menu text-[0.65rem] text-cyan-50">
                DEV TEST
              </span>
            </button>
          </div>
        </GamePanel>

        {activeSection === "duel" ? (
          <DuelTestArenaPanel onOpenArena={handleOpenTestArena} />
        ) : (
          <div className="grid gap-4">
            <GamePanel className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.16em] text-cyan-100/75">
                    {selectedGroup.id}
                  </p>
                  <h3 className="mt-1 font-ik-title text-2xl text-amber-50">{selectedGroup.title}</h3>
                </div>
                <span className="rounded border border-amber-200/18 bg-black/35 px-2 py-1 font-ik-menu text-[0.65rem] text-amber-50">
                  {getEraStatus(state, selectedGroup)}
                </span>
              </div>

              <TimeGateRequirementList era={selectedEra} state={state} />

              {!selectedEraUnlocked && !selectedGroup.teaser && selectedGroup.id === "era_glaciaire" ? (
                <button
                  aria-label="Unlock Ere Glaciaire at the Time Gate"
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-cyan-200/32 bg-cyan-500/12 px-3 py-2 font-ik-menu text-xs uppercase text-cyan-50 transition hover:border-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!canUnlockSelectedEra}
                  onClick={() => handleUnlockEra(selectedGroup.id)}
                  type="button"
                >
                  <DoorOpen className="h-4 w-4" aria-hidden="true" />
                  Unlock Ere Glaciaire
                </button>
              ) : null}
            </GamePanel>

            {selectedGroup.teaser ? (
              <GamePanel className="p-4">
                <div className="rounded-lg border border-amber-200/16 bg-black/28 p-4">
                  <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-100">Teaser locked</p>
                  <h4 className="mt-2 font-ik-title text-xl text-amber-50">Aucun donjon jouable MVP</h4>
                </div>
              </GamePanel>
            ) : (
              <div className="grid gap-3">
                {selectedDungeons.map((dungeon) => (
                  <DungeonRow
                    dungeon={dungeon}
                    eraUnlocked={selectedEraUnlocked}
                    key={dungeon.id}
                    onEnter={handleEnterDungeon}
                    state={state}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
