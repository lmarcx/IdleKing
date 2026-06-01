"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { GameHud, type GameHudResource } from "@/components/game/hud/game-hud";
import { SkillBar } from "@/components/game/story-exploration/skill-bar";
import type { CharacterCombatLoadout, combat } from "@idleking/game-core";

type CombatHealth = GameHudResource;

type CombatHudSkillBar = {
  combatLoadout: CharacterCombatLoadout;
  cooldowns: combat.SkillCooldownState;
  currentTimeMs: number;
};

type CombatHudProps = {
  bossHealth?: CombatHealth;
  bossLabel?: string;
  children?: ReactNode;
  exitHref?: string;
  exitLabel?: string;
  /**
   * MVP scope: "story" | "dungeon". "duel" | "expedition" are reserved labels for
   * future modes (out of MVP, DESIGN_FREEZE_V1 §19) and carry no combat logic here.
   */
  mode: "story" | "duel" | "dungeon" | "expedition";
  playerEnergy?: CombatHealth;
  playerHealth?: CombatHealth;
  playerMana?: CombatHealth;
  playerStamina?: CombatHealth;
  skillBar?: CombatHudSkillBar;
  subtitle?: string;
  title: string;
};

function healthPercent(health?: CombatHealth) {
  if (!health || health.max <= 0) return 0;
  return Math.min(100, Math.max(0, (health.current / health.max) * 100));
}

export function CombatHud({
  bossHealth,
  bossLabel,
  children,
  exitHref = "/game/kingdom",
  exitLabel = "Retour au Royaume",
  mode,
  playerEnergy,
  playerHealth,
  playerMana,
  playerStamina,
  skillBar,
  subtitle,
  title,
}: CombatHudProps) {
  return (
    <>
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-30">
        <GameHud
          playerEnergy={playerEnergy}
          playerHealth={playerHealth}
          playerMana={playerMana}
          playerStamina={playerStamina}
        />
      </div>

      <div className="pointer-events-none absolute left-4 top-24 z-20 max-w-sm rounded-lg border border-amber-200/20 bg-black/62 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.38)] backdrop-blur-sm">
        <p className="font-ik-menu text-[0.62rem] uppercase tracking-[0.2em] text-cyan-200/80">{mode}</p>
        <h1 className="mt-1 font-ik-title text-xl font-semibold text-amber-50">{title}</h1>
        {subtitle ? <p className="mt-1 font-ik-body text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>

      <Link
        className="pointer-events-auto absolute right-4 top-24 z-20 rounded-md border border-amber-200/35 bg-black/62 px-4 py-2 font-ik-menu text-xs text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/16"
        href={exitHref}
      >
        {exitLabel}
      </Link>

      {bossHealth ? (
        <div className="pointer-events-none absolute inset-x-4 top-44 z-20 mx-auto max-w-2xl rounded-lg border border-red-200/28 bg-black/64 px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.42)] backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-ik-menu text-[0.62rem] uppercase tracking-[0.18em] text-red-200/80">
                {bossLabel ?? "Boss"}
              </p>
              <h2 className="font-ik-title text-lg font-semibold text-amber-50">{bossLabel ?? title}</h2>
            </div>
            <span className="font-ik-menu text-xs tabular-nums text-amber-100">
              {Math.max(0, Math.ceil(bossHealth.current))}/{bossHealth.max}
            </span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full border border-red-200/24 bg-black/55">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-700 via-red-500 to-amber-300"
              style={{ width: `${healthPercent(bossHealth)}%` }}
            />
          </div>
        </div>
      ) : null}

      {skillBar ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <SkillBar
            combatLoadout={skillBar.combatLoadout}
            cooldowns={skillBar.cooldowns}
            currentTimeMs={skillBar.currentTimeMs}
          />
        </div>
      ) : null}

      {children}
    </>
  );
}
