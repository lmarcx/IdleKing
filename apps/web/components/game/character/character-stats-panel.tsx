import { GamePanel } from "@/components/ui/game-panel";
import { cn } from "@/lib/utils";

import type { CharacterStat } from "./types";

export function CharacterStatsPanel({ stats }: { stats: CharacterStat[] }) {
  return (
    <GamePanel variant="ornate" className="p-4">
      <h2 className="font-ik-title text-lg font-semibold tracking-wide">Character Stats</h2>

      <div className="mt-4 space-y-2">
        {stats.map((stat) => (
          <div
            className="rounded-lg border border-border/60 bg-black/20 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            key={stat.label}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-ik-menu text-[11px] uppercase tracking-wide text-muted-foreground">{stat.label}</span>
              <span
                className={cn(
                  "font-ik-title text-sm font-semibold tabular-nums",
                  stat.placeholder && "text-muted-foreground"
                )}
              >
                {stat.value}
              </span>
            </div>
            {stat.helper ? <p className="mt-1 font-ik-body text-xs text-muted-foreground">{stat.helper}</p> : null}
          </div>
        ))}
      </div>
    </GamePanel>
  );
}
