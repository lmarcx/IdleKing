"use client";

import { useMemo, useState } from "react";
import { Anvil, ArrowUpCircle, Recycle } from "lucide-react";
import { toast } from "sonner";

import { BuildingCostChips } from "@/components/game/kingdom/building-modal";
import { DEV_MODE } from "@/lib/env";
import { getRarityLabel, getRarityTextClass } from "@/lib/rarity";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import {
  FORGE_RECIPES,
  forgeCraft,
  forgeRecycle,
  forgeUpgrade,
  getBuildingUpgradeCost,
  getCanonicalForgeRecipeRequiredLevel,
  getCurrencyBalance,
  getEquipmentSetDefinition,
  getForgeOutputBase,
  getForgeRecipeLockReason,
  getForgeRecycleEcuRefund,
  getForgeUpgradeCost,
  getForgeUpgradeMaxLevel,
  hasAtLeast,
  isEquipmentItem,
  isItemEquipped,
  normalizeForgeRecipeIngredients,
  upgradeBuilding,
  type EquipmentItem,
  type ForgeRecipe,
} from "@idleking/game-core";

type ForgeTab = "craft" | "upgrade" | "recycle";
type RecipeGroup = "weapons" | "armor" | "accessories" | "sets" | "boss";

const RECIPE_GROUP_LABELS: Record<RecipeGroup, string> = {
  weapons: "Armes",
  armor: "Armures",
  accessories: "Accessoires",
  sets: "Sets",
  boss: "Boss",
};

const LOCK_LABELS: Record<string, string> = {
  BOSS_REQUIRED: "Boss requis",
  CHAPTER_REQUIRED: "Chapitre requis",
  FORGE_NOT_BUILT: "Forge non construite",
  QUEST_REQUIRED: "Progression requise",
  WORLD_LEVEL_TOO_LOW: "World Level",
};

function getRecipeGroup(recipe: ForgeRecipe): RecipeGroup {
  if (recipe.unlockConditions.requiredBossId) return "boss";
  if (recipe.setId) return "sets";
  if (recipe.category === "forge_weapon") return "weapons";
  if (recipe.category === "forge_armor") return "armor";
  return "accessories";
}

// Legacy brownfield duplicates of the canonical weapon/armor recipes: hidden from the player.
const HIDDEN_RECIPE_IDS = new Set(["iron_sword", "BASIC_SWORD", "copper_ring"]);

function ForgeTabs({ active, onChange }: { active: ForgeTab; onChange: (tab: ForgeTab) => void }) {
  const tabs: Array<{ id: ForgeTab; label: string; icon: typeof Anvil }> = [
    { id: "craft", label: "Fabrication", icon: Anvil },
    { id: "upgrade", label: "Amélioration", icon: ArrowUpCircle },
    { id: "recycle", label: "Recyclage", icon: Recycle },
  ];
  return (
    <div aria-label="Onglets de la Forge" className="ik-seg" role="tablist">
      {tabs.map((tab) => (
        <button
          aria-selected={active === tab.id}
          className="ik-seg__tab"
          key={tab.id}
          onClick={() => onChange(tab.id)}
          role="tab"
          type="button"
        >
          <tab.icon aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ActionButton({ disabled, label, onClick }: { disabled: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={cn(
        "flex min-h-9 items-center justify-center gap-2 border-2 px-3 py-1.5 font-ik-menu text-[0.68rem] transition",
        disabled
          ? "cursor-not-allowed border-neutral-800 text-neutral-600"
          : "border-neutral-100 bg-neutral-100 text-neutral-950 hover:bg-neutral-300",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ItemLine({ item }: { item: EquipmentItem }) {
  const setName = item.setId ? getEquipmentSetDefinition(item.setId)?.name : undefined;
  return (
    <div className="min-w-0">
      <div className={cn("truncate font-ik-title text-sm", getRarityTextClass(item.rarity))}>
        {item.name}
        {(item.upgradeLevel ?? 0) > 0 ? ` +${item.upgradeLevel}` : ""}
      </div>
      <div className="font-ik-body text-[0.68rem] text-neutral-500">
        {getRarityLabel(item.rarity)} · {item.slot} · ilvl {item.itemLevel ?? item.ilvl ?? 1}
        {setName ? ` · Set ${setName}` : ""}
      </div>
    </div>
  );
}

/**
 * Full Forge (Freeze §9): Craft · Upgrade · Recycle, plus the Forge building level that gates the
 * weapon ladder (Fg1 Épée → Fg10 Bâton) and shifts craft rarity weights.
 */
export function ForgePanel() {
  const state = useGameStore((store) => store.state);
  const dispatch = useGameStore((store) => store.dispatch);
  const [tab, setTab] = useState<ForgeTab>("craft");
  const [group, setGroup] = useState<RecipeGroup>("weapons");

  const forge = state.buildings.forge;
  const forgeLevel = Math.max(1, forge.level);
  const forgeUpgradeCost = getBuildingUpgradeCost("FORGE", forgeLevel);
  const canUpgradeForge =
    forge.built &&
    forgeLevel < forge.maxLevel &&
    forgeLevel < state.progression.worldLevel &&
    hasAtLeast(state.resources, forgeUpgradeCost);

  const recipes = useMemo(
    () => FORGE_RECIPES.filter((recipe) => !HIDDEN_RECIPE_IDS.has(recipe.id) && getRecipeGroup(recipe) === group),
    [group],
  );
  const equipment = state.inventory.items.filter(isEquipmentItem);
  const ecu = getCurrencyBalance(state.wallet, "ECU");

  function handleUpgradeForge() {
    const result = upgradeBuilding(useGameStore.getState().state, "FORGE");
    if (!result.ok) {
      toast.error(result.reason === "WORLD_LEVEL_TOO_LOW" ? "Le niveau de la Forge est limité par le World Level." : "Amélioration impossible.");
      return;
    }
    dispatch(() => result.next);
    toast.success(`Forge niveau ${result.next.buildings.forge.level}`);
  }

  function handleCraft(recipe: ForgeRecipe) {
    const result = forgeCraft(useGameStore.getState().state, recipe.id, { allowLocked: DEV_MODE });
    if (!result.ok) {
      toast.error(`Fabrication impossible : ${result.reason}`);
      return;
    }
    dispatch(() => result.next);
    toast.success(`${recipe.label} forgé (${getRarityLabel(result.rolledRarity)})`);
  }

  function handleItemUpgrade(item: EquipmentItem) {
    const result = forgeUpgrade(useGameStore.getState().state, item.id);
    if (!result.ok) {
      toast.error(`Amélioration impossible : ${result.reason}`);
      return;
    }
    dispatch(() => result.next);
    toast.success(`${item.name} +${(item.upgradeLevel ?? 0) + 1}`);
  }

  function handleRecycle(item: EquipmentItem) {
    const result = forgeRecycle(useGameStore.getState().state, item.id, { seed: Date.now() >>> 0 });
    if (!result.ok) {
      toast.error(result.reason === "ITEM_EQUIPPED" ? "Déséquipez l'objet avant de le recycler." : "Recyclage impossible.");
      return;
    }
    dispatch(() => result.next);
    toast.success(`+${result.ecuRefund ?? 0} ECU${result.preciousStoneItemId ? " · Pierre précieuse" : ""}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-neutral-700 bg-neutral-950/60 p-3">
        <div>
          <div className="font-ik-menu text-[0.6rem] text-neutral-500">Niveau de la Forge</div>
          <div className="font-ik-title text-xl text-neutral-100 tabular-nums">
            {forgeLevel}
            <span className="ml-2 font-ik-body text-xs text-neutral-500">(max World Level {state.progression.worldLevel})</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BuildingCostChips cost={forgeUpgradeCost} resources={state.resources} />
          <ActionButton disabled={!canUpgradeForge} label="Améliorer" onClick={handleUpgradeForge} />
        </div>
      </div>

      <ForgeTabs active={tab} onChange={setTab} />

      {tab === "craft" ? (
        <div className="space-y-3">
          <div aria-label="Catégories de recettes" className="ik-seg" role="tablist">
            {(Object.keys(RECIPE_GROUP_LABELS) as RecipeGroup[]).map((candidate) => (
              <button
                aria-selected={group === candidate}
                className="ik-seg__tab"
                key={candidate}
                onClick={() => setGroup(candidate)}
                role="tab"
                type="button"
              >
                {RECIPE_GROUP_LABELS[candidate]}
              </button>
            ))}
          </div>
          <div className="ik-stagger grid gap-2 sm:grid-cols-2">
            {recipes.map((recipe) => {
              const ingredients = normalizeForgeRecipeIngredients(recipe.ingredients);
              const lockReason = getForgeRecipeLockReason(state, recipe);
              const hasResources = hasAtLeast(state.resources, ingredients);
              const canCraft = (lockReason === null || DEV_MODE) && hasResources;
              const outputBase = getForgeOutputBase(recipe.outputBaseId);
              const label =
                lockReason === "FORGE_LEVEL_TOO_LOW"
                  ? `Forge Nv ${getCanonicalForgeRecipeRequiredLevel(recipe)}`
                  : lockReason && !DEV_MODE
                    ? LOCK_LABELS[lockReason] ?? "Verrouillé"
                    : hasResources
                      ? "Forger"
                      : "Ressources";
              return (
                <div
                  className={cn(
                    "ik-card-hover border-2 bg-neutral-950/60 p-3",
                    canCraft ? "border-neutral-600" : "border-dashed border-neutral-800",
                  )}
                  key={recipe.id}
                >
                  <div className="font-ik-title text-sm text-neutral-100">{recipe.label}</div>
                  <div className="mt-0.5 font-ik-body text-[0.68rem] capitalize text-neutral-500">
                    {outputBase?.slot ?? recipe.category}
                    {recipe.ringSkillCategory ? ` · skill ${recipe.ringSkillCategory}` : ""}
                  </div>
                  <div className="mt-2.5">
                    <BuildingCostChips cost={ingredients} resources={state.resources} />
                  </div>
                  <div className="mt-3">
                    <ActionButton disabled={!canCraft} label={label} onClick={() => handleCraft(recipe)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {tab === "upgrade" ? (
        <div className="space-y-2">
          {equipment.length === 0 ? (
            <p className="font-ik-body text-sm text-neutral-500">Aucun équipement à améliorer.</p>
          ) : null}
          {equipment.map((item) => {
            const cap = getForgeUpgradeMaxLevel(item.rarity);
            const level = item.upgradeLevel ?? 0;
            const cost = getForgeUpgradeCost(item);
            const ecuCost = cost.currencies?.ECU ?? 0;
            const maxed = level >= cap;
            const affordable = hasAtLeast(state.resources, cost.resources ?? {}) && ecu >= ecuCost;
            return (
              <div className="flex flex-wrap items-center justify-between gap-3 border border-neutral-800 bg-neutral-950/60 p-2.5" key={item.id}>
                <ItemLine item={item} />
                <div className="flex flex-wrap items-center gap-2">
                  {!maxed ? <BuildingCostChips cost={cost.resources ?? {}} resources={state.resources} /> : null}
                  {!maxed ? <span className="font-ik-menu text-[0.62rem] text-neutral-400">{ecuCost} ECU</span> : null}
                  <ActionButton
                    disabled={maxed || !affordable}
                    label={maxed ? `Max +${cap}` : `+${level + 1}`}
                    onClick={() => handleItemUpgrade(item)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "recycle" ? (
        <div className="space-y-2">
          <p className="font-ik-body text-xs text-neutral-500">
            Recycler détruit l'objet : 50 % de sa valeur en ECU et une chance de Pierre précieuse. Aucun matériau rendu.
          </p>
          {equipment.map((item) => {
            const equipped = isItemEquipped(state, item.id);
            return (
              <div className="flex flex-wrap items-center justify-between gap-3 border border-neutral-800 bg-neutral-950/60 p-2.5" key={item.id}>
                <ItemLine item={item} />
                <ActionButton
                  disabled={equipped}
                  label={equipped ? "Équipé" : `Recycler (+${getForgeRecycleEcuRefund(item)} ECU)`}
                  onClick={() => handleRecycle(item)}
                />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
