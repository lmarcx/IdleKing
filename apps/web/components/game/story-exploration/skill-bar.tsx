"use client";

import { combat } from "@idleking/game-core";
import type { CharacterCombatLoadout, EquippedCombatSkill } from "@idleking/game-core";

type SkillId = combat.SkillId;
type SkillSlot = combat.SkillSlot;
type SkillCooldownState = combat.SkillCooldownState;

type SkillBarProps = {
  combatLoadout: CharacterCombatLoadout;
  cooldowns: SkillCooldownState;
  currentTimeMs: number;
};

const SKILL_SLOTS: readonly SkillSlot[] = [1, 2, 3, 4] as const;

const SKILL_ICONS: Record<SkillId, string> = {
  king_aura: "radial-gradient(circle, rgba(240,194,106,0.95) 0 18%, rgba(127,69,255,0.5) 20% 42%, transparent 44%)",
  royal_beam: "linear-gradient(90deg, transparent 0 28%, rgba(255,241,184,0.95) 30% 43%, rgba(255,106,42,0.9) 45% 55%, rgba(255,241,184,0.95) 57% 70%, transparent 72%)",
  royal_strike: "conic-gradient(from 235deg, transparent 0 22%, rgba(255,241,184,0.95) 23% 36%, rgba(240,194,106,0.8) 37% 48%, transparent 49%)",
  war_cry: "radial-gradient(circle, rgba(255,241,184,0.95) 0 20%, rgba(255,184,74,0.55) 22% 48%, transparent 50%)",
};

function formatCooldown(ms: number): string {
  return `${Math.ceil(ms / 1000)}s`;
}

export function SkillBar({ combatLoadout, cooldowns, currentTimeMs }: SkillBarProps) {
  return (
    <div className="pointer-events-none flex items-center justify-center gap-2 rounded-lg border border-amber-200/25 bg-black/68 px-3 py-2 shadow-[0_14px_42px_rgba(0,0,0,0.45)] backdrop-blur-sm">
      {SKILL_SLOTS.map((slot) => {
        const skill = combatLoadout.skills.find((entry) => entry.slot === slot);
        if (!skill) {
          return <EmptySkillSlot key={slot} slot={slot} />;
        }

        const { skillDef, skillId } = skill;
        const remainingMs = combat.getSkillRemainingCooldownMs(skillId, cooldowns, currentTimeMs);
        const cooldownRatio =
          skillDef.cooldownMs > 0 ? Math.min(Math.max(remainingMs / skillDef.cooldownMs, 0), 1) : 0;

        return (
          <EquippedSkillSlot
            cooldownRatio={cooldownRatio}
            key={slot}
            remainingMs={remainingMs}
            skill={skill}
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
  cooldownRatio,
  remainingMs,
  skill,
}: {
  cooldownRatio: number;
  remainingMs: number;
  skill: EquippedCombatSkill;
}) {
  return (
    <div
      aria-label={`Slot ${skill.slot} ${skill.skillDef.name} niveau ${skill.level}`}
      className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md border border-amber-200/30 bg-zinc-950/88 text-amber-50 shadow-inner"
    >
      <span className="absolute left-1.5 top-1 font-ik-menu text-[0.65rem] leading-none text-amber-100/80">
        {skill.slot}
      </span>
      <span
        aria-hidden="true"
        className="h-8 w-8 rounded-full border border-amber-100/20"
        style={{ background: SKILL_ICONS[skill.skillId] }}
      />
      {skill.level > 1 ? (
        <span className="absolute bottom-1 right-1 rounded-sm bg-amber-200/18 px-1 font-ik-menu text-[0.55rem] leading-3 text-amber-50">
          {skill.level}
        </span>
      ) : null}
      {remainingMs > 0 ? (
        <>
          <div className="absolute inset-x-0 bottom-0 bg-black/72" style={{ height: `${cooldownRatio * 100}%` }} />
          <span className="absolute inset-0 grid place-items-center font-ik-menu text-xs text-amber-50">
            {formatCooldown(remainingMs)}
          </span>
        </>
      ) : null}
    </div>
  );
}
