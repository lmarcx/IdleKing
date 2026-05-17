"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";
import { forumRankUpWorld } from "@idleking/game-core/game/forumActions.js";
import { recruitVillager, recruitVillagerCost } from "@idleking/game-core/game/forumRecruitActions.js";
import { restVillager } from "@idleking/game-core/game/forumRestActions.js";
import { wxpNext } from "@idleking/game-core/progression";

export default function ForumPage() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);

  const recruitCost = recruitVillagerCost(state.villagers.list.length);
  const requiredWxp = wxpNext(state.progression.worldLevel);
  const canRankUp = requiredWxp > 0 && state.progression.worldWxp >= requiredWxp;
  const worldEnergy = `${Math.floor(state.world.energy.current)}/${Math.ceil(state.world.energy.max)}`;
  const worldHp = `${Math.floor(state.world.hp.current)}/${Math.ceil(state.world.hp.max)}`;

  return (
    <div className="space-y-4">
      <h1 className="font-ik-title text-2xl font-semibold">Forum</h1>

      <Card>
        <CardHeader>
          <CardTitle>World Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded border p-2">
            <div className="text-muted-foreground">World Level</div>
            <div className="font-ik-menu text-lg tabular-nums">{state.progression.worldLevel}</div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">WXP</div>
            <div className="font-ik-menu text-lg tabular-nums">
              {state.progression.worldWxp}
              {requiredWxp > 0 ? `/${requiredWxp}` : ""}
            </div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">World Energy</div>
            <div className="font-ik-menu text-lg tabular-nums">{worldEnergy}</div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">World HP</div>
            <div className="font-ik-menu text-lg tabular-nums">{worldHp}</div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!canRankUp}
          onClick={() => {
            const res = forumRankUpWorld(state);
            if (!res.rankedUp) {
              toast.error(`World rank up failed: ${res.reason}`);
              return;
            }
            dispatch(() => res.next);
            toast.success(
              `World level increased. World HP refilled to ${Math.ceil(res.next.world.hp.max)} and Energy to ${Math.ceil(
                res.next.world.energy.max
              )}.`
            );
          }}
        >
          {requiredWxp > 0 ? "Rank Up World" : "World Level Max"}
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            const res = recruitVillager(state);
            if (!res.ok) {
              toast.error(`Recruit failed: ${res.reason}`);
              return;
            }
            dispatch(() => res.next);
            toast.success("Villager recruited");
          }}
        >
          Recruit Villager ({recruitCost.meat} MEAT / {recruitCost.gold} GOLD)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Villagers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {state.villagers.list.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded border p-2 text-sm">
              <span>
                {v.id} | stamina {v.stamina}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const res = restVillager(state, v.id);
                  if (!res.ok) {
                    toast.error(`Rest failed: ${res.reason}`);
                    return;
                  }
                  dispatch(() => res.next);
                  toast.success(`${v.id} rested`);
                }}
              >
                Rest
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
