"use client";

import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";
import { buildBuilding } from "@idleking/game-core/game/buildingBuildActions.js";
import { getBuildCost } from "@idleking/game-core/building/buildCosts.js";

const BUILDINGS = [
  { id: "FORUM", key: "forum", route: "/game/kingdom/forum" },
  { id: "FARM", key: "farm", route: "/game/kingdom/farm" },
  { id: "MINE", key: "mine", route: "/game/kingdom/mine" },
  { id: "TEMPLE", key: "temple", route: "/game/kingdom/temple" },
  { id: "KITCHEN", key: "kitchen", route: "/game/kingdom/kitchen" },
  { id: "FORGE", key: "forge", route: "/game/kingdom/forge" },
] as const;

export default function KingdomPage() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Kingdom</h1>
      <p className="text-sm text-muted-foreground">Manage building unlock, build, and activity.</p>

      <div className="grid gap-4 md:grid-cols-2">
        {BUILDINGS.map((b) => {
          const row = state.buildings[b.key];
          const cost = getBuildCost(b.id);

          return (
            <Card key={b.id}>
              <CardHeader>
                <CardTitle>{b.id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  unlocked: {String(row.unlocked)} | built: {String(row.built)} | active: {String((row as { active: boolean }).active)}
                </p>
                <p className="text-muted-foreground">Cost: {JSON.stringify(cost)}</p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      dispatch((prev) => ({
                        ...prev,
                        buildings: {
                          ...prev.buildings,
                          [b.key]: { ...prev.buildings[b.key], unlocked: !prev.buildings[b.key].unlocked },
                        },
                      }));
                    }}
                  >
                    Toggle Open
                  </Button>

                  <Button
                    onClick={() => {
                      const res = buildBuilding(state, b.id);
                      if (!res.ok) {
                        toast.error(`Build failed: ${res.reason}`);
                        return;
                      }
                      dispatch(() => res.next);
                      toast.success(`${b.id} built`);
                    }}
                  >
                    Build
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => {
                      dispatch((prev) => ({
                        ...prev,
                        buildings: {
                          ...prev.buildings,
                          [b.key]: {
                            ...prev.buildings[b.key],
                            active: !(prev.buildings[b.key] as { active: boolean }).active,
                          },
                        },
                      }));
                    }}
                  >
                    Toggle Active
                  </Button>

                  <Link href={b.route}>
                    <Button variant="ghost">Open Page</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
