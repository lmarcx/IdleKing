"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";

import {
  getEquipmentRarityClass,
  getEquipmentRarityLabel,
  getEquipmentRarityTextClass,
  type CharacterEquipment,
  type CharacterEquipmentRarity,
} from "./types";
import { getEquipmentSetDefinition, getSkillDefinition, getUpgradeCapForRarity } from "@idleking/game-core";
import type { ItemRarity } from "@idleking/game-core/items";

const CHARACTER_TO_CORE_RARITY: Record<CharacterEquipmentRarity, ItemRarity> = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY",
};

const TOOLTIP_GAP = 10;
const VIEWPORT_MARGIN = 10;

type TooltipPosition = {
  left: number;
  top: number;
  visibility: "hidden" | "visible";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPosition(anchorRect: DOMRect, tooltipWidth: number, tooltipHeight: number) {
  const maxLeft = window.innerWidth - tooltipWidth - VIEWPORT_MARGIN;
  const maxTop = window.innerHeight - tooltipHeight - VIEWPORT_MARGIN;
  const centeredLeft = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2;

  let top = anchorRect.top - tooltipHeight - TOOLTIP_GAP;

  if (top < VIEWPORT_MARGIN) {
    top = anchorRect.bottom + TOOLTIP_GAP;
  }

  if (top + tooltipHeight > window.innerHeight - VIEWPORT_MARGIN) {
    top = maxTop;
  }

  return {
    left: clamp(centeredLeft, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, maxLeft)),
    top: clamp(top, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, maxTop)),
  };
}

export function EquipmentTooltip({
  actionLabel,
  anchorRect,
  equipment,
  onAction,
  onDelete,
  onMouseEnter,
  onMouseLeave,
  slotLabel,
}: {
  actionLabel?: string;
  anchorRect: DOMRect | null;
  equipment?: CharacterEquipment;
  onAction?: (equipment: CharacterEquipment) => void;
  onDelete?: (equipment: CharacterEquipment) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  slotLabel?: string;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<TooltipPosition>({ left: 0, top: 0, visibility: "hidden" });

  useLayoutEffect(() => {
    if (!anchorRect || !tooltipRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    setPosition({
      ...getPosition(anchorRect, tooltipRect.width, tooltipRect.height),
      visibility: "visible",
    });
  }, [anchorRect, equipment?.id, slotLabel]);

  if (!anchorRect || typeof document === "undefined") return null;

  const setDefinition = equipment?.setId ? getEquipmentSetDefinition(equipment.setId) : undefined;
  const skillDefinition = equipment?.skillId ? getSkillDefinition(equipment.skillId) : undefined;
  const isArtifact = equipment?.slot === "artifact";
  const upgradeCap = equipment ? getUpgradeCapForRarity(CHARACTER_TO_CORE_RARITY[equipment.rarity]) : 0;

  return createPortal(
    <div
      className={`fixed z-[1000] w-72 rounded-md border bg-[#0a0a0a]/95 p-3 text-left shadow-[0_0_22px_rgba(242,242,242,0.14)] backdrop-blur-sm ${equipment ? getEquipmentRarityClass(equipment.rarity) : "border-border/60"}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={tooltipRef}
      style={position}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-ik-title text-sm font-semibold text-foreground">{equipment?.name ?? slotLabel}</div>
        {equipment ? (
          <span className={`font-ik-menu text-[10px] uppercase tracking-wide ${getEquipmentRarityTextClass(equipment.rarity)}`}>
            {getEquipmentRarityLabel(equipment.rarity)}
          </span>
        ) : null}
      </div>
      <div className="mt-1 flex flex-wrap gap-2 font-ik-body text-xs text-muted-foreground">
        {equipment ? (
          <>
            <span className="capitalize">{equipment.slot}</span>
            <span className="tabular-nums">ilvl {equipment.itemLevel}</span>
            <span className="tabular-nums">
              +{equipment.upgradeLevel ?? 0}/{upgradeCap}
            </span>
          </>
        ) : (
          <span>Aucun equipement</span>
        )}
      </div>

      {equipment ? (
        <>
          <p className="mt-3 font-ik-body text-xs leading-relaxed text-muted-foreground">{equipment.description}</p>

          {isArtifact ? (
            <p className="mt-2 font-ik-menu text-[10px] uppercase tracking-wide text-neutral-500">
              Slot inerte (MVP) — aucun affixe, aucune stat, aucune amelioration.
            </p>
          ) : null}

          {setDefinition ? (
            <p className="mt-2 font-ik-body text-xs">
              <span className="text-muted-foreground">Set&nbsp;</span>
              <span className="text-foreground">{setDefinition.name}</span>
            </p>
          ) : null}

          {skillDefinition ? (
            <p className="mt-2 font-ik-body text-xs">
              <span className="text-muted-foreground">Skill&nbsp;</span>
              <span className="text-foreground">{skillDefinition.name}</span>
            </p>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border/50 pt-2 font-ik-body text-xs">
            {Object.entries(equipment.stats).map(([label, value]) => (
              <div className="contents" key={label}>
                <span className="text-muted-foreground">{label.toUpperCase()}</span>
                <span className="text-right tabular-nums">{value}</span>
              </div>
            ))}
          </div>

          {equipment.affixes && equipment.affixes.length > 0 ? (
            <div className="mt-2 grid gap-1 border-t border-border/50 pt-2 font-ik-body text-xs">
              {equipment.affixes.map((affix) => (
                <div className="flex items-center justify-between gap-2" key={affix.affixId}>
                  <span className="capitalize text-muted-foreground">{affix.affixId.replaceAll("_", " ")}</span>
                  <span className="tabular-nums text-foreground">
                    +{affix.value} {affix.stat}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex gap-2">
            {onAction && actionLabel ? (
              <button
                className="flex-1 rounded-md border border-amber-300/35 bg-amber-300/10 px-3 py-2 font-ik-menu text-xs text-amber-100 transition-colors hover:border-amber-300/60 hover:bg-amber-300/16 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300/50"
                onClick={() => onAction(equipment)}
                onMouseDown={(event) => event.preventDefault()}
                type="button"
              >
                {actionLabel}
              </button>
            ) : null}
            {onDelete ? (
              <button
                aria-label={`Supprimer ${equipment.name}`}
                className="grid place-items-center rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive transition-colors hover:border-destructive/70 hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive/60"
                onClick={() => onDelete(equipment)}
                onMouseDown={(event) => event.preventDefault()}
                type="button"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>,
    document.body
  );
}
