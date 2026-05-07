"use client";

import { useMemo, type ReactNode } from "react";

import { useGameHudOverlay, type GameHudOverlayId } from "@/components/game/hud/game-hud-overlays";
import { ResourceFocusDropdown } from "@/components/game/hud/resource-focus-dropdown";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { calculateFinalCharacterStats, xpNext } from "@idleking/game-core";

type GameHudProps = {
  className?: string;
  disabled?: boolean;
  onOpenCharacter?: () => void;
  onOpenInventory?: () => void;
  onOpenSettings?: () => void;
  onOpenSkills?: () => void;
  onOpenWorlds?: () => void;
  playerEnergy?: GameHudResource;
  playerHealth?: GameHudResource;
};

const hudButtonClassName =
  "rounded-md border border-amber-200/22 bg-black/45 px-2.5 py-1.5 font-ik-menu text-[0.66rem] uppercase tracking-[0.1em] text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/16 disabled:cursor-not-allowed disabled:opacity-45";

export type GameHudResource = {
  current: number;
  max: number;
};

function normalizeHudResource(resource: GameHudResource): GameHudResource {
  const max = Math.max(1, Math.ceil(resource.max));
  return {
    current: Math.min(max, Math.max(0, Math.ceil(resource.current))),
    max,
  };
}

function HudBar({ label, value, max, tint }: { label: string; max: number; tint: string; value: number }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className="min-w-28">
      <div className="mb-0.5 flex justify-between gap-2 font-ik-menu text-[0.58rem] uppercase tracking-[0.1em] text-amber-100/68">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full border border-amber-200/16 bg-black/55">
        <div className={`h-full rounded-full ${tint}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function CombatResourceBars({
  playerEnergy,
  playerHealth,
}: {
  playerEnergy: GameHudResource;
  playerHealth: GameHudResource;
}) {
  const health = normalizeHudResource(playerHealth);
  const energy = normalizeHudResource(playerEnergy);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <HudBar label="HP" max={health.max} value={health.current} tint="bg-red-400" />
      <HudBar label="Energy" max={energy.max} value={energy.current} tint="bg-cyan-300" />
    </div>
  );
}

function HudButton({
  children,
  disabled,
  onClick,
}: {
  children: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={hudButtonClassName} disabled={disabled} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function HudChip({ children }: { children: ReactNode }) {
  return <span className="rounded border border-amber-200/14 bg-black/38 px-2 py-1">{children}</span>;
}

export function GameHud({
  className,
  disabled = false,
  onOpenCharacter,
  onOpenInventory,
  onOpenSettings,
  onOpenSkills,
  onOpenWorlds,
  playerEnergy,
  playerHealth,
}: GameHudProps) {
  const { openOverlay } = useGameHudOverlay();
  const state = useGameStore((store) => store.state);
  const characterStats = useMemo(() => calculateFinalCharacterStats(state), [state]);
  const villagers = state.villagers.list;
  const averageStamina =
    villagers.length > 0 ? Math.round(villagers.reduce((sum, villager) => sum + villager.stamina, 0) / villagers.length) : 0;
  const playerXpToNext = xpNext(state.progression.playerLevel);
  const hpMax = Math.max(1, characterStats.hp);
  const handlers: Record<GameHudOverlayId, () => void> = {
    character: onOpenCharacter ?? (() => openOverlay("character")),
    inventory: onOpenInventory ?? (() => openOverlay("inventory")),
    settings: onOpenSettings ?? (() => openOverlay("settings")),
    skills: onOpenSkills ?? (() => openOverlay("skills")),
    worlds: onOpenWorlds ?? (() => openOverlay("worlds")),
  };
  const health = playerHealth ?? { current: hpMax, max: hpMax };
  const energy = playerEnergy ?? { current: 100, max: 100 };

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200/20 bg-zinc-950/84 px-2.5 py-2 shadow-[0_12px_38px_rgba(0,0,0,0.42)] backdrop-blur-md",
        className
      )}
    >
      <nav className="flex flex-wrap items-center gap-1.5" aria-label="Game HUD">
        <HudButton disabled={disabled} onClick={handlers.character}>
          Character
        </HudButton>
        <HudButton disabled={disabled} onClick={handlers.inventory}>
          Inventory
        </HudButton>
        <HudButton disabled={disabled} onClick={handlers.skills}>
          Skills
        </HudButton>
        <HudButton disabled={disabled} onClick={handlers.worlds}>
          Worlds
        </HudButton>
        <HudButton disabled={disabled} onClick={handlers.settings}>
          Settings
        </HudButton>
      </nav>

      <CombatResourceBars playerEnergy={energy} playerHealth={health} />

      <div className="flex flex-wrap items-center gap-2 font-ik-body text-[0.72rem] text-amber-50">
        <HudChip>Player Lv {state.progression.playerLevel}</HudChip>
        <HudChip>
          XP {state.progression.playerXp}
          {playerXpToNext > 0 ? `/${playerXpToNext}` : ""}
        </HudChip>
        <HudChip>World Lv {state.progression.worldLevel}</HudChip>
        <HudChip>WXP {state.progression.worldWxp}</HudChip>
        <HudChip>Villagers {villagers.length}</HudChip>
        <HudChip>Avg stamina {averageStamina}</HudChip>
        <ResourceFocusDropdown resources={state.resources} />
      </div>
    </div>
  );
}
