"use client";

import { Lock, Swords } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { DUEL_OPPONENTS, type DuelMode, type DuelOpponent } from "@/lib/duel-data";

type DuelModeCard = {
  description: string;
  disabled: boolean;
  id: DuelMode;
  label: string;
  status: string;
};

const DUEL_MODES: DuelModeCard[] = [
  {
    description: "Matchmaking et affrontements joueurs seront branchés plus tard.",
    disabled: true,
    id: "online",
    label: "Mode en ligne",
    status: "Verrouillé / Bientôt disponible",
  },
  {
    description: "Entre dans une arène instanciée contre un adversaire local.",
    disabled: false,
    id: "offline",
    label: "Mode hors ligne",
    status: "Disponible",
  },
];

function ModeCard({
  isSelected,
  mode,
  onSelect,
}: {
  isSelected: boolean;
  mode: DuelModeCard;
  onSelect: (mode: DuelMode) => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        "grid min-h-40 rounded-lg border bg-black/42 p-4 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/55",
        isSelected && "border-amber-200/75 bg-amber-200/[0.08] shadow-[0_0_28px_rgba(198,168,91,0.16)]",
        !isSelected && !mode.disabled && "border-amber-200/18 hover:border-amber-200/45 hover:bg-white/[0.035]",
        mode.disabled && "cursor-not-allowed border-slate-300/10 opacity-58"
      )}
      disabled={mode.disabled}
      onClick={() => onSelect(mode.id)}
      type="button"
    >
      <span className="flex items-start justify-between gap-3">
        <span>
          <span className="font-ik-menu text-xs uppercase tracking-[0.2em] text-muted-foreground">{mode.status}</span>
          <span className="mt-2 block font-ik-title text-xl font-semibold text-amber-50">{mode.label}</span>
        </span>
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-black/55",
            mode.disabled ? "border-slate-300/20 text-slate-300" : "border-amber-200/35 text-amber-100"
          )}
        >
          {mode.disabled ? <Lock className="h-4 w-4" aria-hidden="true" /> : <Swords className="h-4 w-4" aria-hidden="true" />}
        </span>
      </span>
      <span className="mt-4 block font-ik-body text-sm leading-relaxed text-muted-foreground">{mode.description}</span>
    </button>
  );
}

function OpponentCard({
  isSelected,
  opponent,
}: {
  isSelected: boolean;
  opponent: DuelOpponent;
}) {
  return (
    <Link
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "block rounded-lg border bg-black/42 p-4 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/55",
        isSelected && "border-amber-200/80 bg-amber-200/[0.08] shadow-[0_0_28px_rgba(198,168,91,0.16)]",
        !isSelected && "border-amber-200/18 hover:border-amber-200/45 hover:bg-white/[0.035]"
      )}
      href={`/game/worlds?mode=duel&opponent=${opponent.id}`}
    >
      <span className="flex flex-wrap items-start justify-between gap-3">
        <span>
          <span className="font-ik-menu text-[0.65rem] uppercase tracking-[0.2em] text-emerald-200">Disponible</span>
          <span className="mt-2 block font-ik-title text-2xl font-semibold text-amber-50">{opponent.name}</span>
        </span>
        <span className="rounded-full border border-amber-200/25 bg-black/45 px-3 py-1 font-ik-menu text-[0.65rem] uppercase tracking-[0.16em] text-amber-100">
          {opponent.difficulty}
        </span>
      </span>
      <span className="mt-3 block font-ik-menu text-xs uppercase tracking-[0.18em] text-muted-foreground">{opponent.type}</span>
      <span className="mt-3 block font-ik-body text-sm leading-relaxed text-muted-foreground">{opponent.description}</span>
    </Link>
  );
}

type DuelModeViewProps = {
  initialOpponentId?: string | null;
};

export function DuelModeView({ initialOpponentId = null }: DuelModeViewProps) {
  const [selectedMode, setSelectedMode] = useState<DuelMode>("offline");
  const offlineOpponents = useMemo(() => DUEL_OPPONENTS.filter((opponent) => opponent.mode === "offline"), []);
  const selectedOpponent = offlineOpponents.find((opponent) => opponent.id === initialOpponentId) ?? null;

  return (
    <section className="min-h-[38rem] rounded-xl border border-amber-200/20 bg-black/35 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-ik-menu text-xs uppercase tracking-[0.24em] text-cyan-200/80">Worlds</p>
          <h1 className="ik-story-title mt-2 text-amber-50">DUEL</h1>
          <p className="mt-3 max-w-2xl font-ik-body text-sm leading-relaxed text-muted-foreground">
            Affronte un adversaire dans une arène instanciée.
          </p>
        </div>
        {selectedOpponent ? (
          <Link
            className="inline-flex items-center justify-center rounded-md border border-amber-200/65 bg-amber-500/18 px-5 py-3 font-ik-menu text-sm text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/24"
            href={`/game/worlds/duel/${selectedOpponent.id}`}
            role="button"
          >
            Lancer le combat
          </Link>
        ) : (
          <button
            className="inline-flex cursor-not-allowed items-center justify-center rounded-md border border-amber-200/18 bg-black/35 px-5 py-3 font-ik-menu text-sm text-muted-foreground transition"
            disabled
            type="button"
          >
            Lancer le combat
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {DUEL_MODES.map((mode) => (
          <ModeCard isSelected={selectedMode === mode.id} key={mode.id} mode={mode} onSelect={setSelectedMode} />
        ))}
      </div>

      {selectedMode === "offline" ? (
        <div className="mt-6 rounded-lg border border-amber-200/14 bg-black/28 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-ik-title text-xl font-semibold text-amber-50">Adversaires disponibles</h2>
              <p className="mt-1 font-ik-body text-sm text-muted-foreground">Sélectionne une cible pour ouvrir une arène vide.</p>
            </div>
            <span className="rounded-full border border-emerald-200/25 bg-emerald-400/10 px-3 py-1 font-ik-menu text-[0.65rem] uppercase tracking-[0.16em] text-emerald-100">
              Hors ligne
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {offlineOpponents.map((opponent) => (
              <OpponentCard
                isSelected={initialOpponentId === opponent.id}
                key={opponent.id}
                opponent={opponent}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
