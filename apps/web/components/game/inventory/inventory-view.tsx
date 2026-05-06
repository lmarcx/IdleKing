"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { getResourceAssetPath, RESOURCE_FALLBACK_ASSET } from "@/lib/resource-assets";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
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

function InventoryItemTooltip({ anchorRect, item }: { anchorRect: DOMRect | null; item: InventoryDisplayItem }) {
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

  return createPortal(
    <div
      ref={tooltipRef}
      className="pointer-events-none fixed z-[1000] w-48 rounded-md border border-amber-300/30 bg-[#090d10]/95 p-3 text-left shadow-[0_0_18px_rgba(56,189,248,0.12)] backdrop-blur-sm"
      style={position}
    >
      <div className="font-ik-title text-sm font-semibold text-foreground">{item.name}</div>
      <div className="font-ik-body mt-1 text-xs capitalize text-muted-foreground">{item.category}</div>
      {(item.slot || item.rarity) && (
        <div className="mt-2 flex items-center justify-between gap-2 font-ik-body text-xs">
          {item.slot ? <span className="capitalize text-muted-foreground">{item.slot}</span> : <span />}
          {item.rarity ? <span className="font-ik-menu text-[10px] uppercase tracking-wide text-amber-200">{item.rarity}</span> : null}
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-ik-body text-xs">
        <span className="text-muted-foreground">Quantite</span>
        <span className="text-right tabular-nums">x{item.quantity}</span>
        <span className="text-muted-foreground">Valeur</span>
        <span className="text-right tabular-nums">{item.value}</span>
      </div>
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
      <div className="mt-2 truncate border-t border-border/50 pt-2 font-ik-menu text-[10px] uppercase tracking-wide text-muted-foreground/75">
        {item.id}
      </div>
    </div>,
    document.body
  );
}

function InventorySlot({ item }: { item: InventoryDisplayItem }) {
  const slotRef = useRef<HTMLButtonElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const icon = getItemIcon(item);
  const initials = item.name.slice(0, 2).toUpperCase();

  const updateAnchorRect = useCallback(() => {
    if (!slotRef.current) return;
    setAnchorRect(slotRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!anchorRect) return;

    window.addEventListener("resize", updateAnchorRect);
    window.addEventListener("scroll", updateAnchorRect, true);

    return () => {
      window.removeEventListener("resize", updateAnchorRect);
      window.removeEventListener("scroll", updateAnchorRect, true);
    };
  }, [anchorRect, updateAnchorRect]);

  return (
    <button
      ref={slotRef}
      aria-label={`${item.name}, ${item.category}, quantite ${item.quantity}`}
      className="relative aspect-square min-h-14 appearance-none rounded-lg border border-border/70 bg-muted/25 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:border-amber-300/45 hover:bg-muted/35 hover:shadow-[0_0_16px_rgba(201,166,84,0.12),inset_0_1px_0_rgba(255,255,255,0.05)] focus-visible:border-amber-300/55 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300/35"
      onBlur={() => setAnchorRect(null)}
      onFocus={updateAnchorRect}
      onMouseEnter={updateAnchorRect}
      onMouseLeave={() => setAnchorRect(null)}
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

      <InventoryItemTooltip anchorRect={anchorRect} item={item} />
    </button>
  );
}

export function InventoryView() {
  const state = useGameStore((s) => s.state);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<InventoryCategory | "all">("all");
  const [sort, setSort] = useState<InventorySort>("quantity-desc");

  const displayItems = useMemo(() => getInventoryDisplayItems(state), [state]);
  const filteredItems = useMemo(
    () => filterAndSortInventoryItems(displayItems, { category, search, sort }),
    [category, displayItems, search, sort]
  );

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
            <InventorySlot key={`${item.category}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
