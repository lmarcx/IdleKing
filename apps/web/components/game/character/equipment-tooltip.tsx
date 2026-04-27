"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  getEquipmentRarityLabel,
  type CharacterEquipment,
} from "./types";

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
  onMouseEnter,
  onMouseLeave,
  slotLabel,
}: {
  actionLabel?: string;
  anchorRect: DOMRect | null;
  equipment?: CharacterEquipment;
  onAction?: (equipment: CharacterEquipment) => void;
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

  return createPortal(
    <div
      className="fixed z-[1000] w-64 rounded-md border border-amber-300/30 bg-[#090d10]/95 p-3 text-left shadow-[0_0_22px_rgba(56,189,248,0.14)] backdrop-blur-sm"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={tooltipRef}
      style={position}
    >
      <div className="font-ik-title text-sm font-semibold text-foreground">{equipment?.name ?? slotLabel}</div>
      <div className="mt-1 flex flex-wrap gap-2 font-ik-body text-xs text-muted-foreground">
        {equipment ? (
          <>
            <span className="capitalize">{getEquipmentRarityLabel(equipment.rarity)}</span>
            <span>{equipment.slot}</span>
            <span className="tabular-nums">ilvl {equipment.itemLevel}</span>
            <span className="tabular-nums">V {equipment.value}</span>
          </>
        ) : (
          <span>Aucun equipement</span>
        )}
      </div>

      {equipment ? (
        <>
          <p className="mt-3 font-ik-body text-xs leading-relaxed text-muted-foreground">{equipment.description}</p>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border/50 pt-2 font-ik-body text-xs">
            {Object.entries(equipment.stats).map(([label, value]) => (
              <div className="contents" key={label}>
                <span className="text-muted-foreground">{label.toUpperCase()}</span>
                <span className="text-right tabular-nums">{value}</span>
              </div>
            ))}
          </div>
          {onAction && actionLabel ? (
            <button
              className="mt-3 w-full rounded-md border border-amber-300/35 bg-amber-300/10 px-3 py-2 font-ik-menu text-xs text-amber-100 transition-colors hover:border-amber-300/60 hover:bg-amber-300/16 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300/50"
              onClick={() => onAction(equipment)}
              onMouseDown={(event) => event.preventDefault()}
              type="button"
            >
              {actionLabel}
            </button>
          ) : null}
        </>
      ) : null}
    </div>,
    document.body
  );
}
