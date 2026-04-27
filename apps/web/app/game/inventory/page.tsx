"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  { label: "Quantité croissante", value: "quantity-asc" },
  { label: "Quantité décroissante", value: "quantity-desc" },
  { label: "Valeur croissante", value: "value-asc" },
  { label: "Valeur décroissante", value: "value-desc" },
  { label: "A-Z", value: "name-asc" },
  { label: "Z-A", value: "name-desc" },
];

function getItemIcon(item: InventoryDisplayItem) {
  if (item.category === "equipment" || item.category === "unique") return null;
  return getResourceAssetPath(item.id);
}

function InventoryItemCard({ item }: { item: InventoryDisplayItem }) {
  const icon = getItemIcon(item);

  return (
    <div className="rounded-lg border border-border/70 bg-muted/25 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border/60 bg-black/20">
          {icon ? (
            <img
              alt={`Icône ${item.name}`}
              className="h-6 w-6 object-contain"
              onError={(event) => {
                event.currentTarget.src = RESOURCE_FALLBACK_ASSET;
              }}
              src={icon}
            />
          ) : (
            <span className="font-ik-menu text-xs text-muted-foreground">{item.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-ik-title text-sm font-semibold">{item.name}</div>
          <div className="font-ik-body mt-1 text-xs capitalize text-muted-foreground">{item.category}</div>
        </div>

        <div className="text-right text-xs">
          <div className="tabular-nums">x{item.quantity}</div>
          <div className="mt-1 text-muted-foreground tabular-nums">V {item.value}</div>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
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

      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px]">
            <label className="grid gap-1.5">
              <span className="font-ik-menu text-xs uppercase tracking-wide text-muted-foreground">Recherche</span>
              <input
                className="h-10 rounded-md border border-border/70 bg-background/60 px-3 font-ik-body text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nom d'item ou ressource"
                type="search"
                value={search}
              />
            </label>

            <label className="grid gap-1.5">
              <span className="font-ik-menu text-xs uppercase tracking-wide text-muted-foreground">Catégorie</span>
              <select
                className="h-10 rounded-md border border-border/70 bg-background/60 px-3 font-ik-body text-sm outline-none transition-colors focus:border-primary/50"
                onChange={(event) => setCategory(event.target.value as InventoryCategory | "all")}
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
                onChange={(event) => setSort(event.target.value as InventorySort)}
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

          {filteredItems.length === 0 ? (
            <p className="font-ik-body rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              Aucun objet trouvé.
            </p>
          ) : (
            <div
              className={cn(
                "grid gap-2",
                "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              )}
            >
              {filteredItems.map((item) => (
                <InventoryItemCard key={`${item.category}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
