"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { BuildingSprite } from "@/components/kingdom/building-sprite";
import { RelicPanel } from "@/components/ui/relic-panel";
import { DEV_MODE } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { getBuildCost } from "@idleking/game-core/building/buildCosts.js";
import { getCornucopiaClaimables } from "@idleking/game-core/building/cornucopiaActions.js";
import { buildBuilding } from "@idleking/game-core/game/buildingBuildActions.js";
import { farmResourcesAvailable, mineResourcesAvailable } from "@idleking/game-core/game/buildingActions.js";
import { forumRankUpWorld } from "@idleking/game-core/game/forumActions.js";
import { recruitVillager, recruitVillagerCost } from "@idleking/game-core/game/forumRecruitActions.js";
import type { GameState } from "@idleking/game-core/game/state.js";
import { addQty, type ResourceId } from "@idleking/game-core/resources/types.js";

type BuildableBuildingId = "FORUM" | "FARM" | "MINE" | "TEMPLE" | "KITCHEN" | "FORGE";
type BuildableBuildingKey = "forum" | "farm" | "mine" | "temple" | "kitchen" | "forge";
type KingdomBuildingKey = BuildableBuildingKey | "cornucopia";
type KingdomBuildingState = "active" | "built" | "locked" | "selected" | "unlocked";

type KingdomBuildingDefinition = {
  key: KingdomBuildingKey;
  id?: BuildableBuildingId;
  route?: string;
  title: string;
  shortDescription: string;
  description: string;
  functionLabel: string;
  imageAlt: string;
};

type BuildingRow = {
  active?: boolean;
  built: boolean;
  unlocked: boolean;
};

const KINGDOM_BUILDINGS = [
  {
    key: "forum",
    id: "FORUM",
    route: "/game/kingdom/forum",
    title: "Forum",
    shortDescription: "Recrutez, reposez et faites progresser le royaume.",
    description:
      "Le Forum centralise les villageois et les decisions de progression du monde. C'est le point d'ancrage social du royaume.",
    functionLabel: "Recrutement, repos et rank up du monde.",
    imageAlt: "Hall de forum royal en pierre sous une nuit sombre",
  },
  {
    key: "farm",
    id: "FARM",
    route: "/game/kingdom/farm",
    title: "Farm",
    shortDescription: "Produisez les premieres ressources alimentaires.",
    description:
      "La Ferme transforme le travail des villageois en ressources de base pour soutenir la croissance du royaume.",
    functionLabel: "Allocation de villageois sur les ressources agricoles.",
    imageAlt: "Ferme medievale avec champs nocturnes",
  },
  {
    key: "mine",
    id: "MINE",
    route: "/game/kingdom/mine",
    title: "Mine",
    shortDescription: "Extrayez minerais et materiaux precieux.",
    description:
      "La Mine ouvre l'acces aux metaux et aux ressources profondes necessaires aux constructions avancees.",
    functionLabel: "Allocation de villageois sur les ressources minieres.",
    imageAlt: "Entree de mine dans la montagne avec lueur chaude",
  },
  {
    key: "temple",
    id: "TEMPLE",
    route: "/game/kingdom/temple",
    title: "Temple",
    shortDescription: "Canalisez l'XP_GLOBAL du royaume.",
    description:
      "Le Temple concentre l'energie universelle et transforme l'effort du royaume en progression globale.",
    functionLabel: "Allocation de villageois vers XP_GLOBAL.",
    imageAlt: "Temple dark fantasy avec portail d'energie violette",
  },
  {
    key: "kitchen",
    id: "KITCHEN",
    route: "/game/kingdom/kitchen",
    title: "Kitchen",
    shortDescription: "Preparez plats et potions pour vos allies.",
    description:
      "La Cuisine consomme des ressources pour creer des plats utiles aux villageois et aux expeditions futures.",
    functionLabel: "Cuisine de recettes et depense de stamina.",
    imageAlt: "Cuisine medievale avec foyer allume",
  },
  {
    key: "forge",
    id: "FORGE",
    route: "/game/kingdom/forge",
    title: "Forge",
    shortDescription: "Fabriquez et ameliorez les equipements.",
    description:
      "La Forge convertit minerais et ressources rares en equipement, ameliorations et recyclage.",
    functionLabel: "Craft, upgrade et recycle d'equipement.",
    imageAlt: "Forge de pierre avec enclume et braises",
  },
  {
    key: "cornucopia",
    title: "Cornucopia",
    shortDescription: "Obtenez manuellement les premieres ressources.",
    description:
      "La Corne d'Abondance reste disponible des le depart pour amorcer l'economie du royaume.",
    functionLabel: "Recolte manuelle d'une ressource disponible.",
    imageAlt: "Corne d'abondance remplie de pieces et ressources",
  },
] satisfies readonly KingdomBuildingDefinition[];

const BUILDING_STATE_CLASS_NAMES: Record<KingdomBuildingState, string> = {
  active: "ik-building-card--active",
  built: "ik-building-card--built",
  locked: "ik-building-card--lock",
  selected: "ik-building-card--selected",
  unlocked: "ik-building-card--default",
};

function getBuildingRow(state: GameState, key: KingdomBuildingKey): BuildingRow {
  return state.buildings[key];
}

function isBuildableBuildingKey(key: KingdomBuildingKey): key is BuildableBuildingKey {
  return key !== "cornucopia";
}

function getBuildingVisualState(row: BuildingRow, selected: boolean): KingdomBuildingState {
  if (selected) return "selected";
  if (!row.unlocked) return "locked";
  if (row.active) return "active";
  if (row.built) return "built";
  return "unlocked";
}

function getBuildingChip(row: BuildingRow, selected: boolean) {
  if (selected) return { label: "SELECTED", className: "ik-chip ik-chip--gold" };
  if (!row.unlocked) return { label: "LOCKED", className: "ik-chip ik-chip--locked" };
  if (row.active) return { label: "ACTIVE", className: "ik-chip ik-chip--gold" };
  if (row.built) return { label: "BUILT", className: "ik-chip ik-chip--gold" };
  return { label: "UNLOCKED", className: "ik-chip" };
}

function formatCost(cost: Record<string, number>) {
  const entries = Object.entries(cost);
  if (entries.length === 0) return "No cost";
  return entries.map(([id, qty]) => `${qty} ${id}`).join(", ");
}

function formatAllocation(allocation: Partial<Record<ResourceId, number>>) {
  const entries = Object.entries(allocation).filter(([, qty]) => Number(qty) > 0);
  if (entries.length === 0) return "No villagers allocated.";
  return entries.map(([id, qty]) => `${id}: ${qty}`).join(", ");
}

function getStatusText(row: BuildingRow) {
  if (!row.unlocked) return "Locked";
  if (row.active) return "Built and active";
  if (row.built) return "Built, inactive";
  return "Unlocked, not built";
}

function patchBuildableBuilding(
  state: GameState,
  key: BuildableBuildingKey,
  patch: Partial<BuildingRow>
): GameState {
  return {
    ...state,
    buildings: {
      ...state.buildings,
      [key]: {
        ...state.buildings[key],
        ...patch,
      },
    },
  };
}

function resolveCornucopiaResourceSelection(
  claimables: ResourceId[],
  selected: ResourceId | null
): ResourceId | null {
  if (claimables.length === 0) return null;
  if (selected && claimables.includes(selected)) return selected;
  return claimables[0];
}

function getCornucopiaStatusLabel(params: {
  devMode: boolean;
  stamina: number;
  staminaMax: number;
  unlocked: boolean;
}) {
  const { devMode, stamina, staminaMax, unlocked } = params;

  if (!unlocked) return "Locked";
  if (devMode) return "Manual harvest, stamina ignored in development";
  return `Manual harvest, stamina ${stamina}/${staminaMax}`;
}

function getBuildingOutput(definition: KingdomBuildingDefinition, state: GameState) {
  switch (definition.key) {
    case "forum": {
      const recruitCost = recruitVillagerCost(state.villagers.list.length);
      return [
        `Villagers: ${state.villagers.list.length}`,
        `Recruit cost: ${recruitCost.meat} MEAT / ${recruitCost.gold} GOLD`,
        `World level: ${state.progression.worldLevel}`,
      ];
    }
    case "farm":
      return [
        `Resources: ${farmResourcesAvailable(state.progression.worldLevel).join(", ")}`,
        `Allocation: ${formatAllocation(state.buildings.farm.allocation)}`,
      ];
    case "mine":
      return [
        `Resources: ${mineResourcesAvailable(state.progression.worldLevel).join(", ")}`,
        `Allocation: ${formatAllocation(state.buildings.mine.allocation)}`,
      ];
    case "temple":
      return [`XP_GLOBAL workers: ${state.buildings.temple.allocation.XP_GLOBAL}`];
    case "kitchen":
      return ["Recipes are managed from the Kitchen screen."];
    case "forge":
      return [`Crafted items: ${state.inventory.items.length}`];
    case "cornucopia":
      return [
        getCornucopiaStatusLabel({
          devMode: DEV_MODE,
          stamina: state.buildings.cornucopia.stamina,
          staminaMax: state.buildings.cornucopia.staminaMax,
          unlocked: state.buildings.cornucopia.unlocked,
        }),
      ];
  }
}

function getCornucopiaResourceOptionClassName(selected: boolean) {
  return cn(
    "rounded-lg border px-2.5 py-2 text-left text-xs tracking-wide transition-colors duration-150",
    selected
      ? "border-primary/50 bg-primary/15 text-white shadow-[0_0_18px_rgba(255,140,40,0.08)]"
      : "border-white/10 bg-black/10 text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white/90"
  );
}

function BuildingCard({
  definition,
  onOpen,
  row,
  selected,
}: {
  definition: KingdomBuildingDefinition;
  onOpen: () => void;
  row: BuildingRow;
  selected: boolean;
}) {
  const visualState = getBuildingVisualState(row, selected);
  const chip = getBuildingChip(row, selected);

  return (
    <RelicPanel className={cn("ik-kingdom-building-card", BUILDING_STATE_CLASS_NAMES[visualState])}>
      <BuildingSprite
        altLabel={definition.imageAlt}
        buildingId={definition.key}
      />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-ik-title text-xl font-semibold text-white/90">{definition.title}</h2>
          <p className="font-ik-body mt-2 text-sm text-white/70">{definition.shortDescription}</p>
        </div>
        <div className={chip.className}>{chip.label}</div>
      </div>

      <button type="button" className="ik-runic-button ik-runic-button--primary mt-5 w-full" onClick={onOpen}>
        Ouvrir
      </button>
    </RelicPanel>
  );
}

function BuildingModal({
  activeCornucopiaResource,
  canClickCornucopia,
  cornucopiaClaimables,
  definition,
  isCornucopiaSelectorOpen,
  onBuild,
  onClose,
  onHarvestCornucopia,
  onRecruitVillager,
  onRankUpWorld,
  onSelectCornucopiaResource,
  onToggleActive,
  onToggleCornucopiaSelector,
  onToggleUnlocked,
  row,
  state,
}: {
  activeCornucopiaResource: ResourceId | null;
  canClickCornucopia: boolean;
  cornucopiaClaimables: ResourceId[];
  definition: KingdomBuildingDefinition;
  isCornucopiaSelectorOpen: boolean;
  onBuild: (definition: KingdomBuildingDefinition) => void;
  onClose: () => void;
  onHarvestCornucopia: () => void;
  onRecruitVillager: () => void;
  onRankUpWorld: () => void;
  onSelectCornucopiaResource: (resourceId: ResourceId) => void;
  onToggleActive: (key: BuildableBuildingKey) => void;
  onToggleCornucopiaSelector: () => void;
  onToggleUnlocked: (key: BuildableBuildingKey) => void;
  row: BuildingRow;
  state: GameState;
}) {
  const canUseManagement = Boolean(definition.route && row.unlocked && row.built);
  const buildCost = definition.id ? formatCost(getBuildCost(definition.id)) : null;
  const buildableKey = isBuildableBuildingKey(definition.key) ? definition.key : null;
  const outputLines = getBuildingOutput(definition, state);

  return (
    <div className="ik-kingdom-modal-backdrop" onClick={onClose}>
      <div className="ik-kingdom-modal" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-ik-menu text-xs text-white/50">Kingdom Building</p>
            <h2 className="font-ik-title mt-1 text-2xl font-semibold text-white/92">{definition.title}</h2>
          </div>
          <button type="button" className="ik-runic-button px-3 py-2 text-xs" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <BuildingSprite
            altLabel={definition.imageAlt}
            buildingId={definition.key}
          />

          <div className="space-y-4">
            <p className="font-ik-body text-sm text-white/72">{definition.description}</p>

            <div className="ik-kingdom-modal-stat-grid">
              <div>
                <p className="font-ik-menu text-[11px] text-white/45">Status</p>
                <p className="mt-1 text-sm text-white/85">{getStatusText(row)}</p>
              </div>
              <div>
                <p className="font-ik-menu text-[11px] text-white/45">Function</p>
                <p className="mt-1 text-sm text-white/85">{definition.functionLabel}</p>
              </div>
              {buildCost ? (
                <div className="lg:col-span-2">
                  <p className="font-ik-menu text-[11px] text-white/45">Build Cost</p>
                  <p className="mt-1 text-sm text-white/85">{buildCost}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/15 p-3">
              <p className="font-ik-menu text-[11px] text-white/45">Production / Role</p>
              <ul className="mt-2 space-y-1 text-sm text-white/75">
                {outputLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {definition.id && buildableKey ? (
            <>
              {DEV_MODE ? (
                <button type="button" className="ik-runic-button" onClick={() => onToggleUnlocked(buildableKey)}>
                  {row.unlocked ? "Lock MVP" : "Unlock MVP"}
                </button>
              ) : null}

              <button
                type="button"
                className="ik-runic-button ik-runic-button--primary"
                disabled={!row.unlocked || row.built}
                onClick={() => onBuild(definition)}
                title={!row.unlocked ? "Building locked" : row.built ? "Already built" : undefined}
              >
                {row.built ? "Already built" : "Build"}
              </button>

              <button
                type="button"
                className="ik-runic-button"
                disabled={!row.unlocked || !row.built}
                onClick={() => onToggleActive(buildableKey)}
                title={!row.unlocked || !row.built ? "Build required" : undefined}
              >
                {row.active ? "Deactivate" : "Activate"}
              </button>
            </>
          ) : null}

          {definition.key === "forum" ? (
            <>
              <button
                type="button"
                className="ik-runic-button"
                disabled={!row.unlocked || !row.built}
                onClick={onRankUpWorld}
                title={!row.unlocked || !row.built ? "Forum build required" : undefined}
              >
                Rank Up World
              </button>
              <button
                type="button"
                className="ik-runic-button"
                disabled={!row.unlocked || !row.built}
                onClick={onRecruitVillager}
                title={!row.unlocked || !row.built ? "Forum build required" : undefined}
              >
                Recruit Villager
              </button>
            </>
          ) : null}

          {definition.key === "cornucopia" ? (
            <>
              <button
                type="button"
                className="ik-runic-button ik-runic-button--primary"
                disabled={!canClickCornucopia}
                onClick={onHarvestCornucopia}
                title={!canClickCornucopia ? "Cornucopia drained, sealed, or missing a resource" : undefined}
              >
                Harvest {activeCornucopiaResource ?? "Resource"}
              </button>
              <button
                type="button"
                className="ik-runic-button"
                disabled={cornucopiaClaimables.length === 0}
                onClick={onToggleCornucopiaSelector}
                aria-expanded={isCornucopiaSelectorOpen}
                title={cornucopiaClaimables.length === 0 ? "No claimable resources available" : undefined}
              >
                {isCornucopiaSelectorOpen ? "Hide Resources" : "Select Resource"}
              </button>
            </>
          ) : null}

          {definition.route ? (
            canUseManagement ? (
              <Link href={definition.route} className="ik-runic-button text-center">
                Open Management
              </Link>
            ) : (
              <button type="button" className="ik-runic-button" disabled>
                Management locked
              </button>
            )
          ) : null}

          {!definition.route && definition.key !== "cornucopia" ? (
            <button type="button" className="ik-runic-button" disabled>
              Action not wired yet
            </button>
          ) : null}
        </div>

        {definition.key === "cornucopia" && isCornucopiaSelectorOpen ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="font-ik-menu text-[11px] text-white/45">Choose Harvest Resource</p>

            {cornucopiaClaimables.length === 0 ? (
              <p className="font-ik-body mt-2 text-sm text-white/55">No claimable resources available.</p>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {cornucopiaClaimables.map((resourceId) => (
                  <button
                    key={resourceId}
                    type="button"
                    className={getCornucopiaResourceOptionClassName(resourceId === activeCornucopiaResource)}
                    onClick={() => onSelectCornucopiaResource(resourceId)}
                    aria-pressed={resourceId === activeCornucopiaResource}
                  >
                    {resourceId}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function KingdomPage() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const [selectedBuildingKey, setSelectedBuildingKey] = useState<KingdomBuildingKey | null>(null);
  const [isCornucopiaSelectorOpen, setIsCornucopiaSelectorOpen] = useState(false);
  const [selectedCornucopiaResource, setSelectedCornucopiaResource] = useState<ResourceId | null>(null);

  const cornucopiaClaimables = useMemo(() => getCornucopiaClaimables(state), [state]);
  const activeCornucopiaResource = resolveCornucopiaResourceSelection(
    cornucopiaClaimables,
    selectedCornucopiaResource
  );
  const selectedBuilding = KINGDOM_BUILDINGS.find((building) => building.key === selectedBuildingKey) ?? null;
  const cornucopiaRow = state.buildings.cornucopia;
  const cornucopiaStaminaBypassed = DEV_MODE;
  const canClickCornucopia =
    cornucopiaRow.unlocked &&
    cornucopiaRow.built &&
    cornucopiaRow.active &&
    (cornucopiaStaminaBypassed || cornucopiaRow.stamina > 0) &&
    activeCornucopiaResource !== null;

  useEffect(() => {
    const nextResource = resolveCornucopiaResourceSelection(
      cornucopiaClaimables,
      selectedCornucopiaResource
    );

    if (nextResource !== selectedCornucopiaResource) {
      setSelectedCornucopiaResource(nextResource);
    }
  }, [cornucopiaClaimables, selectedCornucopiaResource]);

  function handleBuild(definition: KingdomBuildingDefinition) {
    if (!definition.id) return;

    const res = buildBuilding(state, definition.id);
    if (!res.ok) {
      toast.error(`Build failed: ${res.reason}`);
      return;
    }

    dispatch(() => res.next);
    toast.success(`${definition.title} built`);
  }

  function handleToggleUnlocked(key: BuildableBuildingKey) {
    dispatch((prev) => {
      const row = prev.buildings[key];
      return patchBuildableBuilding(prev, key, { unlocked: !row.unlocked });
    });
  }

  function handleToggleActive(key: BuildableBuildingKey) {
    dispatch((prev) => {
      const row = prev.buildings[key];
      return patchBuildableBuilding(prev, key, { active: !row.active });
    });
  }

  function handleRankUpWorld() {
    const res = forumRankUpWorld(state);
    if (!res.rankedUp) {
      toast.error(`World rank up failed: ${res.reason}`);
      return;
    }

    dispatch(() => res.next);
    toast.success("World level increased");
  }

  function handleRecruitVillager() {
    const res = recruitVillager(state);
    if (!res.ok) {
      toast.error(`Recruit failed: ${res.reason}`);
      return;
    }

    dispatch(() => res.next);
    toast.success("Villager recruited");
  }

  function handleSelectCornucopiaResource(resourceId: ResourceId) {
    setSelectedCornucopiaResource(resourceId);
    setIsCornucopiaSelectorOpen(false);
  }

  function handleHarvestCornucopia() {
    if (!canClickCornucopia || !activeCornucopiaResource) return;

    dispatch((prev) => ({
      ...prev,
      resources: addQty(prev.resources, activeCornucopiaResource, 1),
      buildings: {
        ...prev.buildings,
        cornucopia: {
          ...prev.buildings.cornucopia,
          stamina: cornucopiaStaminaBypassed
            ? prev.buildings.cornucopia.stamina
            : Math.max(0, prev.buildings.cornucopia.stamina - 1),
        },
      },
    }));
  }

  return (
    <div className="space-y-4 p-6">
      <RelicPanel variant="gold">
        <div className="font-ik-title text-xl font-semibold text-white/90">Royaume</div>
        <div className="font-ik-body mt-1 text-sm text-white/60">
          Manage kingdom buildings, progression engines, and production systems.
        </div>
      </RelicPanel>

      <div className="ik-kingdom-building-grid">
        {KINGDOM_BUILDINGS.map((building) => {
          const row = getBuildingRow(state, building.key);

          return (
            <BuildingCard
              key={building.key}
              definition={building}
              row={row}
              selected={selectedBuildingKey === building.key}
              onOpen={() => setSelectedBuildingKey(building.key)}
            />
          );
        })}
      </div>

      {selectedBuilding ? (
        <BuildingModal
          activeCornucopiaResource={activeCornucopiaResource}
          canClickCornucopia={canClickCornucopia}
          cornucopiaClaimables={cornucopiaClaimables}
          definition={selectedBuilding}
          isCornucopiaSelectorOpen={isCornucopiaSelectorOpen}
          onBuild={handleBuild}
          onClose={() => setSelectedBuildingKey(null)}
          onHarvestCornucopia={handleHarvestCornucopia}
          onRankUpWorld={handleRankUpWorld}
          onRecruitVillager={handleRecruitVillager}
          onSelectCornucopiaResource={handleSelectCornucopiaResource}
          onToggleActive={handleToggleActive}
          onToggleCornucopiaSelector={() => setIsCornucopiaSelectorOpen((open) => !open)}
          onToggleUnlocked={handleToggleUnlocked}
          row={getBuildingRow(state, selectedBuilding.key)}
          state={state}
        />
      ) : null}
    </div>
  );
}
