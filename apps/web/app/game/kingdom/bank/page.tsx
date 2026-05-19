"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEV_MODE } from "@/lib/env";
import { useGameStore } from "@/store/game-store";
import {
  depositAllToBank,
  depositItemToBank,
  depositStackToBank,
  withdrawAllFromBank,
  withdrawItemFromBank,
  withdrawStackFromBank,
  type BankBulkCategory,
  type BankItemCategory,
} from "@idleking/game-core/bank";
import { isEquipmentItem, type Item, type NonEquipmentItem } from "@idleking/game-core/items";
import { ALL_RESOURCES, addQty, getQty, type ResourceId } from "@idleking/game-core/resources/types.js";

type BankFilter = "all" | BankItemCategory;

type DisplayStack = {
  id: string;
  name: string;
  category: BankItemCategory;
  quantity: number;
  blocked?: boolean;
  blockedLabel?: string;
};

const FILTERS: { id: BankFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "resources", label: "Resources" },
  { id: "consumables", label: "Consumables" },
  { id: "special", label: "Special" },
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

function getItemBankCategory(item: NonEquipmentItem): BankItemCategory | null {
  if (item.kind === "resource") return "resources";
  if (item.kind === "consumable") return "consumables";
  if (item.kind === "material" || item.kind === "misc" || item.kind === "special") return "special";
  return null;
}

function toBulkCategory(filter: BankFilter): BankBulkCategory {
  return filter === "all" ? "all" : filter;
}

function matchesFilter(filter: BankFilter, category: BankItemCategory): boolean {
  return filter === "all" || filter === category;
}

function getInventoryStacks(items: Item[], resources: ReturnType<typeof useGameStore.getState>["state"]["resources"]): DisplayStack[] {
  const stacks: DisplayStack[] = [];

  for (const id of ALL_RESOURCES) {
    const quantity = getQty(resources, id);
    if (quantity <= 0) continue;
    stacks.push({
      id,
      name: formatResourceName(id),
      category: "resources",
      quantity,
    });
  }

  for (const item of items) {
    if (isEquipmentItem(item)) {
      stacks.push({
        id: item.id,
        name: item.name,
        category: "special",
        quantity: 1,
        blocked: true,
        blockedLabel: "Equipment cannot be banked",
      });
      continue;
    }

    if (item.kind === "quest") {
      stacks.push({
        id: item.id,
        name: item.name,
        category: "special",
        quantity: getItemQuantity(item),
        blocked: true,
        blockedLabel: "Quest items stay bound",
      });
      continue;
    }

    const category = getItemBankCategory(item);
    if (!category) continue;
    stacks.push({
      id: item.id,
      name: item.name,
      category,
      quantity: getItemQuantity(item),
    });
  }

  return stacks;
}

function getBankStacks(state: ReturnType<typeof useGameStore.getState>["state"]): DisplayStack[] {
  const map = new Map<string, DisplayStack>();
  for (const stack of state.bank.stacks) {
    const key = `${stack.category}:${stack.id}`;
    const current = map.get(key);
    if (current) {
      current.quantity += stack.quantity;
      continue;
    }
    map.set(key, {
      id: stack.id,
      name: stack.name,
      category: stack.category,
      quantity: stack.quantity,
    });
  }
  return [...map.values()];
}

export default function BankPage() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const [filter, setFilter] = useState<BankFilter>("all");

  const bankBuilt = state.buildings.bank.built && state.buildings.bank.active;
  const inventoryStacks = getInventoryStacks(state.inventory.items, state.resources).filter((stack) =>
    matchesFilter(filter, stack.category),
  );
  const bankStacks = getBankStacks(state).filter((stack) => matchesFilter(filter, stack.category));

  function runTransfer(label: string, action: () => ReturnType<typeof depositItemToBank>) {
    const result = action();
    if (!result.ok) {
      toast.error(`${label} failed: ${result.reason}`);
      return;
    }
    dispatch(() => result.next);
    toast.success(`${label}: ${result.quantity ?? 0}`);
  }

  function grantDevBankSmokeSetup() {
    if (!DEV_MODE) return;

    dispatch((current) => ({
      ...current,
      buildings: {
        ...current.buildings,
        bank: {
          ...current.buildings.bank,
          active: true,
          built: true,
          level: Math.max(1, current.buildings.bank.level),
          status: "built",
          unlocked: true,
        },
      },
      resources: addQty(addQty(addQty(current.resources, "WOOD", 25), "STONE", 25), "COPPER", 25),
      inventory: {
        items: [
          ...current.inventory.items,
          {
            id: "dev-bank-potion",
            kind: "consumable",
            name: "DEV Smoke Potion",
            quantity: 5,
          },
          {
            id: "dev-bank-relic-shard",
            kind: "special",
            name: "DEV Relic Shard",
            quantity: 3,
          },
        ],
      },
    }));
    toast.success("DEV Bank smoke setup granted");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-ik-title text-2xl font-semibold">Bank</h1>
          <p className="text-sm text-muted-foreground">
            Stores resources, consumables, and special non-quest items. Currencies stay in wallet.
          </p>
        </div>
        {DEV_MODE ? (
          <Button data-testid="bank-dev-smoke-setup" onClick={grantDevBankSmokeSetup} size="sm" type="button" variant="outline">
            DEV: Bank Smoke Setup
          </Button>
        ) : null}
      </div>

      {!bankBuilt ? (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Build the Bank in the Kingdom before using storage.
          </CardContent>
        </Card>
      ) : null}

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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Inventory</CardTitle>
              <Button
                disabled={!bankBuilt || inventoryStacks.every((stack) => stack.blocked)}
                onClick={() => runTransfer("Deposit all", () => depositAllToBank(useGameStore.getState().state, toBulkCategory(filter)))}
                size="sm"
                type="button"
                variant="secondary"
              >
                Deposit All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {inventoryStacks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching inventory stacks.</p>
            ) : (
              inventoryStacks.map((stack) => (
                <div key={`${stack.category}:${stack.id}`} className="rounded border p-3 text-sm">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{stack.name}</div>
                      <div className="text-xs text-muted-foreground" data-testid={`bank-inventory-qty-${stack.id}`}>
                        {stack.category} | Qty {stack.quantity}
                        {stack.blockedLabel ? ` | ${stack.blockedLabel}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      data-testid={`bank-deposit-one-${stack.id}`}
                      disabled={!bankBuilt || stack.blocked}
                      onClick={() => runTransfer("Deposit 1", () => depositItemToBank(useGameStore.getState().state, stack.id, 1))}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Deposit 1
                    </Button>
                    <Button
                      disabled={!bankBuilt || stack.blocked}
                      onClick={() => runTransfer("Deposit stack", () => depositStackToBank(useGameStore.getState().state, stack.id))}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Deposit Stack
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Bank</CardTitle>
              <Button
                disabled={!bankBuilt || bankStacks.length === 0}
                onClick={() => runTransfer("Withdraw all", () => withdrawAllFromBank(useGameStore.getState().state, toBulkCategory(filter)))}
                size="sm"
                type="button"
                variant="secondary"
              >
                Withdraw All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {bankStacks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching bank stacks.</p>
            ) : (
              bankStacks.map((stack) => (
                <div key={`${stack.category}:${stack.id}`} className="rounded border p-3 text-sm">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{stack.name}</div>
                      <div className="text-xs text-muted-foreground" data-testid={`bank-bank-qty-${stack.id}`}>
                        {stack.category} | Qty {stack.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      data-testid={`bank-withdraw-one-${stack.id}`}
                      disabled={!bankBuilt}
                      onClick={() => runTransfer("Withdraw 1", () => withdrawItemFromBank(useGameStore.getState().state, stack.id, 1))}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Withdraw 1
                    </Button>
                    <Button
                      disabled={!bankBuilt}
                      onClick={() => runTransfer("Withdraw stack", () => withdrawStackFromBank(useGameStore.getState().state, stack.id))}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Withdraw Stack
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
