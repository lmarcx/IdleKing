"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  combat,
  type CharacterCombatLoadout,
  type CombatSkillSlot,
  type SkillDefinition,
  type SkillElement,
} from "@idleking/game-core";
import { getStorySkillRuntimeProfile, type SkillCooldownState, type SkillId } from "@idleking/game-core/skills";

type SkillSlot = CombatSkillSlot;

type SkillBarProps = {
  combatLoadout: CharacterCombatLoadout;
  cooldowns: SkillCooldownState;
  currentTimeMs: number;
};

type RingSkillSlot = {
  ringSkillScaling: number | null;
  skillDef: SkillDefinition | null;
  skillId: SkillId | null;
  slot: SkillSlot;
};

const SKILL_SLOTS: readonly SkillSlot[] = [1, 2, 3, 4, 5] as const;

const ELEMENT_ICONS: Record<SkillElement, string> = {
  dark: "radial-gradient(circle, rgba(106,106,106,0.96) 0 20%, rgba(26,26,26,0.82) 22% 58%, transparent 60%)",
  electricity: "conic-gradient(from 210deg, transparent 0 20%, rgba(242,242,242,0.95) 21% 34%, rgba(154,154,154,0.82) 35% 47%, transparent 48%)",
  fire: "radial-gradient(circle, rgba(242,242,242,0.96) 0 18%, rgba(106,106,106,0.82) 20% 48%, transparent 50%)",
  ground: "radial-gradient(circle, rgba(154,154,154,0.96) 0 22%, rgba(58,58,58,0.82) 24% 54%, transparent 56%)",
  ice: "linear-gradient(135deg, transparent 0 20%, rgba(242,242,242,0.94) 22% 48%, rgba(154,154,154,0.72) 50% 68%, transparent 70%)",
  light: "radial-gradient(circle, rgba(242,242,242,0.98) 0 24%, rgba(201,201,201,0.72) 26% 52%, transparent 54%)",
  neutral: "radial-gradient(circle, rgba(201,201,201,0.92) 0 18%, rgba(106,106,106,0.62) 20% 48%, transparent 50%)",
  water: "radial-gradient(circle, rgba(201,201,201,0.96) 0 18%, rgba(58,58,58,0.76) 20% 52%, transparent 54%)",
  wind: "conic-gradient(from 260deg, transparent 0 18%, rgba(201,201,201,0.92) 20% 36%, rgba(106,106,106,0.62) 38% 52%, transparent 54%)",
};

function formatSeconds(seconds: number): string {
  return `${Number(seconds.toFixed(seconds >= 10 ? 0 : 1))}s`;
}

function getRingSkillSlots(combatLoadout: CharacterCombatLoadout): RingSkillSlot[] {
  return SKILL_SLOTS.map((slot): RingSkillSlot => {
    const skill = combatLoadout.skills.find((candidate) => candidate.slot === slot);
    return {
      ringSkillScaling: skill?.ringSkillScaling ?? null,
      skillDef: skill?.skillDef ?? null,
      skillId: skill?.skillId ?? null,
      slot,
    };
  });
}

/** Short, category-aware effect line for the hover tooltip — mirrors what the skill actually does at runtime. */
function describeSkillEffect(skill: RingSkillSlot & { skillDef: SkillDefinition }, attack: number): string {
  const { skillDef } = skill;
  const profile = getStorySkillRuntimeProfile(skillDef.id);

  if (skillDef.category === "attack") {
    const damage = combat.computeSkillDamage({
      attack,
      ringSkillScaling: skill.ringSkillScaling ?? undefined,
      skillDamageMultiplier: skillDef.basePower,
    });
    const shape = profile.attack;
    const area =
      shape?.shape === "cone"
        ? `cône ${shape.range}px`
        : shape?.shape === "line"
          ? `ligne ${shape.range}px`
          : shape?.shape === "aoe" || shape?.shape === "enemy_cast"
            ? `zone r.${shape.radius ?? 80}px`
            : `portée ${shape?.range ?? "—"}px`;
    return `Dégâts ≈ ${Math.round(damage.damage)} · ${area}`;
  }

  if (skillDef.category === "movement" && profile.movement) {
    return `Déplacement ${profile.movement.distance}px (${profile.movement.mode})`;
  }

  if (skillDef.category === "defense" && profile.defense) {
    const reduction = Math.round((1 - profile.defense.incomingDamageMultiplier) * 100);
    return `Réduit les dégâts subis de ${reduction}% · ${Math.round(profile.defense.durationMs / 1000)}s`;
  }

  if (skillDef.category === "utility" && profile.utility) {
    if (profile.utility.kind === "damage_buff") {
      return `+${Math.round(((profile.utility.damageMultiplier ?? 1) - 1) * 100)}% dégâts · ${Math.round(profile.utility.durationMs / 1000)}s`;
    }
    if (profile.utility.kind === "mana_regen_buff") {
      return `+${profile.utility.manaRegenPerSecond ?? 0} Mana/s · ${Math.round(profile.utility.durationMs / 1000)}s`;
    }
    if (profile.utility.kind === "enemy_vulnerability_debuff") {
      return `Cible +${Math.round(((profile.utility.incomingDamageMultiplier ?? 1) - 1) * 100)}% dégâts subis`;
    }
  }

  if (skillDef.category === "summon" && profile.summon) {
    return `Invocation · ${Math.round(profile.summon.durationMs / 1000)}s`;
  }

  return skillDef.description;
}

export function SkillBar({ combatLoadout, cooldowns, currentTimeMs }: SkillBarProps) {
  const ringSkillSlots = getRingSkillSlots(combatLoadout);

  return (
    <div
      aria-label="Barre de skills rings equipes, slots 1 a 5 castables"
      className="pointer-events-none relative flex items-center justify-center gap-2 border-2 border-neutral-700 bg-black/72 px-3 py-2 shadow-[4px_4px_0_rgba(0,0,0,0.55)] backdrop-blur-sm"
    >
      {SKILL_SLOTS.map((slot) => {
        const skill = ringSkillSlots[slot - 1];
        const skillDef = skill?.skillDef ?? null;
        if (!skill || !skillDef) {
          return <EmptySkillSlot key={slot} slot={slot} />;
        }

        return (
          <EquippedSkillSlot
            attack={combatLoadout.stats.attack}
            cooldowns={cooldowns}
            currentTimeMs={currentTimeMs}
            key={slot}
            skill={{ ...skill, skillDef }}
          />
        );
      })}
    </div>
  );
}

function EmptySkillSlot({ slot }: { slot: SkillSlot }) {
  return (
    <div
      aria-label={`Slot ${slot} vide`}
      className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden border border-dashed border-neutral-800 bg-zinc-950/55 text-neutral-600"
    >
      <span className="absolute left-1.5 top-1 font-ik-menu text-[0.65rem] leading-none text-neutral-600">{slot}</span>
      <span className="h-8 w-8 rounded-full border border-dashed border-neutral-800 bg-black/25" aria-hidden="true" />
    </div>
  );
}

function EquippedSkillSlot({
  attack,
  cooldowns,
  currentTimeMs,
  skill,
}: {
  attack: number;
  cooldowns: SkillCooldownState;
  currentTimeMs: number;
  skill: RingSkillSlot & { skillDef: SkillDefinition };
}) {
  const cooldownMs = Math.max(0, (cooldowns[skill.skillDef.id] ?? 0) - currentTimeMs);
  const totalCooldownMs = Math.max(1, skill.skillDef.cooldownSeconds * 1000);
  const cooldownRatio = Math.min(1, cooldownMs / totalCooldownMs);
  const isCooling = cooldownMs > 0;
  const cooldownLabel = isCooling ? formatSeconds(cooldownMs / 1_000) : null;
  const effectSummary = describeSkillEffect(skill, attack);

  // Edge detection: flash on cast (0 → cooling), pop when back to ready.
  const previousCooling = useRef(isCooling);
  const [pulse, setPulse] = useState<"cast" | "ready" | null>(null);
  useEffect(() => {
    if (isCooling !== previousCooling.current) {
      setPulse(isCooling ? "cast" : "ready");
      previousCooling.current = isCooling;
      const timeout = window.setTimeout(() => setPulse(null), 360);
      return () => window.clearTimeout(timeout);
    }
  }, [isCooling]);

  return (
    <div className="group pointer-events-auto relative">
      <div
        aria-label={`Ring slot ${skill.slot}: ${skill.skillDef.id} ${skill.skillDef.name}, ${skill.skillDef.element}, cooldown ${formatSeconds(skill.skillDef.cooldownSeconds)}, mana ${skill.skillDef.manaCost}`}
        className={cn(
          "relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden border bg-zinc-950/88 text-neutral-100",
          isCooling ? "border-neutral-800" : "border-neutral-500",
          pulse === "cast" && "ik-skill-cast-flash"
        )}
      >
        <span className="absolute left-1.5 top-1 z-10 font-ik-menu text-[0.65rem] leading-none text-neutral-400">
          {skill.slot}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "h-8 w-8 rounded-full border border-neutral-700 transition-opacity",
            isCooling && "opacity-40",
            pulse === "ready" && "ik-skill-ready-pop"
          )}
          style={{ background: ELEMENT_ICONS[skill.skillDef.element] }}
        />

        {/* Radial cooldown sweep — shaded wedge shrinks as the skill recharges. */}
        {isCooling ? (
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `conic-gradient(rgba(10,10,10,0.82) ${cooldownRatio * 360}deg, transparent ${cooldownRatio * 360}deg)`,
            }}
          />
        ) : null}

        <span
          className={cn(
            "absolute bottom-1 right-1 z-10 px-1 font-ik-menu text-[0.5rem] leading-3",
            isCooling ? "bg-black/70 text-neutral-100 tabular-nums" : "bg-neutral-800/80 text-neutral-400"
          )}
        >
          {cooldownLabel ?? `M${skill.skillDef.manaCost}`}
        </span>
      </div>

      {/* Hover tooltip — name, short effect line, mana/cooldown. Not clipped by the slot's own overflow-hidden since it's a sibling. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-56 -translate-x-1/2 border border-neutral-600 bg-black/95 p-2.5 text-left opacity-0 shadow-[3px_3px_0_rgba(0,0,0,0.6)] transition-opacity duration-100 group-hover:opacity-100"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-ik-title text-xs text-neutral-100">{skill.skillDef.name}</span>
          <span className="font-ik-menu text-[0.55rem] uppercase tracking-[0.08em] text-neutral-500">
            {skill.skillDef.element}
          </span>
        </div>
        <p className="mt-1 font-ik-body text-[0.68rem] leading-snug text-neutral-400">{effectSummary}</p>
        <div className="mt-2 flex items-center gap-2 border-t border-neutral-800 pt-1.5 font-ik-menu text-[0.6rem] text-neutral-500">
          <span>Mana {skill.skillDef.manaCost}</span>
          <span aria-hidden="true">·</span>
          <span>CD {formatSeconds(skill.skillDef.cooldownSeconds)}</span>
        </div>
      </div>
    </div>
  );
}
