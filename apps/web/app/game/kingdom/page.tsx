"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { RelicPanel } from "@/components/ui/relic-panel";
import { getCornucopiaClaimables } from "@idleking/game-core/building/cornucopiaActions.js";
import { buildBuilding } from "@idleking/game-core/game/buildingBuildActions.js";
import type { GameState } from "@idleking/game-core/game/state.js";
import { addQty, type ResourceId } from "@idleking/game-core/resources/types.js";
import { getBuildCost } from "@idleking/game-core/building/buildCosts.js";

const BUILDINGS = [
  { id: "FORUM", key: "forum", route: "/game/kingdom/forum", accent: "gold" },
  { id: "FARM", key: "farm", route: "/game/kingdom/farm", accent: "default" },
  { id: "MINE", key: "mine", route: "/game/kingdom/mine", accent: "default" },
  { id: "TEMPLE", key: "temple", route: "/game/kingdom/temple", accent: "xp" },
  { id: "KITCHEN", key: "kitchen", route: "/game/kingdom/kitchen", accent: "default" },
  { id: "FORGE", key: "forge", route: "/game/kingdom/forge", accent: "gold" },
] as const;

type Accent = "default" | "gold" | "xp" | "wxp";

function getBuildingChip(row: { unlocked: boolean; built: boolean; active?: boolean }) {
  const active = Boolean(row.active);
  if (!row.unlocked) return { label: "SCELLÉ", className: "ik-chip ik-chip--locked" };
  if (row.unlocked && !row.built) return { label: "DÉBLOQUÉ", className: "ik-chip" };
  if (row.built && !active) return { label: "CONSTRUIT", className: "ik-chip ik-chip--gold" };
  return { label: "ACTIF", className: "ik-chip ik-chip--gold" };
}

function formatCost(cost: unknown) {
  // Garde simple pour MVP (tu pourras le rendre plus joli ensuite)
  try {
    return JSON.stringify(cost);
  } catch {
    return String(cost);
  }
}

function getAvailableCornucopiaResources(state: GameState): ResourceId[] {
  return getCornucopiaClaimables(state);
}

function resolveCornucopiaResourceSelection(
  claimables: ResourceId[],
  selected: ResourceId | null
): ResourceId | null {
  if (claimables.length === 0) return null;
  if (selected && claimables.includes(selected)) return selected;
  return claimables[0];
}

function getCornucopiaResourceOptionClassName(selected: boolean) {
  return cn(
    "rounded-lg border px-2.5 py-2 text-left text-xs tracking-wide transition-colors duration-150",
    selected
      ? "border-primary/50 bg-primary/15 text-white shadow-[0_0_18px_rgba(255,140,40,0.08)]"
      : "border-white/10 bg-black/10 text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white/90"
  );
}

export default function KingdomPage() {
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const [cornucopiaClicks, setCornucopiaClicks] = useState(0);
  const [isCornucopiaSelectorOpen, setIsCornucopiaSelectorOpen] = useState(false);
  const [selectedCornucopiaResource, setSelectedCornucopiaResource] = useState<ResourceId | null>(null);

  const cornucopiaClaimables = useMemo(
    () => getAvailableCornucopiaResources(state),
    [state]
  );

  const activeCornucopiaResource = resolveCornucopiaResourceSelection(
    cornucopiaClaimables,
    selectedCornucopiaResource
  );
  const cornucopiaRow = state.buildings.cornucopia;
  const cornucopiaChip = getBuildingChip(cornucopiaRow);
  const canClickCornucopia =
    cornucopiaRow.unlocked &&
    cornucopiaRow.built &&
    cornucopiaRow.active &&
    cornucopiaRow.stamina > 0 &&
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
          stamina: Math.max(0, prev.buildings.cornucopia.stamina - 1),
        },
      },
    }));

    setCornucopiaClicks((current) => current + 1);
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <RelicPanel variant="gold">
        <div className="text-xl font-semibold text-white/90">Royaume</div>
        <div className="text-sm text-white/60 mt-1">
          Gère les bâtiments : déblocage, construction et activité.
        </div>
      </RelicPanel>

      {/* Grid */}
      <div className="ik-building-grid">
        {BUILDINGS.map((b) => {
          const row = state.buildings[b.key] as { unlocked: boolean; built: boolean; active?: boolean };
          const cost = getBuildCost(b.id);
          const chip = getBuildingChip(row);

          const panelVariant = b.accent === "gold" ? "gold" : b.accent === "xp" ? "xp" : "default";

          const canOpenPage = row.unlocked && row.built;
          const canToggleActive = row.unlocked && row.built;

          return (
            <RelicPanel key={b.id} variant={panelVariant as Accent} className="ik-building-card">
              <div className="ik-building-top">
                <div className="flex gap-3">
                  <div className="ik-building-icon" />
                  <div>
                    <div className="ik-building-name">{b.id}</div>
                    <div className="ik-building-state">
                      unlocked: {String(row.unlocked)} • built: {String(row.built)} • active: {String(Boolean(row.active))}
                    </div>
                  </div>
                </div>

                <div className={chip.className}>{chip.label}</div>
              </div>

              <div className="mt-3 text-xs text-white/55">
                Cost: <span className="text-white/70">{formatCost(cost)}</span>
              </div>

              <div className="ik-building-actions">
                {/* Toggle Unlock */}
                <button
                  className="ik-runic-button ik-runic-button--ghost"
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
                </button>

                {/* Build */}
                <button
                  className="ik-runic-button ik-runic-button--primary"
                  onClick={() => {
                    const res = buildBuilding(state, b.id);
                    if (!res.ok) {
                      toast.error(`Build failed: ${res.reason}`);
                      return;
                    }
                    dispatch(() => res.next);
                    toast.success(`${b.id} built`);
                  }}
                  disabled={!row.unlocked || row.built}
                >
                  Build
                </button>

                {/* Toggle Active */}
                <button
                  className="ik-runic-button"
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
                  disabled={!canToggleActive}
                  aria-disabled={!canToggleActive}
                  title={!canToggleActive ? "Build required" : undefined}
                >
                  Toggle Active
                </button>

                {/* Open page */}
                <Link href={b.route} aria-disabled={!canOpenPage} title={!canOpenPage ? "Build required" : undefined}>
                  <button className="ik-runic-button" disabled={!canOpenPage}>
                    Open Page
                  </button>
                </Link>
              </div>
            </RelicPanel>
          );
        })}

        <RelicPanel variant="gold" className="ik-building-card">
          <div className="ik-building-top">
            <div className="flex gap-3">
              <div className="ik-building-icon" />
              <div>
                <div className="ik-building-name">Corne d&apos;Abondance</div>
                <div className="ik-building-state">
                  {cornucopiaRow.unlocked ? "debloquee" : "scellee"} • manuelle • stamina{" "}
                  {cornucopiaRow.stamina}/{cornucopiaRow.staminaMax}
                </div>
              </div>
            </div>

            <div className={cornucopiaChip.className}>{cornucopiaChip.label}</div>
          </div>

          <p className="mt-3 text-sm text-white/70">
            Source manuelle de ressources pour les premiers instants du royaume. Faible rendement,
            clic rapide, integration simple pour le MVP.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="text-[11px] uppercase tracking-wide text-white/45">Ressource</div>
              <div className="mt-1 text-sm font-medium text-white/85">
                {activeCornucopiaResource ?? "Aucune"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="text-[11px] uppercase tracking-wide text-white/45">Gain / clic</div>
              <div className="mt-1 text-sm font-medium text-white/85">+1</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="text-[11px] uppercase tracking-wide text-white/45">Clics session</div>
              <div className="mt-1 text-sm font-medium text-white/85">{cornucopiaClicks}</div>
            </div>
          </div>

          {isCornucopiaSelectorOpen ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Choose Harvest Resource
              </div>

              {cornucopiaClaimables.length === 0 ? (
                <p className="mt-2 text-sm text-white/55">No claimable resources available.</p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {cornucopiaClaimables.map((resourceId) => (
                    <button
                      key={resourceId}
                      type="button"
                      className={getCornucopiaResourceOptionClassName(resourceId === activeCornucopiaResource)}
                      onClick={() => handleSelectCornucopiaResource(resourceId)}
                      aria-pressed={resourceId === activeCornucopiaResource}
                    >
                      {resourceId}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div className="ik-building-actions">
            <button
              className="ik-runic-button ik-runic-button--primary"
              onClick={handleHarvestCornucopia}
              disabled={!canClickCornucopia}
              aria-disabled={!canClickCornucopia}
              title={!canClickCornucopia ? "Cornucopia drained, sealed, or missing a resource" : undefined}
            >
              Harvest {activeCornucopiaResource ?? "Resource"}
            </button>

            <button
              type="button"
              className="ik-runic-button"
              onClick={() => setIsCornucopiaSelectorOpen((open) => !open)}
              disabled={cornucopiaClaimables.length === 0}
              aria-expanded={isCornucopiaSelectorOpen}
              aria-pressed={isCornucopiaSelectorOpen}
              title={cornucopiaClaimables.length === 0 ? "No claimable resources available" : undefined}
            >
              {isCornucopiaSelectorOpen ? "Hide Resources" : "Select Resource"}
            </button>
          </div>
        </RelicPanel>
      </div>
    </div>
  );
}
