"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game-store";
import { KITCHEN_RECIPES } from "@idleking/game-core/building/kitchen/recipes.js";
import { cookDish } from "@idleking/game-core/game/kitchenActions.js";

export default function KitchenPage() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const [villagerId, setVillagerId] = useState(state.villagers.list[0]?.id ?? "");

  return (
    <div className="space-y-4">
      <h1 className="font-ik-title text-2xl font-semibold">Kitchen</h1>

      <label className="text-sm">
        <span className="mb-1 block text-muted-foreground">Worker</span>
        <select
          className="w-full max-w-xs rounded border bg-background px-2 py-1"
          value={villagerId}
          onChange={(event) => setVillagerId(event.target.value)}
        >
          {state.villagers.list.map((v) => (
            <option key={v.id} value={v.id}>
              {v.id} (stamina {v.stamina})
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        {KITCHEN_RECIPES.map((recipe) => (
          <Card key={recipe.id}>
            <CardHeader>
              <CardTitle>{recipe.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Cost: {JSON.stringify(recipe.cost)}</p>
              <p>Output: {JSON.stringify(recipe.output)}</p>
              <p>Stamina cost: {Math.round(recipe.staminaCostPct * 100)}%</p>
              <Button
                onClick={() => {
                  const res = cookDish(state, recipe.id, villagerId);
                  if (!res.ok) {
                    toast.error(`Cook failed: ${res.reason}`);
                    return;
                  }
                  dispatch(() => res.next);
                  toast.success(`${recipe.label} cooked`);
                }}
              >
                Cook
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
