"use client";

import { KingdomDialogueBox } from "@/components/game/kingdom/kingdom-dialogue-box";
import { useGameStore } from "@/store/game-store";
import { markKingdomArrivalSeen, shouldShowKingdomArrival } from "@idleking/game-core";

const ARRIVAL_TEXT =
  "Au-delà des Terres Désolées, une ancienne place royale émerge de la poussière. " +
  "Les murs effondrés semblent attendre qu'on leur rende un nom. Accompagné de Billy, " +
  "le vieux roi franchit le seuil de son Royaume retrouvé.";

/** One-time arrival dialogue, shown the first time the Kingdom is reached after the prologue. */
export function KingdomArrivalDialogue() {
  const hydrated = useGameStore((s) => s.hydrated);
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);

  if (!hydrated || !shouldShowKingdomArrival(state)) return null;

  return (
    <KingdomDialogueBox
      name="Le Royaume"
      text={ARRIVAL_TEXT}
      onClose={() => dispatch(markKingdomArrivalSeen)}
    />
  );
}
