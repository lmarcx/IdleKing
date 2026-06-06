"use client";

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
  dark: "radial-gradient(circle, rgba(191,145,255,0.96) 0 20%, rgba(42,20,77,0.82) 22% 58%, transparent 60%)",
  electricity: "conic-gradient(from 210deg, transparent 0 20%, rgba(255,238,125,0.95) 21% 34%, rgba(100,220,255,0.82) 35% 47%, transparent 48%)",
  fire: "radial-gradient(circle, rgba(255,225,130,0.96) 0 18%, rgba(255,87,42,0.82) 20% 48%, transparent 50%)",
  ground: "radial-gradient(circle, rgba(195,160,104,0.96) 0 22%, rgba(85,63,31,0.82) 24% 54%, transparent 56%)",
  ice: "linear-gradient(135deg, transparent 0 20%, rgba(190,244,255,0.94) 22% 48%, rgba(95,164,255,0.72) 50% 68%, transparent 70%)",
  light: "radial-gradient(circle, rgba(255,248,190,0.98) 0 24%, rgba(240,194,106,0.72) 26% 52%, transparent 54%)",
  neutral: "radial-gradient(circle, rgba(232,226,212,0.92) 0 18%, rgba(127,139,158,0.62) 20% 48%, transparent 50%)",
  water: "radial-gradient(circle, rgba(125,225,255,0.96) 0 18%, rgba(28,103,184,0.76) 20% 52%, transparent 54%)",
  wind: "conic-gradient(from 260deg, transparent 0 18%, rgba(170,255,210,0.92) 20% 36%, rgba(84,201,164,0.62) 38% 52%, transparent 54%)",
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
      className="pointer-events-none relative flex items-center justify-center gap-2 rounded-lg border border-amber-200/25 bg-black/68 px-3 py-2 shadow-[0_14px_42px_rgba(0,0,0,0.45)] backdrop-blur-sm"
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
      className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md border border-amber-200/15 bg-zinc-950/55 text-amber-50/35 shadow-inner"
    >
      <span className="absolute left-1.5 top-1 font-ik-menu text-[0.65rem] leading-none text-amber-100/45">{slot}</span>
      <span className="h-8 w-8 rounded-full border border-dashed border-amber-100/15 bg-black/25" aria-hidden="true" />
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
  const cooldownLabel = cooldownMs > 0 ? formatSeconds(cooldownMs / 1_000) : null;

  return (
    <div
      aria-label={`Ring slot ${skill.slot}: ${skill.skillDef.id} ${skill.skillDef.name}, ${skill.skillDef.element}, cooldown ${formatSeconds(skill.skillDef.cooldownSeconds)}, mana ${skill.skillDef.manaCost}`}
      className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md border border-amber-200/30 bg-zinc-950/88 text-amber-50 shadow-inner"
      title={`${skill.skillDef.id} - ${skill.skillDef.name} | ${skill.skillDef.element} | CD ${formatSeconds(skill.skillDef.cooldownSeconds)} | Mana ${skill.skillDef.manaCost}`}
    >
      <span className="absolute left-1.5 top-1 font-ik-menu text-[0.65rem] leading-none text-amber-100/80">
        {skill.slot}
      </span>
      <span
        aria-hidden="true"
        className="h-8 w-8 rounded-full border border-amber-100/20"
        style={{ background: ELEMENT_ICONS[skill.skillDef.element] }}
      />
      <span className="absolute bottom-1 left-1 rounded-sm bg-black/58 px-1 font-ik-menu text-[0.5rem] leading-3 text-cyan-100">
        {skill.skillDef.element}
      </span>
      <span className="absolute bottom-1 right-1 rounded-sm bg-amber-200/18 px-1 font-ik-menu text-[0.5rem] leading-3 text-amber-50">
        {cooldownLabel ?? `M${skill.skillDef.manaCost}`}
      </span>
    </div>
  );
}
