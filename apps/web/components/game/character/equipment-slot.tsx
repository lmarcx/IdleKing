"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { EquipmentTooltip } from "./equipment-tooltip";
import {
  getEquipmentRarityClass,
  getSlotIconPath,
  type CharacterEquipment,
  type EquipmentSlotDefinition,
  type EquipmentSlotId,
} from "./types";

export function EquipmentSlot({
  item,
  onUnequip,
  slot,
}: {
  item?: CharacterEquipment;
  onUnequip: (slot: EquipmentSlotId) => void;
  slot: EquipmentSlotDefinition;
}) {
  const slotRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const icon = item?.icon ?? getSlotIconPath(slot.id);

  const updateAnchorRect = useCallback(() => {
    if (!slotRef.current) return;
    setAnchorRect(slotRef.current.getBoundingClientRect());
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (!closeTimerRef.current) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const closeTooltip = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setAnchorRect(null);
    }, 120);
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!anchorRect) return;

    window.addEventListener("resize", updateAnchorRect);
    window.addEventListener("scroll", updateAnchorRect, true);

    return () => {
      window.removeEventListener("resize", updateAnchorRect);
      window.removeEventListener("scroll", updateAnchorRect, true);
    };
  }, [anchorRect, updateAnchorRect]);

  useEffect(
    () => () => {
      clearCloseTimer();
    },
    [clearCloseTimer]
  );

  return (
    <button
      ref={slotRef}
      aria-label={`${slot.label}: ${item ? item.name : "Aucun equipement"}`}
      className={cn(
        "group relative grid h-full w-full aspect-square place-items-center rounded-lg border border-border/70 bg-black/25 p-1.5",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors",
        "hover:border-amber-300/45 hover:bg-muted/30 focus-visible:border-amber-300/55 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300/35",
        getEquipmentRarityClass(item?.rarity)
      )}
      onBlur={closeTooltip}
      onFocus={updateAnchorRect}
      onMouseEnter={() => {
        clearCloseTimer();
        updateAnchorRect();
      }}
      onMouseLeave={closeTooltip}
      type="button"
    >
      <img
        alt=""
        aria-hidden="true"
        className={cn("h-6 w-6 object-contain opacity-70 sm:h-7 sm:w-7", item && "opacity-95")}
        src={icon}
      />

      {item ? (
        <span className="absolute bottom-1 right-1 rounded border border-amber-300/35 bg-black/75 px-1.5 py-0.5 font-ik-menu text-[10px] leading-none">
          {item.itemLevel}
        </span>
      ) : null}

      <EquipmentTooltip
        actionLabel={item ? "Desequiper" : undefined}
        anchorRect={anchorRect}
        equipment={item}
        onAction={() => {
          onUnequip(slot.id);
          setAnchorRect(null);
        }}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={closeTooltip}
        slotLabel={slot.label}
      />
    </button>
  );
}
