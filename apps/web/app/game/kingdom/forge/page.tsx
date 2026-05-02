"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGameStore } from "@/store/game-store";
import { FORGE_RECIPES } from "@idleking/game-core/building/forge/recipes.js";
import { forgeCraft, forgeRecycle, forgeUpgrade } from "@idleking/game-core/game/forgeActions.js";
import { isEquipmentItem } from "@idleking/game-core/items";

export default function ForgePage() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const [villagerId, setVillagerId] = useState(state.villagers.list[0]?.id ?? "");
  const equipmentItems = state.inventory.items.filter(isEquipmentItem);

  return (
    <div className="space-y-4">
      <h1 className="font-ik-title text-2xl font-semibold">Forge</h1>

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

      <Tabs defaultValue="craft" className="space-y-3">
        <TabsList>
          <TabsTrigger value="craft">Craft</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="craft">
          <div className="grid gap-4 lg:grid-cols-2">
            {FORGE_RECIPES.map((recipe) => (
              <Card key={recipe.id}>
                <CardHeader>
                  <CardTitle>{recipe.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    {recipe.slot} | {recipe.rarity}
                  </p>
                  <p>Cost: {JSON.stringify(recipe.cost)}</p>
                  <p>Stamina cost: {Math.round(recipe.staminaCostPct * 100)}%</p>
                  <Button
                    onClick={() => {
                      const res = forgeCraft(state, recipe.id, villagerId);
                      if (!res.ok) {
                        toast.error(`Craft failed: ${res.reason}`);
                        return;
                      }
                      dispatch(() => res.next);
                      toast.success(`Crafted ${recipe.label}`);
                    }}
                  >
                    Craft
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Crafted Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {equipmentItems.length === 0 ? (
                <p className="font-ik-body text-sm text-muted-foreground">No items yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {equipmentItems.map((item) => (
                    <li key={item.id} className="rounded border p-2">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span>
                          {item.name} ({item.slot}) ilvl {item.itemLevel ?? item.ilvl ?? 1}
                        </span>
                        <span className="text-muted-foreground">{item.rarity}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const res = forgeUpgrade(state, item.id, villagerId);
                            if (!res.ok) {
                              toast.error(`Upgrade failed: ${res.reason}`);
                              return;
                            }
                            dispatch(() => res.next);
                            toast.success("Item upgraded");
                          }}
                        >
                          Upgrade
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const res = forgeRecycle(state, item.id);
                            if (!res.ok) {
                              toast.error(`Recycle failed: ${res.reason}`);
                              return;
                            }
                            dispatch(() => res.next);
                            toast.success("Item recycled");
                          }}
                        >
                          Recycle
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
