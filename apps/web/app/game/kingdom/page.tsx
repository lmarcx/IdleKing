// apps/web/app/game/kingdom/page.tsx
import { RelicPanel } from "@/components/ui/relic-panel";

function BuildingCard(props: {
  name: string;
  state: "LOCKED" | "UNLOCKED" | "BUILT" | "ACTIVE";
  accent?: "default" | "gold" | "xp" | "wxp";
}) {
  const { name, state, accent = "default" } = props;

  const variant =
    accent === "gold" ? "gold" : accent === "xp" ? "xp" : accent === "wxp" ? "wxp" : "default";

  const chip =
    state === "LOCKED"
      ? ["SCELLÉ", "ik-chip ik-chip--locked"]
      : state === "UNLOCKED"
      ? ["DÉBLOQUÉ", "ik-chip"]
      : state === "BUILT"
      ? ["CONSTRUIT", "ik-chip ik-chip--gold"]
      : ["ACTIF", "ik-chip ik-chip--gold"];

  return (
    <RelicPanel variant={variant} className="ik-building-card">
      <div className="ik-building-top">
        <div className="flex gap-12">
          <div className="ik-building-icon" />
          <div>
            <div className="ik-building-name">{name}</div>
            <div className="ik-building-state">Bâtiment du Royaume</div>
          </div>
        </div>
        <div className={chip[1]}>{chip[0]}</div>
      </div>

      <div className="ik-building-actions">
        <button className="ik-runic-button ik-runic-button--primary">
          {state === "LOCKED" ? "Conditions" : state === "UNLOCKED" ? "Build" : "Open"}
        </button>
        <button className="ik-runic-button ik-runic-button--ghost" disabled={state !== "ACTIVE" && state !== "BUILT"}>
          Toggle
        </button>
      </div>
    </RelicPanel>
  );
}

export default function KingdomPage() {
  return (
    <div className="p-6 space-y-4">
      <RelicPanel variant="gold">
        <div className="text-xl font-semibold text-white/90">Royaume</div>
        <div className="text-sm text-white/60 mt-1">
          Stabilise tes fondations. Chaque bâtiment façonne ta progression.
        </div>
      </RelicPanel>

      <div className="ik-building-grid">
        <BuildingCard name="Forum" state="BUILT" accent="gold" />
        <BuildingCard name="Ferme" state="UNLOCKED" />
        <BuildingCard name="Mine" state="UNLOCKED" />
        <BuildingCard name="Temple" state="LOCKED" accent="xp" />
        <BuildingCard name="Cuisine" state="UNLOCKED" />
        <BuildingCard name="Forge" state="LOCKED" accent="gold" />
      </div>
    </div>
  );
}