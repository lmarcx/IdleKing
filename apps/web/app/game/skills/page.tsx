"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { GamePanel } from "@/components/ui/game-panel";
import { useGameStore } from "@/store/game-store";
import {
  SKILL_DEFS,
  SKILL_UPGRADE_COST_BY_LEVEL,
  SKILL_UPGRADE_DEFS,
  createDefaultPlayerSkillsState,
  getEffectiveSkillDef,
  getSkillProgress,
  isSkillUnlocked,
  type PlayerSkillsState,
  type SkillDef,
  type SkillId,
  type SkillSlot,
  type SkillUpgradeEffect,
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

function getNextLevelCost(skills: PlayerSkillsState, skillId: SkillId): number | null {
  const level = getSkillProgress(skills, skillId)?.level ?? 0;
  if (level >= 5) return null;
  return SKILL_UPGRADE_COST_BY_LEVEL[(level + 1) as keyof typeof SKILL_UPGRADE_COST_BY_LEVEL];
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

function getStatusLabel(level: number): string {
  if (level <= 0) return "Verrouillé";
  if (level >= 5) return "Max";
  return "Débloqué";
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
    case "INSUFFICIENT_SKILL_POINTS":
      return "Pas assez de points de compétence.";
    case "INVALID_SLOT":
      return "Slot invalide.";
    case "LOCKED_SKILL":
      return "Ce skill est verrouillé.";
    case "MAX_LEVEL":
      return "Ce skill est déjà au niveau maximum.";
    case "UNKNOWN_SKILL":
      return "Skill inconnu.";
    default:
      return "Action impossible.";
  }
}

function formatEffect(effect: SkillUpgradeEffect): string {
  const statLabel: Record<SkillUpgradeEffect["stat"], string> = {
    bonusDamageMultiplier: "Bonus dégâts",
    cooldownMs: "Cooldown",
    damageMultiplier: "Dégâts",
    durationMs: "Durée",
    radius: "Rayon",
    range: "Portée",
    tickIntervalMs: "Tick",
    width: "Largeur",
  };
  const value =
    effect.stat.endsWith("Ms")
      ? formatMs(Math.abs(effect.value))
      : effect.op === "multiply"
        ? `x${effect.value}`
        : `${effect.value > 0 ? "+" : ""}${effect.value}`;
  const sign = effect.stat.endsWith("Ms") && effect.value < 0 ? "-" : effect.stat.endsWith("Ms") ? "+" : "";

  return `${statLabel[effect.stat]} ${effect.op === "multiply" ? value : `${sign}${value}`}`;
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

export default function SkillsPage() {
  const storedSkills = useGameStore((s) => s.state.skills);
  const unlockOrUpgradePlayerSkill = useGameStore((s) => s.unlockOrUpgradePlayerSkill);
  const equipPlayerSkill = useGameStore((s) => s.equipPlayerSkill);
  const unequipPlayerSkill = useGameStore((s) => s.unequipPlayerSkill);
  const respecPlayerSkills = useGameStore((s) => s.respecPlayerSkills);
  const addDevSkillPoint = useGameStore((s) => s.addDevSkillPoint);
  const skills = getSafeSkillsState(storedSkills);
  const [selectedSkillId, setSelectedSkillId] = useState<SkillId>("royal_strike");
  const selectedDef = getEffectiveSkillDef(selectedSkillId, skills);
  const selectedProgress = getSkillProgress(skills, selectedSkillId);
  const selectedLevel = selectedProgress?.level ?? 0;
  const selectedUnlocked = isSkillUnlocked(skills, selectedSkillId);
  const selectedNextCost = getNextLevelCost(skills, selectedSkillId);
  const selectedEquippedSlot = SKILL_SLOTS.find((slot) => skills.loadout[slot] === selectedSkillId);
  const detailStats = useMemo(() => getPrimaryStats(selectedDef), [selectedDef]);

  function handleUpgrade(skillId: SkillId) {
    const result = unlockOrUpgradePlayerSkill(skillId);
    if (!result.ok) {
      toast.error(getFailureMessage(result.reason));
      return;
    }

    toast.success(result.previousLevel === 0 ? "Skill débloqué" : "Skill amélioré");
  }

  function handleEquip(slot: SkillSlot) {
    const result = equipPlayerSkill(selectedSkillId, slot);
    if (!result.ok) {
      toast.error(getFailureMessage(result.reason));
      return;
    }

    toast.success(`Skill équipé en slot ${slot}`);
  }

  function handleUnequip(slot: SkillSlot) {
    const result = unequipPlayerSkill(slot);
    if (!result.ok) {
      toast.error(getFailureMessage(result.reason));
      return;
    }

    toast.success(`Slot ${slot} vidé`);
  }

  function handleRespec() {
    const result = respecPlayerSkills();
    toast.success(`Respec effectué, ${result.refundedSkillPoints} point(s) remboursé(s)`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-200/80">Character</p>
          <h1 className="font-ik-title text-3xl font-semibold text-amber-50">Skills</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-amber-200/25 bg-black/45 px-3 py-2 font-ik-menu text-sm text-amber-50">
            Points: {skills.skillPoints}
          </span>
          {process.env.NODE_ENV !== "production" ? (
            <button
              className="rounded-md border border-cyan-200/35 bg-cyan-500/12 px-3 py-2 font-ik-menu text-xs uppercase text-cyan-100 transition hover:border-cyan-100"
              onClick={() => addDevSkillPoint(1)}
              type="button"
            >
              +1 point de compétence
            </button>
          ) : null}
          <button
            className="rounded-md border border-red-200/30 bg-red-500/10 px-3 py-2 font-ik-menu text-xs uppercase text-red-100 transition hover:border-red-100"
            onClick={handleRespec}
            type="button"
          >
            Respec gratuit
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
        <GamePanel className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-ik-title text-xl text-amber-50">Skill Tree</h2>
            <span className="font-ik-body text-xs text-muted-foreground">Niveau max 5</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {SKILL_IDS.map((skillId) => {
              const baseDef = SKILL_DEFS[skillId];
              const effectiveDef = getEffectiveSkillDef(skillId, skills);
              const progress = getSkillProgress(skills, skillId);
              const level = progress?.level ?? 0;
              const nextCost = getNextLevelCost(skills, skillId);
              const isSelected = selectedSkillId === skillId;
              const isMax = level >= 5;
              const canAfford = nextCost !== null && skills.skillPoints >= nextCost;

              return (
                <div
                  className={[
                    "rounded-lg border bg-black/35 p-4 text-left transition",
                    isSelected
                      ? "border-amber-200/70 shadow-[0_0_28px_rgba(240,194,106,0.14)]"
                      : "border-amber-200/18 hover:border-amber-200/45",
                  ].join(" ")}
                  data-testid={`skill-card-${skillId}`}
                  key={skillId}
                  onClick={() => setSelectedSkillId(skillId)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-ik-title text-lg text-amber-50">{baseDef.name}</p>
                      <p className="mt-1 font-ik-menu text-[0.62rem] uppercase tracking-[0.16em] text-cyan-100/75">
                        {getKindLabel(baseDef.kind)}
                      </p>
                    </div>
                    <span className="rounded-sm border border-amber-200/20 bg-amber-200/10 px-2 py-1 font-ik-menu text-[0.65rem] text-amber-50">
                      {level}/5
                    </span>
                  </div>
                  <p className="mt-3 min-h-10 font-ik-body text-sm text-muted-foreground">{baseDef.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 font-ik-body text-xs text-amber-50/85">
                    {getPrimaryStats(effectiveDef)
                      .slice(0, 4)
                      .map(([label, value]) => (
                        <span className="rounded border border-amber-200/14 bg-black/35 px-2 py-1" key={label}>
                          {label}: {value}
                        </span>
                      ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="font-ik-menu text-xs uppercase text-amber-100/75">{getStatusLabel(level)}</span>
                    <span className="font-ik-body text-xs text-muted-foreground">
                      {nextCost === null ? "Coût: -" : `Coût: ${nextCost}`}
                    </span>
                  </div>
                  <button
                    className="mt-3 w-full rounded-md border border-amber-200/30 bg-amber-500/14 px-3 py-2 font-ik-menu text-xs uppercase text-amber-50 transition hover:border-amber-100 disabled:cursor-not-allowed disabled:opacity-45"
                    data-testid={`skill-upgrade-${skillId}`}
                    disabled={isMax || !canAfford}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleUpgrade(skillId);
                    }}
                    type="button"
                  >
                    {level <= 0 ? "Débloquer" : "Améliorer"}
                  </button>
                </div>
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
            <span className="rounded-md border border-amber-200/25 bg-black/45 px-3 py-2 font-ik-menu text-sm text-amber-50">
              {selectedLevel}/5
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
          <div className="mt-5">
            <h3 className="font-ik-title text-lg text-amber-50">Upgrades</h3>
            <div className="mt-3 grid gap-2">
              {SKILL_UPGRADE_DEFS[selectedSkillId].map((upgrade) => (
                <div
                  className={[
                    "rounded-md border px-3 py-2",
                    selectedLevel >= upgrade.level
                      ? "border-emerald-200/25 bg-emerald-500/8"
                      : "border-amber-200/14 bg-black/30",
                  ].join(" ")}
                  key={upgrade.level}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-ik-menu text-xs uppercase text-amber-50">Niveau {upgrade.level}</span>
                    <span className="font-ik-body text-xs text-muted-foreground">
                      {selectedLevel >= upgrade.level ? "Actif" : "À venir"}
                    </span>
                  </div>
                  <p className="mt-1 font-ik-body text-sm text-muted-foreground">
                    {upgrade.effects.map(formatEffect).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </GamePanel>
      </div>

      <GamePanel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-ik-title text-xl text-amber-50">Loadout</h2>
            <p className="font-ik-body text-sm text-muted-foreground">
              Skill sélectionné: {selectedDef.name} {selectedUnlocked ? "" : "(verrouillé)"}
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
                    className="rounded-md border border-cyan-200/30 bg-cyan-500/10 px-3 py-2 font-ik-menu text-xs uppercase text-cyan-50 transition hover:border-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
                    data-testid={`skill-equip-slot-${slot}`}
                    disabled={!selectedUnlocked || selectedEquippedSlot === slot}
                    onClick={() => handleEquip(slot)}
                    type="button"
                  >
                    Équiper sélection
                  </button>
                  <button
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
    </div>
  );
}
