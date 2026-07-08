"use client";

import { useMemo, type ComponentType } from "react";
import {
  Activity,
  Backpack,
  Coins,
  Crown,
  Droplets,
  Gem,
  Globe2,
  Heart,
  Hourglass,
  Settings,
  Sparkles,
  UserRound,
  Users,
  Zap,
} from "lucide-react";

import { useGameHudOverlay, type GameHudOverlayId } from "@/components/game/hud/game-hud-overlays";
import { ResourceFocusDropdown } from "@/components/game/hud/resource-focus-dropdown";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { calculateFinalCharacterStats, getCurrencyBalance, xpNext } from "@idleking/game-core";

type GameHudProps = {
  className?: string;
  disabled?: boolean;
  onOpenCharacter?: () => void;
  onOpenInventory?: () => void;
  onOpenResonance?: () => void;
  onOpenSettings?: () => void;
  onOpenSkills?: () => void;
  onOpenWorlds?: () => void;
  playerEnergy?: GameHudResource;
  playerHealth?: GameHudResource;
  playerMana?: GameHudResource;
  playerStamina?: GameHudResource;
};

export type GameHudResource = {
  current: number;
  max: number;
};

type HudIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

const HUD_NAV_ITEMS: ReadonlyArray<{ icon: HudIcon; id: GameHudOverlayId; label: string }> = [
  { icon: UserRound, id: "character", label: "Personnage" },
  { icon: Backpack, id: "inventory", label: "Inventaire" },
  { icon: Sparkles, id: "skills", label: "Skills" },
  { icon: Gem, id: "resonance", label: "Résonance" },
  { icon: Hourglass, id: "worlds", label: "Time Gate" },
  { icon: Settings, id: "settings", label: "Options" },
];

function normalizeHudResource(resource: GameHudResource): GameHudResource {
  const max = Math.max(1, Math.ceil(resource.max));
  return {
    current: Math.min(max, Math.max(0, Math.ceil(resource.current))),
    max,
  };
}

function HudBar({
  dim = false,
  icon: Icon,
  label,
  max,
  value,
}: {
  dim?: boolean;
  icon: HudIcon;
  label: string;
  max: number;
  value: number;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const low = percent <= 25;

  return (
    <div
      aria-label={`${label} ${value}/${max}`}
      className="flex min-w-[7.5rem] items-center gap-1.5"
      data-ik-tip={`${label} ${value}/${max}`}
      role="meter"
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={value}
    >
      <Icon aria-hidden="true" className={cn("h-3.5 w-3.5 shrink-0", dim ? "text-neutral-500" : "text-neutral-200")} strokeWidth={2.4} />
      <div className="ik-bar flex-1">
        <div
          className={cn("ik-bar__fill", dim && "ik-bar__fill--dim", low && !dim && "ik-bar__fill--low")}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function CombatResourceBars({
  playerEnergy,
  playerHealth,
  playerMana,
  playerStamina,
}: {
  playerEnergy?: GameHudResource;
  playerHealth: GameHudResource;
  playerMana?: GameHudResource;
  playerStamina?: GameHudResource;
}) {
  const health = normalizeHudResource(playerHealth);
  const energy = playerEnergy ? normalizeHudResource(playerEnergy) : undefined;
  const mana = playerMana ? normalizeHudResource(playerMana) : undefined;
  const stamina = playerStamina ? normalizeHudResource(playerStamina) : undefined;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <HudBar icon={Heart} label="PV" max={health.max} value={health.current} />
      {energy ? <HudBar icon={Zap} label="Énergie" max={energy.max} value={energy.current} /> : null}
      {mana ? <HudBar icon={Droplets} label="Mana" max={mana.max} value={mana.current} /> : null}
      {stamina ? <HudBar icon={Activity} label="Stamina" max={stamina.max} value={stamina.current} /> : null}
    </div>
  );
}

function HudStat({
  icon: Icon,
  label,
  progress,
  tip,
  value,
}: {
  icon: HudIcon;
  label: string;
  progress?: number;
  tip: string;
  value: string;
}) {
  return (
    <div
      aria-label={tip}
      className="flex min-w-14 flex-col gap-1 border border-neutral-700 bg-black/60 px-2 py-1"
      data-ik-tip={tip}
    >
      <span className="flex items-center gap-1.5">
        <Icon aria-hidden="true" className="h-3.5 w-3.5 text-neutral-300" strokeWidth={2.4} />
        <span className="font-ik-menu text-[0.66rem] leading-none text-neutral-100 tabular-nums">{value}</span>
        <span className="sr-only">{label}</span>
      </span>
      {progress !== undefined ? (
        <span className="ik-bar !h-[3px] w-full !border-neutral-800">
          <span className="ik-bar__fill ik-bar__fill--dim block" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </span>
      ) : null}
    </div>
  );
}

export function GameHud({
  className,
  disabled = false,
  onOpenCharacter,
  onOpenInventory,
  onOpenResonance,
  onOpenSettings,
  onOpenSkills,
  onOpenWorlds,
  playerEnergy,
  playerHealth,
  playerMana,
  playerStamina,
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
    resonance: onOpenResonance ?? (() => openOverlay("resonance")),
    settings: onOpenSettings ?? (() => openOverlay("settings")),
    skills: onOpenSkills ?? (() => openOverlay("skills")),
    worlds: onOpenWorlds ?? (() => openOverlay("worlds")),
  };
  const health = playerHealth ?? { current: hpMax, max: hpMax };
  const energy = playerEnergy ?? (playerMana || playerStamina ? undefined : { current: 100, max: 100 });
  const worldEnergy = normalizeHudResource({
    current: Math.floor(state.world.energy.current),
    max: Math.ceil(state.world.energy.max),
  });
  const worldHp = normalizeHudResource({
    current: Math.floor(state.world.hp.current),
    max: Math.ceil(state.world.hp.max),
  });
  const ecuBalance = getCurrencyBalance(state.wallet, "ECU");
  const xpProgress = playerXpToNext > 0 ? (state.progression.playerXp / playerXpToNext) * 100 : 100;

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 border-2 border-neutral-700 bg-zinc-950/88 px-2.5 py-2 shadow-[4px_4px_0_rgba(0,0,0,0.6)] backdrop-blur-md",
        className
      )}
    >
      <nav aria-label="Game HUD" className="flex items-center gap-1.5">
        {HUD_NAV_ITEMS.map(({ icon: Icon, id, label }) => (
          <button
            aria-label={label}
            className="ik-hud-btn"
            data-ik-tip={label}
            disabled={disabled}
            key={id}
            onClick={handlers[id]}
            type="button"
          >
            <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <CombatResourceBars
          playerEnergy={energy}
          playerHealth={health}
          playerMana={playerMana}
          playerStamina={playerStamina}
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-l border-neutral-800 pl-3">
          <HudBar dim icon={Globe2} label="Énergie du Monde" max={worldEnergy.max} value={worldEnergy.current} />
          <HudBar dim icon={Heart} label="PV du Monde" max={worldHp.max} value={worldHp.current} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <HudStat
          icon={Crown}
          label="Niveau du joueur"
          progress={xpProgress}
          tip={`Niveau ${state.progression.playerLevel} — XP ${state.progression.playerXp}${playerXpToNext > 0 ? `/${playerXpToNext}` : " (max)"}`}
          value={`${state.progression.playerLevel}`}
        />
        <HudStat
          icon={Globe2}
          label="Niveau du monde"
          tip={`World Level ${state.progression.worldLevel} — WXP ${state.progression.worldWxp}`}
          value={`${state.progression.worldLevel}`}
        />
        <HudStat icon={Coins} label="ECU" tip={`${ecuBalance} ECU`} value={`${ecuBalance}`} />
        <HudStat
          icon={Users}
          label="Villageois"
          tip={`${villagers.length} villageois — stamina moyenne ${averageStamina}`}
          value={`${villagers.length}`}
        />
        <ResourceFocusDropdown resources={state.resources} />
      </div>
    </div>
  );
}
