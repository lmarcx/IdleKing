import type { Item } from "@idleking/game-core/items";

import { GamePanel } from "@/components/ui/game-panel";

import { formatItemStats, getItemSlotId, getSlotIconPath } from "./types";

function EquipmentListItem({ item }: { item: Item }) {
  const stats = formatItemStats(item.stats);
  const slotId = getItemSlotId(item);

  return (
    <li className="rounded-lg border border-border/60 bg-black/20 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-amber-300/35 hover:bg-muted/25">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border/60 bg-black/25">
          <img alt="" aria-hidden="true" className="h-6 w-6 object-contain opacity-75" src={getSlotIconPath(slotId)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-ik-title text-sm font-semibold">{item.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-ik-body text-xs text-muted-foreground">
            <span>{item.slot}</span>
            <span>{item.rarity}</span>
            <span className="tabular-nums">ilvl {item.ilvl}</span>
          </div>
          <div className="mt-2 font-ik-body text-xs text-muted-foreground">
            {stats.length > 0
              ? stats
                  .slice(0, 3)
                  .map((stat) => `${stat.label} ${stat.value}`)
                  .join(" | ")
              : "Stats a venir"}
          </div>
        </div>
      </div>
    </li>
  );
}

export function AvailableEquipmentPanel({ items }: { items: Item[] }) {
  return (
    <GamePanel variant="ornate" className="p-4">
      <h2 className="font-ik-title text-lg font-semibold tracking-wide">Available Equipment</h2>

      {items.length === 0 ? (
        <p className="mt-4 rounded-lg border border-border/60 bg-black/20 p-4 font-ik-body text-sm text-muted-foreground">
          Aucun equipement disponible.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <EquipmentListItem item={item} key={item.id} />
          ))}
        </ul>
      )}
    </GamePanel>
  );
}
