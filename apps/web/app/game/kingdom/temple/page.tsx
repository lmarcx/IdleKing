"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";
import { setTempleXpGlobalAllocation } from "@idleking/game-core/game/buildingActions.js";

export default function TemplePage() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);

  return (
    <div className="space-y-4">
      <h1 className="font-ik-title text-2xl font-semibold">Temple Allocation</h1>
      <Card>
        <CardHeader>
          <CardTitle>XP Global Allocation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">XP_GLOBAL workers</span>
            <input
              className="w-full max-w-xs rounded border bg-background px-2 py-1"
              type="number"
              min={0}
              value={state.buildings.temple.allocation.XP_GLOBAL}
              onChange={(event) => {
                const n = Math.max(0, Math.floor(Number(event.target.value) || 0));
                dispatch((prev) => setTempleXpGlobalAllocation(prev, n));
              }}
            />
          </label>

          <Button variant="outline" onClick={() => dispatch((prev) => setTempleXpGlobalAllocation(prev, 0))}>
            Reset
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
