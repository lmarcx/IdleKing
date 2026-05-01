import Link from "next/link";

import { DuelArenaView } from "@/components/game/duel/duel-arena-view";
import { getDuelOpponent } from "@/lib/duel-data";

type DuelPageProps = {
  params: Promise<{
    duelId: string;
  }>;
};

export default async function DuelPage({ params }: DuelPageProps) {
  const { duelId } = await params;
  const opponent = getDuelOpponent(duelId);

  if (!opponent || !opponent.available) {
    return (
      <div className="grid min-h-[36rem] place-items-center text-center">
        <div className="max-w-md rounded-xl border border-amber-200/20 bg-black/40 p-6">
          <h1 className="font-ik-title text-xl font-semibold text-amber-50">Duel introuvable</h1>
          <p className="mt-2 font-ik-body text-sm text-muted-foreground">
            Cet adversaire n'existe pas ou n'est pas encore disponible.
          </p>
          <Link
            className="mt-5 inline-flex rounded-md border border-amber-200/35 bg-black/55 px-4 py-2 font-ik-menu text-xs text-amber-50 transition hover:border-amber-100"
            href="/game/worlds?mode=duel"
          >
            Retour au Duel
          </Link>
        </div>
      </div>
    );
  }

  return <DuelArenaView opponent={opponent} />;
}
