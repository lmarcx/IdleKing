"use client";

import { KingdomArrivalDialogue } from "@/components/game/kingdom/kingdom-arrival-dialogue";
import { KingdomHubStage } from "@/components/game/kingdom/kingdom-hub-stage";

export default function KingdomPage() {
  return (
    <main className="mx-auto w-full max-w-[1800px] p-2 sm:p-3">
      <KingdomHubStage />
      <KingdomArrivalDialogue />
    </main>
  );
}
