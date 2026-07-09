"use client";

import type { ReactNode } from "react";
import { Hammer, Lock } from "lucide-react";

import { getResourceAssetPath } from "@/lib/resource-assets";
import { cn } from "@/lib/utils";
import { getQty, type ResourceId } from "@idleking/game-core";

export type BuildingGlyphKind =
  | "bank"
  | "cornucopia"
  | "farm"
  | "forge"
  | "forum"
  | "kitchen"
  | "market"
  | "mine"
  | "temple";

type ResourceBag = Parameters<typeof getQty>[0];

const GLYPH_PATHS: Record<BuildingGlyphKind, ReactNode> = {
  bank: (
    <>
      <rect height="34" width="60" x="18" y="48" />
      <path d="M10 48 L48 22 L86 48" />
      <path d="M28 48 V82 M48 48 V82 M68 48 V82" />
      <circle cx="48" cy="35" r="4" />
    </>
  ),
  cornucopia: (
    <>
      <path d="M22 70 C22 44 48 30 74 34 C60 38 50 46 46 58 C42 68 34 74 22 70 Z" />
      <circle cx="64" cy="58" r="5" />
      <circle cx="74" cy="48" r="4" />
      <circle cx="76" cy="62" r="3" />
    </>
  ),
  farm: (
    <>
      <rect height="30" width="40" x="14" y="52" />
      <path d="M10 52 L34 34 L58 52" />
      <rect height="14" width="10" x="29" y="68" />
      <path d="M64 82 H86 M64 74 H86 M64 66 H86" />
    </>
  ),
  forge: (
    <>
      <path d="M24 46 H72 V56 H58 L62 70 H34 L38 56 H24 Z" />
      <path d="M30 46 V38 H50 V46" />
      <path d="M62 30 L70 22 M66 34 L76 26" />
    </>
  ),
  forum: (
    <>
      <rect height="36" width="56" x="20" y="46" />
      <path d="M14 46 L48 24 L82 46" />
      <path d="M30 46 V82 M48 46 V82 M66 46 V82" />
    </>
  ),
  kitchen: (
    <>
      <rect height="34" width="50" x="23" y="48" />
      <path d="M17 48 L48 26 L79 48" />
      <rect height="18" width="12" x="34" y="64" />
      <circle cx="62" cy="60" r="6" />
      <path d="M64 26 V16" />
    </>
  ),
  market: (
    <>
      <path d="M18 42 H78 L84 56 H12 Z" />
      <path d="M18 56 V82 H78 V56" />
      <path d="M22 42 V32 H74 V42" />
      <rect height="16" width="14" x="54" y="66" />
    </>
  ),
  mine: (
    <>
      <path d="M12 82 L34 24 H62 L84 82 Z" />
      <path d="M38 82 L42 58 H54 L58 82 Z" />
      <path d="M40 40 L56 48 M56 40 L40 48" />
    </>
  ),
  temple: (
    <>
      <path d="M14 44 L48 20 L82 44 Z" />
      <path d="M20 44 V78 M34 44 V78 M48 44 V78 M62 44 V78 M76 44 V78" />
      <path d="M14 78 H82" />
    </>
  ),
};

export function BuildingGlyph({ className, kind }: { className?: string; kind: BuildingGlyphKind }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
    >
      {GLYPH_PATHS[kind]}
    </svg>
  );
}

export function BuildingModalHeader({
  devUnlocked = false,
  glyph,
  level,
  maxLevel,
  statusLabel,
  subtitle,
  title,
}: {
  devUnlocked?: boolean;
  glyph: BuildingGlyphKind;
  level?: number;
  maxLevel?: number;
  statusLabel: string;
  subtitle?: string;
  title: string;
}) {
  const showPips = maxLevel !== undefined && maxLevel > 0 && maxLevel <= 8;

  return (
    <div className="flex items-center gap-4 border-b-2 border-neutral-800 pb-4">
      <span className="ik-anim-pop-in grid h-16 w-16 shrink-0 place-items-center border-2 border-neutral-600 bg-neutral-950 text-neutral-100">
        <BuildingGlyph className="h-11 w-11" kind={glyph} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-ik-title text-xl font-semibold uppercase tracking-[0.06em] text-neutral-100">{title}</h2>
          <span className="border border-neutral-600 px-2 py-0.5 font-ik-menu text-[0.6rem] text-neutral-300">
            {statusLabel}
          </span>
          {devUnlocked ? (
            <span className="border border-dashed border-neutral-600 px-2 py-0.5 font-ik-menu text-[0.6rem] text-neutral-500">
              DEV
            </span>
          ) : null}
        </div>
        {level !== undefined && maxLevel !== undefined ? (
          <div className="mt-1.5 flex items-center gap-2" data-ik-tip={`Niveau ${level}/${maxLevel}`}>
            {showPips ? (
              <span className="flex items-center gap-1">
                {Array.from({ length: maxLevel }, (_, pip) => (
                  <span className={cn("ik-pip", pip < level && "ik-pip--on")} key={pip} />
                ))}
              </span>
            ) : null}
            <span className="font-ik-menu text-[0.6rem] text-neutral-500 tabular-nums">
              Nv {level}/{maxLevel}
            </span>
          </div>
        ) : null}
        {subtitle ? <p className="mt-1 font-ik-body text-xs text-neutral-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function BuildingCostChips({
  cost,
  resources,
}: {
  cost: Partial<Record<ResourceId, number>>;
  resources: ResourceBag;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.entries(cost) as Array<[ResourceId, number]>).map(([resourceId, amount]) => {
        const owned = getQty(resources, resourceId);
        const affordable = owned >= amount;
        const label = resourceId.replaceAll("_", " ");

        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 border px-2 py-1 font-ik-menu text-[0.62rem] tabular-nums",
              affordable ? "border-neutral-600 text-neutral-200" : "border-dashed border-neutral-700 text-neutral-500"
            )}
            data-ik-tip={`${label} : ${owned}/${amount}`}
            key={resourceId}
          >
            <img alt="" aria-hidden="true" className={cn("h-4 w-4", !affordable && "opacity-50")} src={getResourceAssetPath(resourceId)} />
            {amount}
            <span className="sr-only">
              {label} {owned}/{amount}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function BuildingBuildSection({
  canBuild,
  cost,
  label,
  onBuild,
  resources,
}: {
  canBuild: boolean;
  cost: Partial<Record<ResourceId, number>>;
  label: string;
  onBuild: () => void;
  resources: ResourceBag;
}) {
  return (
    <div className="ik-anim-rise-in border border-dashed border-neutral-700 bg-neutral-950/60 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BuildingCostChips cost={cost} resources={resources} />
        <button
          className={cn(
            "flex min-h-10 items-center gap-2 border-2 px-4 py-2 font-ik-menu text-xs transition",
            canBuild
              ? "ik-ready-pulse border-neutral-100 bg-neutral-100 text-neutral-950 hover:bg-neutral-300"
              : "cursor-not-allowed border-neutral-800 text-neutral-600"
          )}
          disabled={!canBuild}
          onClick={onBuild}
          type="button"
        >
          {canBuild ? (
            <Hammer aria-hidden="true" className="h-4 w-4" strokeWidth={2.4} />
          ) : (
            <Lock aria-hidden="true" className="h-4 w-4" strokeWidth={2.4} />
          )}
          {label}
        </button>
      </div>
    </div>
  );
}

export function ModalActionButton({
  children,
  disabled = false,
  onClick,
  primary = false,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex min-h-10 items-center gap-2 border-2 px-4 py-2 font-ik-menu text-xs transition",
        primary
          ? "border-neutral-100 bg-neutral-100 text-neutral-950 hover:bg-neutral-300"
          : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-300 hover:text-neutral-100",
        disabled && "cursor-not-allowed opacity-40 hover:border-neutral-700 hover:text-neutral-300"
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
