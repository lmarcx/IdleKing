import { BotoActions } from "@/components/game/boto/boto-actions";
import { BotoUnit } from "@/components/game/boto/boto-unit";
import { TerminalDialogue } from "@/components/game/boto/terminal-dialogue";
import { HoloPanel } from "@/components/ui/holo-panel";

const BOTO_MESSAGES = [
  {
    speaker: "BOTO" as const,
    text: "Mon lien avec ce monde est instable... mais suffisant pour te guider.",
  },
  {
    speaker: "ROI" as const,
    text: "Alors montre-moi quoi faire maintenant.",
  },
  {
    speaker: "BOTO" as const,
    text: "Commence par stabiliser le Royaume. Construis la Ferme puis la Mine.",
  },
];

export default function BotoPage() {
  return (
    <div className="p-6">
      <div className="ik-boto-console">
        <BotoUnit />

        <div className="ik-boto-right">
          <HoloPanel className="ik-boto-console-heading py-4">
            <div className="font-ik-boto font-semibold tracking-wide text-emerald-100">
              COMPANION CONSOLE
            </div>
            <div className="font-ik-boto mt-1 text-sm text-emerald-200/60">
              Matrix guidance protocol online
            </div>
          </HoloPanel>

          <TerminalDialogue messages={BOTO_MESSAGES} />
          <BotoActions />
        </div>
      </div>
    </div>
  );
}
