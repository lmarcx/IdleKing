import type { Item } from "@idleking/game-core/items";

import { cn } from "@/lib/utils";

import { formatItemStats, getSlotIconPath, type EquipmentSlotDefinition } from "./types";

export function EquipmentSlot({ item, slot }: { item?: Item; slot: EquipmentSlotDefinition }) {
  const stats = formatItemStats(item?.stats);

  return (
    <button
      aria-label={`${slot.label}: ${item ? item.name : "Aucun equipement"}`}
      className={cn(
        "group relative grid aspect-square min-h-16 place-items-center rounded-lg border border-border/70 bg-black/25 p-2",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors",
        "hover:border-amber-300/45 hover:bg-muted/30 focus-visible:border-amber-300/55 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300/35"
      )}
      type="button"
    >
      <img
        alt=""
        aria-hidden="true"
        className={cn("h-8 w-8 object-contain opacity-70", item && "opacity-95")}
        src={getSlotIconPath(slot.id)}
      />

      {item ? (
        <span className="absolute bottom-1 right-1 rounded border border-amber-300/35 bg-black/75 px-1.5 py-0.5 font-ik-menu text-[10px] leading-none">
          {item.ilvl}
        </span>
      ) : null}

      <span className="pointer-events-none absolute left-1/2 top-[calc(100%+0.5rem)] z-20 hidden w-48 -translate-x-1/2 rounded-md border border-amber-300/30 bg-[#090d10]/95 p-3 text-left shadow-[0_0_18px_rgba(56,189,248,0.12)] group-hover:block group-focus-visible:block">
        <span className="block font-ik-title text-sm font-semibold">{slot.label}</span>
        <span className="mt-1 block font-ik-body text-xs text-muted-foreground">
          {item ? item.name : "Aucun equipement"}
        </span>
        {item ? (
          <span className="mt-2 block space-y-1 border-t border-border/50 pt-2 font-ik-body text-xs">
            <span className="flex justify-between gap-3">
              <span className="text-muted-foreground">Rarity</span>
              <span>{item.rarity}</span>
            </span>
            <span className="flex justify-between gap-3">
              <span className="text-muted-foreground">ilvl</span>
              <span className="tabular-nums">{item.ilvl}</span>
            </span>
            {stats.length > 0 ? (
              stats.slice(0, 4).map((stat) => (
                <span className="flex justify-between gap-3" key={stat.label}>
                  <span className="text-muted-foreground">{stat.label}</span>
                  <span className="tabular-nums">{stat.value}</span>
                </span>
              ))
            ) : (
              <span className="block text-muted-foreground">Stats a venir</span>
            )}
          </span>
        ) : null}
      </span>
    </button>
  );
}
