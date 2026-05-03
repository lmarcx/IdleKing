import { KingdomHubStage } from "@/components/game/kingdom/kingdom-hub-stage";

export default function KingdomOfflinePage() {
  return (
    <main className="space-y-4 p-4">
      <div>
        <h1 className="font-ik-title text-2xl font-semibold text-foreground">Kingdom Offline</h1>
      </div>

      <KingdomHubStage />
    </main>
  );
}
