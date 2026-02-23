import { RelicPanel } from "@/components/ui/relic-panel";
import { HoloPanel } from "@/components/ui/holo-panel";

export default function TestUI() {
  return (
    <div className="p-10 space-y-8">
      <RelicPanel variant="gold">
        <h2 className="text-lg font-semibold">Forum</h2>
        <p>Rank Up World available.</p>
      </RelicPanel>

      <HoloPanel>
        <h2 className="text-lg font-semibold">BOTO UNIT ONLINE</h2>
        <p>Cosmic link established.</p>
      </HoloPanel>
    </div>
  );
}