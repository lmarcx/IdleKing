"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEV_MODE } from "@/lib/env";
import { useGameStore } from "@/store/game-store";
import { getCurrencyBalance, grantCurrency } from "@idleking/game-core";
import {
  getConsumableMarketEntry,
  getEquipmentMarketEntry,
  getMarketBuyEntries,
  getResourceMarketSellPrice,
  marketBuy,
  marketSell,
  type MarketCategory,
} from "@idleking/game-core/market";
import { generateEquipmentItem } from "@idleking/game-core/equipment";
import { isEquipmentItem, type Item, type NonEquipmentItem } from "@idleking/game-core/items";
import { ALL_RESOURCES, addQty, getQty, type ResourceId } from "@idleking/game-core/resources/types.js";

type MarketFilter = "all" | MarketCategory;

type SellStack = {
  id: string;
  name: string;
  category: MarketCategory;
  quantity: number;
  sellPrice: number;
  blocked?: boolean;
  blockedLabel?: string;
};

const FILTERS: { id: MarketFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "resources", label: "Resources" },
  { id: "consumables", label: "Consumables" },
  { id: "equipment", label: "Equipment" },
];

function formatResourceName(id: ResourceId): string {
  return id
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getItemQuantity(item: NonEquipmentItem): number {
  return Math.max(1, Math.floor(item.quantity ?? 1));
}

function matchesFilter(filter: MarketFilter, category: MarketCategory): boolean {
  return filter === "all" || filter === category;
}

function getSellStacks(items: Item[], resources: ReturnType<typeof useGameStore.getState>["state"]["resources"]): SellStack[] {
  const stacks: SellStack[] = [];

  for (const id of ALL_RESOURCES) {
    const quantity = getQty(resources, id);
    if (quantity <= 0) continue;
    stacks.push({
      id,
      name: formatResourceName(id),
      category: "resources",
      quantity,
      sellPrice: getResourceMarketSellPrice(id).amount,
    });
  }

  for (const item of items) {
    if (isEquipmentItem(item)) {
      const entry = getEquipmentMarketEntry(item);
      stacks.push({
        id: item.id,
        name: item.name,
        category: "equipment",
        quantity: 1,
        sellPrice: entry?.sellPrice.amount ?? 0,
        blocked: !entry,
        blockedLabel: entry ? undefined : "Unsellable equipment",
      });
      continue;
    }

    if (item.kind === "quest") {
      stacks.push({
        id: item.id,
        name: item.name,
        category: "consumables",
        quantity: getItemQuantity(item),
        sellPrice: 0,
        blocked: true,
        blockedLabel: "Quest item",
      });
      continue;
    }

    if (item.kind !== "consumable") continue;
    const entry = getConsumableMarketEntry(item);
    stacks.push({
      id: item.id,
      name: item.name,
      category: "consumables",
      quantity: getItemQuantity(item),
      sellPrice: entry?.sellPrice.amount ?? 0,
      blocked: !entry,
      blockedLabel: entry ? undefined : "Not bought by Market",
    });
  }

  return stacks;
}

export default function MarketPage() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const [filter, setFilter] = useState<MarketFilter>("all");
  const ecu = getCurrencyBalance(state.wallet, "ECU");
  const buyEntries = getMarketBuyEntries(filter).filter((entry) => matchesFilter(filter, entry.category));
  const sellStacks = getSellStacks(state.inventory.items, state.resources).filter((stack) => matchesFilter(filter, stack.category));

  function buy(entryId: string) {
    const result = marketBuy(useGameStore.getState().state, entryId, 1);
    if (!result.ok) {
      toast.error(`Buy failed: ${result.reason}`);
      return;
    }
    dispatch(() => result.next);
    toast.success(`Bought for ${result.ecuAmount ?? 0} ECU`);
  }

  function sell(id: string) {
    const result = marketSell(useGameStore.getState().state, id, 1);
    if (!result.ok) {
      toast.error(`Sell failed: ${result.reason}`);
      return;
    }
    dispatch(() => result.next);
    toast.success(`Sold for ${result.ecuAmount ?? 0} ECU`);
  }

  function grantDevMarketSmokeSetup() {
    if (!DEV_MODE) return;

    dispatch((current) => ({
      ...current,
      buildings: {
        ...current.buildings,
        market: {
          ...current.buildings.market,
          active: true,
          built: true,
          level: Math.max(1, current.buildings.market.level),
          status: "built",
          unlocked: true,
        },
      },
      wallet: grantCurrency(current.wallet, "ECU", 100),
      resources: addQty(addQty(current.resources, "WOOD", 5), "STONE", 5),
      inventory: {
        items: [
          ...current.inventory.items,
          {
            id: "healing_potion",
            kind: "consumable",
            name: "Healing Potion",
            quantity: 2,
            value: 10,
          },
          {
            ...generateEquipmentItem({
              id: "market_basic_sword_dev",
              name: "Basic Sword",
              slot: "weapon",
              itemLevel: 1,
              rarity: "COMMON",
            }),
            value: 24,
          },
        ],
      },
    }));
    toast.success("DEV Market smoke setup granted");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-ik-title text-2xl font-semibold">Market</h1>
          <p className="text-sm text-muted-foreground">MVP trading uses ECU only. Vendor stock is infinite.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded border px-3 py-2 text-sm" data-testid="market-ecu-balance">
            ECU {ecu}
          </div>
          {DEV_MODE ? (
            <Button data-testid="market-dev-smoke-setup" onClick={grantDevMarketSmokeSetup} size="sm" type="button" variant="outline">
              DEV: Market Smoke Setup
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((entry) => (
          <Button
            key={entry.id}
            onClick={() => setFilter(entry.id)}
            size="sm"
            type="button"
            variant={filter === entry.id ? "default" : "outline"}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Buy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {buyEntries.map((entry) => (
              <div key={entry.id} className="rounded border p-3 text-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{entry.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.category} | Buy {entry.buyPrice.amount} ECU
                    </div>
                  </div>
                </div>
                <Button
                  data-testid={`market-buy-one-${entry.id}`}
                  disabled={ecu < entry.buyPrice.amount}
                  onClick={() => buy(entry.id)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Buy 1
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sell</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sellStacks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching sellable stacks.</p>
            ) : (
              sellStacks.map((stack) => (
                <div key={`${stack.category}:${stack.id}`} className="rounded border p-3 text-sm">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{stack.name}</div>
                      <div className="text-xs text-muted-foreground" data-testid={`market-sell-qty-${stack.id}`}>
                        {stack.category} | Qty {stack.quantity} | Sell {stack.sellPrice} ECU
                        {stack.blockedLabel ? ` | ${stack.blockedLabel}` : ""}
                      </div>
                    </div>
                  </div>
                  <Button
                    data-testid={`market-sell-one-${stack.id}`}
                    disabled={stack.blocked}
                    onClick={() => sell(stack.id)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Sell 1
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
