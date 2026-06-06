"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { GamePanel } from "@/components/ui/game-panel";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import {
  SKILL_DEFS,
  createDefaultPlayerSkillsState,
  equipSkill,
  isSkillUnlocked,
  unequipSkill,
  type PlayerSkillsState,
  type SkillDef,
  type SkillId,
  type SkillSlot,
} from "@idleking/game-core";

const SKILL_IDS = Object.keys(SKILL_DEFS) as SkillId[];
const SKILL_SLOTS: readonly SkillSlot[] = [1, 2, 3, 4] as const;
const SLOT_KEYS: Record<SkillSlot, string> = {
  1: "&",
  2: "é",
  3: "\"",
  4: "'",
};

function getSafeSkillsState(skills: PlayerSkillsState | undefined): PlayerSkillsState {
  return skills ?? createDefaultPlayerSkillsState();
}

function formatMs(ms: number | undefined): string | null {
  if (ms === undefined) return null;
  if (ms >= 1000) return `${Number((ms / 1000).toFixed(1))}s`;
  return `${ms}ms`;
}

function formatMultiplier(value: number | undefined): string | null {
  if (value === undefined) return null;
  return `x${Number(value.toFixed(3))}`;
}

function getKindLabel(kind: SkillDef["kind"]): string {
  switch (kind) {
    case "aura":
      return "Aura";
    case "beam":
      return "Rayon";
    case "buff":
      return "Buff";
    case "frontal_aoe":
      return "AOE frontale";
  }
}

function getFailureMessage(reason: string): string {
  switch (reason) {
    case "ALREADY_EQUIPPED":
      return "Ce skill est déjà équipé.";
    case "INVALID_SLOT":
      return "Slot invalide.";
    case "LOCKED_SKILL":
      return "Action verrouillée : équipez un ring qui porte ce skill.";
    case "UNKNOWN_SKILL":
      return "Skill inconnu.";
    default:
      return "Action impossible.";
  }
}

function getPrimaryStats(def: SkillDef): Array<[string, string]> {
  return [
    ["Cooldown", formatMs(def.cooldownMs)],
    ["Durée", formatMs(def.durationMs)],
    ["Portée", def.range?.toString() ?? null],
    ["Rayon", def.radius?.toString() ?? null],
    ["Largeur", def.width?.toString() ?? null],
    ["Dégâts", formatMultiplier(def.damageMultiplier)],
    ["Bonus dégâts", def.bonusDamageMultiplier === undefined ? null : `+${Math.round(def.bonusDamageMultiplier * 100)}%`],
    ["Tick", formatMs(def.tickIntervalMs)],
  ].filter((entry): entry is [string, string] => entry[1] !== null);
}

export function SkillsView() {
  const storedSkills = useGameStore((s) => s.state.skills);
  const dispatch = useGameStore((s) => s.dispatch);
  const skills = getSafeSkillsState(storedSkills);
  const [selectedSkillId, setSelectedSkillId] = useState<SkillId>("royal_strike");
  const selectedDef = SKILL_DEFS[selectedSkillId];
  const selectedUnlocked = isSkillUnlocked(skills, selectedSkillId);
  const selectedEquippedSlot = SKILL_SLOTS.find((slot) => skills.loadout[slot] === selectedSkillId);
  const detailStats = useMemo(() => getPrimaryStats(selectedDef), [selectedDef]);

  function handleEquip(slot: SkillSlot) {
    const result = equipSkill(skills, selectedSkillId, slot);
    if (!result.ok) {
      toast.error(getFailureMessage(result.reason), { id: `skill-equip-${selectedSkillId}` });
      return;
    }

    dispatch((current) => ({
      ...current,
      skills: result.state,
    }));
    toast.success(`Skill équipé en slot ${slot}`, { id: `skill-equip-${selectedSkillId}` });
  }

  function handleUnequip(slot: SkillSlot) {
    const result = unequipSkill(skills, slot);
    if (!result.ok) {
      toast.error(getFailureMessage(result.reason), { id: `skill-unequip-${slot}` });
      return;
    }

    dispatch((current) => ({
      ...current,
      skills: result.state,
    }));
    toast.success(`Slot ${slot} vidé`, { id: `skill-unequip-${slot}` });
  }

  return (
    <section aria-labelledby="skills-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-200/80">Character</p>
          <h1 id="skills-title" className="font-ik-title text-3xl font-semibold text-amber-50">Skills</h1>
        </div>
        <span className="rounded-md border border-amber-200/25 bg-black/45 px-3 py-2 font-ik-menu text-sm text-amber-50">
          Ring Skills
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
        <GamePanel className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-ik-title text-xl text-amber-50">Skill Codex</h2>
            <span className="font-ik-body text-xs text-muted-foreground">MVP</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {SKILL_IDS.map((skillId) => {
              const baseDef = SKILL_DEFS[skillId];
              const unlocked = isSkillUnlocked(skills, skillId);
              const isSelected = selectedSkillId === skillId;

              return (
                <button
                  aria-label={`${baseDef.name} - ${unlocked ? "Unlocked" : "Locked"}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "rounded-lg border bg-black/35 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/45",
                    isSelected
                      ? "border-amber-200/70 shadow-[0_0_28px_rgba(240,194,106,0.14)]"
                      : "border-amber-200/18 hover:border-amber-200/45"
                  )}
                  data-testid={`skill-card-${skillId}`}
                  key={skillId}
                  onClick={() => setSelectedSkillId(skillId)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-ik-title text-lg text-amber-50">{baseDef.name}</p>
                      <p className="mt-1 font-ik-menu text-[0.62rem] uppercase tracking-[0.16em] text-cyan-100/75">
                        {getKindLabel(baseDef.kind)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-sm border px-2 py-1 font-ik-menu text-[0.65rem]",
                        unlocked ? "border-emerald-300/30 text-emerald-100" : "border-zinc-400/25 text-zinc-400"
                      )}
                    >
                      {unlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                  <p className="mt-3 min-h-10 font-ik-body text-sm text-muted-foreground">{baseDef.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 font-ik-body text-xs text-amber-50/85">
                    {getPrimaryStats(baseDef)
                      .slice(0, 4)
                      .map(([label, value]) => (
                        <span className="rounded border border-amber-200/14 bg-black/35 px-2 py-1" key={label}>
                          {label}: {value}
                        </span>
                      ))}
                  </div>
                </button>
              );
            })}
          </div>
        </GamePanel>

        <GamePanel className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-ik-title text-2xl text-amber-50">{selectedDef.name}</h2>
              <p className="mt-1 font-ik-menu text-[0.65rem] uppercase tracking-[0.16em] text-cyan-100/75">
                {getKindLabel(selectedDef.kind)}
              </p>
            </div>
            <span
              className={cn(
                "rounded-md border bg-black/45 px-3 py-2 font-ik-menu text-sm",
                selectedUnlocked ? "border-emerald-300/30 text-emerald-100" : "border-zinc-400/25 text-zinc-400"
              )}
            >
              {selectedUnlocked ? "Unlocked" : "Locked"}
            </span>
          </div>
          <p className="mt-4 font-ik-body text-sm leading-6 text-muted-foreground">{selectedDef.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {detailStats.map(([label, value]) => (
              <div className="rounded-md border border-amber-200/15 bg-black/35 px-3 py-2" key={label}>
                <p className="font-ik-menu text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                <p className="mt-1 font-ik-body text-sm text-amber-50">{value}</p>
              </div>
            ))}
          </div>
        </GamePanel>
      </div>

      <GamePanel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-ik-title text-xl text-amber-50">Loadout</h2>
            <p className="font-ik-body text-sm text-muted-foreground">
              Skill sélectionné: {selectedDef.name} {selectedUnlocked ? "" : "(locked)"}
            </p>
          </div>
          {selectedEquippedSlot ? (
            <span className="font-ik-body text-xs text-muted-foreground">Déjà équipé slot {selectedEquippedSlot}</span>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {SKILL_SLOTS.map((slot) => {
            const equippedSkillId = skills.loadout[slot];
            const equippedDef = equippedSkillId ? SKILL_DEFS[equippedSkillId] : null;

            return (
              <div className="rounded-lg border border-amber-200/18 bg-black/35 p-3" key={slot}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-ik-menu text-xs uppercase text-amber-100">Slot {slot}</span>
                  <span className="rounded border border-amber-200/20 px-2 py-1 font-ik-menu text-xs text-amber-50">
                    {SLOT_KEYS[slot]}
                  </span>
                </div>
                <p className="mt-3 min-h-10 font-ik-body text-sm text-amber-50">
                  {equippedDef ? equippedDef.name : "Vide"}
                </p>
                <div className="mt-3 grid gap-2">
                  <button
                    aria-label={`Equip selected skill in slot ${slot}`}
                    className="rounded-md border border-cyan-200/30 bg-cyan-500/10 px-3 py-2 font-ik-menu text-xs uppercase text-cyan-50 transition hover:border-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
                    data-testid={`skill-equip-slot-${slot}`}
                    disabled={!selectedUnlocked || selectedEquippedSlot === slot}
                    onClick={() => handleEquip(slot)}
                    type="button"
                  >
                    Équiper sélection
                  </button>
                  <button
                    aria-label={`Unequip skill from slot ${slot}`}
                    className="rounded-md border border-amber-200/20 bg-black/25 px-3 py-2 font-ik-menu text-xs uppercase text-amber-50 transition hover:border-amber-100 disabled:cursor-not-allowed disabled:opacity-45"
                    data-testid={`skill-unequip-slot-${slot}`}
                    disabled={!equippedSkillId}
                    onClick={() => handleUnequip(slot)}
                    type="button"
                  >
                    Déséquiper
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </GamePanel>
    </section>
  );
}
