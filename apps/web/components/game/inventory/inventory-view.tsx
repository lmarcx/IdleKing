"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EQUIPMENT_DRAG_MIME, type EquipmentDragPayload, type EquipmentSlotId } from "@/components/game/character/types";
import { ItemDeleteConfirmDialog } from "@/components/game/item-delete-dialog";
import { getResourceAssetPath, RESOURCE_FALLBACK_ASSET } from "@/lib/resource-assets";
import { getRarityBorderClass, getRarityLabel, getRarityTextClass } from "@/lib/rarity";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { getEquipmentSetDefinition, getSkillDefinition, getUpgradeCapForRarity, type ItemRarity } from "@idleking/game-core";
import {
  filterAndSortInventoryItems,
  getInventoryDisplayItems,
  type InventoryCategory,
  type InventoryDisplayItem,
  type InventorySort,
} from "@idleking/game-core/items";

const CATEGORY_OPTIONS: Array<{ label: string; value: InventoryCategory | "all" }> = [
  { label: "Toutes", value: "all" },
  { label: "Equipment", value: "equipment" },
  { label: "Resources", value: "resources" },
  { label: "Consumables", value: "consumables" },
  { label: "Unique", value: "unique" },
  { label: "Materials", value: "materials" },
];

const SORT_OPTIONS: Array<{ label: string; value: InventorySort }> = [
  { label: "Quantite croissante", value: "quantity-asc" },
  { label: "Quantite decroissante", value: "quantity-desc" },
  { label: "Valeur croissante", value: "value-asc" },
  { label: "Valeur decroissante", value: "value-desc" },
  { label: "A-Z", value: "name-asc" },
  { label: "Z-A", value: "name-desc" },
];

const TOOLTIP_GAP = 8;
const TOOLTIP_VIEWPORT_MARGIN = 10;

type TooltipPosition = {
  left: number;
  top: number;
  visibility: "hidden" | "visible";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTooltipPosition(anchorRect: DOMRect, tooltipWidth: number, tooltipHeight: number) {
  const maxLeft = window.innerWidth - tooltipWidth - TOOLTIP_VIEWPORT_MARGIN;
  const maxTop = window.innerHeight - tooltipHeight - TOOLTIP_VIEWPORT_MARGIN;
  const centeredLeft = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2;

  let top = anchorRect.top - tooltipHeight - TOOLTIP_GAP;

  if (top < TOOLTIP_VIEWPORT_MARGIN) {
    top = anchorRect.bottom + TOOLTIP_GAP;
  }

  if (top + tooltipHeight > window.innerHeight - TOOLTIP_VIEWPORT_MARGIN) {
    top = maxTop;
  }

  return {
    left: clamp(centeredLeft, TOOLTIP_VIEWPORT_MARGIN, Math.max(TOOLTIP_VIEWPORT_MARGIN, maxLeft)),
    top: clamp(top, TOOLTIP_VIEWPORT_MARGIN, Math.max(TOOLTIP_VIEWPORT_MARGIN, maxTop)),
  };
}

function getItemIcon(item: InventoryDisplayItem) {
  if (item.category === "equipment" || item.category === "unique") return null;
  return getResourceAssetPath(item.id);
}

function toCharacterEquipmentSlotId(slot: string): EquipmentSlotId {
  if (slot === "main_hand") return "weapon";
  if (slot === "off_hand") return "offhand";
  return slot as EquipmentSlotId;
}

function InventoryToolbar({
  category,
  search,
  sort,
  onCategoryChange,
  onSearchChange,
  onSortChange,
}: {
  category: InventoryCategory | "all";
  search: string;
  sort: InventorySort;
  onCategoryChange: (category: InventoryCategory | "all") => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: InventorySort) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px]">
      <label className="grid gap-1.5">
        <span className="font-ik-menu text-xs uppercase tracking-wide text-muted-foreground">Recherche</span>
        <input
          className="h-10 rounded-md border border-border/70 bg-background/60 px-3 font-ik-body text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Nom d'item ou ressource"
          type="search"
          value={search}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="font-ik-menu text-xs uppercase tracking-wide text-muted-foreground">Categorie</span>
        <select
          className="h-10 rounded-md border border-border/70 bg-background/60 px-3 font-ik-body text-sm outline-none transition-colors focus:border-primary/50"
          onChange={(event) => onCategoryChange(event.target.value as InventoryCategory | "all")}
          value={category}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5">
        <span className="font-ik-menu text-xs uppercase tracking-wide text-muted-foreground">Tri</span>
        <select
          className="h-10 rounded-md border border-border/70 bg-background/60 px-3 font-ik-body text-sm outline-none transition-colors focus:border-primary/50"
          onChange={(event) => onSortChange(event.target.value as InventorySort)}
          value={sort}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function InventoryItemTooltip({
  anchorRect,
  canDelete,
  item,
  onDelete,
  onMouseEnter,
  onMouseLeave,
}: {
  anchorRect: DOMRect | null;
  canDelete: boolean;
  item: InventoryDisplayItem;
  onDelete: (item: InventoryDisplayItem) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<TooltipPosition>({ left: 0, top: 0, visibility: "hidden" });

  useLayoutEffect(() => {
    if (!anchorRect || !tooltipRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    setPosition({
      ...getTooltipPosition(anchorRect, tooltipRect.width, tooltipRect.height),
      visibility: "visible",
    });
  }, [anchorRect, item.id]);

  if (!anchorRect || typeof document === "undefined") return null;

  const isEquipment = item.category === "equipment";
  const setDefinition = item.setId ? getEquipmentSetDefinition(item.setId) : undefined;
  const skillDefinition = item.skillId ? getSkillDefinition(item.skillId) : undefined;
  const isArtifact = item.slot === "artifact";
  const upgradeCap = isEquipment && item.rarity ? getUpgradeCapForRarity(item.rarity as ItemRarity) : undefined;

  return createPortal(
    <div
      ref={tooltipRef}
      className={cn(
        "fixed z-[1000] w-56 rounded-md border bg-[#0a0a0a]/95 p-3 text-left shadow-[0_0_18px_rgba(242,242,242,0.12)] backdrop-blur-sm",
        isEquipment ? getRarityBorderClass(item.rarity) : "border-amber-300/30",
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={position}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-ik-title text-sm font-semibold text-foreground">{item.name}</div>
        {isEquipment && item.rarity ? (
          <span className={cn("font-ik-menu text-[10px] uppercase tracking-wide", getRarityTextClass(item.rarity))}>
            {getRarityLabel(item.rarity)}
          </span>
        ) : null}
      </div>
      <div className="font-ik-body mt-1 text-xs capitalize text-muted-foreground">{item.category}</div>
      {item.slot ? (
        <div className="mt-2 font-ik-body text-xs capitalize text-muted-foreground">{item.slot}</div>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-ik-body text-xs">
        <span className="text-muted-foreground">Quantite</span>
        <span className="text-right tabular-nums">x{item.quantity}</span>
        <span className="text-muted-foreground">Valeur</span>
        <span className="text-right tabular-nums">{item.value}</span>
        {upgradeCap !== undefined ? (
          <>
            <span className="text-muted-foreground">Upgrade</span>
            <span className="text-right tabular-nums">
              +{item.upgradeLevel ?? 0}/{upgradeCap}
            </span>
          </>
        ) : null}
      </div>

      {isArtifact ? (
        <p className="mt-2 font-ik-menu text-[10px] uppercase tracking-wide text-neutral-500">
          Slot inerte (MVP) — aucun affixe, aucune stat.
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

      {item.stats && (
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border/50 pt-2 font-ik-body text-xs">
          {Object.entries(item.stats)
            .filter(([, value]) => typeof value === "number" && value > 0)
            .map(([stat, value]) => (
              <div key={stat} className="contents">
                <span className="text-muted-foreground uppercase">{stat}</span>
                <span className="text-right tabular-nums">+{value}</span>
              </div>
            ))}
        </div>
      )}

      {item.affixes && item.affixes.length > 0 ? (
        <div className="mt-2 grid gap-1 border-t border-border/50 pt-2 font-ik-body text-xs">
          {item.affixes.map((affix) => (
            <div className="flex items-center justify-between gap-2" key={affix.affixId}>
              <span className="capitalize text-muted-foreground">{affix.affixId.replaceAll("_", " ")}</span>
              <span className="tabular-nums text-foreground">
                +{affix.value} {affix.stat}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {canDelete ? (
        <button
          aria-label={`Supprimer ${item.name}`}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 font-ik-menu text-xs text-destructive transition-colors hover:border-destructive/70 hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive/60"
          onClick={() => onDelete(item)}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
          Supprimer
        </button>
      ) : null}

      <div className="mt-2 truncate border-t border-border/50 pt-2 font-ik-menu text-[10px] uppercase tracking-wide text-muted-foreground/75">
        {item.id}
      </div>
    </div>,
    document.body
  );
}

function InventorySlot({
  canDelete,
  item,
  onDelete,
}: {
  canDelete: boolean;
  item: InventoryDisplayItem;
  onDelete: (item: InventoryDisplayItem) => void;
}) {
  const slotRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const icon = getItemIcon(item);
  const initials = item.name.slice(0, 2).toUpperCase();
  const isEquipment = item.category === "equipment";

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

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  return (
    <button
      ref={slotRef}
      aria-label={`${item.name}, ${item.category}, quantite ${item.quantity}`}
      className={cn(
        "relative aspect-square min-h-14 appearance-none rounded-lg border border-border/70 bg-muted/25 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:border-amber-300/45 hover:bg-muted/35 hover:shadow-[0_0_16px_rgba(242,242,242,0.12),inset_0_1px_0_rgba(255,255,255,0.05)] focus-visible:border-amber-300/55 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300/35",
        isEquipment && getRarityBorderClass(item.rarity),
      )}
      draggable={isEquipment}
      onBlur={closeTooltip}
      onDragStart={
        isEquipment && item.slot
          ? (event) => {
              const payload: EquipmentDragPayload = { id: item.id, slot: toCharacterEquipmentSlotId(item.slot!) };
              event.dataTransfer.setData(EQUIPMENT_DRAG_MIME, JSON.stringify(payload));
              event.dataTransfer.effectAllowed = "move";
              closeTooltip();
            }
          : undefined
      }
      onFocus={updateAnchorRect}
      onMouseEnter={() => {
        clearCloseTimer();
        updateAnchorRect();
      }}
      onMouseLeave={closeTooltip}
      type="button"
    >
      <div className="absolute inset-2 grid place-items-center rounded-md border border-border/35 bg-black/20">
        {icon ? (
          <img
            alt={`Icone ${item.name}`}
            className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.08)] sm:h-9 sm:w-9"
            onError={(event) => {
              event.currentTarget.src = RESOURCE_FALLBACK_ASSET;
            }}
            src={icon}
          />
        ) : (
          <span className="font-ik-menu text-sm text-muted-foreground">{initials}</span>
        )}
      </div>

      <span className="absolute bottom-1.5 right-1.5 rounded border border-amber-300/35 bg-black/75 px-1.5 py-0.5 font-ik-menu text-[10px] leading-none text-foreground shadow-[0_0_8px_rgba(0,0,0,0.55)]">
        x{item.quantity}
      </span>

      <InventoryItemTooltip
        anchorRect={anchorRect}
        canDelete={canDelete}
        item={item}
        onDelete={onDelete}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={closeTooltip}
      />
    </button>
  );
}

export function InventoryView() {
  const state = useGameStore((s) => s.state);
  const removePlayerItem = useGameStore((s) => s.removePlayerItem);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<InventoryCategory | "all">("all");
  const [sort, setSort] = useState<InventorySort>("quantity-desc");
  const [pendingDelete, setPendingDelete] = useState<InventoryDisplayItem | null>(null);

  const displayItems = useMemo(() => getInventoryDisplayItems(state), [state]);
  const filteredItems = useMemo(
    () => filterAndSortInventoryItems(displayItems, { category, search, sort }),
    [category, displayItems, search, sort]
  );
  const deletableItemIds = useMemo(
    () => new Set(state.inventory.items.map((item) => item.id)),
    [state.inventory.items],
  );

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    const result = removePlayerItem(pendingDelete.id);
    if (!result.ok) {
      toast.error(`Unable to delete item: ${result.reason}`);
    } else {
      toast.success(`${pendingDelete.name} deleted`);
    }
    setPendingDelete(null);
  }

  return (
    <div className="space-y-4">
      <h1 className="font-ik-title text-2xl font-semibold">Inventory</h1>

      <InventoryToolbar
        category={category}
        onCategoryChange={setCategory}
        onSearchChange={setSearch}
        onSortChange={setSort}
        search={search}
        sort={sort}
      />

      {filteredItems.length === 0 ? (
        <p className="font-ik-body rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
          Aucun objet trouve.
        </p>
      ) : (
        <div
          className={cn(
            "grid grid-cols-[repeat(auto-fill,minmax(3.75rem,1fr))] gap-2 overflow-visible",
            "sm:grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))]"
          )}
        >
          {filteredItems.map((item) => (
            <InventorySlot
              canDelete={deletableItemIds.has(item.id)}
              item={item}
              key={`${item.category}-${item.id}`}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <ItemDeleteConfirmDialog
        itemName={pendingDelete?.name ?? null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        open={pendingDelete !== null}
      />
    </div>
  );
}
