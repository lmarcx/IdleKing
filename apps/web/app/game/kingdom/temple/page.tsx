"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";
import { setTempleXpGlobalAllocation } from "@idleking/game-core/game/buildingActions.js";
import { convertTempleGlobalXp } from "@idleking/game-core/game/templeActions.js";
import { getQty } from "@idleking/game-core/resources/types.js";

export default function TemplePage() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const xpGlobal = getQty(state.resources, "XP_GLOBAL");

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

      <Card>
        <CardHeader>
          <CardTitle>XP_GLOBAL Conversion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Available XP_GLOBAL</span>
            <span className="font-ik-menu tabular-nums">{xpGlobal}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!state.buildings.temple.built || xpGlobal <= 0}
              onClick={() => {
                const res = convertTempleGlobalXp(state, "playerXp", xpGlobal);
                if (!res.ok) {
                  toast.error(`Conversion failed: ${res.reason}`);
                  return;
                }
                dispatch(() => res.next);
                toast.success(`Converted ${res.amount} XP_GLOBAL to Player XP`);
              }}
            >
              XP_GLOBAL to Player XP
            </Button>
            <Button
              disabled={!state.buildings.temple.built || xpGlobal <= 0}
              variant="secondary"
              onClick={() => {
                const res = convertTempleGlobalXp(state, "worldWxp", xpGlobal);
                if (!res.ok) {
                  toast.error(`Conversion failed: ${res.reason}`);
                  return;
                }
                dispatch(() => res.next);
                toast.success(`Converted ${res.amount} XP_GLOBAL to ${res.amount} WXP`);
              }}
            >
              XP_GLOBAL to WXP (1:1)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
