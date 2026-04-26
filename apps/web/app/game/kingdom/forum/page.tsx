"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";
import { forumRankUpWorld } from "@idleking/game-core/game/forumActions.js";
import { recruitVillager, recruitVillagerCost } from "@idleking/game-core/game/forumRecruitActions.js";
import { restVillager } from "@idleking/game-core/game/forumRestActions.js";

export default function ForumPage() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);

  const recruitCost = recruitVillagerCost(state.villagers.list.length);

  return (
    <div className="space-y-4">
      <h1 className="ik-title text-2xl font-semibold">Forum</h1>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            const res = forumRankUpWorld(state);
            if (!res.rankedUp) {
              toast.error(`World rank up failed: ${res.reason}`);
              return;
            }
            dispatch(() => res.next);
            toast.success("World level increased");
          }}
        >
          Rank Up World
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
