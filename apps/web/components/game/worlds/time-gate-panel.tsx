"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  Aperture,
  Bot,
  Check,
  ChevronRight,
  Crosshair,
  FlaskConical,
  Globe2,
  Hourglass,
  Lock,
  Skull,
  Snowflake,
  Sparkles,
  Swords,
  Unlock,
  Waves,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

type GameState = ReturnType<typeof useGameStore.getState>["state"];

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

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

const STORY_FLAG_LABELS: Record<string, string> = {
  arathas_academy_cleared: "Académie d'Arathas terminée",
  chapter_i_complete: "Chapitre I terminé",
  frozen_river_cleared: "Rive Figée terminée",
  funeral_mausoleum_cleared: "Mausolée Funèbre terminé",
  prologue_complete: "Prologue terminé",
  reflection_cavern_cleared: "Caverne aux Reflets terminée",
  royal_abyss_cleared: "Gouffre Royal terminé",
};

type StoryEraGroup = Readonly<{
  icon: IconType;
  id: EraId;
  title: string;
  subtitle: string;
  dungeonIds: readonly string[];
  teaser?: true;
}>;

type TimeGateSection = "story" | "duel";

type EraStatus = "unlocked" | "ready" | "locked" | "teaser";

type DuelTestEntry = Readonly<{
  icon: IconType;
  id: string;
  title: string;
  detail: string;
}>;

const STORY_ERA_GROUPS: readonly StoryEraGroup[] = [
  {
    icon: Skull,
    id: "era_funebre",
    title: "Ère Funèbre",
    subtitle: "Prologue et ruines cendreuses",
    dungeonIds: ["prologue_wastelands", "funeral_mausoleum", "ashen_peak", "royal_abyss"],
  },
  {
    icon: Snowflake,
    id: "era_glaciaire",
    title: "Ère Glaciaire",
    subtitle: "Rive, reflets et source du givre",
    dungeonIds: ["frozen_river", "reflection_cavern", "arathas_academy", "frost_source"],
  },
  {
    icon: Waves,
    id: "era_deluge",
    title: "Déluge",
    subtitle: "Teaser verrouillé",
    dungeonIds: [],
    teaser: true,
  },
];

const DUEL_TEST_ENTRIES: readonly DuelTestEntry[] = [
  {
    icon: Bot,
    id: "enemy-test",
    title: "Enemy Test",
    detail: "Déplacement, dégâts de contact, survie.",
  },
  {
    icon: Skull,
    id: "boss-test",
    title: "Boss Test",
    detail: "HP de boss, spéciaux, telegraphs.",
  },
  {
    icon: Crosshair,
    id: "skill-pattern-test",
    title: "Skill Pattern Test",
    detail: "Casts, cooldowns, mana, patterns.",
  },
];

const ERA_STATUS_META: Record<EraStatus, { icon: IconType; label: string }> = {
  locked: { icon: Lock, label: "Verrouillée" },
  ready: { icon: Unlock, label: "Prête à débloquer" },
  teaser: { icon: Lock, label: "Teaser" },
  unlocked: { icon: Check, label: "Disponible" },
};

function getEraDefinitionById(eraId: EraId): EraDefinition {
  const era = ERA_REGISTRY.find((candidate) => candidate.id === eraId);
  if (!era) throw new Error(`Missing era definition: ${eraId}`);
  return era;
}

function getEraStatus(state: GameState, group: StoryEraGroup): EraStatus {
  if (group.teaser || !isEraPlayable(group.id)) return "teaser";
  if (isEraUnlocked(state, group.id)) return "unlocked";
  if (canUnlockEraAtTimeGate(state, group.id)) return "ready";
  return "locked";
}

function getDungeonTitle(dungeon: StoryDungeonDefinition): string {
  if (dungeon.id === "prologue_wastelands") return "Prologue / Terres Désolées";
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

  return STORY_FLAG_LABELS[requirement.flag] ?? `Story: ${requirement.flag}`;
}

/* ---------- Portal glyph (animated) ---------- */

function PortalGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <circle
        className="ik-portal-ring-outer"
        cx="48"
        cy="48"
        r="42"
        stroke="var(--ik-gray-2)"
        strokeDasharray="10 7"
        strokeWidth="2"
      />
      <circle
        className="ik-portal-ring-inner"
        cx="48"
        cy="48"
        r="31"
        stroke="var(--ik-gray-3)"
        strokeDasharray="4 6"
        strokeWidth="2"
      />
      <g className="ik-portal-core" stroke="var(--ik-white)" strokeWidth="2.5">
        <path d="M36 30 H60 M36 66 H60" />
        <path d="M39 30 C39 44 57 52 57 66 M57 30 C57 44 39 52 39 66" />
      </g>
    </svg>
  );
}

/* ---------- Small building blocks ---------- */

function StatChip({
  icon: Icon,
  met,
  tip,
  value,
}: {
  icon: IconType;
  met?: boolean;
  tip: string;
  value: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 border px-2.5 py-1.5 font-ik-menu text-[0.68rem] tabular-nums",
        met === false ? "border-dashed border-neutral-700 text-neutral-500" : "border-neutral-600 text-neutral-100"
      )}
      data-ik-tip={tip}
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
      {value}
      <span className="sr-only">{tip}</span>
    </span>
  );
}

function RequirementChip({ met, text }: { met: boolean; text: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-1 font-ik-menu text-[0.62rem]",
        met ? "border-neutral-600 text-neutral-200" : "border-dashed border-neutral-700 text-neutral-500"
      )}
    >
      {met ? (
        <Check aria-hidden="true" className="h-3 w-3 text-neutral-100" strokeWidth={3} />
      ) : (
        <X aria-hidden="true" className="h-3 w-3" strokeWidth={3} />
      )}
      {text}
    </span>
  );
}

function TimeGateRequirements({ era, state }: { era: EraDefinition; state: GameState }) {
  const storyFlagsMet = era.unlockConditions.storyFlags.every((flag) => state.story.completedEvents.has(flag));

  return (
    <div className="flex flex-wrap gap-1.5">
      <RequirementChip met={state.buildings.timeGate.built} text="Time Gate" />
      <RequirementChip met={state.specialItems.kaleidoscopeOwned} text="Kaléidoscope" />
      <RequirementChip
        met={state.progression.worldLevel >= era.unlockConditions.minWorldLevel}
        text={`World Lv ${era.unlockConditions.minWorldLevel}`}
      />
      <RequirementChip
        met={state.specialItems.fragmentDuTemps >= era.unlockConditions.fragmentDuTempsCost}
        text={`Fragment ×${era.unlockConditions.fragmentDuTempsCost}`}
      />
      {era.unlockConditions.storyFlags.length > 0 ? (
        <span data-ik-tip={era.unlockConditions.storyFlags.map((flag) => STORY_FLAG_LABELS[flag] ?? flag).join("\n")}>
          <RequirementChip met={storyFlagsMet} text="Progression Story" />
        </span>
      ) : null}
    </div>
  );
}

/* ---------- Era timeline ---------- */

function EraTimeline({
  onSelect,
  selectedEraId,
  state,
}: {
  onSelect: (eraId: EraId) => void;
  selectedEraId: EraId;
  state: GameState;
}) {
  return (
    <div className="ik-stagger grid gap-2 sm:grid-cols-3">
      {STORY_ERA_GROUPS.map((group) => {
        const status = getEraStatus(state, group);
        const meta = ERA_STATUS_META[status];
        const StatusIcon = meta.icon;
        const EraIcon = group.icon;
        const selected = group.id === selectedEraId;

        return (
          <button
            aria-pressed={selected}
            className={cn(
              "ik-card-hover group relative border-2 bg-black/45 p-3.5 text-left",
              selected ? "border-neutral-100" : status === "teaser" ? "border-dashed border-neutral-800" : "border-neutral-700",
              status === "ready" && !selected && "ik-ready-pulse"
            )}
            data-ik-tip={meta.label}
            key={group.id}
            onClick={() => onSelect(group.id)}
            type="button"
          >
            <span className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "grid h-11 w-11 place-items-center border-2 bg-neutral-950 transition-colors",
                  selected ? "border-neutral-100" : "border-neutral-700 group-hover:border-neutral-400"
                )}
              >
                <EraIcon
                  aria-hidden="true"
                  className={cn("h-5 w-5", status === "teaser" ? "text-neutral-600" : "text-neutral-100")}
                  strokeWidth={2}
                />
              </span>
              <StatusIcon
                aria-hidden="true"
                className={cn("h-4 w-4", status === "unlocked" ? "text-neutral-100" : "text-neutral-500")}
                strokeWidth={2.6}
              />
            </span>
            <span
              className={cn(
                "mt-3 block font-ik-title text-base leading-tight",
                status === "teaser" ? "text-neutral-500" : "text-neutral-100"
              )}
            >
              {group.title}
            </span>
            <span className="mt-0.5 block truncate font-ik-body text-[0.7rem] text-neutral-500">{group.subtitle}</span>
            <span className="sr-only">{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Dungeon cards ---------- */

function DungeonCard({
  dungeon,
  eraUnlocked,
  index,
  onEnter,
  state,
}: {
  dungeon: StoryDungeonDefinition;
  eraUnlocked: boolean;
  index: number;
  onEnter: (dungeonId: string) => void;
  state: GameState;
}) {
  const storyUnlocked = canEnterDungeon(state, dungeon.id);
  const completed = state.story.completedDungeonIds.has(dungeon.id);
  const lockReasons = getStoryDungeonLockReasons(state, dungeon.id);
  const boss = dungeon.bossId ? getStoryBossDefinition(dungeon.bossId) : undefined;
  const canEnter = eraUnlocked && storyUnlocked;
  const lockTip = [
    ...(!eraUnlocked ? ["Ère non débloquée au Time Gate"] : []),
    ...lockReasons.map(formatRequirement),
  ].join("\n");

  return (
    <button
      aria-label={
        canEnter ? `Entrer dans ${getDungeonTitle(dungeon)}` : `${getDungeonTitle(dungeon)} — verrouillé`
      }
      className={cn(
        "ik-card-hover group relative overflow-hidden border-2 bg-black/45 p-4 text-left",
        canEnter ? "border-neutral-600" : "cursor-not-allowed border-dashed border-neutral-800",
        completed && "border-neutral-500"
      )}
      data-ik-tip={!canEnter && lockTip ? lockTip : undefined}
      disabled={!canEnter}
      onClick={() => onEnter(dungeon.id)}
      type="button"
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-1 -top-3 font-ik-title text-[3.4rem] leading-none",
          canEnter ? "text-neutral-800" : "text-neutral-900"
        )}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <span className="relative flex items-center gap-2">
        <span className="border border-neutral-700 bg-neutral-950 px-1.5 py-0.5 font-ik-menu text-[0.58rem] text-neutral-400">
          {getChapterLabel(dungeon.chapterId)}
        </span>
        {completed ? (
          <span className="flex items-center gap-1 border border-neutral-500 bg-neutral-100 px-1.5 py-0.5 font-ik-menu text-[0.58rem] text-neutral-950">
            <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3} />
            Terminé
          </span>
        ) : null}
      </span>

      <span
        className={cn(
          "relative mt-2.5 block font-ik-title text-lg leading-tight",
          canEnter ? "text-neutral-100" : "text-neutral-500"
        )}
      >
        {getDungeonTitle(dungeon)}
      </span>

      {boss ? (
        <span className="relative mt-1.5 flex items-center gap-1.5 font-ik-body text-xs text-neutral-500">
          <Skull aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.2} />
          {boss.name}
        </span>
      ) : null}

      <span className="relative mt-3 flex h-5 items-center font-ik-menu text-[0.62rem]">
        {canEnter ? (
          <span className="flex translate-x-0 items-center gap-1 text-neutral-400 transition-all duration-150 group-hover:translate-x-1 group-hover:text-neutral-100">
            Entrer
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.6} />
          </span>
        ) : (
          <span className="flex items-center gap-1 text-neutral-600">
            <Lock aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.4} />
            Verrouillé
          </span>
        )}
      </span>
    </button>
  );
}

/* ---------- Duel / test arena ---------- */

function DuelTestArenaPanel({ onOpenArena }: { onOpenArena: (href: string) => void }) {
  const opponent = DUEL_OPPONENTS.find((candidate) => candidate.available) ?? null;

  return (
    <div className="ik-anim-rise-in space-y-3">
      <div className="flex items-center gap-2 border border-dashed border-neutral-700 bg-black/40 px-3 py-2">
        <FlaskConical aria-hidden="true" className="h-4 w-4 text-neutral-400" strokeWidth={2.2} />
        <p className="font-ik-menu text-[0.62rem] text-neutral-400">
          Sandbox de gameplay — aucune récompense, hors progression MVP
        </p>
      </div>

      <div className="ik-stagger grid gap-2 sm:grid-cols-3">
        {DUEL_TEST_ENTRIES.map((entry) => (
          <DuelTestEntryCard entry={entry} key={entry.id} onOpenArena={onOpenArena} opponent={opponent} />
        ))}
      </div>
    </div>
  );
}

function DuelTestEntryCard({
  entry,
  onOpenArena,
  opponent,
}: {
  entry: DuelTestEntry;
  onOpenArena: (href: string) => void;
  opponent: DuelOpponent | null;
}) {
  const canOpen = Boolean(opponent);
  const EntryIcon = entry.icon;

  return (
    <button
      aria-label={`Lancer ${entry.title}`}
      className={cn(
        "ik-card-hover group border-2 bg-black/45 p-4 text-left",
        canOpen ? "border-neutral-600" : "cursor-not-allowed border-dashed border-neutral-800"
      )}
      data-ik-tip={opponent ? opponent.name : "Aucun adversaire disponible"}
      disabled={!canOpen}
      onClick={() => {
        if (!opponent) return;
        onOpenArena(opponent.fightHref);
      }}
      type="button"
    >
      <span className="grid h-11 w-11 place-items-center border-2 border-neutral-700 bg-neutral-950 transition-colors group-hover:border-neutral-300">
        <EntryIcon aria-hidden="true" className="h-5 w-5 text-neutral-100" strokeWidth={2} />
      </span>
      <span className="mt-3 block font-ik-title text-base text-neutral-100">{entry.title}</span>
      <span className="mt-1 block font-ik-body text-xs text-neutral-500">{entry.detail}</span>
      <span className="mt-3 flex items-center gap-1 font-ik-menu text-[0.62rem] text-neutral-400 transition-all duration-150 group-hover:translate-x-1 group-hover:text-neutral-100">
        Lancer
        <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.6} />
      </span>
    </button>
  );
}

/* ---------- Main panel ---------- */

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
  const selectedEraStatus = getEraStatus(state, selectedGroup);
  const selectedEraUnlocked = selectedEraStatus === "unlocked";
  const canUnlockSelectedEra = canUnlockEraAtTimeGate(state, selectedGroup.id);
  const showPips = timeGate.maxLevel > 0 && timeGate.maxLevel <= 8;

  function handleUnlockEra(eraId: EraId) {
    const result = unlockEraAtTimeGate(useGameStore.getState().state, eraId);
    if (!result.ok) {
      toast.error(UNLOCK_FAILURE_LABELS[result.reason] ?? "Déblocage impossible.", { id: `time-gate-${eraId}` });
      return;
    }

    dispatch(() => result.next);
    toast.success(`${selectedGroup.title} débloquée`, {
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
      {/* Header */}
      <div className="ik-anim-rise-in flex flex-wrap items-center justify-between gap-4 border-2 border-neutral-700 bg-black/45 p-4">
        <div className="flex items-center gap-4">
          <PortalGlyph className="h-16 w-16 shrink-0" />
          <div>
            <h2 className="font-ik-title text-2xl font-semibold uppercase tracking-[0.06em] text-neutral-100" id="time-gate-title">
              Time Gate
            </h2>
            <div className="mt-1.5 flex items-center gap-2" data-ik-tip={`Niveau ${timeGate.level}/${timeGate.maxLevel} — ${timeGate.status}`}>
              {showPips ? (
                <span className="flex items-center gap-1">
                  {Array.from({ length: timeGate.maxLevel }, (_, pip) => (
                    <span className={cn("ik-pip", pip < timeGate.level && "ik-pip--on")} key={pip} />
                  ))}
                </span>
              ) : null}
              <span className="font-ik-menu text-[0.62rem] text-neutral-400">
                Nv {timeGate.level}/{timeGate.maxLevel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <StatChip
            icon={Aperture}
            met={state.specialItems.kaleidoscopeOwned}
            tip={state.specialItems.kaleidoscopeOwned ? "Kaléidoscope possédé" : "Kaléidoscope manquant"}
            value={state.specialItems.kaleidoscopeOwned ? "✓" : "—"}
          />
          <StatChip
            icon={Hourglass}
            tip={`Fragment du Temps ×${state.specialItems.fragmentDuTemps}`}
            value={`${state.specialItems.fragmentDuTemps}`}
          />
          <StatChip icon={Globe2} tip={`World Level ${state.progression.worldLevel}`} value={`${state.progression.worldLevel}`} />
        </div>
      </div>

      {/* Mode tabs */}
      <div aria-label="Modes de jeu" className="ik-seg ik-anim-rise-in" role="tablist" style={{ animationDelay: "40ms" }}>
        <button
          aria-selected={activeSection === "story"}
          className="ik-seg__tab"
          onClick={() => setActiveSection("story")}
          role="tab"
          type="button"
        >
          <Swords aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
          Histoire
        </button>
        <button
          aria-selected={activeSection === "duel"}
          className="ik-seg__tab"
          onClick={() => setActiveSection("duel")}
          role="tab"
          type="button"
        >
          <FlaskConical aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
          Arène d'essai
        </button>
      </div>

      {activeSection === "duel" ? (
        <DuelTestArenaPanel onOpenArena={handleOpenTestArena} />
      ) : (
        <div className="space-y-4">
          <EraTimeline onSelect={setSelectedEraId} selectedEraId={selectedGroup.id} state={state} />

          {/* Era detail */}
          <div className="ik-anim-rise-in space-y-4 border-2 border-neutral-700 bg-black/45 p-4" key={selectedGroup.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <selectedGroup.icon aria-hidden="true" className="h-5 w-5 text-neutral-100" strokeWidth={2.2} />
                <h3 className="font-ik-title text-xl text-neutral-100">{selectedGroup.title}</h3>
                <span
                  className={cn(
                    "border px-2 py-0.5 font-ik-menu text-[0.6rem]",
                    selectedEraUnlocked
                      ? "border-neutral-400 bg-neutral-100 text-neutral-950"
                      : "border-neutral-700 text-neutral-400"
                  )}
                >
                  {ERA_STATUS_META[selectedEraStatus].label}
                </span>
              </div>

              {!selectedEraUnlocked && !selectedGroup.teaser ? (
                <button
                  aria-label={`Débloquer ${selectedGroup.title}`}
                  className={cn(
                    "flex min-h-10 items-center gap-2 border-2 px-4 py-2 font-ik-menu text-xs transition",
                    canUnlockSelectedEra
                      ? "ik-ready-pulse border-neutral-100 bg-neutral-100 text-neutral-950 hover:bg-neutral-300"
                      : "cursor-not-allowed border-neutral-800 text-neutral-600"
                  )}
                  disabled={!canUnlockSelectedEra}
                  onClick={() => handleUnlockEra(selectedGroup.id)}
                  type="button"
                >
                  <Unlock aria-hidden="true" className="h-4 w-4" strokeWidth={2.4} />
                  Débloquer
                </button>
              ) : null}
            </div>

            {!selectedEraUnlocked && !selectedGroup.teaser ? (
              <TimeGateRequirements era={selectedEra} state={state} />
            ) : null}

            {selectedGroup.teaser ? (
              <div className="grid place-items-center gap-3 border border-dashed border-neutral-800 bg-neutral-950/60 py-10">
                <Sparkles aria-hidden="true" className="h-6 w-6 text-neutral-600" strokeWidth={2} />
                <p className="font-ik-menu text-[0.68rem] text-neutral-500">Prochainement — aucun donjon jouable</p>
              </div>
            ) : (
              <div className="ik-stagger grid gap-2.5 sm:grid-cols-2">
                {selectedDungeons.map((dungeon, index) => (
                  <DungeonCard
                    dungeon={dungeon}
                    eraUnlocked={selectedEraUnlocked}
                    index={index}
                    key={dungeon.id}
                    onEnter={handleEnterDungeon}
                    state={state}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
