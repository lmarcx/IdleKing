"use client";

import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";

const INVENTORY_COLUMNS = 20;
const INVENTORY_ROWS = 10;
const TOTAL_INVENTORY_SLOTS = INVENTORY_COLUMNS * INVENTORY_ROWS;

const inventorySlotIndexes = Array.from({ length: TOTAL_INVENTORY_SLOTS }, (_, index) => index);

type InventorySlotProps = {
  className?: string;
  slotNumber: number;
};

function InventorySlot({ className, slotNumber }: InventorySlotProps) {
  return (
    <button
      type="button"
      aria-label={`Inventory slot ${slotNumber}`}
      className={cn(
        "aspect-square rounded-lg border border-border/70 bg-muted/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors duration-150 hover:border-primary/30 hover:bg-muted/55",
        className
      )}
    />
  );
}

export default function InventoryPage() {
  const state = useGameStore((s) => s.state);

  const resources = useMemo(
    () =>
      Object.entries(state.resources)
        .map(([id, qty]) => ({ id, qty: Math.floor(Number(qty ?? 0)) }))
        .filter((r) => r.qty > 0)
        .sort((a, b) => b.qty - a.qty),
    [state.resources]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Inventory</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            {state.inventory.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No equipment crafted yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {state.inventory.items.map((item) => (
                  <li key={item.id} className="rounded border p-2">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-muted-foreground">
                      {item.slot} | {item.rarity} | ilvl {item.ilvl}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent>
            {resources.length === 0 ? (
              <p className="text-sm text-muted-foreground">No resources in stock.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {resources.map((r) => (
                  <li key={r.id} className="flex justify-between">
                    <span className="text-muted-foreground">{r.id}</span>
                    <span>{r.qty}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-1">
            <div
              className="grid min-w-[47.125rem] gap-1.5 md:min-w-[52.125rem]"
              style={{ gridTemplateColumns: `repeat(${INVENTORY_COLUMNS}, minmax(2rem, 1fr))` }}
            >
              {inventorySlotIndexes.map((slotIndex) => (
                <InventorySlot key={slotIndex} slotNumber={slotIndex + 1} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
