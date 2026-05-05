import { redirect } from "next/navigation";

import { DuelArenaView } from "@/components/game/duel/duel-arena-view";
import { getDuelOpponent } from "@/lib/duel-data";

export default function ScarecrowDuelPage() {
  const opponent = getDuelOpponent("epouvantail-ressuscite");
  if (!opponent || !opponent.available) {
    redirect("/game/kingdom");
  }

  return <DuelArenaView opponent={opponent} />;
}
