import Link from "next/link";

import { DuelArenaStage } from "@/components/game/duel/duel-arena-stage";
import type { DuelOpponent } from "@/lib/duel-data";

const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1600;

type DuelArenaViewProps = {
  opponent: DuelOpponent;
};

export function DuelArenaView({ opponent }: DuelArenaViewProps) {
  return (
    <section className="relative h-[calc(100vh-2rem)] min-h-[44rem] overflow-hidden rounded-xl border border-amber-200/25 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.48)]">
      <DuelArenaStage mapHeight={MAP_HEIGHT} mapWidth={MAP_WIDTH} />

      <div className="pointer-events-none absolute left-4 top-28 z-10 max-w-sm rounded-lg border border-amber-200/20 bg-black/65 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.38)]">
        <p className="font-ik-menu text-[0.65rem] uppercase tracking-[0.2em] text-cyan-200/80">Duel hors ligne</p>
        <h1 className="mt-1 font-ik-title text-xl font-semibold text-amber-50">{opponent.name}</h1>
        <p className="mt-1 font-ik-body text-xs text-muted-foreground">{opponent.type}</p>
      </div>

      <Link
        className="pointer-events-auto absolute right-4 top-28 z-10 rounded-md border border-amber-200/35 bg-black/65 px-4 py-2 font-ik-menu text-xs text-amber-50 transition hover:border-amber-100 hover:bg-amber-500/16"
        href="/game/worlds?mode=duel"
      >
        Retour au Duel
      </Link>

      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 rounded-lg border border-amber-200/18 bg-black/55 px-4 py-2 font-ik-body text-xs text-muted-foreground">
        Déplacement : WASD, ZQSD ou flèches directionnelles. Attaques : clic gauche mêlée, clic droit tir.
      </div>
    </section>
  );
}
