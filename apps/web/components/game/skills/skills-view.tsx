"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { GamePanel } from "@/components/ui/game-panel";
import { describeSkillEffect } from "@/lib/skill-effect-summary";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import {
  calculateFinalCharacterStats,
  equipRingItem,
  getEquippedRingItems,
  isEquipmentItem,
  MAX_EQUIPPED_RINGS,
  normalizeEquipmentItem,
  unequipRingItem,
  type EquipmentItem,
} from "@idleking/game-core";
import {
  isSkillBearingRing,
  type RingEquipmentInstance,
  type SkillBearingRingEquipmentInstance,
} from "@idleking/game-core/equipment";

/**
 * game-core's public ring helpers intentionally type ring data narrowly
 * (RingEquipmentInstance has no id/name — only combat-relevant fields), but
 * the underlying objects are always full EquipmentItem instances. Recombine
 * the two here purely for display purposes.
 */
type EquippedRingItem = EquipmentItem & RingEquipmentInstance;
/** An inventory ring item, narrowed to carry a real (non-null) SkillId. */
type InventorySkillRing = EquipmentItem & SkillBearingRingEquipmentInstance;
import {
  getSkillDefinition,
  getStorySkillRuntimeProfile,
  SKILL_IDS,
  type SkillCategory,
  type SkillDefinition,
  type SkillId,
} from "@idleking/game-core/skills";

const RING_SLOT_INDEXES: readonly number[] = Array.from({ length: MAX_EQUIPPED_RINGS }, (_, index) => index);

type SkillOwnership = "equipped" | "owned" | "unowned";

function formatSecondsFromMs(ms: number | undefined): string | null {
  if (ms === undefined) return null;
  return `${Number((ms / 1000).toFixed(1))}s`;
}

function getCategoryLabel(category: SkillCategory): string {
  switch (category) {
    case "attack":
      return "Attaque";
    case "movement":
      return "Déplacement";
    case "defense":
      return "Défense";
    case "utility":
      return "Utilitaire";
    case "summon":
      return "Invocation";
  }
}

function getOwnershipLabel(ownership: SkillOwnership): string {
  switch (ownership) {
    case "equipped":
      return "Équipé";
    case "owned":
      return "Possédé";
    case "unowned":
      return "Non obtenu";
  }
}

function getRarityLabel(rarity: string): string {
  return rarity.charAt(0) + rarity.slice(1).toLowerCase();
}

/** Real stat rows for the selected skill's shape, sourced from the same profile combat reads. */
function getProfileStats(skillDef: SkillDefinition): Array<[string, string]> {
  const profile = getStorySkillRuntimeProfile(skillDef.id);
  const rows: Array<[string, string | null]> = [
    ["Mana", `${skillDef.manaCost}`],
    ["Cooldown", `${skillDef.cooldownSeconds}s`],
    ["Puissance", `x${skillDef.basePower.toFixed(2)}`],
  ];

  if (profile.attack) {
    rows.push(["Portée", `${profile.attack.range}`]);
    if (profile.attack.radius !== undefined) rows.push(["Rayon", `${profile.attack.radius}`]);
    if (profile.attack.width !== undefined) rows.push(["Largeur", `${profile.attack.width}`]);
    if (profile.attack.halfAngleRadians !== undefined) {
      rows.push(["Angle", `${Math.round(profile.attack.halfAngleRadians * 2 * (180 / Math.PI))}°`]);
    }
    if (profile.attack.maxTargets !== undefined) rows.push(["Cibles max", `${profile.attack.maxTargets}`]);
  }
  if (profile.movement) {
    rows.push(["Distance", `${profile.movement.distance}`]);
    rows.push(["Durée", formatSecondsFromMs(profile.movement.durationMs)]);
  }
  if (profile.defense) {
    rows.push(["Réduction", `${Math.round((1 - profile.defense.incomingDamageMultiplier) * 100)}%`]);
    rows.push(["Durée", formatSecondsFromMs(profile.defense.durationMs)]);
  }
  if (profile.utility) {
    rows.push(["Durée", formatSecondsFromMs(profile.utility.durationMs)]);
    if (profile.utility.damageMultiplier !== undefined) {
      rows.push(["Bonus dégâts", `+${Math.round((profile.utility.damageMultiplier - 1) * 100)}%`]);
    }
    if (profile.utility.manaRegenPerSecond !== undefined) {
      rows.push(["Mana/s", `+${profile.utility.manaRegenPerSecond}`]);
    }
    if (profile.utility.incomingDamageMultiplier !== undefined) {
      rows.push(["Dégâts subis (cible)", `+${Math.round((profile.utility.incomingDamageMultiplier - 1) * 100)}%`]);
    }
  }
  if (profile.summon) {
    rows.push(["Durée", formatSecondsFromMs(profile.summon.durationMs)]);
  }

  return rows.filter((entry): entry is [string, string] => entry[1] !== null);
}

function getInventorySkillRings(items: readonly unknown[]): InventorySkillRing[] {
  return items.flatMap((item): InventorySkillRing[] => {
    if (!isEquipmentItem(item)) return [];
    const normalized = normalizeEquipmentItem(item);
    if (!normalized || !isSkillBearingRing(normalized)) return [];
    return [normalized as InventorySkillRing];
  });
}

export function SkillsView() {
  const gameState = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const attack = useMemo(() => calculateFinalCharacterStats(gameState).attack, [gameState]);

  const equippedRings = useMemo(
    () => getEquippedRingItems(gameState) as Array<EquippedRingItem | null>,
    [gameState]
  );
  const inventoryRings = useMemo(
    () => getInventorySkillRings(gameState.inventory.items),
    [gameState.inventory.items]
  );
  const equippedSkillIds = useMemo(
    () => new Set(equippedRings.flatMap((ring) => (ring?.skillId ? [ring.skillId] : []))),
    [equippedRings]
  );
  const ownedSkillIds = useMemo(
    () => new Set(inventoryRings.map((ring) => ring.skillId)),
    [inventoryRings]
  );
  const equippedItemIds = useMemo(
    () => new Set(equippedRings.flatMap((ring) => (ring ? [ring.id] : []))),
    [equippedRings]
  );
  const unequippedInventoryRings = useMemo(
    () => inventoryRings.filter((ring) => !equippedItemIds.has(ring.id)),
    [inventoryRings, equippedItemIds]
  );

  const defaultSkillId = equippedRings[0]?.skillId ?? SKILL_IDS[0];
  const [selectedSkillId, setSelectedSkillId] = useState<SkillId>(defaultSkillId);
  const [pickerBySlot, setPickerBySlot] = useState<Record<number, string>>({});

  const selectedDef = getSkillDefinition(selectedSkillId);
  if (!selectedDef) throw new Error(`Unknown MVP skill: ${selectedSkillId}`);
  const selectedOwnership: SkillOwnership = equippedSkillIds.has(selectedSkillId)
    ? "equipped"
    : ownedSkillIds.has(selectedSkillId)
      ? "owned"
      : "unowned";
  const detailStats = useMemo(() => getProfileStats(selectedDef), [selectedDef]);
  const detailEffect = useMemo(() => describeSkillEffect(selectedDef, attack), [selectedDef, attack]);

  function handleEquip(slotIndex: number) {
    const itemId = pickerBySlot[slotIndex];
    if (!itemId) return;

    const result = equipRingItem(gameState, itemId, slotIndex);
    if (!result.ok) {
      toast.error(getEquipFailureMessage(result.reason), { id: `ring-equip-${slotIndex}` });
      return;
    }

    dispatch(() => result.state);
    setPickerBySlot((current) => ({ ...current, [slotIndex]: "" }));
    toast.success(`${result.item.name} équipé en slot ${slotIndex + 1}`, { id: `ring-equip-${slotIndex}` });
  }

  function handleUnequip(slotIndex: number) {
    const result = unequipRingItem(gameState, slotIndex);
    dispatch(() => result.state);
    toast.success(`Slot ${slotIndex + 1} vidé`, { id: `ring-unequip-${slotIndex}` });
  }

  return (
    <section aria-labelledby="skills-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-ik-menu text-xs uppercase tracking-[0.18em] text-amber-200/80">Character</p>
          <h1 id="skills-title" className="font-ik-title text-3xl font-semibold text-amber-50">Skills</h1>
        </div>
        <span className="rounded-md border border-amber-200/25 bg-black/45 px-3 py-2 font-ik-menu text-sm text-amber-50">
          Anneaux équipés {equippedSkillIds.size}/{MAX_EQUIPPED_RINGS}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
        <GamePanel className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-ik-title text-xl text-amber-50">Skill Codex</h2>
            <span className="font-ik-body text-xs text-muted-foreground">SK-001..016 (anneaux)</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {SKILL_IDS.map((skillId) => {
              const baseDef = getSkillDefinition(skillId);
              if (!baseDef) return null;
              const ownership: SkillOwnership = equippedSkillIds.has(skillId)
                ? "equipped"
                : ownedSkillIds.has(skillId)
                  ? "owned"
                  : "unowned";
              const isSelected = selectedSkillId === skillId;

              return (
                <button
                  aria-label={`${baseDef.name} - ${getOwnershipLabel(ownership)}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "rounded-lg border bg-black/35 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/45",
                    isSelected
                      ? "border-amber-200/70 shadow-[0_0_28px_rgba(242,242,242,0.14)]"
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
                        {getCategoryLabel(baseDef.category)} · {baseDef.element}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-sm border px-2 py-1 font-ik-menu text-[0.65rem]",
                        ownership === "equipped" && "border-emerald-300/30 text-emerald-100",
                        ownership === "owned" && "border-cyan-300/30 text-cyan-100",
                        ownership === "unowned" && "border-zinc-400/25 text-zinc-400"
                      )}
                    >
                      {getOwnershipLabel(ownership)}
                    </span>
                  </div>
                  <p className="mt-3 min-h-10 font-ik-body text-sm text-muted-foreground">{baseDef.description}</p>
                  <p className="mt-3 font-ik-body text-xs text-amber-50/85">{describeSkillEffect(baseDef, attack)}</p>
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
                {getCategoryLabel(selectedDef.category)} · {selectedDef.element}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-md border bg-black/45 px-3 py-2 font-ik-menu text-sm",
                selectedOwnership === "equipped" && "border-emerald-300/30 text-emerald-100",
                selectedOwnership === "owned" && "border-cyan-300/30 text-cyan-100",
                selectedOwnership === "unowned" && "border-zinc-400/25 text-zinc-400"
              )}
            >
              {getOwnershipLabel(selectedOwnership)}
            </span>
          </div>
          <p className="mt-4 font-ik-body text-sm leading-6 text-muted-foreground">{selectedDef.description}</p>
          <p className="mt-2 font-ik-body text-sm text-amber-50">{detailEffect}</p>
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
              Anneaux à skill équipés — ce sont exactement les skills castables dans la barre de combat.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {RING_SLOT_INDEXES.map((slotIndex) => {
            const ring = equippedRings[slotIndex];
            const ringDef = ring?.skillId ? getSkillDefinition(ring.skillId) : null;
            const pickerValue = pickerBySlot[slotIndex] ?? "";

            return (
              <div className="rounded-lg border border-amber-200/18 bg-black/35 p-3" key={slotIndex}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-ik-menu text-xs uppercase text-amber-100">Slot {slotIndex + 1}</span>
                  {ring ? (
                    <span className="rounded border border-amber-200/20 px-2 py-1 font-ik-menu text-[0.6rem] text-amber-50">
                      {getRarityLabel(ring.rarity)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 min-h-10 font-ik-body text-sm text-amber-50">
                  {ring ? `${ring.name} — ${ringDef?.name ?? ring.skillId}` : "Vide"}
                </p>
                <div className="mt-3 grid gap-2">
                  {ring ? (
                    <button
                      aria-label={`Unequip ring from slot ${slotIndex + 1}`}
                      className="rounded-md border border-amber-200/20 bg-black/25 px-3 py-2 font-ik-menu text-xs uppercase text-amber-50 transition hover:border-amber-100"
                      onClick={() => handleUnequip(slotIndex)}
                      type="button"
                    >
                      Déséquiper
                    </button>
                  ) : (
                    <>
                      <select
                        aria-label={`Choisir un anneau pour le slot ${slotIndex + 1}`}
                        className="rounded-md border border-amber-200/20 bg-black/45 px-2 py-2 font-ik-body text-xs text-amber-50"
                        onChange={(event) =>
                          setPickerBySlot((current) => ({ ...current, [slotIndex]: event.target.value }))
                        }
                        value={pickerValue}
                      >
                        <option value="">
                          {unequippedInventoryRings.length === 0 ? "Aucun anneau disponible" : "Choisir un anneau…"}
                        </option>
                        {unequippedInventoryRings.map((availableRing) => (
                          <option key={availableRing.id} value={availableRing.id}>
                            {availableRing.name} — {getSkillDefinition(availableRing.skillId)?.name ?? availableRing.skillId}
                          </option>
                        ))}
                      </select>
                      <button
                        aria-label={`Equip ring in slot ${slotIndex + 1}`}
                        className="rounded-md border border-cyan-200/30 bg-cyan-500/10 px-3 py-2 font-ik-menu text-xs uppercase text-cyan-50 transition hover:border-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
                        disabled={!pickerValue}
                        onClick={() => handleEquip(slotIndex)}
                        type="button"
                      >
                        Équiper
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </GamePanel>
    </section>
  );
}

function getEquipFailureMessage(reason: string): string {
  switch (reason) {
    case "RING_SKILL_ALREADY_EQUIPPED":
      return "Ce skill est déjà équipé par un autre anneau.";
    case "RING_SLOTS_FULL":
      return "Tous les slots d'anneaux sont occupés.";
    case "INVALID_RING_SLOT":
      return "Slot invalide.";
    case "INVALID_RING":
      return "Cet objet n'est pas un anneau à skill valide.";
    case "ITEM_NOT_FOUND":
      return "Anneau introuvable dans l'inventaire.";
    default:
      return "Action impossible.";
  }
}
