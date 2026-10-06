import { DuelArenaStage } from "@/components/game/duel/duel-arena-stage";
import type { DuelOpponent } from "@/lib/duel-data";

const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1600;

type DuelArenaViewProps = {
  opponent: DuelOpponent;
};

/**
 * DuelArenaStage renders its own complete HUD (title, exit link, boss health,
 * skill bar via CombatHud) — this view only adds the one thing that HUD
 * doesn't show: control hints. It stays out of the CombatHud's title panel
 * (top-24) and skill bar (bottom-4) zones so nothing stacks.
 */
export function DuelArenaView({ opponent }: DuelArenaViewProps) {
  void opponent;
  return (
    <section className="relative h-[calc(100vh-2rem)] min-h-[44rem] overflow-hidden rounded-xl border border-amber-200/25 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.48)]">
      <DuelArenaStage mapHeight={MAP_HEIGHT} mapWidth={MAP_WIDTH} />

      <div className="pointer-events-none absolute left-4 bottom-24 z-10 max-w-xs rounded-lg border border-amber-200/18 bg-black/55 px-4 py-2 font-ik-body text-xs text-muted-foreground">
        Déplacement : WASD, ZQSD ou flèches. Attaques : clic gauche mêlée, clic droit tir.
      </div>
    </section>
  );
}
