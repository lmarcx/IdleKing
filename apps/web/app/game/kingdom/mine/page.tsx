"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";
import { mineResourcesAvailable, setMineAllocation } from "@idleking/game-core/game/buildingActions.js";

function toInt(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

export default function MinePage() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);

  const resources = useMemo(
    () => mineResourcesAvailable(state.progression.worldLevel),
    [state.progression.worldLevel]
  );

  const totalAllocated = Object.values(state.buildings.mine.allocation).reduce(
    (sum, n) => sum + Math.max(0, Math.floor(Number(n ?? 0))),
    0
  );

  return (
    <div className="space-y-4">
      <h1 className="ik-title text-2xl font-semibold">Mine Allocation</h1>

      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((rid) => (
              <label key={rid} className="space-y-1 text-sm">
                <span className="text-muted-foreground">{rid}</span>
                <input
                  className="w-full rounded border bg-background px-2 py-1"
                  type="number"
                  min={0}
                  value={state.buildings.mine.allocation[rid] ?? 0}
                  onChange={(event) => {
                    const value = toInt(event.target.value);
                    const next = { ...state.buildings.mine.allocation, [rid]: value };
                    dispatch((prev) => setMineAllocation(prev, next));
                  }}
                />
              </label>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span>Total allocated: {totalAllocated}</span>
            <span className="text-muted-foreground">/ {state.villagers.list.length} villagers</span>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              dispatch((prev) => setMineAllocation(prev, {}));
            }}
          >
            Clear Allocation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
