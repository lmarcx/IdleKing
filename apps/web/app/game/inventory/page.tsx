"use client";

import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";

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
    </div>
  );
}
