"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { GamePanel } from "@/components/ui/game-panel";
import { cn } from "@/lib/utils";

import { EquipmentTooltip } from "./equipment-tooltip";
import {
  getEquipmentRarityClass,
  getEquipmentRarityLabel,
  type CharacterEquipment,
} from "./types";

type ActiveEquipment = {
  anchorRect: DOMRect;
  item: CharacterEquipment;
};

function EquipmentGridItem({
  isEquipped,
  item,
  onClose,
  onKeepOpen,
  onOpen,
}: {
  isEquipped: boolean;
  item: CharacterEquipment;
  onClose: () => void;
  onKeepOpen: () => void;
  onOpen: (item: CharacterEquipment, anchorRect: DOMRect) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => {
    if (!buttonRef.current) return;
    onOpen(item, buttonRef.current.getBoundingClientRect());
  }, [item, onOpen]);

  return (
    <button
      aria-label={`${item.name}, ${getEquipmentRarityLabel(item.rarity)}, ${item.slot}`}
      className={cn(
        "relative grid aspect-square place-items-center rounded-lg border bg-black/25 p-2",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors",
        "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300/35",
        getEquipmentRarityClass(item.rarity)
      )}
      onBlur={onClose}
      onClick={open}
      onFocus={open}
      onMouseEnter={() => {
        onKeepOpen();
        open();
      }}
      onMouseLeave={onClose}
      ref={buttonRef}
      type="button"
    >
      <img alt="" aria-hidden="true" className="h-7 w-7 object-contain opacity-90" src={item.icon} />
      {isEquipped ? (
        <span className="absolute right-1 top-1 rounded border border-emerald-300/35 bg-black/75 px-1 font-ik-menu text-[7px] leading-4 text-emerald-100">
          Equipe
        </span>
      ) : null}
    </button>
  );
}

export function AvailableEquipmentPanel({
  equippedItemIds,
  items,
  onEquip,
  onUnequip,
}: {
  equippedItemIds: Set<string>;
  items: CharacterEquipment[];
  onEquip: (item: CharacterEquipment) => void;
  onUnequip: (item: CharacterEquipment) => void;
}) {
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeEquipment, setActiveEquipment] = useState<ActiveEquipment | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (!closeTimerRef.current) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const closeTooltip = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setActiveEquipment(null);
    }, 120);
  }, [clearCloseTimer]);

  const openTooltip = useCallback(
    (item: CharacterEquipment, anchorRect: DOMRect) => {
      clearCloseTimer();
      setActiveEquipment({ anchorRect, item });
    },
    [clearCloseTimer]
  );

  useEffect(
    () => () => {
      clearCloseTimer();
    },
    [clearCloseTimer]
  );

  return (
    <GamePanel variant="character" className="p-4">
      <h2 className="font-ik-title text-lg font-semibold tracking-wide">Available Equipment</h2>

      {items.length === 0 ? (
        <p className="mt-4 rounded-lg border border-border/60 bg-black/20 p-4 font-ik-body text-sm text-muted-foreground">
          Aucun equipement disponible.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-2">
          {items.map((item) => (
            <EquipmentGridItem
              isEquipped={equippedItemIds.has(item.id)}
              item={item}
              key={item.id}
              onClose={closeTooltip}
              onKeepOpen={clearCloseTimer}
              onOpen={openTooltip}
            />
          ))}
        </div>
      )}

      <EquipmentTooltip
        actionLabel={
          activeEquipment && equippedItemIds.has(activeEquipment.item.id) ? "Desequiper" : "Equiper"
        }
        anchorRect={activeEquipment?.anchorRect ?? null}
        equipment={activeEquipment?.item}
        onAction={(item) => {
          if (equippedItemIds.has(item.id)) {
            onUnequip(item);
          } else {
            onEquip(item);
          }
          setActiveEquipment(null);
        }}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={closeTooltip}
      />
    </GamePanel>
  );
}
