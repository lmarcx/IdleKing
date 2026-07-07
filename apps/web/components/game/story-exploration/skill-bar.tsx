"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  type CharacterCombatLoadout,
  type CombatSkillSlot,
  type SkillDefinition,
  type SkillElement,
} from "@idleking/game-core";
import type { SkillCooldownState, SkillId } from "@idleking/game-core/skills";

type SkillSlot = CombatSkillSlot;

type SkillBarProps = {
  combatLoadout: CharacterCombatLoadout;
  cooldowns: SkillCooldownState;
  currentTimeMs: number;
};

type RingSkillSlot = {
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
      skillDef: skill?.skillDef ?? null,
      skillId: skill?.skillId ?? null,
      slot,
    };
  });
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
  cooldowns,
  currentTimeMs,
  skill,
}: {
  cooldowns: SkillCooldownState;
  currentTimeMs: number;
  skill: RingSkillSlot & { skillDef: SkillDefinition };
}) {
  const cooldownMs = Math.max(0, (cooldowns[skill.skillDef.id] ?? 0) - currentTimeMs);
  const totalCooldownMs = Math.max(1, skill.skillDef.cooldownSeconds * 1000);
  const cooldownRatio = Math.min(1, cooldownMs / totalCooldownMs);
  const isCooling = cooldownMs > 0;
  const cooldownLabel = isCooling ? formatSeconds(cooldownMs / 1_000) : null;

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
    <div
      aria-label={`Ring slot ${skill.slot}: ${skill.skillDef.id} ${skill.skillDef.name}, ${skill.skillDef.element}, cooldown ${formatSeconds(skill.skillDef.cooldownSeconds)}, mana ${skill.skillDef.manaCost}`}
      className={cn(
        "relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden border bg-zinc-950/88 text-neutral-100",
        isCooling ? "border-neutral-800" : "border-neutral-500",
        pulse === "cast" && "ik-skill-cast-flash"
      )}
      title={`${skill.skillDef.id} - ${skill.skillDef.name} | ${skill.skillDef.element} | CD ${formatSeconds(skill.skillDef.cooldownSeconds)} | Mana ${skill.skillDef.manaCost}`}
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
  );
}
