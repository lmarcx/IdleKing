"use client";

import { useMemo, useState, type SyntheticEvent } from "react";

import { getResourceAssetPath, RESOURCE_FALLBACK_ASSET } from "@/lib/resource-assets";
import { ALL_RESOURCES, getQty, type ResourceId, type ResourceStock } from "@idleking/game-core";

type ResourceFocusDropdownProps = {
  resources: ResourceStock;
};

function formatResourceLabel(resourceId: ResourceId) {
  return resourceId.replaceAll("_", " ");
}

function handleResourceIconError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.src.endsWith(RESOURCE_FALLBACK_ASSET)) return;
  image.src = RESOURCE_FALLBACK_ASSET;
}

function getDefaultFocusResource(resources: ResourceStock): ResourceId {
  const firstNonZero = ALL_RESOURCES.find((resourceId) => getQty(resources, resourceId) > 0);
  if (firstNonZero) return firstNonZero;
  if (ALL_RESOURCES.includes("XP_GLOBAL")) return "XP_GLOBAL";
  return "WOOD";
}

export function ResourceFocusDropdown({ resources }: ResourceFocusDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceId | null>(null);
  const defaultResource = useMemo(() => getDefaultFocusResource(resources), [resources]);
  const focusedResource = selectedResource ?? defaultResource;

  return (
    <div className="relative">
      <button
        className="flex min-w-40 items-center gap-2 rounded-md border border-amber-200/20 bg-black/46 px-2.5 py-1.5 text-left shadow-[0_0_16px_rgba(0,0,0,0.22)] transition hover:border-amber-200/50"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <img
          alt=""
          aria-hidden="true"
          className="h-5 w-5 shrink-0 object-contain"
          onError={handleResourceIconError}
          src={getResourceAssetPath(focusedResource)}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-ik-menu text-[0.58rem] uppercase tracking-[0.1em] text-amber-100/68">
            Focus
          </span>
          <span className="block truncate font-ik-body text-[0.72rem] text-amber-50">
            {formatResourceLabel(focusedResource)}: {getQty(resources, focusedResource)}
          </span>
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[920] mt-2 max-h-80 w-72 overflow-y-auto rounded-md border border-amber-200/25 bg-zinc-950/98 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
          {ALL_RESOURCES.map((resourceId) => (
            <button
              className="flex w-full items-center gap-2 rounded px-2 py-2 text-left transition hover:bg-amber-500/12"
              key={resourceId}
              onClick={() => {
                setSelectedResource(resourceId);
                setOpen(false);
              }}
              type="button"
            >
              <img
                alt=""
                aria-hidden="true"
                className="h-5 w-5 shrink-0 object-contain"
                onError={handleResourceIconError}
                src={getResourceAssetPath(resourceId)}
              />
              <span className="min-w-0 flex-1 truncate font-ik-body text-xs text-amber-50">
                {formatResourceLabel(resourceId)}
              </span>
              <span className="shrink-0 font-ik-menu text-xs tabular-nums text-muted-foreground">
                {getQty(resources, resourceId)}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
