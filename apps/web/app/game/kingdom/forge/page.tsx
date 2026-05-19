"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEV_MODE } from "@/lib/env";
import { useGameStore } from "@/store/game-store";
import { grantCurrency } from "@idleking/game-core";
import {
  FORGE_RECIPES,
  getAvailableForgeRecipes,
  getForgeRecipeLockReason,
} from "@idleking/game-core/building/forge/recipes.js";
import {
  FORGE_PRECIOUS_STONE_DROP_CHANCE,
  getForgeRecycleEcuRefund,
  getForgeUpgradeBreakpointsReached,
  getForgeUpgradeCost,
  getForgeUpgradeMaxLevel,
  getNextForgeUpgradeBreakpoint,
  getUpgradedEquipmentStats,
} from "@idleking/game-core/building/forge/rules.js";
import { forgeCraft, forgeRecycle, forgeUpgrade } from "@idleking/game-core/game/forgeActions.js";
import { isEquipmentItem, type EquipmentStats } from "@idleking/game-core/items";
import { addQty } from "@idleking/game-core/resources/types.js";

function formatStatPreview(current: EquipmentStats, next: EquipmentStats): string {
  const parts = [
    ["HP", current.hp, next.hp],
    ["ATK", current.attack, next.attack],
    ["DEF", current.defense, next.defense],
    ["POWER", current.power, next.power],
  ].flatMap(([label, currentValue, nextValue]) => {
    if (typeof currentValue !== "number" || typeof nextValue !== "number") return [];
    const delta = nextValue - currentValue;
    return delta > 0 ? [`${label} +${delta}`] : [];
  });

  return parts.length > 0 ? parts.join(" | ") : "No stat change";
}

export default function ForgePage() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const equipmentItems = state.inventory.items.filter(isEquipmentItem);
  const availableRecipeIds = new Set(getAvailableForgeRecipes(state).map((recipe) => recipe.id));

  function grantDevForgeSmokeSetup() {
    if (!DEV_MODE) return;

    dispatch((current) => {
      let resources = current.resources;
      for (const [resourceId, amount] of [
        ["COPPER", 25],
        ["IRON", 25],
        ["STONE", 10],
        ["WOOD", 10],
        ["GOLD", 25],
        ["PAPER", 5],
        ["INK", 5],
        ["RUNES", 5],
      ] as const) {
        resources = addQty(resources, resourceId, amount);
      }

      return {
        ...current,
        buildings: {
          ...current.buildings,
          forge: {
            ...current.buildings.forge,
            active: true,
            built: true,
            level: Math.max(1, current.buildings.forge.level),
            status: "built",
            unlocked: true,
          },
        },
        resources,
        wallet: grantCurrency(current.wallet, "ECU", 25),
      };
    });
    toast.success("DEV Forge smoke setup granted");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-ik-title text-2xl font-semibold">Forge</h1>
        {DEV_MODE ? (
          <Button onClick={grantDevForgeSmokeSetup} size="sm" type="button" variant="outline">
            DEV: Forge Smoke Setup
          </Button>
        ) : null}
      </div>

      <Tabs defaultValue="craft" className="space-y-3">
        <TabsList>
          <TabsTrigger value="craft">Craft</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="craft">
          <div className="grid gap-4 lg:grid-cols-2">
            {FORGE_RECIPES.map((recipe) => {
              const lockReason = getForgeRecipeLockReason(state, recipe);
              const isAvailable = availableRecipeIds.has(recipe.id);
              const lockLabel =
                lockReason === "FORGE_NOT_BUILT"
                  ? "Build Forge"
                  : lockReason === "FORGE_LEVEL_TOO_LOW"
                    ? `Requires Forge level ${recipe.requiredForgeLevel}`
                    : lockReason === "WORLD_LEVEL_TOO_LOW"
                      ? `Requires World level ${recipe.requiredWorldLevel}`
                      : null;

              return (
                <Card key={recipe.id}>
                  <CardHeader>
                    <CardTitle>{recipe.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      {recipe.slot} | {recipe.rarity}
                    </p>
                    <p>Cost: {JSON.stringify(recipe.cost)}</p>
                    <p className="text-xs text-muted-foreground">
                      Forge level {recipe.requiredForgeLevel}
                      {recipe.requiredWorldLevel ? ` | World level ${recipe.requiredWorldLevel}` : ""}
                    </p>
                    {lockLabel ? <p className="text-xs text-muted-foreground">{lockLabel}</p> : null}
                    <Button
                      disabled={!isAvailable}
                      onClick={() => {
                        const res = forgeCraft(state, recipe.id);
                        if (!res.ok) {
                          toast.error(`Craft failed: ${res.reason}`);
                          return;
                        }
                        dispatch(() => res.next);
                        toast.success(`Crafted ${recipe.label}`);
                      }}
                    >
                      {isAvailable ? "Craft" : "Locked"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
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
                  {equipmentItems.map((item) => {
                    const rarity = item.rarity ?? "COMMON";
                    const upgradeLevel = item.upgradeLevel ?? 0;
                    const maxUpgradeLevel = getForgeUpgradeMaxLevel(rarity);
                    const nextBreakpoint = getNextForgeUpgradeBreakpoint(upgradeLevel, rarity);
                    const nextStats = getUpgradedEquipmentStats(
                      item.baseStats ?? item.stats,
                      rarity,
                      item.itemLevel ?? item.ilvl ?? 1,
                      Math.min(upgradeLevel + 1, maxUpgradeLevel),
                    );

                    return (
                      <li key={item.id} className="rounded border p-2">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span>
                            {item.name} ({item.slot}) ilvl {item.itemLevel ?? item.ilvl ?? 1} +{upgradeLevel}
                          </span>
                          <span className="text-muted-foreground">{rarity}</span>
                        </div>
                        <div className="mb-2 text-xs text-muted-foreground">
                          Upgrade cap +{maxUpgradeLevel} | Next breakpoint {nextBreakpoint ? `+${nextBreakpoint}` : "none"} |
                          Reached {getForgeUpgradeBreakpointsReached(upgradeLevel).map((level) => `+${level}`).join(", ") || "none"}
                        </div>
                        <div className="mb-2 text-xs text-muted-foreground">
                          Upgrade cost {JSON.stringify(getForgeUpgradeCost(item))} | Preview{" "}
                          {formatStatPreview(item.stats, nextStats)}
                        </div>
                        <div className="mb-2 text-xs text-muted-foreground">
                          Recycle: {getForgeRecycleEcuRefund(item)} ECU, {Math.round(FORGE_PRECIOUS_STONE_DROP_CHANCE * 100)}%
                          chance for Precious Stone {rarity}.
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              const res = forgeUpgrade(state, item.id);
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
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
